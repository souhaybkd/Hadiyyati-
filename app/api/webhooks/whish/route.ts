import { NextRequest, NextResponse } from 'next/server'
import { finalizeWhishPayment } from '@/lib/whish'

// Whish notifies the third party of the transaction result via a GET request to
// the callback URLs we supplied when creating the payment. We re-verify the
// status with Whish (via finalizeWhishPayment) rather than trusting the query
// param blindly, and create the order on success.
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

    const result = await finalizeWhishPayment(externalId)

    return NextResponse.json({ received: true, status: result.status })
  } catch (error) {
    console.error('Whish webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
