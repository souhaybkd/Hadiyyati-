import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '@/lib/stripe'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Guest checkout is allowed, so authentication is optional here.
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Retrieve the checkout session from Stripe
    const stripe = await getStripeClient()
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent']
    })

    // If the session belongs to a registered buyer, only that buyer may view it.
    // Guest sessions (no user_id) are viewable via the Stripe session id itself.
    const sessionUserId = session.metadata?.user_id
    if (sessionUserId && sessionUserId !== user?.id) {
      return NextResponse.json({ error: 'Unauthorized access to this session' }, { status: 403 })
    }

    // Format the response
    const orderDetails = {
      id: session.id,
      status: session.status,
      amount_total: session.amount_total,
      customer_email: session.customer_email,
      metadata: session.metadata || {},
      line_items: session.line_items?.data.map(item => ({
        description: item.description,
        quantity: item.quantity,
        amount_total: item.amount_total
      })) || []
    }

    return NextResponse.json(orderDetails)
  } catch (error) {
    console.error('Success API error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve order details' },
      { status: 500 }
    )
  }
} 