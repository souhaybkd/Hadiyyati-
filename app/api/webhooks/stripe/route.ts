import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createOrder, sendGiftNotification } from '@/lib/actions/checkout'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: any

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
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
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items.data.price.product']
    })

    const metadata = fullSession.metadata || {}
    const lineItems = fullSession.line_items?.data || []

    // Extract wishlist item IDs from metadata
    const itemIds = metadata.item_ids ? metadata.item_ids.split(',') : []
    
    console.log('Extracted item IDs from metadata:', itemIds)

    // Prepare order items with correct wishlist_item_id mapping
    const orderItems = lineItems.map((item: any, index: number) => ({
      wishlist_item_id: itemIds[index] || '', // Map to actual wishlist item ID
      title: item.description || item.price?.product?.name || 'Unknown Item',
      description: item.price?.product?.description || null,
      price: (item.amount_total || 0) / 100, // Convert from cents
      quantity: item.quantity || 1,
      image_url: item.price?.product?.images?.[0] || null
    }))

    console.log('Prepared order items with wishlist_item_ids:', orderItems)

    // Create order in database
    const order = await createOrder(
      session.id,
      (session.amount_total || 0) / 100, // Convert from cents
      session.currency || 'usd',
      session.customer_email || '',
      metadata.custom_message || null,
      metadata.is_gift === 'true',
      metadata.wishlist_owner_ids || null,
      orderItems
    )

    // Send gift notification to wishlist owners if it's a gift
    if (metadata.is_gift === 'true' && metadata.wishlist_owner_ids) {
      const wishlistOwnerIds = metadata.wishlist_owner_ids.split(',')
      
      for (const ownerId of wishlistOwnerIds) {
        try {
          await sendGiftNotification(
            order.id,
            ownerId.trim(),
            metadata.user_id || '', // Get sender ID from metadata
            session.customer_email?.split('@')[0] || 'Gift Sender',
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