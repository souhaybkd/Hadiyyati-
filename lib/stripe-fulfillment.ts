import { getStripeClient } from '@/lib/stripe'
import { createOrder } from '@/lib/actions/checkout'
import { createSupabaseServiceClient } from '@/lib/supabase-service'
import { PLATFORM_FEE_STRIPE_PRODUCT_NAME } from '@/lib/checkout-pricing'
import {
  parseCheckoutItemLines,
  uniqueWishlistIdsFromMetadata,
} from '@/lib/checkout-items'

/**
 * Creates the platform order for a paid Stripe Checkout session.
 * Idempotent: a second call for the same session returns the existing order.
 * Used by the webhook and by the success page so a missed webhook still
 * records the gift for the wishlist owner and the admin dashboard.
 */
export async function fulfillStripeCheckoutSession(sessionId: string) {
  const stripe = await getStripeClient()
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items.data.price.product'],
  })

  if (session.payment_status !== 'paid') {
    return { fulfilled: false as const, session, reason: 'unpaid' as const }
  }

  const metadata = session.metadata || {}
  const itemLines = metadata.item_lines as string | undefined
  const checkoutLines = itemLines?.trim()
    ? parseCheckoutItemLines(itemLines)
    : (metadata.item_ids ? metadata.item_ids.split(',').filter(Boolean) : []).map((id: string) => ({
        id,
        quantity: 1,
      }))

  const itemIds = uniqueWishlistIdsFromMetadata(itemLines, metadata.item_ids)
  if (itemIds.length === 0) {
    throw new Error('Stripe session is missing wishlist item metadata')
  }

  const service = createSupabaseServiceClient()
  const { data: wishlistRows, error: wishlistError } = await service
    .from('wishlist_items')
    .select('id, title, description, price, image_url')
    .in('id', itemIds)

  if (wishlistError) {
    throw new Error('Failed to load wishlist items for Stripe order')
  }

  const wishlistById = new Map((wishlistRows || []).map((row) => [row.id, row]))

  const orderItems = checkoutLines.map(({ id, quantity }) => {
    const row = wishlistById.get(id)
    return {
      wishlist_item_id: id,
      title: row?.title || 'Gift item',
      description: row?.description || null,
      price: Number(row?.price ?? 0),
      quantity,
      image_url: row?.image_url || null,
    }
  })

  const feeLines = (session.line_items?.data || []).filter((item) => {
    const product = item.price?.product as { name?: string } | string | undefined
    const name = typeof product === 'object' && product ? product.name : undefined
    return name === PLATFORM_FEE_STRIPE_PRODUCT_NAME
  })
  if (feeLines.length > 1) {
    console.warn('Unexpected multiple platform fee line items on session', session.id)
  }

  const customerEmail =
    session.customer_details?.email || session.customer_email || ''

  const order = await createOrder(
    session.id,
    (session.amount_total || 0) / 100,
    session.currency || 'usd',
    customerEmail,
    metadata.custom_message || null,
    metadata.is_gift === 'true',
    metadata.wishlist_owner_ids || null,
    orderItems,
    metadata.user_id || null,
    metadata.buyer_name || null
  )

  return { fulfilled: true as const, session, order }
}
