import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasStripePublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      hasSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      stripeKeyStart: process.env.STRIPE_SECRET_KEY?.substring(0, 8) + '...',
      publishableKeyStart: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 8) + '...'
    }

    // Test Stripe connection
    let stripeTest = null
    try {
      // Simple API call to test Stripe connection
      const account = await stripe.accounts.retrieve()
      stripeTest = {
        connected: true,
        accountId: account.id,
        country: account.country
      }
    } catch (stripeError: any) {
      stripeTest = {
        connected: false,
        error: stripeError.message,
        type: stripeError.type
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envCheck,
      stripe: stripeTest,
      nodeEnv: process.env.NODE_ENV
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 