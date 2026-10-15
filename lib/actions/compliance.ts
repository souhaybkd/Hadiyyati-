'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseServiceClient } from '@/lib/supabase-service'
import { toErrorMessage } from '@/lib/error-utils'
import { revalidatePath } from 'next/cache'
import { fetchWatchlistScreening } from '@/lib/veriff'
import {
  persistWatchlistScreening,
  reconcileProfileWatchlistClearance,
} from '@/lib/veriff-watchlist-persist'
import type { WatchlistScreeningPayload } from '@/lib/veriff-watchlist'
import type { KycStatus, KycVerification, Profile } from '@/lib/types/database'

export type ComplianceQueueFilter =
  | 'needs_action'
  | 'kyc_issues'
  | 'kyc_pending'
  | 'kyc_declined'
  | 'kyc_resubmission'
  | 'screening_pending'
  | 'watchlist_hit'
  | 'cleared'
  | 'all'

export type ComplianceQueueCounts = Record<ComplianceQueueFilter, number>

export type ComplianceCase = {
  id: string
  username: string
  full_name: string
  email: string
  kyc_status: KycStatus
  kyc_verified_at: string | null
  kyc_session_id: string | null
  watchlist_review_status: string | null
  watchlist_cleared: boolean
  updated_at: string
  payoutReady: boolean
  blockReason: string | null
}

export type ComplianceUserDetail = {
  profile: Pick<
    Profile,
    | 'id'
    | 'username'
    | 'full_name'
    | 'email'
    | 'kyc_status'
    | 'kyc_verified_at'
    | 'kyc_session_id'
    | 'watchlist_review_status'
    | 'watchlist_cleared'
    | 'created_at'
    | 'updated_at'
  >
  verifications: KycVerification[]
  payoutReady: boolean
  blockReason: string | null
}

async function assertAdmin() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Admin access required')
  }

  return user
}

function payoutState(row: {
  kyc_status?: string | null
  watchlist_cleared?: boolean
  watchlist_review_status?: string | null
}): { payoutReady: boolean; blockReason: string | null } {
  const kyc = row.kyc_status || 'unverified'
  if (kyc !== 'approved') {
    const labels: Record<string, string> = {
      unverified: 'Identity not started',
      pending: 'Identity verification in progress',
      declined: 'Identity verification declined',
      resubmission_requested: 'Identity resubmission required',
    }
    return { payoutReady: false, blockReason: labels[kyc] || `KYC: ${kyc}` }
  }

  if (!row.watchlist_cleared) {
    if (row.watchlist_review_status === 'potential_match') {
      return { payoutReady: false, blockReason: 'Watchlist potential match — manual review' }
    }
    return { payoutReady: false, blockReason: 'PEP/sanctions screening in progress' }
  }

  return { payoutReady: true, blockReason: null }
}

function applyQueueFilter(query: any, filter: ComplianceQueueFilter) {
  switch (filter) {
    case 'kyc_issues':
      return query.in('kyc_status', ['pending', 'declined', 'resubmission_requested'])
    case 'kyc_pending':
      return query.eq('kyc_status', 'pending')
    case 'kyc_declined':
      return query.eq('kyc_status', 'declined')
    case 'kyc_resubmission':
      return query.eq('kyc_status', 'resubmission_requested')
    case 'watchlist_hit':
      return query.eq('watchlist_review_status', 'potential_match')
    case 'screening_pending':
      return query
        .eq('kyc_status', 'approved')
        .eq('watchlist_cleared', false)
        .or('watchlist_review_status.is.null,watchlist_review_status.neq.potential_match')
    case 'cleared':
      return query.eq('kyc_status', 'approved').eq('watchlist_cleared', true)
    case 'needs_action':
      return query.or(
        'kyc_status.in.(pending,declined,resubmission_requested),and(kyc_status.eq.approved,watchlist_cleared.eq.false)'
      )
    case 'all':
    default:
      return query.neq('kyc_status', 'unverified')
  }
}

function mapCase(row: Record<string, unknown>): ComplianceCase {
  const { payoutReady, blockReason } = payoutState(row as ComplianceCase)
  return {
    id: row.id as string,
    username: (row.username as string) || '',
    full_name: (row.full_name as string) || '',
    email: (row.email as string) || '',
    kyc_status: (row.kyc_status as KycStatus) || 'unverified',
    kyc_verified_at: (row.kyc_verified_at as string | null) ?? null,
    kyc_session_id: (row.kyc_session_id as string | null) ?? null,
    watchlist_review_status: (row.watchlist_review_status as string | null) ?? null,
    watchlist_cleared: Boolean(row.watchlist_cleared),
    updated_at: row.updated_at as string,
    payoutReady,
    blockReason,
  }
}

