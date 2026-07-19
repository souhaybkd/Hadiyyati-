// Server-only Whish Pay integration.
// Implements the subset of the Whish Web Service (v1.4) used at checkout:
//   - Post Payment  (POST /payment/whish)      -> returns a collect URL
//   - Get Status    (POST /payment/collect/status) -> success | failed | pending
// Credentials (channel / secret / websiteUrl / environment) are read from the
// admin-managed `payment_gateways` table via lib/payment-config.
import { getWhishConfig, whishBaseUrl, type WhishConfig } from '@/lib/payment-config'
import { createSupabaseServiceClient } from '@/lib/supabase-service'
import { createOrder } from '@/lib/actions/checkout'

const WHISH_USER_AGENT = 'Whish/1.0 (https://whish.money; support@whish.money)'

function whishHeaders(config: WhishConfig): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    channel: config.channel,
    secret: config.secret,
    websiteUrl: config.websiteUrl,
    'User-Agent': WHISH_USER_AGENT,
  }
}

interface WhishResponse<T> {
  status: boolean
  code: string | null
  dialog: { title?: string; message?: string } | null
  data: T | null
}

export interface CreateWhishPaymentInput {
  amount: number
  currency: 'USD' | 'LBP'
  invoice: string
  externalId: number
  successCallbackUrl: string
  failureCallbackUrl: string
  successRedirectUrl: string
  failureRedirectUrl: string
}

// Calls Post Payment and returns the collect URL the buyer should be sent to.
export async function createWhishPayment(
  config: WhishConfig,
  input: CreateWhishPaymentInput
): Promise<{ collectUrl: string }> {
  const res = await fetch(`${whishBaseUrl(config.environment)}/payment/whish`, {
    method: 'POST',
    headers: whishHeaders(config),
    body: JSON.stringify(input),
    cache: 'no-store',
  })

  const json = (await res.json()) as WhishResponse<{ collectUrl: string }>

  if (!res.ok || !json.status || !json.data?.collectUrl) {
    const message = json?.dialog?.message || `Whish payment failed (code: ${json?.code ?? 'unknown'})`
    throw new Error(message)
  }

  return { collectUrl: json.data.collectUrl }
}

export type WhishCollectStatus = 'success' | 'failed' | 'pending'

// Calls Get Status for a given external transaction id.
export async function getWhishStatus(
  config: WhishConfig,
  externalId: number,
  currency: 'USD' | 'LBP'
): Promise<WhishCollectStatus> {
  const res = await fetch(`${whishBaseUrl(config.environment)}/payment/collect/status`, {
    method: 'POST',
    headers: whishHeaders(config),
    body: JSON.stringify({ externalId, currency }),
    cache: 'no-store',
  })

  const json = (await res.json()) as WhishResponse<{ collectStatus: string }>

  if (!res.ok || !json.status || !json.data) {
    throw new Error(json?.dialog?.message || 'Failed to retrieve Whish payment status')
  }

  const status = (json.data.collectStatus || '').toLowerCase()
  if (status === 'success') return 'success'
  if (status === 'failed') return 'failed'
  return 'pending'
}

export interface FinalizeResult {
  status: 'success' | 'failed' | 'pending' | 'not_found'
  orderId?: string
  payment?: any
}

// Verifies the Whish transaction status and, on success, creates the order
// exactly once. Safe to call multiple times (idempotent) — invoked from both
// the Whish callback webhook and the success page status poll so the order is
// created even when Whish cannot reach the callback URL (e.g. localhost).
export async function finalizeWhishPayment(externalId: number): Promise<FinalizeResult> {
  const supabase = createSupabaseServiceClient()

  const { data: payment, error } = await supabase
    .from('whish_payments')
    .select('*')
    .eq('external_id', externalId)
    .maybeSingle()

  if (error || !payment) {
    return { status: 'not_found' }
  }

  // Already finalized.
  if (payment.order_id) {
    return { status: 'success', orderId: payment.order_id, payment }
  }
  if (payment.status === 'failed') {
    return { status: 'failed', payment }
  }

  const config = await getWhishConfig()
  let collectStatus: WhishCollectStatus
  try {
    collectStatus = await getWhishStatus(config, externalId, payment.currency)
  } catch (statusError) {
    console.error('Error checking Whish status:', statusError)
    return { status: 'pending', payment }
  }

  if (collectStatus === 'pending') {
    return { status: 'pending', payment }
  }

  if (collectStatus === 'failed') {
    await supabase
      .from('whish_payments')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('external_id', externalId)
    return { status: 'failed', payment }
  }

  // Success -> create the order.
  const items = (payment.items || []) as Array<any>
  const orderItems = items.map((item) => ({
    wishlist_item_id: item.id || '',
    title: item.title,
    description: item.description ?? null,
    price: Number(item.price),
    quantity: item.quantity || 1,
    image_url: item.image_url ?? null,
  }))

  const order = await createOrder(
    `whish_${externalId}`,
    Number(payment.amount),
    payment.currency,
    payment.customer_email || '',
    payment.custom_message ?? null,
    payment.is_gift,
    payment.wishlist_owner_ids ?? null,
    orderItems,
    payment.user_id ?? null,
    payment.customer_name ?? null
  )

  await supabase
    .from('whish_payments')
    .update({ status: 'success', order_id: order.id, updated_at: new Date().toISOString() })
    .eq('external_id', externalId)

  return { status: 'success', orderId: order.id, payment: { ...payment, order_id: order.id } }
}
