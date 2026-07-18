import Stripe from 'stripe'
import { getStripeConfig, isStripeUsable } from '@/lib/payment-config'

// Server-side Stripe client, built from the credentials stored in the
// `payment_gateways` table (with environment variables as a fallback) so the
// secret key can be managed from the admin dashboard instead of being hardcoded.
export async function getStripeClient(): Promise<Stripe> {
  const config = await getStripeConfig()

  if (!config.secretKey) {
    throw new Error('Stripe is not configured. Add a secret key in the admin dashboard.')
  }

  return new Stripe(config.secretKey, {
    apiVersion: '2023-10-16',
  })
}

// Returns { stripe, config } and throws if Stripe is disabled or unconfigured.
export async function getEnabledStripeClient(): Promise<{
  stripe: Stripe
  webhookSecret: string
}> {
  const config = await getStripeConfig()

  if (!isStripeUsable(config)) {
    throw new Error('Stripe payments are currently unavailable.')
  }

  return {
    stripe: new Stripe(config.secretKey, { apiVersion: '2023-10-16' }),
    webhookSecret: config.webhookSecret,
  }
}

export async function getStripeWebhookSecret(): Promise<string> {
  const config = await getStripeConfig()
  return config.webhookSecret
}
