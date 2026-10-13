import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient, getStripeWebhookSecret } from '@/lib/stripe'
import { createOrder, sendGiftNotification } from '@/lib/actions/checkout'
import { createSupabaseServiceClient } from '@/lib/supabase-service'
import { PLATFORM_FEE_STRIPE_PRODUCT_NAME } from '@/lib/checkout-pricing'
import {
  parseCheckoutItemLines,
  uniqueWishlistIdsFromMetadata,
} from '@/lib/checkout-items'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  const stripe = await getStripeClient()
  const webhookSecret = await getStripeWebhookSecret()

  if (!webhookSecret) {
    console.error('Stripe webhook secret is not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event: any

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  console.log('Processing checkout session completed:', session.id)

  try {
    // Get the full session with line items
    const stripe = await getStripeClient()
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items.data.price.product']
    })

    const metadata = fullSession.metadata || {}
    const itemLines = metadata.item_lines as string | undefined
    const checkoutLines = itemLines?.trim()
      ? parseCheckoutItemLines(itemLines)
      : (metadata.item_ids ? metadata.item_ids.split(',').filter(Boolean) : []).map((id: string) => ({
          id,
          quantity: 1,
        }))

    const itemIds = uniqueWishlistIdsFromMetadata(itemLines, metadata.item_ids)

    console.log('Extracted checkout lines from metadata:', checkoutLines)

    const service = createSupabaseServiceClient()
    const { data: wishlistRows } = await service
      .from('wishlist_items')
      .select('id, title, description, price, image_url')
      .in('id', itemIds)

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

    // Log if Stripe line items included the platform fee (not stored as order_items).
    const feeLines = (fullSession.line_items?.data || []).filter((item) => {
      const product = item.price?.product as { name?: string } | undefined
      return product?.name === PLATFORM_FEE_STRIPE_PRODUCT_NAME
    })
    if (feeLines.length > 1) {
      console.warn('Unexpected multiple platform fee line items on session', session.id)
    }

    console.log('Prepared order items with wishlist_item_ids:', orderItems)

    // Create order in database.
    // Pass the buyer id explicitly since a webhook request has no user session.
    const order = await createOrder(
      session.id,
      (session.amount_total || 0) / 100, // Convert from cents
      session.currency || 'usd',
      session.customer_email || '',
      metadata.custom_message || null,
      metadata.is_gift === 'true',
      metadata.wishlist_owner_ids || null,
      orderItems,
      metadata.user_id || null,
      metadata.buyer_name || null
    )

    // Send gift notification to wishlist owners if it's a gift
    if (metadata.is_gift === 'true' && metadata.wishlist_owner_ids) {
      const wishlistOwnerIds = metadata.wishlist_owner_ids.split(',')
      
      for (const ownerId of wishlistOwnerIds) {
        try {
          await sendGiftNotification(
            order.id,
            ownerId.trim(),
            metadata.user_id || null, // Sender id (null for guest checkout)
            metadata.buyer_name || session.customer_email?.split('@')[0] || 'Gift Sender',
            metadata.custom_message || null,
            orderItems.map(item => ({
              title: item.title,
              price: item.price,
              image_url: item.image_url
            }))
          )
        } catch (error) {
          console.error(`Failed to send notification to wishlist owner ${ownerId}:`, error)
          // Continue with other notifications even if one fails
        }
      }
    }

    console.log('Order created successfully:', order.id)
    console.log('Dashboard should now show updated data for users:', metadata.wishlist_owner_ids)
  } catch (error) {
    console.error('Error processing checkout session:', error)
    throw error
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  console.log('Payment intent succeeded:', paymentIntent.id)
  // Additional processing if needed
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  console.log('Payment intent failed:', paymentIntent.id)
  // Handle failed payment - maybe update order status
} 