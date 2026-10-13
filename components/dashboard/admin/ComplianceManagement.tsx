'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  getComplianceCases,
  getComplianceQueueCounts,
  getComplianceUserDetail,
  adminRefreshWatchlistForUser,
  adminApproveWatchlistAfterReview,
  type ComplianceCase,
  type ComplianceQueueFilter,
  type ComplianceUserDetail,
} from '@/lib/actions/compliance'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import type { KycStatus } from '@/lib/types/database'
import {
  ShieldCheck,
  Search,
  Loader2,
  RefreshCw,
  Eye,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react'

const FILTERS: { id: ComplianceQueueFilter; labelKey: string }[] = [
  { id: 'needs_action', labelKey: 'admin.compliance.filter.needsAction' },
  { id: 'kyc_issues', labelKey: 'admin.compliance.filter.kycIssues' },
  { id: 'kyc_pending', labelKey: 'admin.compliance.filter.kycPending' },
  { id: 'kyc_declined', labelKey: 'admin.compliance.filter.kycDeclined' },
  { id: 'kyc_resubmission', labelKey: 'admin.compliance.filter.kycResubmission' },
  { id: 'screening_pending', labelKey: 'admin.compliance.filter.screeningPending' },
  { id: 'watchlist_hit', labelKey: 'admin.compliance.filter.watchlistHit' },
  { id: 'cleared', labelKey: 'admin.compliance.filter.cleared' },
  { id: 'all', labelKey: 'admin.compliance.filter.all' },
]

function isComplianceFilter(value: string | null): value is ComplianceQueueFilter {
  return FILTERS.some((f) => f.id === value)
}

function kycBadge(status: KycStatus) {
  switch (status) {
    case 'approved':
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>
    case 'pending':
      return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
    case 'declined':
      return <Badge variant="destructive">Declined</Badge>
    case 'resubmission_requested':
      return <Badge className="bg-orange-100 text-orange-800">Resubmit</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function watchlistBadge(status: string | null, cleared: boolean) {
  if (cleared) {
    return <Badge className="bg-green-100 text-green-800">Cleared</Badge>
  }
  switch (status) {
    case 'potential_match':
      return <Badge variant="destructive">Potential match</Badge>
    case 'no_match':
      return <Badge className="bg-slate-100 text-slate-800">No match</Badge>
    case 'reviewed':
      return <Badge className="bg-green-100 text-green-800">Reviewed</Badge>
    default:
      return <Badge variant="outline">Screening pending</Badge>
  }
}

export function ComplianceManagement() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [filter, setFilter] = useState<ComplianceQueueFilter>('needs_action')
  const [counts, setCounts] = useState<Record<ComplianceQueueFilter, number>>({
    needs_action: 0,
    kyc_issues: 0,
    kyc_pending: 0,
    kyc_declined: 0,
    kyc_resubmission: 0,
    screening_pending: 0,
    watchlist_hit: 0,
    cleared: 0,
    all: 0,
  })
  const [cases, setCases] = useState<ComplianceCase[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ComplianceUserDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  useEffect(() => {
    const param = searchParams?.get('filter') ?? null
    if (isComplianceFilter(param)) {
      setFilter(param)
    }
  }, [searchParams])

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const setFilterAndUrl = (next: ComplianceQueueFilter) => {
    setFilter(next)
    const params = new URLSearchParams({ tab: 'compliance', filter: next })
    router.replace(`/admin?${params.toString()}`, { scroll: false })
  }

  const loadCounts = useCallback(async () => {
    const result = await getComplianceQueueCounts()
    if (!result.error) setCounts(result.counts)
  }, [])

  const loadCases = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await getComplianceCases({
      filter,
      search: searchDebounced,
      limit: 100,
    })
    if (result.error) {
      setError(result.error)
      setCases([])
      setTotal(0)
    } else {
      setCases(result.data)
      setTotal(result.count)
    }
    setLoading(false)
  }, [filter, searchDebounced])

  const refreshAll = useCallback(async () => {
    await loadCounts()
    await loadCases()
  }, [loadCounts, loadCases])

  useEffect(() => {
    loadCounts()
  }, [loadCounts])

  useEffect(() => {
    loadCases()
  }, [loadCases])

  const openDetail = async (userId: string) => {
    setSelectedUserId(userId)
    setDetail(null)
    setActionMessage(null)
    setDetailLoading(true)
    const result = await getComplianceUserDetail(userId)
    if (result.data) setDetail(result.data)
    setDetailLoading(false)
  }

  const closeDetail = () => {
    setSelectedUserId(null)
    setDetail(null)
    setActionMessage(null)
  }

  const handleRefreshWatchlist = async () => {
    if (!selectedUserId) return
    setActionLoading(true)
    setActionMessage(null)
    const result = await adminRefreshWatchlistForUser(selectedUserId)
    if (result.error) {
      setActionMessage(result.error)
    } else {
      setActionMessage(t('admin.compliance.watchlistRefreshed'))
      await openDetail(selectedUserId)
      await refreshAll()
    }
    setActionLoading(false)
  }

  const handleApproveWatchlist = async () => {
    if (!selectedUserId) return
    setActionLoading(true)
    setActionMessage(null)
    const result = await adminApproveWatchlistAfterReview(selectedUserId)
    if (!result.success) {
      setActionMessage(result.error || t('admin.compliance.actionFailed'))
    } else {
      setActionMessage(t('admin.compliance.watchlistApproved'))
      await openDetail(selectedUserId)
      await refreshAll()
    }
    setActionLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-design-text-heading flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-design-primary" />
            {t('admin.compliance.title')}
          </h1>
          <p className="mt-1 text-design-text-muted">{t('admin.compliance.subtitle')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshAll} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {t('admin.queue.refresh')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.id}
            size="sm"
            variant={filter === f.id ? 'default' : 'outline'}
            onClick={() => setFilterAndUrl(f.id)}
          >
            {t(f.labelKey)}
            <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-xs">{counts[f.id]}</span>
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.compliance.casesTitle')}</CardTitle>
          <div className="relative max-w-sm pt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-10"
              placeholder={t('admin.compliance.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-design-primary" />
            </div>
          ) : error ? (
            <p className="text-center text-red-600 py-8">{error}</p>
          ) : cases.length === 0 ? (
            <p className="text-center text-design-text-muted py-8">{t('admin.compliance.empty')}</p>
          ) : (
            <>
              <p className="text-sm text-design-text-muted mb-4">
                {t('admin.compliance.showing', { count: cases.length, total })}
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.compliance.colUser')}</TableHead>
                    <TableHead>{t('admin.compliance.colKyc')}</TableHead>
                    <TableHead>{t('admin.compliance.colWatchlist')}</TableHead>
                    <TableHead>{t('admin.compliance.colPayouts')}</TableHead>
                    <TableHead>{t('admin.compliance.colUpdated')}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="font-medium">{row.full_name || '—'}</div>
                        <div className="text-sm text-design-text-muted">@{row.username || 'unknown'}</div>
                        <div className="text-xs text-design-text-muted">{row.email}</div>
                      </TableCell>
                      <TableCell>{kycBadge(row.kyc_status)}</TableCell>
                      <TableCell>
                        {watchlistBadge(row.watchlist_review_status, row.watchlist_cleared)}
                      </TableCell>
                      <TableCell>
                        {row.payoutReady ? (
                          <span className="flex items-center gap-1 text-green-700 text-sm">
                            <CheckCircle className="h-4 w-4" />
                            {t('admin.compliance.payoutReady')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-800 text-sm">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span className="max-w-[200px] truncate">{row.blockReason}</span>
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-design-text-muted">
                        {new Date(row.updated_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => openDetail(row.id)}>
                          <Eye className="h-4 w-4 mr-1" />
                          {t('admin.compliance.review')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      <Sheet open={Boolean(selectedUserId)} onOpenChange={(open) => !open && closeDetail()}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t('admin.compliance.detailTitle')}</SheetTitle>
            <SheetDescription>{t('admin.compliance.detailDesc')}</SheetDescription>
          </SheetHeader>

          {detailLoading || !detail ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-design-primary" />
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="font-semibold text-design-text-heading">{detail.profile.full_name}</h3>
                <p className="text-sm text-design-text-muted">@{detail.profile.username}</p>
                <p className="text-sm">{detail.profile.email}</p>
                <Link
                  href={`/admin?tab=users`}
                  className="text-sm text-design-primary hover:underline mt-2 inline-block"
                >
                  {t('admin.compliance.openUserAdmin')}
                </Link>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{t('admin.compliance.colKyc')}</span>
                  {kycBadge((detail.profile.kyc_status as KycStatus) || 'unverified')}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{t('admin.compliance.colWatchlist')}</span>
                  {watchlistBadge(
                    detail.profile.watchlist_review_status ?? null,
                    detail.profile.watchlist_cleared ?? false
                  )}
                </div>
                <div className="text-sm">
                  {detail.payoutReady ? (
                    <span className="text-green-700 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      {t('admin.compliance.payoutReady')}
                    </span>
                  ) : (
                    <span className="text-amber-800 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {detail.blockReason}
                    </span>
                  )}
                </div>
                {detail.profile.kyc_verified_at && (
                  <p className="text-xs text-design-text-muted">
                    {t('admin.compliance.verifiedAt')}:{' '}
                    {new Date(detail.profile.kyc_verified_at).toLocaleString()}
                  </p>
                )}
                {detail.profile.kyc_session_id && (
                  <p className="text-xs font-mono text-design-text-muted break-all">
                    Session: {detail.profile.kyc_session_id}
                  </p>
                )}
              </div>

              {detail.profile.kyc_status === 'approved' && !detail.profile.watchlist_cleared && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={actionLoading}
                    onClick={handleRefreshWatchlist}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    {t('admin.compliance.refreshWatchlist')}
                  </Button>
                  {detail.profile.watchlist_review_status === 'potential_match' && (
                    <Button size="sm" disabled={actionLoading} onClick={handleApproveWatchlist}>
                      {t('admin.compliance.approveWatchlist')}
                    </Button>
                  )}
                </div>
              )}

              {actionMessage && (
                <p className="text-sm text-design-text-muted border-l-2 border-design-primary pl-3">
                  {actionMessage}
                </p>
              )}

              <div>
                <h4 className="font-medium mb-2">{t('admin.compliance.sessionsTitle')}</h4>
                {detail.verifications.length === 0 ? (
                  <p className="text-sm text-design-text-muted">{t('admin.compliance.noSessions')}</p>
                ) : (
                  <ul className="space-y-3">
                    {detail.verifications.map((v) => (
                      <li key={v.id} className="rounded border p-3 text-sm space-y-1">
                        <div className="flex justify-between gap-2">
                          <Badge variant="outline">{v.status}</Badge>
                          <span className="text-xs text-design-text-muted">
                            {new Date(v.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="font-mono text-xs break-all">{v.veriff_session_id}</p>
                        {v.watchlist_review_status && (
                          <p>
                            Watchlist: {v.watchlist_review_status}
                            {typeof v.watchlist_total_hits === 'number' &&
                              ` (${v.watchlist_total_hits} hits)`}
                          </p>
                        )}
                        {v.raw_watchlist && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-design-primary">
                              {t('admin.compliance.rawWatchlist')}
                            </summary>
                            <pre className="mt-2 max-h-48 overflow-auto rounded bg-slate-50 p-2 text-xs">
                              {JSON.stringify(v.raw_watchlist, null, 2)}
                            </pre>
                          </details>
                        )}
                        {v.raw_decision && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-design-primary">
                              {t('admin.compliance.rawDecision')}
                            </summary>
                            <pre className="mt-2 max-h-48 overflow-auto rounded bg-slate-50 p-2 text-xs">
                              {JSON.stringify(v.raw_decision, null, 2)}
                            </pre>
                          </details>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
