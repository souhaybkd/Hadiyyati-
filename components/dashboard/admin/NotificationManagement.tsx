'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Gift, Loader2, AlertCircle, DollarSign, Search } from 'lucide-react'
import { getGiftNotifications, type GiftNotificationWithDetails } from '@/lib/actions/notifications'
import { AdminListPagination } from '@/components/dashboard/admin/AdminListPagination'
import { useSearchParams, useRouter } from 'next/navigation'

const PAGE_SIZE = 20
type ReadFilter = 'all' | 'unread' | 'read'

export function NotificationManagement() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [notifications, setNotifications] = useState<GiftNotificationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [readFilter, setReadFilter] = useState<ReadFilter>('all')
  const [searchInput, setSearchInput] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const f = searchParams?.get('read')
    if (f === 'unread' || f === 'read') setReadFilter(f)
    else setReadFilter('all')
    const q = searchParams?.get('q') ?? ''
    setSearchInput(q)
    setSearchDebounced(q)
    const p = parseInt(searchParams?.get('page') ?? '1', 10)
    setPage(Number.isFinite(p) && p > 0 ? p : 1)
  }, [searchParams])

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(searchInput), 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  const syncUrl = useCallback(
    (patch: { page?: number; read?: ReadFilter; q?: string }) => {
      const params = new URLSearchParams({ tab: 'notifications' })
      const nextPage = patch.page ?? page
      const nextRead = patch.read ?? readFilter
      const nextQ = patch.q ?? searchDebounced

      if (nextPage > 1) params.set('page', String(nextPage))
      if (nextRead !== 'all') params.set('read', nextRead)
      if (nextQ.trim()) params.set('q', nextQ.trim())

      router.replace(`/admin?${params.toString()}`, { scroll: false })
    },
    [page, readFilter, searchDebounced, router]
  )

  useEffect(() => {
    if (searchDebounced !== (searchParams?.get('q') ?? '')) {
      setPage(1)
      syncUrl({ page: 1, q: searchDebounced })
    }
  }, [searchDebounced, searchParams, syncUrl])

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getGiftNotifications({
        page,
        pageSize: PAGE_SIZE,
        filter: readFilter,
        search: searchDebounced || undefined,
      })
      setNotifications(data.notifications)
      setTotalCount(data.totalCount)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
      setNotifications([])
      setTotalCount(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, readFilter, searchDebounced])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getNotificationMessage = (notification: GiftNotificationWithDetails) => {
    const senderName = notification.sender_name || 'Someone'
    const recipientName =
      notification.recipient_name || notification.recipient_username || 'Unknown'
    return `${senderName} sent a gift to ${recipientName}`
  }

  const setRead = (filter: ReadFilter) => {
    setReadFilter(filter)
    setPage(1)
    syncUrl({ read: filter, page: 1 })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-design-text-heading">Gift Notifications</h1>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Gift activity
          </CardTitle>
          <div className="flex flex-col gap-3 pt-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search recipient name, username, or email…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'unread', 'read'] as ReadFilter[]).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={readFilter === f ? 'default' : 'outline'}
                  onClick={() => setRead(f)}
                >
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-design-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications match your filters.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Gift className="h-5 w-5 text-purple-600 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{getNotificationMessage(notification)}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(notification.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {!notification.is_read && (
                          <Badge className="bg-amber-100 text-amber-800">Unread</Badge>
                        )}
                        {notification.order_total != null && (
                          <div className="flex items-center gap-1 text-green-600 font-semibold">
                            <DollarSign className="h-4 w-4" />
                            <span>${notification.order_total}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <AdminListPagination
                page={page}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={PAGE_SIZE}
                onPageChange={(next) => {
                  setPage(next)
                  syncUrl({ page: next })
                }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
