'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseServiceClient } from '@/lib/supabase-service'
import {
  getPublicGatewayStatus,
  type GatewayName,
  type PublicGatewayStatus,
} from '@/lib/payment-config'
import { revalidatePath } from 'next/cache'

// Shape returned to the admin dashboard (includes secrets, admin-only).
export interface AdminGatewaySettings {
  stripe: {
    is_enabled: boolean
    secretKey: string
    publishableKey: string
    webhookSecret: string
  }
  whish: {
    is_enabled: boolean
    channel: string
    secret: string
    websiteUrl: string
    environment: 'sandbox' | 'production'
  }
}

async function assertAdmin() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }
}

// Public, client-safe: only booleans, no secrets. Used by the checkout page.
export async function getPublicGatewayStatusAction(): Promise<PublicGatewayStatus> {
  return getPublicGatewayStatus()
}

// Admin-only: full configuration including secrets.
export async function getGatewaySettingsForAdmin(): Promise<AdminGatewaySettings> {
  await assertAdmin()

  const supabase = createSupabaseServiceClient()
  const { data, error } = await supabase
    .from('payment_gateways')
    .select('gateway, is_enabled, config')

  if (error) {
    console.error('Error fetching gateway settings:', error)
    throw new Error('Failed to fetch payment gateway settings')
  }

  const byGateway: Record<string, { is_enabled: boolean; config: Record<string, any> }> = {}
  for (const row of data || []) {
    byGateway[row.gateway] = { is_enabled: row.is_enabled, config: row.config || {} }
  }

  const stripe = byGateway['stripe'] || { is_enabled: false, config: {} }
  const whish = byGateway['whish'] || { is_enabled: false, config: {} }

  return {
    stripe: {
      is_enabled: stripe.is_enabled,
      secretKey: stripe.config.secretKey || '',
      publishableKey: stripe.config.publishableKey || '',
      webhookSecret: stripe.config.webhookSecret || '',
    },
    whish: {
      is_enabled: whish.is_enabled,
      channel: whish.config.channel || '',
      secret: whish.config.secret || '',
      websiteUrl: whish.config.websiteUrl || '',
      environment: (whish.config.environment as 'sandbox' | 'production') || 'sandbox',
    },
  }
}

async function upsertGateway(
  gateway: GatewayName,
  is_enabled: boolean,
  config: Record<string, any>
) {
  const supabase = createSupabaseServiceClient()
  const { error } = await supabase.from('payment_gateways').upsert(
    {
      gateway,
      is_enabled,
      config,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'gateway' }
  )

  if (error) {
    console.error(`Error saving ${gateway} settings:`, error)
    throw new Error(`Failed to save ${gateway} settings`)
  }
}

export async function updateStripeSettings(input: {
  is_enabled: boolean
  secretKey: string
  publishableKey: string
  webhookSecret: string
}) {
  await assertAdmin()

  if (input.is_enabled && !input.secretKey.trim()) {
    throw new Error('A Stripe secret key is required to enable Stripe.')
  }

  await upsertGateway('stripe', input.is_enabled, {
    secretKey: input.secretKey.trim(),
    publishableKey: input.publishableKey.trim(),
    webhookSecret: input.webhookSecret.trim(),
  })

  revalidatePath('/admin')
  revalidatePath('/checkout')
  return { success: true }
}

export async function updateWhishSettings(input: {
  is_enabled: boolean
  channel: string
  secret: string
  websiteUrl: string
  environment: 'sandbox' | 'production'
}) {
  await assertAdmin()

  if (input.is_enabled && (!input.channel.trim() || !input.secret.trim() || !input.websiteUrl.trim())) {
    throw new Error('Channel, secret and website URL are required to enable Whish.')
  }

  await upsertGateway('whish', input.is_enabled, {
    channel: input.channel.trim(),
    secret: input.secret.trim(),
    websiteUrl: input.websiteUrl.trim(),
    environment: input.environment,
  })

  revalidatePath('/admin')
  revalidatePath('/checkout')
  return { success: true }
}

// Quick enable/disable toggle without editing credentials.
export async function toggleGateway(gateway: GatewayName, is_enabled: boolean) {
  await assertAdmin()

  const supabase = createSupabaseServiceClient()

  // Read existing config so we don't wipe credentials on a simple toggle.
  const { data: existing } = await supabase
    .from('payment_gateways')
    .select('config')
    .eq('gateway', gateway)
    .maybeSingle()

  await upsertGateway(gateway, is_enabled, existing?.config || {})

  revalidatePath('/admin')
  revalidatePath('/checkout')
  return { success: true }
}
