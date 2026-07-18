import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseServiceClient } from '@/lib/supabase-service'
import { getWhishConfig, isWhishUsable } from '@/lib/payment-config'
import { createWhishPayment } from '@/lib/whish'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      return NextResponse.json({ error: 'Site URL configuration error' }, { status: 500 })
    }

    // Ensure Whish is enabled and configured.
    const whishConfig = await getWhishConfig()
    if (!isWhishUsable(whishConfig)) {
      return NextResponse.json(
        { error: 'Whish payments are currently unavailable.' },
        { status: 400 }
      )
    }

    // Authenticate buyer.
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate body.
    let requestBody: any
    try {
      requestBody = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { items, customMessage, isGift } = requestBody

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item.title || typeof item.price !== 'number' || item.price <= 0) {
        return NextResponse.json(
          { error: `Invalid item data at index ${i}. Missing title or invalid price.` },
          { status: 400 }
        )
      }
    }

    // Prevent buying already-purchased items.
    const itemIds = items.map((item: any) => item.id).filter(Boolean)
    if (itemIds.length > 0) {
      const { data: wishlistItems, error: itemsError } = await supabase
        .from('wishlist_items')
        .select('id, title, is_purchased')
        .in('id', itemIds)

      if (itemsError) {
        return NextResponse.json({ error: 'Failed to validate items' }, { status: 500 })
      }

      const purchasedItems = wishlistItems?.filter((item) => item.is_purchased) || []
      if (purchasedItems.length > 0) {
        return NextResponse.json(
          {
            error: `Cannot purchase: ${purchasedItems
              .map((i) => i.title)
              .join(', ')} ${purchasedItems.length === 1 ? 'is' : 'are'} already marked as purchased.`,
          },
          { status: 400 }
        )
      }
    }

    // Compute total (matches Stripe: sum of item prices, no separate tax line).
    const amount = items.reduce(
      (sum: number, item: any) => sum + item.price * (item.quantity || 1),
      0
    )
    const currency = 'USD' as const

    const wishlistOwnerIds = Array.from(
      new Set(items.map((item: any) => item.user_id).filter(Boolean))
    ).join(',')

    // Unique numeric reference for this transaction.
    const externalId = Date.now()

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
    const successRedirectUrl = `${siteUrl}/checkout/success?gateway=whish&externalId=${externalId}`
    const failureRedirectUrl = `${siteUrl}/checkout?error=payment_failed`
    const successCallbackUrl = `${siteUrl}/api/webhooks/whish?status=success&externalId=${externalId}`
    const failureCallbackUrl = `${siteUrl}/api/webhooks/whish?status=failure&externalId=${externalId}`

    // Persist a pending record BEFORE redirecting so the order can be created
    // when the payment is confirmed (via callback or the success page poll).
    const service = createSupabaseServiceClient()
    const { error: insertError } = await service.from('whish_payments').insert({
      external_id: externalId,
      user_id: user.id,
      customer_email: user.email,
      amount,
      currency,
      custom_message: customMessage || null,
      is_gift: !!isGift,
      wishlist_owner_ids: wishlistOwnerIds || null,
      items,
      status: 'pending',
    })

    if (insertError) {
      console.error('Failed to create whish_payments record:', insertError)
      return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 })
    }

    // Create the Whish payment and get the collect URL.
    const { collectUrl } = await createWhishPayment(whishConfig, {
      amount,
      currency,
      invoice: `hadiyyati order ${externalId}`,
      externalId,
      successCallbackUrl,
      failureCallbackUrl,
      successRedirectUrl,
      failureRedirectUrl,
    })

    // Store the collect URL for reference.
    await service
      .from('whish_payments')
      .update({ collect_url: collectUrl })
      .eq('external_id', externalId)

    return NextResponse.json({ url: collectUrl, externalId })
  } catch (error) {
    console.error('❌ Whish checkout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create Whish payment' },
      { status: 500 }
    )
  }
}
