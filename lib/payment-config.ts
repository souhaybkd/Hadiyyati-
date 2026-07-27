// NOTE: This module is server-only. It reads payment gateway credentials
// (including secrets) via the service-role client and must never be imported
// from client components.
import { createSupabaseServiceClient } from '@/lib/supabase-service'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type GatewayName = 'stripe' | 'whish'

export interface StripeConfig {
  enabled: boolean
  secretKey: string
  publishableKey: string
  webhookSecret: string
}

export interface WhishConfig {
  enabled: boolean
  channel: string
  secret: string
  websiteUrl: string
  environment: 'sandbox' | 'production'
}

export interface PaymentGatewayRecord {
  gateway: GatewayName
  is_enabled: boolean
  config: Record<string, any>
}

export interface PublicGatewayStatus {
  stripe: boolean
  whish: boolean
}

// -----------------------------------------------------------------------------
// Raw DB access (service role -> bypasses RLS, server-only)
// -----------------------------------------------------------------------------

async function getGatewayRecord(gateway: GatewayName): Promise<PaymentGatewayRecord | null> {
  try {
    const supabase = createSupabaseServiceClient()
    const { data, error } = await supabase
      .from('payment_gateways')
      .select('gateway, is_enabled, config')
      .eq('gateway', gateway)
      .maybeSingle()

    if (error) {
      console.error(`Error loading payment gateway "${gateway}":`, error.message)
      return null
    }
    return (data as PaymentGatewayRecord) || null
  } catch (err) {
    console.error(`Failed to load payment gateway "${gateway}":`, err)
    return null
  }
}

// -----------------------------------------------------------------------------
// Resolved config (DB first, environment variables as fallback)
// -----------------------------------------------------------------------------

export async function getStripeConfig(): Promise<StripeConfig> {
  const record = await getGatewayRecord('stripe')
  const cfg = record?.config || {}

  const secretKey = (cfg.secretKey as string) || process.env.STRIPE_SECRET_KEY || ''
  const publishableKey =
    (cfg.publishableKey as string) || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
  const webhookSecret = (cfg.webhookSecret as string) || process.env.STRIPE_WEBHOOK_SECRET || ''

  // If there is no record yet, fall back to "enabled when a secret key exists"
  // so existing environment-based installs keep working.
  const enabled = record ? record.is_enabled : !!secretKey

  return { enabled, secretKey, publishableKey, webhookSecret }
}

export async function getWhishConfig(): Promise<WhishConfig> {
  const record = await getGatewayRecord('whish')
  const cfg = record?.config || {}

  const channel = (cfg.channel as string) || process.env.WHISH_CHANNEL || ''
  const secret = (cfg.secret as string) || process.env.WHISH_SECRET || ''
  const websiteUrl = (cfg.websiteUrl as string) || process.env.WHISH_WEBSITE_URL || ''
  const environment =
    (cfg.environment as 'sandbox' | 'production') ||
    (process.env.WHISH_ENVIRONMENT as 'sandbox' | 'production') ||
    'sandbox'

  const enabled = record ? record.is_enabled : false

  return { enabled, channel, secret, websiteUrl, environment }
}

// A gateway is only offered at checkout when it is both enabled AND has the
// minimum credentials required to actually process a payment.
export function isStripeUsable(config: StripeConfig): boolean {
  return config.enabled && !!config.secretKey
}

export function isWhishUsable(config: WhishConfig): boolean {
  return config.enabled && !!config.channel && !!config.secret && !!config.websiteUrl
}

export async function getPublicGatewayStatus(): Promise<PublicGatewayStatus> {
  const [stripe, whish] = await Promise.all([getStripeConfig(), getWhishConfig()])
  return {
    stripe: isStripeUsable(stripe),
    whish: isWhishUsable(whish),
  }
}

// Whish REST base URL for the configured environment (Partner API v1.4.4).
// The previous sandbox host (api.sandbox.whish.money) was retired along with
// its credentials; the new sandbox requires separately issued credentials.
export function whishBaseUrl(environment: 'sandbox' | 'production'): string {
  return environment === 'production'
    ? 'https://api.whish.money/itel-service/api'
    : 'https://partner.api.sbx.whish.money/itel-service/api'
}
