import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-service'
import { mapVeriffDecision } from '@/lib/veriff'
import { resolveVeriffUserId, verifyVeriffWebhookRequest } from '@/lib/veriff-webhook'

/**
 * Veriff decision webhook.
 * Configure Decision webhook URL in Veriff Customer Portal to:
 *   https://<your-domain>/api/webhooks/veriff
 *
 * PEP/sanctions results use a separate URL — see watchlist-screening/route.ts.
 */
export async function POST(request: NextRequest) {
  const verified = await verifyVeriffWebhookRequest(request)
  if (!verified.ok) return verified.response

  const payload = verified.payload
  const verification = payload?.verification as Record<string, unknown> | undefined
  if (!verification?.id) {
    return NextResponse.json({ error: 'Missing verification' }, { status: 400 })
  }

  const sessionId = String(verification.id)
  const vendorData =
    verification.vendorData != null ? String(verification.vendorData) : null
  const decisionCode =
    typeof verification.code === 'number'
      ? verification.code
      : verification.code != null
        ? Number(verification.code)
        : null
  const statusString =
    typeof verification.status === 'string' ? verification.status : null

  const { kycStatus, verificationStatus } = mapVeriffDecision({
    status: statusString,
    code: Number.isFinite(decisionCode as number) ? (decisionCode as number) : null,
  })

  const supabase = createSupabaseServiceClient()
  const now = new Date().toISOString()

  const userId = await resolveVeriffUserId(supabase, sessionId, vendorData)

  if (!userId) {
    console.error('Veriff webhook: could not resolve user for session', sessionId)
    return NextResponse.json({ error: 'Unknown session' }, { status: 404 })
  }

  const { error: upsertError } = await supabase.from('kyc_verifications').upsert(
    {
      user_id: userId,
      veriff_session_id: sessionId,
      status: verificationStatus,
      decision_code: Number.isFinite(decisionCode as number) ? decisionCode : null,
      vendor_data: vendorData || userId,
      raw_decision: payload,
      updated_at: now,
    },
    { onConflict: 'veriff_session_id' }
  )

  if (upsertError) {
    console.error('Veriff webhook: failed to upsert kyc_verifications', upsertError)
    return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
  }

  const profileUpdate: Record<string, unknown> = {
    kyc_status: kycStatus,
    kyc_session_id: sessionId,
    updated_at: now,
  }

  if (kycStatus === 'approved') {
    profileUpdate.kyc_verified_at =
      verification.decisionTime || verification.acceptanceTime || now
    profileUpdate.watchlist_cleared = false
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update(profileUpdate)
    .eq('id', userId)

  if (profileError) {
    console.error('Veriff webhook: failed to update profile', profileError)
    return NextResponse.json({ error: 'Profile update failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
