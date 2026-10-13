import { NextRequest, NextResponse } from 'next/server'
import { getEnabledStripeClient } from '@/lib/stripe'
import { STRIPE_SHIPPING_ALLOWED_COUNTRIES } from '@/lib/stripe-shipping-countries'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getPlatformFeePercentage } from '@/lib/actions/platform-settings'
import {
  resolveCheckoutItemsFromDb,
  itemsSubtotal,
  encodeCheckoutItemLines,
} from '@/lib/checkout-items'
import {
  computeCheckoutTotals,
  PLATFORM_FEE_STRIPE_PRODUCT_NAME,
} from '@/lib/checkout-pricing'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting checkout process...')

    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      console.error('❌ Missing NEXT_PUBLIC_SITE_URL environment variable')
      return NextResponse.json({ error: 'Site URL configuration error' }, { status: 500 })
    }

    // Build the Stripe client from the admin-managed configuration.
    // Throws if Stripe is disabled or missing credentials.
    let stripe
    try {
      ;({ stripe } = await getEnabledStripeClient())
    } catch (configError) {
      console.error('❌ Stripe unavailable:', configError)
      return NextResponse.json(
        { error: 'Stripe payments are currently unavailable.', errorKey: 'checkout.errUnavailable' },
        { status: 400 }
      )
    }

    // Buyer authentication is OPTIONAL — gifting from a wishlist does not require
    // an account. If the buyer is signed in we use their account; otherwise they
    // check out as a guest and provide an email.
    console.log('🔍 Checking user authentication (optional)...')
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    console.log(user ? `✅ Signed-in buyer: ${user.id}` : 'ℹ️ Guest checkout')

    // Parse request body
    console.log('🔍 Parsing request body...')
    let requestBody;
    try {
      requestBody = await request.json()
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { items, customMessage, isGift, customerEmail, customerName } = requestBody
    const language = requestBody.language === 'ar' ? 'ar' : 'en'

    // Determine the buyer's email (account email or guest-provided email).
    const buyerEmail: string = (user?.email || customerEmail || '').trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      return NextResponse.json(
        { error: 'A valid email address is required to complete your purchase.', errorKey: 'checkout.validEmail' },
        { status: 400 }
      )
    }
    const buyerName: string = (user?.user_metadata?.full_name || customerName || '').trim()
    console.log('📦 Request data:', { 
      itemsCount: items?.length, 
      hasCustomMessage: !!customMessage, 
      isGift 
    })

    if (!items || items.length === 0) {
      console.error('❌ No items provided in request')
      return NextResponse.json({ error: 'No items provided', errorKey: 'checkout.cartEmptyError' }, { status: 400 })
    }

    let resolvedItems
    try {
      resolvedItems = await resolveCheckoutItemsFromDb(supabase, items)
    } catch (resolveError) {
      const message = resolveError instanceof Error ? resolveError.message : 'Invalid cart'
      const isPurchased = message.includes('purchased')
      return NextResponse.json(
        {
          error: message,
          errorKey: isPurchased ? 'checkout.errPurchased' : 'checkout.errInvalidItem',
        },
        { status: 400 }
      )
    }

    const feePercentage = await getPlatformFeePercentage()
    const totals = computeCheckoutTotals(itemsSubtotal(resolvedItems), feePercentage)

    console.log('🔍 Preparing line items for Stripe...')
    const lineItems = resolvedItems.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.title,
          description: item.wishlist_owner_name
            ? language === 'ar'
              ? `هدية إلى ${item.wishlist_owner_name}`
              : `Gift to ${item.wishlist_owner_name}`
            : language === 'ar'
              ? 'هدية من هديتي'
              : 'Gift from hadiyyati',
          images: item.image_url ? [item.image_url] : [],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }))

    if (totals.platformFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: PLATFORM_FEE_STRIPE_PRODUCT_NAME,
            description:
              language === 'ar'
                ? `عمولة المنصة (${totals.feePercentage}%)`
                : `Platform service fee (${totals.feePercentage}%)`,
            images: [],
          },
          unit_amount: Math.round(totals.platformFee * 100),
        },
        quantity: 1,
      })
    }

    // Create metadata for the session
    const metadata = {
      user_id: user?.id || '',
      buyer_name: buyerName,
      custom_message: customMessage || '',
      is_gift: isGift ? 'true' : 'false',
      item_ids: resolvedItems.map((item) => item.id).join(','),
      item_lines: encodeCheckoutItemLines(resolvedItems),
      wishlist_owner_ids: Array.from(new Set(resolvedItems.map((item) => item.user_id).filter(Boolean))).join(','),
      platform_fee: String(totals.platformFee),
      items_subtotal: String(totals.itemsSubtotal),
    }
    
    console.log('📋 Session metadata:', metadata)

    console.log('🔍 Creating Stripe checkout session with config')

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout`,
      metadata,
      // Stripe Checkout has no Arabic locale. English is explicit; Arabic follows the browser.
      locale: language === 'en' ? 'en' : 'auto',
      customer_email: buyerEmail,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: STRIPE_SHIPPING_ALLOWED_COUNTRIES,
      },
    })
    
    console.log('✅ Stripe session created successfully:', session.id)
    return NextResponse.json({ sessionId: session.id, url: session.url })
    
  } catch (error) {
    console.error('❌ Checkout error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown',
    })
    
    // Return more specific error message if it's a Stripe error
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as any
      console.error('❌ Stripe specific error:', {
        type: stripeError.type,
        code: stripeError.code,
        message: stripeError.message,
        param: stripeError.param
      })
      
      return NextResponse.json(
        { 
          error: `Stripe error: ${stripeError.message}`,
          errorKey: 'checkout.errSession',
          details: process.env.NODE_ENV === 'development' ? stripeError : undefined
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        errorKey: 'checkout.errSession',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
} 