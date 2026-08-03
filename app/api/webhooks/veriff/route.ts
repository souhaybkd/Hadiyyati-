import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-service'
import {
  getVeriffConfig,
  mapVeriffDecision,
  verifyVeriffSignature,
} from '@/lib/veriff'

/**
 * Veriff decision webhook.
 * Configure Decision webhook URL in Veriff Customer Portal to:
 *   https://<your-domain>/api/webhooks/veriff
 *
 * Payload is authenticated via X-HMAC-SIGNATURE (HMAC-SHA256 of raw body).
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  let sharedSecretKey: string
  try {
    ;({ sharedSecretKey } = getVeriffConfig())
  } catch (err) {
    console.error('Veriff webhook not configured:', err)
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const signature =
    request.headers.get('x-hmac-signature') || request.headers.get('X-HMAC-SIGNATURE')

  if (!verifyVeriffSignature(rawBody, signature, sharedSecretKey)) {
    console.error('Veriff webhook signature verification failed')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const verification = payload?.verification
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

  // Prefer session id match; fall back to vendorData (user id)
  let userId: string | null = null

  const { data: bySession } = await supabase
    .from('kyc_verifications')
    .select('user_id')
    .eq('veriff_session_id', sessionId)
    .maybeSingle()

  if (bySession?.user_id) {
    userId = bySession.user_id
  } else if (vendorData) {
    userId = vendorData
  }

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