export async function getComplianceQueueCounts(): Promise<{
  counts: ComplianceQueueCounts
  error: string | null
}> {
  const empty: ComplianceQueueCounts = {
    needs_action: 0,
    kyc_issues: 0,
    kyc_pending: 0,
    kyc_declined: 0,
    kyc_resubmission: 0,
    screening_pending: 0,
    watchlist_hit: 0,
    cleared: 0,
    all: 0,
  }

  try {
    await assertAdmin()
    const supabase = await createSupabaseServerClient()

    const filters: ComplianceQueueFilter[] = [
      'needs_action',
      'kyc_issues',
      'kyc_pending',
      'kyc_declined',
      'kyc_resubmission',
      'screening_pending',
      'watchlist_hit',
      'cleared',
      'all',
    ]

    const results = await Promise.all(
      filters.map(async (filter) => {
        let q = supabase.from('profiles').select('*', { count: 'exact', head: true })
        q = applyQueueFilter(q, filter)
        const { count } = await q
        return { filter, count: count || 0 }
      })
    )

    const counts = { ...empty }
    for (const { filter, count } of results) {
      counts[filter] = count
    }

    return { counts, error: null }
  } catch (error) {
    console.error('getComplianceQueueCounts:', error)
    return {
      counts: empty,
      error: toErrorMessage(error, 'Failed to load queue counts'),
    }
  }
}

async function healApprovedScreening(
  rows: Record<string, unknown>[]
): Promise<
  Map<string, { watchlist_cleared: boolean; watchlist_review_status: string | null }>
> {
  const pending = rows.filter(
    (row) => row.kyc_status === 'approved' && !row.watchlist_cleared && row.id
  )
  const healed = new Map<
    string,
    { watchlist_cleared: boolean; watchlist_review_status: string | null }
  >()
  if (!pending.length) return healed

  const service = createSupabaseServiceClient()
  await Promise.all(
    pending.map(async (row) => {
      const userId = row.id as string
      try {
        const result = await reconcileProfileWatchlistClearance(service, userId)
        if (result.changed) {
          healed.set(userId, {
            watchlist_cleared: result.watchlist_cleared,
            watchlist_review_status: result.watchlist_review_status,
          })
        }
      } catch (error) {
        console.error('healApprovedScreening:', userId, error)
      }
    })
  )

  return healed
}

export async function getComplianceCases(params?: {
  filter?: ComplianceQueueFilter
  search?: string
  limit?: number
  offset?: number
}): Promise<{ data: ComplianceCase[]; count: number; error: string | null }> {
  const filter = params?.filter ?? 'needs_action'
  const limit = params?.limit ?? 50
  const offset = params?.offset ?? 0

  try {
    await assertAdmin()
    const supabase = await createSupabaseServerClient()

    let query = supabase
      .from('profiles')
      .select(
        'id, username, full_name, email, kyc_status, kyc_verified_at, kyc_session_id, watchlist_review_status, watchlist_cleared, updated_at',
        { count: 'exact' }
      )
      .order('updated_at', { ascending: false })

    query = applyQueueFilter(query, filter)

    if (params?.search?.trim()) {
      const term = params.search.trim()
      query = query.or(
        `username.ilike.%${term}%,full_name.ilike.%${term}%,email.ilike.%${term}%`
      )
    }

    query = query.range(offset, offset + limit - 1)

    const { data, count, error } = await query
    if (error) throw error

    const rows = (data || []) as Record<string, unknown>[]
    const healed = await healApprovedScreening(rows)

    return {
      data: rows.map((row) => {
        const fix = healed.get(row.id as string)
        if (!fix) return mapCase(row)
        return mapCase({
          ...row,
          watchlist_cleared: fix.watchlist_cleared,
          watchlist_review_status: fix.watchlist_review_status ?? row.watchlist_review_status,
        })
      }),
      count: count || 0,
      error: null,
    }
  } catch (error) {
    console.error('getComplianceCases:', error)
    return {
      data: [],
      count: 0,
      error: toErrorMessage(error, 'Failed to load compliance cases'),
    }
  }
}

