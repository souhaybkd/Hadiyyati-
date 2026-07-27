// Server-only Whish Pay integration.
// Implements the subset of the Whish Partner API (v1.4.4) used at checkout:
//   - Create a payment   (POST /payment/whish)            -> returns a collect URL
//   - Get payment status (POST /payment/collect/status)   -> collect status
// Credentials (channel / secret / websiteUrl / environment) are read from the
// admin-managed `payment_gateways` table via lib/payment-config.
import { getWhishConfig, whishBaseUrl, type WhishConfig } from '@/lib/payment-config'
import { createSupabaseServiceClient } from '@/lib/supabase-service'
import { createOrder } from '@/lib/actions/checkout'

// Whish requires a User-Agent that identifies *our* application, in the format
// AppName/version (website; contact-email).
const WHISH_USER_AGENT = 'Hadiyyati/1.0 (https://hadiyyati.me; support@hadiyyati.com)'

// `status:false` paired with this code means the outcome is undetermined
// (pending) rather than failed, and must never be treated as a failure.
const WHISH_PENDING_CODE = '500'

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
  retrieved?: boolean
}

// Whish answers with HTTP 200 and puts the real outcome in the body, so callers
// branch on `status`/`code` instead of the HTTP status code. Transport-level
// rejections (e.g. 403 for non-public callback URLs) surface as thrown errors.
async function whishRequest<T>(
  config: WhishConfig,
  path: string,
  body: unknown
): Promise<WhishResponse<T>> {
  const res = await fetch(`${whishBaseUrl(config.environment)}${path}`, {
    method: 'POST',
    headers: whishHeaders(config),
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  const raw = await res.text()
  let json: WhishResponse<T> | null = null
  try {
    json = raw ? (JSON.parse(raw) as WhishResponse<T>) : null
  } catch {
    json = null
  }

  if (!json) {
    if (res.status === 403) {
      throw new Error(
        'Whish rejected the request (403). Callback and redirect URLs must be publicly reachable.'
      )
    }
    throw new Error(`Whish returned an unexpected response (HTTP ${res.status}).`)
  }

  return json
}

function isPendingResponse(json: WhishResponse<unknown>): boolean {
  return !json.status && String(json.code) === WHISH_PENDING_CODE
}

function whishErrorMessage(json: WhishResponse<unknown>, fallback: string): string {
  return json.dialog?.message || `${fallback} (code: ${json.code ?? 'unknown'})`
}

// Whish takes the amount as a JSON string: USD allows 2 decimals with a $1.00
// minimum, LBP takes whole numbers with a 1000 minimum.
export function formatWhishAmount(amount: number, currency: 'USD' | 'LBP'): string {
  if (currency === 'LBP') {
    const whole = Math.round(amount)
    if (whole < 1000) {
      throw new Error('The minimum amount for an LBP payment is 1,000 LBP.')
    }
    return String(whole)
  }

  const rounded = Math.round(amount * 100) / 100
  if (rounded < 1) {
    throw new Error('The minimum amount for a USD payment is $1.00.')
  }
  return rounded.toFixed(2)
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

// Creates the payment and returns the hosted URL the buyer should be sent to.
// A successful response only means the link was generated, not that it is paid.
export async function createWhishPayment(
  config: WhishConfig,
  input: CreateWhishPaymentInput
): Promise<{ collectUrl: string }> {
  const json = await whishRequest<{ collectUrl: string }>(config, '/payment/whish', {
    amount: formatWhishAmount(input.amount, input.currency),
    currency: input.currency,
    invoice: input.invoice,
    externalId: String(input.externalId),
    successCallbackUrl: input.successCallbackUrl,
    failureCallbackUrl: input.failureCallbackUrl,
    successRedirectUrl: input.successRedirectUrl,
    failureRedirectUrl: input.failureRedirectUrl,
  })

  if (!json.status || !json.data?.collectUrl) {
    throw new Error(whishErrorMessage(json, 'Whish payment failed'))
  }

  return { collectUrl: json.data.collectUrl }
}

// Only `success` and `failed` are settled outcomes. `pending` means the link is
// still payable (a failed *attempt* leaves it pending), and `unknown` means the
// final state could not be determined.
export type WhishCollectStatus = 'success' | 'failed' | 'pending' | 'refunded' | 'unknown'

export async function getWhishStatus(
  config: WhishConfig,
  externalId: number,
  currency: 'USD' | 'LBP'
): Promise<WhishCollectStatus> {
  const json = await whishRequest<{ collectStatus: string; payerPhoneNumber?: string }>(
    config,
    '/payment/collect/status',
    { currency, externalId: String(externalId) }
  )

  // Undetermined outcome — reconcile later rather than settling the order.
  if (isPendingResponse(json)) return 'unknown'

  if (!json.status || !json.data) {
    throw new Error(whishErrorMessage(json, 'Failed to retrieve Whish payment status'))
  }

  switch ((json.data.collectStatus || '').toLowerCase()) {
    case 'success':
      return 'success'
    case 'failed':
      return 'failed'
    case 'refunded':
      return 'refunded'
    case 'pending':
      return 'pending'
    default:
      return 'unknown'
  }
}

export interface FinalizeResult {
  status: 'success' | 'failed' | 'pending' | 'refunded' | 'not_found'
  orderId?: string
  payment?: any
}

// Verifies the Whish transaction status and, on success, creates the order
// exactly once. Safe to call multiple times (idempotent) — invoked from both
// the Whish callback webhook and the success page status poll so the order is
// created even when a callback never arrives.
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
  if (payment.status === 'refunded') {
    return { status: 'refunded', payment }
  }

  const config = await getWhishConfig()
  let collectStatus: WhishCollectStatus
  try {
    collectStatus = await getWhishStatus(config, externalId, payment.currency)
  } catch (statusError) {
    console.error('Error checking Whish status:', statusError)
    return { status: 'pending', payment }
  }

  // Not a settled outcome: the link is still payable (or the state is unknown),
  // so leave the payment open and reconcile on a later poll/callback.
  if (collectStatus === 'pending' || collectStatus === 'unknown') {
    return { status: 'pending', payment }
  }

  // The link expired without being paid — this is the only settled failure.
  if (collectStatus === 'failed') {
    await supabase
      .from('whish_payments')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('external_id', externalId)
    return { status: 'failed', payment }
  }

  // Paid then refunded before we ever created the order: do not fulfil it.
  if (collectStatus === 'refunded') {
    await supabase
      .from('whish_payments')
      .update({ status: 'refunded', updated_at: new Date().toISOString() })
      .eq('external_id', externalId)
    return { status: 'refunded', payment }
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
