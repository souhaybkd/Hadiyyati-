'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { getPaymentIssuesForAdmin, type AdminPaymentIssue } from '@/lib/actions/admin'
import {
  getPayoutQueueForAdmin,
  markOrderPayoutSent,
  type AdminPayoutQueueItem,
  type PayoutQueueFilter,
} from '@/lib/actions/payout-admin'
import { AdminListPagination } from '@/components/dashboard/admin/AdminListPagination'
import {
  DollarSign,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Banknote,
} from 'lucide-react'

type GatewayFilter = 'all' | 'whish' | 'stripe'
type StatusFilter = 'failed' | 'pending' | 'all'

const PAYOUT_FILTERS: { id: PayoutQueueFilter; label: string }[] = [
  { id: 'due', label: 'Due now' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'needs_setup', label: 'Needs setup' },
  { id: 'paid', label: 'Sent' },
  { id: 'all', label: 'All gifts' },
]

const PAGE_SIZE = 20

function copyText(text: string) {
  void navigator.clipboard.writeText(text)
}

export function TransactionManagement() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const view = searchParams?.get('view') === 'payments' ? 'payments' : 'payouts'
  const payoutFilter = (searchParams?.get('payout') as PayoutQueueFilter) || 'due'

  const [payoutItems, setPayoutItems] = useState<AdminPayoutQueueItem[]>([])
  const [payoutLoading, setPayoutLoading] = useState(true)
  const [payoutError, setPayoutError] = useState<string | null>(null)
  const [payoutPage, setPayoutPage] = useState(1)
  const [payoutTotal, setPayoutTotal] = useState(0)
  const [payoutTotalPages, setPayoutTotalPages] = useState(1)
  const [payoutDelayDays, setPayoutDelayDays] = useState(10)

  const [markTarget, setMarkTarget] = useState<AdminPayoutQueueItem | null>(null)
  const [markNote, setMarkNote] = useState('')
  const [markSaving, setMarkSaving] = useState(false)

  const [issues, setIssues] = useState<AdminPaymentIssue[]>([])
  const [issuesLoading, setIssuesLoading] = useState(false)
  const [issuesError, setIssuesError] = useState<string | null>(null)
  const [gatewayFilter, setGatewayFilter] = useState<GatewayFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('failed')

  const setView = (v: 'payouts' | 'payments') => {
    const params = new URLSearchParams({ tab: 'transactions', view: v })
    if (v === 'payouts') params.set('payout', payoutFilter)
    router.replace(`/admin?${params.toString()}`, { scroll: false })
  }

  const setPayoutFilterUrl = (f: PayoutQueueFilter) => {
    setPayoutPage(1)
    const params = new URLSearchParams({ tab: 'transactions', view: 'payouts', payout: f })
    router.replace(`/admin?${params.toString()}`, { scroll: false })
  }

  useEffect(() => {
    const p = parseInt(searchParams?.get('page') ?? '1', 10)
    setPayoutPage(Number.isFinite(p) && p > 0 ? p : 1)
    const pf = searchParams?.get('payout')
    if (pf && PAYOUT_FILTERS.some((x) => x.id === pf)) {
      // filter synced from URL via payoutFilter const
    }
  }, [searchParams])

  const loadPayouts = useCallback(async () => {
    setPayoutLoading(true)
    setPayoutError(null)
    const result = await getPayoutQueueForAdmin({
      filter: payoutFilter,
      page: payoutPage,
      pageSize: PAGE_SIZE,
    })
    if (result.error) {
      setPayoutError(result.error)
      setPayoutItems([])
    } else {
      setPayoutItems(result.items)
      setPayoutTotal(result.totalCount)
      setPayoutTotalPages(result.totalPages)
      setPayoutDelayDays(result.payoutDelayDays)
    }
    setPayoutLoading(false)
  }, [payoutFilter, payoutPage])

  useEffect(() => {
    if (view === 'payouts') loadPayouts()
  }, [view, loadPayouts])

  const fetchIssues = useCallback(async () => {
    setIssuesLoading(true)
    setIssuesError(null)
    const result = await getPaymentIssuesForAdmin({
      gateway: gatewayFilter,
      status: statusFilter,
      limit: 100,
    })
    if (result.error) {
      setIssuesError(result.error)
      setIssues([])
    } else {
      setIssues(result.data)
    }
    setIssuesLoading(false)
  }, [gatewayFilter, statusFilter])

  useEffect(() => {
    if (view === 'payments') fetchIssues()
  }, [view, fetchIssues])

  useEffect(() => {
    const gateway = searchParams?.get('gateway')
    if (gateway === 'whish' || gateway === 'stripe') setGatewayFilter(gateway)
    const status = searchParams?.get('status')
    if (status === 'failed' || status === 'pending' || status === 'all') setStatusFilter(status)
  }, [searchParams])

  const confirmMarkSent = async () => {
    if (!markTarget) return
    setMarkSaving(true)
    const result = await markOrderPayoutSent(markTarget.orderId, markNote)
    setMarkSaving(false)
    if (!result.success) {
      setPayoutError(result.error || 'Could not mark payout')
      return
    }
    setMarkTarget(null)
    setMarkNote('')
    await loadPayouts()
  }

  const payoutStatusBadge = (item: AdminPayoutQueueItem) => {
    if (item.paidAt) {
      return <Badge className="bg-green-100 text-green-800">Sent</Badge>
    }
    if (!item.payoutReady) {
      return <Badge variant="destructive">Needs setup</Badge>
    }
    if (item.isDue) {
      return <Badge className="bg-amber-100 text-amber-800">Due now</Badge>
    }
    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        {item.daysUntilDue > 0 ? `In ${item.daysUntilDue}d` : 'Scheduled'}
      </Badge>
    )
  }

  const paymentFilterHref = (gateway: GatewayFilter, status: StatusFilter) => {
    const params = new URLSearchParams({ tab: 'transactions', view: 'payments' })
    if (gateway !== 'all') params.set('gateway', gateway)
    if (status !== 'failed') params.set('status', status)
    return `/admin?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-design-text-heading">Transactions</h1>
        <p className="mt-1 text-design-text-muted text-sm max-w-2xl">
          Send receiver payouts manually after the {payoutDelayDays}-day holding period, using each
          user&apos;s saved payout method. Mark rows as sent when you&apos;ve completed the transfer.
        </p>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as 'payouts' | 'payments')}>
        <TabsList>
          <TabsTrigger value="payouts" className="gap-2">
            <Banknote className="h-4 w-4" />
            Payout queue
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Payment issues
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payouts" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receiver payouts</CardTitle>
              <CardDescription>
                Completed gift orders · payout due {payoutDelayDays} days after purchase
              </CardDescription>
              <div className="flex flex-wrap gap-2 pt-4">
                {PAYOUT_FILTERS.map((f) => (
                  <Button
                    key={f.id}
                    size="sm"
                    variant={payoutFilter === f.id ? 'default' : 'outline'}
                    onClick={() => setPayoutFilterUrl(f.id)}
                  >
                    {f.label}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                  onClick={loadPayouts}
                  disabled={payoutLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${payoutLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {payoutLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-design-primary" />
                </div>
              ) : payoutError ? (
                <p className="text-center text-red-600 py-8">{payoutError}</p>
              ) : payoutItems.length === 0 ? (
                <p className="text-center text-design-text-muted py-8">
                  No payouts in this queue.
                </p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Receiver</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Send via</TableHead>
                        <TableHead>Due date</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payoutItems.map((item) => (
                        <TableRow key={item.orderId}>
                          <TableCell>{payoutStatusBadge(item)}</TableCell>
                          <TableCell>
                            <div className="font-medium">{item.receiverName}</div>
                            <div className="text-xs text-design-text-muted">{item.receiverEmail}</div>
                            {!item.payoutReady && item.blockers.length > 0 && (
                              <div className="text-xs text-amber-800 mt-1 flex items-start gap-1">
                                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                                {item.blockers.join(' · ')}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {item.payoutAmount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            {item.currency}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{item.payoutMethodLabel}</div>
                            {item.payoutDetailsSummary ? (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-xs text-design-text-muted truncate max-w-[180px]">
                                  {item.payoutDetailsSummary}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0"
                                  onClick={() => copyText(item.payoutDetailsSummary || '')}
                                  title="Copy payout details"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-design-text-muted">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(item.payoutDueDate).toLocaleDateString()}
                            <div className="text-xs text-design-text-muted">
                              Order {new Date(item.orderDate).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.paidAt ? (
                              <span className="text-xs text-green-700 flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4" />
                                {new Date(item.paidAt).toLocaleDateString()}
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                disabled={!item.isDue}
                                onClick={() => {
                                  setMarkTarget(item)
                                  setMarkNote('')
                                }}
                              >
                                Mark sent
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <AdminListPagination
                    page={payoutPage}
                    totalPages={payoutTotalPages}
                    totalCount={payoutTotal}
                    pageSize={PAGE_SIZE}
                    onPageChange={(next) => {
                      setPayoutPage(next)
                      const params = new URLSearchParams({
                        tab: 'transactions',
                        view: 'payouts',
                        payout: payoutFilter,
                        page: String(next),
                      })
                      router.replace(`/admin?${params.toString()}`, { scroll: false })
                    }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Failed or pending checkouts
              </CardTitle>
              <div className="flex flex-wrap gap-2 pt-4">
                {(['all', 'whish', 'stripe'] as GatewayFilter[]).map((g) => (
                  <Button
                    key={g}
                    variant={gatewayFilter === g ? 'default' : 'outline'}
                    size="sm"
                    asChild
                  >
                    <Link href={paymentFilterHref(g, statusFilter)}>
                      {g === 'all' ? 'All gateways' : g === 'whish' ? 'Whish' : 'Stripe'}
                    </Link>
                  </Button>
                ))}
                <span className="mx-1 w-px self-stretch bg-design-gray-200" />
                {(['failed', 'pending', 'all'] as StatusFilter[]).map((s) => (
                  <Button
                    key={s}
                    variant={statusFilter === s ? 'default' : 'outline'}
                    size="sm"
                    asChild
                  >
                    <Link href={paymentFilterHref(gatewayFilter, s)}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Link>
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {issuesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-design-primary" />
                </div>
              ) : issuesError ? (
                <p className="text-center text-red-600 py-8">{issuesError}</p>
              ) : issues.length === 0 ? (
                <p className="text-center text-design-text-muted py-8">No payment issues found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gateway</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issues.map((issue) => (
                      <TableRow key={`${issue.gateway}-${issue.id}`}>
                        <TableCell className="capitalize">{issue.gateway}</TableCell>
                        <TableCell>{issue.status}</TableCell>
                        <TableCell>
                          {issue.amount.toLocaleString()} {issue.currency}
                        </TableCell>
                        <TableCell>{issue.customerEmail || '—'}</TableCell>
                        <TableCell>{new Date(issue.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={Boolean(markTarget)} onOpenChange={(open: boolean) => !open && setMarkTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark payout as sent</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm you sent{' '}
              <strong>
                {markTarget?.payoutAmount.toFixed(2)} {markTarget?.currency}
              </strong>{' '}
              to <strong>{markTarget?.receiverName}</strong> via {markTarget?.payoutMethodLabel}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium">Reference note (optional)</label>
            <Textarea
              placeholder="Bank reference, Whish transfer ID, etc."
              value={markNote}
              onChange={(e) => setMarkNote(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMarkTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMarkSent} disabled={markSaving}>
              {markSaving ? 'Saving…' : 'Confirm sent'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
