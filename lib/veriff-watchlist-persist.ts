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
