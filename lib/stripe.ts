import { loadStripe } from '@stripe/stripe-js'
import Stripe from 'stripe'

// Client-side Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export const getStripe = () => {
  return stripePromise
}

// Server-side Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// Helper functions for payments
export const createPaymentIntent = async (amount: number, currency: string = 'usd') => {
  return await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency,
    automatic_payment_methods: {
      enabled: true,
    },
  })
}

export const createCheckoutSession = async (
  items: Array<{
    price: number
    quantity: number
    name: string
    description?: string
  }>,
  successUrl: string,
  cancelUrl: string,
  metadata?: { [key: string]: string }
) => {
  return await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: item.description,
        },
        unit_amount: item.price * 100, // Convert to cents
      },
      quantity: item.quantity,
    })),
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  })
}

export const retrievePaymentIntent = async (paymentIntentId: string) => {
  return await stripe.paymentIntents.retrieve(paymentIntentId)
}

// Webhook helpers
export const constructEventFromRequest = (body: Buffer, signature: string) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
  return stripe.webhooks.constructEvent(body, signature, webhookSecret)
} 