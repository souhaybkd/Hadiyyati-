import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { finalizeWhishPayment } from '@/lib/whish'

// Called by the success page to confirm a Whish payment and retrieve the order
// details. This also acts as a reliable fallback for order creation when Whish
// cannot reach our callback URL (e.g. during local development).
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const externalIdParam = searchParams.get('externalId')

    if (!externalIdParam) {
      return NextResponse.json({ error: 'Missing externalId' }, { status: 400 })
    }

    const externalId = Number(externalIdParam)
    if (!Number.isFinite(externalId)) {
      return NextResponse.json({ error: 'Invalid externalId' }, { status: 400 })
    }

    // Ensure the requester is the buyer who initiated this payment.
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await finalizeWhishPayment(externalId)

    if (result.status === 'not_found') {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const payment = result.payment

    // Only the buyer may view their own payment details.
    if (payment?.user_id && payment.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access to this payment' }, { status: 403 })
    }

    const items = (payment?.items || []) as Array<any>

    return NextResponse.json({
      status: result.status, // success | failed | pending
      orderId: result.orderId || null,
      amount_total: Math.round(Number(payment?.amount || 0) * 100),
      currency: payment?.currency || 'USD',
      customer_email: payment?.customer_email || '',
      is_gift: !!payment?.is_gift,
      custom_message: payment?.custom_message || null,
      line_items: items.map((item) => ({
        description: item.title,
        quantity: item.quantity || 1,
        amount_total: Math.round(Number(item.price) * (item.quantity || 1) * 100),
      })),
    })
  } catch (error) {
    console.error('Whish status error:', error)
    return NextResponse.json({ error: 'Failed to retrieve payment status' }, { status: 500 })
  }
}
