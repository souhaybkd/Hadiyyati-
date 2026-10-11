export type WatchlistReviewStatus = 'no_match' | 'potential_match' | 'reviewed'

export interface WatchlistScreeningHit {
  matchStatus?: string
}

export interface WatchlistScreeningPayload {
  checkType?: string
  sessionId?: string
  vendorData?: string | null
  reviewStatus?: string
  matchStatus?: string
  hasUnacknowledgedChanges?: boolean
  monitorStatus?: string
  totalHits?: number
  createdAt?: string
  hits?: WatchlistScreeningHit[]
}

export function normalizeWatchlistReviewStatus(
  status?: string | null
): WatchlistReviewStatus | null {
  const s = (status || '').toLowerCase()
  if (s === 'no_match' || s === 'potential_match' || s === 'reviewed') {
    return s
  }
  return null
}

/** Whether PEP/sanctions screening allows receiver payouts (after IDV is approved). */
export function isWatchlistClearedForPayouts(payload: {
  reviewStatus?: string | null
  hasUnacknowledgedChanges?: boolean
  hits?: WatchlistScreeningHit[]
}): boolean {
  const reviewStatus = normalizeWatchlistReviewStatus(payload.reviewStatus)
  if (!reviewStatus) return false
  if (payload.hasUnacknowledgedChanges) return false
  if (reviewStatus === 'no_match') return true
  if (reviewStatus === 'potential_match') return false

  const hits = payload.hits ?? []
  const hasBlockingHit = hits.some((hit) => {
    const ms = (hit.matchStatus || '').toLowerCase()
    return ms === 'true_match' || ms === 'inconclusive' || ms === 'potential_match'
  })
  return !hasBlockingHit
}
