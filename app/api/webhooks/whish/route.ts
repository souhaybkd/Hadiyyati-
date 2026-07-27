import { NextRequest, NextResponse } from 'next/server'
import { finalizeWhishPayment } from '@/lib/whish'

// Whish notifies us of each payment attempt with an unauthenticated GET to the
// callback URLs we supplied when creating the payment, so we never trust the
// query params: finalizeWhishPayment re-verifies the outcome with Whish and
// creates the order only once the payment is confirmed.
//
// A failure callback means *this attempt* failed, not the order: the link stays
// payable and the status stays pending until it is paid or expires. We
// therefore never cancel an order here.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const externalIdParam = searchParams.get('externalId')

  if (!externalIdParam) {
    return NextResponse.json({ error: 'Missing externalId' }, { status: 400 })
  }

  const externalId = Number(externalIdParam)
  if (!Number.isFinite(externalId)) {
    return NextResponse.json({ error: 'Invalid externalId' }, { status: 400 })
  }

  try {
    const result = await finalizeWhishPayment(externalId)
    return NextResponse.json({ received: true, status: result.status })
  } catch (error) {
    // Acknowledge with 200 so Whish does not keep retrying; the success page
    // poll reconciles anything we failed to process here.
    console.error('Whish webhook error:', error)
    return NextResponse.json({ received: true, status: 'deferred' })
  }
}