export async function getComplianceUserDetail(
  userId: string
): Promise<{ data: ComplianceUserDetail | null; error: string | null }> {
  try {
    await assertAdmin()
    const supabase = await createSupabaseServerClient()

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(
        'id, username, full_name, email, kyc_status, kyc_verified_at, kyc_session_id, watchlist_review_status, watchlist_cleared, created_at, updated_at'
      )
      .eq('id', userId)
      .single()

    if (profileError) throw profileError

    const { data: verifications, error: verError } = await supabase
      .from('kyc_verifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (verError) throw verError

    let profileRow = profile
    if (profile.kyc_status === 'approved' && !profile.watchlist_cleared) {
      const healed = await reconcileProfileWatchlistClearance(
        createSupabaseServiceClient(),
        userId
      )
      if (healed.changed) {
        profileRow = {
          ...profile,
          watchlist_cleared: healed.watchlist_cleared,
          watchlist_review_status:
            healed.watchlist_review_status ?? profile.watchlist_review_status,
        }
      }
    }

    const { payoutReady, blockReason } = payoutState(profileRow)

    return {
      data: {
        profile: profileRow as ComplianceUserDetail['profile'],
        verifications: (verifications || []) as KycVerification[],
        payoutReady,
        blockReason,
      },
      error: null,
    }
  } catch (error) {
    console.error('getComplianceUserDetail:', error)
    return {
      data: null,
      error: toErrorMessage(error, 'Failed to load user compliance detail'),
    }
  }
}

/** Pull latest watchlist screening from Veriff for a user (admin). */
export async function adminRefreshWatchlistForUser(
  userId: string
): Promise<{ watchlist_cleared?: boolean; watchlist_review_status?: string | null; error?: string }> {
  try {
    await assertAdmin()
    const service = createSupabaseServiceClient()

    const { data: profile, error: profileError } = await service
      .from('profiles')
      .select('kyc_status, kyc_session_id, watchlist_cleared')
      .eq('id', userId)
      .single()

    if (profileError || !profile?.kyc_session_id) {
      return { error: 'No verification session for this user' }
    }

    if (profile.kyc_status !== 'approved') {
      return { error: 'Identity is not approved yet' }
    }

    if (profile.watchlist_cleared) {
      return { watchlist_cleared: true, watchlist_review_status: 'reviewed' }
    }

    const healed = await reconcileProfileWatchlistClearance(service, userId)
    if (healed.watchlist_cleared) {
      revalidatePath('/admin')
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
      userId,
      vendorData: userId,
      payload: data as WatchlistScreeningPayload & Record<string, unknown>,
    })

    if (result.error) {
      return { error: result.error }
    }

    const { data: updated } = await service
      .from('profiles')
      .select('watchlist_cleared, watchlist_review_status')
      .eq('id', userId)
      .single()

    revalidatePath('/admin')
    return {
      watchlist_cleared: Boolean(updated?.watchlist_cleared),
      watchlist_review_status: updated?.watchlist_review_status ?? null,
    }
  } catch (error) {
    console.error('adminRefreshWatchlistForUser:', error)
    return { error: 'Could not refresh watchlist screening' }
  }
}

/** After manual compliance review, allow payouts despite a prior potential match. */
export async function adminApproveWatchlistAfterReview(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin()
    const service = createSupabaseServiceClient()
    const now = new Date().toISOString()

    const { data: profile } = await service
      .from('profiles')
      .select('kyc_session_id, kyc_status')
      .eq('id', userId)
      .single()

    if (!profile || profile.kyc_status !== 'approved') {
      return { success: false, error: 'User must have approved identity before clearing watchlist' }
    }

    const { error: profileError } = await service
      .from('profiles')
      .update({
        watchlist_cleared: true,
        watchlist_review_status: 'reviewed',
        updated_at: now,
      })
      .eq('id', userId)

    if (profileError) throw profileError

    if (profile.kyc_session_id) {
      await service
        .from('kyc_verifications')
        .update({
          watchlist_review_status: 'reviewed',
          watchlist_has_unacknowledged_changes: false,
          updated_at: now,
        })
        .eq('veriff_session_id', profile.kyc_session_id)
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('adminApproveWatchlistAfterReview:', error)
    return {
      success: false,
      error: toErrorMessage(error, 'Failed to approve watchlist review'),
    }
  }
}
