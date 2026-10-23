import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient, getStripeWebhookSecret } from '@/lib/stripe'
import { fulfillStripeCheckoutSession } from '@/lib/stripe-fulfillment'

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

async function handleCheckoutSessionCompleted(session: { id: string }) {
  console.log('Processing checkout session completed:', session.id)
  const result = await fulfillStripeCheckoutSession(session.id)
  if (!result.fulfilled) {
    console.log('Checkout session not paid yet, skipping order:', session.id)
    return
  }
  console.log('Order recorded for Stripe session:', session.id, result.order.id)
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  console.log('Payment intent succeeded:', paymentIntent.id)
  // Additional processing if needed
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  console.log('Payment intent failed:', paymentIntent.id)
  // Handle failed payment - maybe update order status
} 