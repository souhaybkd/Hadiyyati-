'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseServiceClient } from '@/lib/supabase-service'
import {
  createVeriffSession,
  fetchWatchlistScreening,
  splitFullName,
  VeriffConfigError,
} from '@/lib/veriff'
import {
  persistWatchlistScreening,
  reconcileProfileWatchlistClearance,
} from '@/lib/veriff-watchlist-persist'
import type { WatchlistScreeningPayload } from '@/lib/veriff-watchlist'
import type { KycStatus } from '@/lib/types/database'
import { redirect } from 'next/navigation'

export interface UserKycInfo {
  kyc_status: KycStatus
  kyc_verified_at: string | null
  kyc_session_id: string | null
  watchlist_review_status: string | null
  watchlist_cleared: boolean
}

function kycSchemaSetupErrorMessage(error?: unknown): string {
  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: string }).message)
      : ''
  const blob = message.toLowerCase()
  if (blob.includes('watchlist_cleared') || blob.includes('watchlist_review_status')) {
    return (
      'KYC database is missing PEP/sanctions columns. In the Supabase SQL editor, run supabase schema/veriff_watchlist_migration.sql (or re-run veriff_kyc_migration.sql), then try again.'
    )
  }
  return 'KYC database setup is incomplete. Run supabase schema/veriff_kyc_migration.sql in the Supabase SQL editor, then try again.'
}

function isMissingKycSchema(error: unknown): boolean {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: string }).code)
      : ''
  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: string }).message)
      : error instanceof Error
        ? error.message
        : String(error)
  const blob = `${code} ${message}`.toLowerCase()
  return (
    code === '42P01' ||
    code === '42703' ||
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    blob.includes('kyc_verifications') ||
    blob.includes('kyc_status') ||
    blob.includes('kyc_session_id') ||
    blob.includes('watchlist_cleared') ||
    blob.includes('watchlist_review_status') ||
    blob.includes('schema cache')
  )
}

function startSessionErrorMessage(error: unknown): string {
  if (error instanceof VeriffConfigError) return error.message
  if (isMissingKycSchema(error)) {
    return kycSchemaSetupErrorMessage(error)
  }
  if (error instanceof Error && error.message) {
    if (
      error.message.startsWith('Failed to') ||
      error.message.startsWith('Identity') ||
      error.message.startsWith('Veriff') ||
      error.message.startsWith('KYC')
    ) {
      return error.message
    }
  }
  return 'Could not start identity verification. Please try again.'
}

export async function getMyKycStatus(): Promise<UserKycInfo> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'kyc_status, kyc_verified_at, kyc_session_id, watchlist_review_status, watchlist_cleared'
    )
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching KYC status:', error)
    if (isMissingKycSchema(error)) {
      return {
        kyc_status: 'unverified',
        kyc_verified_at: null,
        kyc_session_id: null,
        watchlist_review_status: null,
        watchlist_cleared: false,
      }
    }
    return {
      kyc_status: 'unverified',
      kyc_verified_at: null,
      kyc_session_id: null,
      watchlist_review_status: null,
      watchlist_cleared: false,
    }
  }

  const status: UserKycInfo = {
    kyc_status: (data?.kyc_status as KycStatus) || 'unverified',
    kyc_verified_at: data?.kyc_verified_at ?? null,
    kyc_session_id: data?.kyc_session_id ?? null,
    watchlist_review_status: data?.watchlist_review_status ?? null,
    watchlist_cleared: Boolean(data?.watchlist_cleared),
  }

  if (status.kyc_status === 'approved' && !status.watchlist_cleared) {
    try {
      const healed = await reconcileProfileWatchlistClearance(
        createSupabaseServiceClient(),
        user.id
      )
      status.watchlist_cleared = healed.watchlist_cleared
      status.watchlist_review_status =
        healed.watchlist_review_status ?? status.watchlist_review_status
    } catch (healError) {
      console.error('Error reconciling watchlist clearance:', healError)
    }
  }

  return status
}

/**
 * Pull latest PEP/sanctions result from Veriff when the webhook is delayed.
 * Safe to call repeatedly while identity is approved and screening is pending.
 */
