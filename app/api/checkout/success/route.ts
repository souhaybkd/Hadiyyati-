import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'payment_intent']
    })

    // Verify the session belongs to the current user
    if (session.metadata?.user_id !== user.id) {
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