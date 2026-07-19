import { NextRequest, NextResponse } from 'next/server'
import { getEnabledStripeClient } from '@/lib/stripe'
import { createSupabaseServerClient } from '@/lib/supabase-server'

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
        { error: 'Stripe payments are currently unavailable.' },
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

    // Determine the buyer's email (account email or guest-provided email).
    const buyerEmail: string = (user?.email || customerEmail || '').trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      return NextResponse.json(
        { error: 'A valid email address is required to complete your purchase.' },
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
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    // Validate items structure
    console.log('🔍 Validating items structure...')
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.title || typeof item.price !== 'number' || item.price <= 0) {
        console.error(`❌ Invalid item at index ${i}:`, item)
        return NextResponse.json({ 
          error: `Invalid item data at index ${i}. Missing title or invalid price.` 
        }, { status: 400 })
      }
    }
    console.log('✅ Items validation passed')

    // Check if any items are marked as purchased
    console.log('🔍 Checking if items are available for purchase...')
    const itemIds = items.map((item: any) => item.id).filter(Boolean)
    if (itemIds.length > 0) {
      const { data: wishlistItems, error: itemsError } = await supabase
        .from('wishlist_items')
        .select('id, title, is_purchased')
        .in('id', itemIds)

      if (itemsError) {
        console.error('❌ Error checking wishlist items:', itemsError)
        return NextResponse.json({ 
          error: 'Failed to validate items' 
        }, { status: 500 })
      }

      const purchasedItems = wishlistItems?.filter(item => item.is_purchased) || []
      if (purchasedItems.length > 0) {
        console.error('❌ Some items are already marked as purchased:', purchasedItems.map(i => i.title))
        return NextResponse.json({ 
          error: `Cannot purchase: ${purchasedItems.map(i => i.title).join(', ')} ${purchasedItems.length === 1 ? 'is' : 'are'} already marked as purchased.` 
        }, { status: 400 })
      }
    }
    console.log('✅ All items are available for purchase')

    // Calculate total and prepare line items
    console.log('🔍 Preparing line items for Stripe...')
    const lineItems = items.map((item: any, index: number) => {
      console.log(`📝 Processing item ${index}:`, {
        title: item.title,
        price: item.price,
        quantity: item.quantity || 1,
        wishlist_owner_name: item.wishlist_owner_name
      })
      
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.title,
            description: item.wishlist_owner_name 
              ? `Gift to ${item.wishlist_owner_name}` 
              : 'Gift from hadiyyati',
            images: item.image_url ? [item.image_url] : [],
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity || 1,
      }
    })

    // Create metadata for the session
    const metadata = {
      user_id: user?.id || '',
      buyer_name: buyerName,
      custom_message: customMessage || '',
      is_gift: isGift ? 'true' : 'false',
      item_ids: items.map((item: any) => item.id).join(','),
      wishlist_owner_ids: Array.from(new Set(items.map((item: any) => item.user_id))).join(','),
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
      customer_email: buyerEmail,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'SE', 'DK', 'NO', 'FI'],
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
          details: process.env.NODE_ENV === 'development' ? stripeError : undefined
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
} 