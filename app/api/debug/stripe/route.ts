import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripe'
import { getStripeConfig } from '@/lib/payment-config'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    // This endpoint discloses payment configuration details, so restrict it to admins.
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const config = await getStripeConfig()

    // Check configuration (DB-managed with env fallback)
    const envCheck = {
      stripeEnabled: config.enabled,
      hasStripeSecretKey: !!config.secretKey,
      hasStripePublishableKey: !!config.publishableKey,
      hasSiteUrl: !!process.env.NEXT_PUBLIC_SITE_URL,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
      stripeKeyStart: config.secretKey ? config.secretKey.substring(0, 8) + '...' : null,
      publishableKeyStart: config.publishableKey ? config.publishableKey.substring(0, 8) + '...' : null,
    }

    // Test Stripe connection
    let stripeTest = null
    try {
      // Simple API call to test Stripe connection
      const stripe = await getStripeClient()
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