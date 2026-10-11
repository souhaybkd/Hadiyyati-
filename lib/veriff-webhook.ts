import { NextRequest, NextResponse } from 'next/server'
import { getVeriffConfig, verifyVeriffSignature } from '@/lib/veriff'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function verifyVeriffWebhookRequest(
  request: NextRequest
): Promise<
  | { ok: true; rawBody: string; payload: Record<string, unknown> }
  | { ok: false; response: NextResponse }
> {
  const rawBody = await request.text()

  let sharedSecretKey: string
  try {
    ;({ sharedSecretKey } = getVeriffConfig())
  } catch (err) {
    console.error('Veriff webhook not configured:', err)
    return {
      ok: false,
      response: NextResponse.json({ error: 'Webhook not configured' }, { status: 500 }),
    }
  }

  const signature =
    request.headers.get('x-hmac-signature') || request.headers.get('X-HMAC-SIGNATURE')

  if (!verifyVeriffSignature(rawBody, signature, sharedSecretKey)) {
    console.error('Veriff webhook signature verification failed')
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid signature' }, { status: 401 }),
    }
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }),
    }
  }

  return { ok: true, rawBody, payload }
}

export async function resolveVeriffUserId(
  supabase: SupabaseClient,
  sessionId: string,
  vendorData?: string | null
): Promise<string | null> {
  const { data: bySession } = await supabase
    .from('kyc_verifications')
    .select('user_id')
    .eq('veriff_session_id', sessionId)
    .maybeSingle()

  if (bySession?.user_id) return bySession.user_id
  if (vendorData) return String(vendorData)
  return null
}