export async function refreshMyWatchlistScreening(): Promise<{
  watchlist_cleared?: boolean
  watchlist_review_status?: string | null
  error?: string
}> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('kyc_status, kyc_session_id, watchlist_cleared')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.kyc_session_id) {
    return { error: 'No verification session to screen' }
  }

  if (profile.kyc_status !== 'approved') {
    return { error: 'Identity verification is not approved yet' }
  }

  if (profile.watchlist_cleared) {
    return {
      watchlist_cleared: true,
      watchlist_review_status: null,
    }
  }

  try {
    const service = createSupabaseServiceClient()
    const healed = await reconcileProfileWatchlistClearance(service, user.id)
    if (healed.watchlist_cleared) {
      return {
        watchlist_cleared: true,
        watchlist_review_status: healed.watchlist_review_status,
      }
    }

    const data = await fetchWatchlistScreening(profile.kyc_session_id)
    if (!data?.reviewStatus) {
      return { watchlist_cleared: false, watchlist_review_status: null }
    }

    const result = await persistWatchlistScreening(service, {
      sessionId: profile.kyc_session_id,
      userId: user.id,
      vendorData: user.id,
      payload: data as WatchlistScreeningPayload & Record<string, unknown>,
    })

    if (result.error) {
      return { error: result.error }
    }

    const { data: updated } = await supabase
      .from('profiles')
      .select('watchlist_cleared, watchlist_review_status')
      .eq('id', user.id)
      .single()

    return {
      watchlist_cleared: Boolean(updated?.watchlist_cleared),
      watchlist_review_status: updated?.watchlist_review_status ?? null,
    }
  } catch (error) {
    console.error('Error refreshing watchlist screening:', error)
    return { error: 'Could not load sanctions screening status' }
  }
}

/**
 * Creates a Veriff session for the logged-in user and returns the hosted URL
 * to redirect them to. Persists a pending kyc_verifications row.
 *
 * Returns `{ error }` instead of throwing so production does not hide the
 * message behind Next.js's generic Server Components digest.
 */
export async function startVeriffSession(): Promise<{ url?: string; error?: string }> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email, kyc_status, watchlist_cleared')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error loading profile for Veriff:', profileError)
      if (isMissingKycSchema(profileError)) {
        return { error: kycSchemaSetupErrorMessage(profileError) }
      }
      return { error: 'Failed to load profile for verification' }
    }

    if (profile?.kyc_status === 'approved' && profile?.watchlist_cleared) {
      return { error: 'Identity already verified' }
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
      /\/$/,
      ''
    )
    const callback = `${siteUrl}/dashboard?tab=payouts&kyc=done`
    const { firstName, lastName } = splitFullName(profile?.full_name)
    const email = profile?.email || user.email || undefined

    const session = await createVeriffSession({
      callback,
      vendorData: user.id,
      firstName,
      lastName,
      email,
    })

    const service = createSupabaseServiceClient()
    const now = new Date().toISOString()

    const { error: insertError } = await service.from('kyc_verifications').insert({
      user_id: user.id,
      veriff_session_id: session.verification.id,
      status: 'created',
      vendor_data: user.id,
      created_at: now,
      updated_at: now,
    })

    if (insertError) {
      console.error('Error inserting kyc_verifications:', insertError)
      if (isMissingKycSchema(insertError)) {
        return { error: kycSchemaSetupErrorMessage(insertError) }
      }
      return { error: 'Failed to store verification session' }
    }

    const { error: updateError } = await service
      .from('profiles')
      .update({
        kyc_status: 'pending',
        kyc_session_id: session.verification.id,
        watchlist_review_status: null,
        watchlist_cleared: false,
        updated_at: now,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile KYC status:', updateError)
      if (isMissingKycSchema(updateError)) {
        return { error: kycSchemaSetupErrorMessage(updateError) }
      }
      return { error: 'Failed to update verification status' }
    }

    return { url: session.verification.url }
  } catch (error) {
    console.error('Error starting Veriff session:', error)
    return { error: startSessionErrorMessage(error) }
  }
}
