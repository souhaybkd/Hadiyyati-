import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-service'
import { persistWatchlistScreening } from '@/lib/veriff-watchlist-persist'
import type { WatchlistScreeningPayload } from '@/lib/veriff-watchlist'
import { resolveVeriffUserId, verifyVeriffWebhookRequest } from '@/lib/veriff-webhook'

/**
 * Veriff PEP & Sanctions (watchlist screening) webhook.
 * Configure in Veriff Station → Integration → Settings → Webhook watchlist screening URL:
 *   https://<your-domain>/api/webhooks/veriff/watchlist-screening
 *
 * @see https://devdocs.veriff.com/docs/watchlist-screening-webhook
 */
export async function POST(request: NextRequest) {
  const verified = await verifyVeriffWebhookRequest(request)
  if (!verified.ok) return verified.response

  const payload = verified.payload as WatchlistScreeningPayload & Record<string, unknown>
  const sessionId = payload.sessionId != null ? String(payload.sessionId) : null

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })
  }

  const vendorData =
    payload.vendorData != null ? String(payload.vendorData) : null

  const supabase = createSupabaseServiceClient()
  const userId = await resolveVeriffUserId(supabase, sessionId, vendorData)

  if (!userId) {
    console.error('Watchlist webhook: could not resolve user for session', sessionId)
    return NextResponse.json({ error: 'Unknown session' }, { status: 404 })
  }

  const result = await persistWatchlistScreening(supabase, {
    sessionId,
    userId,
    vendorData,
    payload,
  })

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
