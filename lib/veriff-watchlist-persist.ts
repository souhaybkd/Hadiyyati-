import type { SupabaseClient } from '@supabase/supabase-js'
import {
  isWatchlistClearedForPayouts,
  normalizeWatchlistReviewStatus,
  type WatchlistScreeningPayload,
} from '@/lib/veriff-watchlist'

export async function persistWatchlistScreening(
  supabase: SupabaseClient,
  params: {
    sessionId: string
    userId: string
    vendorData?: string | null
    payload: WatchlistScreeningPayload & Record<string, unknown>
  }
): Promise<{ error?: string }> {
  const { sessionId, userId, vendorData, payload } = params
  const now = new Date().toISOString()
  const reviewStatus = normalizeWatchlistReviewStatus(payload.reviewStatus)
  const cleared = isWatchlistClearedForPayouts(payload)
  const screenedAt = payload.createdAt || now

  const watchlistFields = {
    watchlist_review_status: reviewStatus,
    watchlist_total_hits:
      typeof payload.totalHits === 'number' ? payload.totalHits : null,
    watchlist_has_unacknowledged_changes: Boolean(payload.hasUnacknowledgedChanges),
    watchlist_monitor_status:
      typeof payload.monitorStatus === 'string' ? payload.monitorStatus : null,
    watchlist_screened_at: screenedAt,
    raw_watchlist: payload,
    updated_at: now,
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from('kyc_verifications')
    .update(watchlistFields)
    .eq('veriff_session_id', sessionId)
    .select('id')

  if (updateError) {
    console.error('Watchlist screening: failed to update kyc_verifications', updateError)
    return { error: 'Database update failed' }
  }

  if (!updatedRows?.length) {
    const { error: insertError } = await supabase.from('kyc_verifications').insert({
      user_id: userId,
      veriff_session_id: sessionId,
      status: 'approved',
      vendor_data: vendorData || userId,
      created_at: now,
      ...watchlistFields,
    })

    if (insertError) {
      console.error('Watchlist screening: failed to insert kyc_verifications', insertError)
      return { error: 'Database update failed' }
    }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      watchlist_review_status: reviewStatus,
      watchlist_cleared: cleared,
      updated_at: now,
    })
    .eq('id', userId)

  if (profileError) {
    console.error('Watchlist screening: failed to update profile', profileError)
    return { error: 'Profile update failed' }
  }

  return {}
}

/**
 * The decision webhook used to set watchlist_cleared back to false after the
 * watchlist webhook had already stored a no-match. Profiles can therefore show
 * review status "no_match" while payouts stay blocked. When the stored
 * screening for the current session already allows payouts, restore the flag.
 * Never downgrades a clearance an admin set by hand.
 */
export async function reconcileProfileWatchlistClearance(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  watchlist_cleared: boolean
  watchlist_review_status: string | null
  changed: boolean
}> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('kyc_status, kyc_session_id, watchlist_cleared, watchlist_review_status')
    .eq('id', userId)
    .maybeSingle()

  if (profileError || !profile) {
    return {
      watchlist_cleared: false,
      watchlist_review_status: null,
      changed: false,
    }
  }

  const currentCleared = Boolean(profile.watchlist_cleared)
  const currentStatus = (profile.watchlist_review_status as string | null) ?? null

  if (profile.kyc_status !== 'approved' || !profile.kyc_session_id || currentCleared) {
    return {
      watchlist_cleared: currentCleared,
      watchlist_review_status: currentStatus,
      changed: false,
    }
  }

  const { data: verification, error: verificationError } = await supabase
    .from('kyc_verifications')
    .select('raw_watchlist, watchlist_review_status')
    .eq('veriff_session_id', profile.kyc_session_id)
    .maybeSingle()

  if (verificationError || !verification?.raw_watchlist) {
    return {
      watchlist_cleared: false,
      watchlist_review_status: currentStatus,
      changed: false,
    }
  }

  const payload = verification.raw_watchlist as WatchlistScreeningPayload
  const cleared = isWatchlistClearedForPayouts(payload)
  const reviewStatus =
    normalizeWatchlistReviewStatus(payload.reviewStatus) ||
    normalizeWatchlistReviewStatus(verification.watchlist_review_status) ||
    currentStatus

  if (!cleared) {
    return {
      watchlist_cleared: false,
      watchlist_review_status: reviewStatus,
      changed: false,
    }
  }

  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      watchlist_cleared: true,
      watchlist_review_status: reviewStatus,
      updated_at: now,
    })
    .eq('id', userId)
    .eq('watchlist_cleared', false)

  if (updateError) {
    console.error('Watchlist reconcile: failed to update profile', updateError)
    return {
      watchlist_cleared: false,
      watchlist_review_status: currentStatus,
      changed: false,
    }
  }

  return {
    watchlist_cleared: true,
    watchlist_review_status: reviewStatus,
    changed: true,
  }
}
