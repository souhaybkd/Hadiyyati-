'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  getUsers,
  updateUserStatus,
  updateUserRole,
  type AdminUsersKycFilter,
} from '@/lib/actions/admin'
import { payoutMethodLabel, payoutDetailsSummary } from '@/lib/payout-display'
import type { PayoutDetails } from '@/lib/types/database'
import { AdminListPagination } from '@/components/dashboard/admin/AdminListPagination'
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Calendar,
  Ban,
  CheckCircle,
  Loader2,
} from 'lucide-react'

const PAGE_SIZE = 20

interface UserProfile {
  id: string
  username: string
  full_name: string
  email: string
  role: string
  status: string
  kyc_status?: string
  payout_method?: string | null
  payout_details?: PayoutDetails | Record<string, unknown> | null
  created_at: string
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'banned'

const KYC_FILTERS: { id: AdminUsersKycFilter; label: string }[] = [
  { id: 'all', label: 'All KYC' },
  { id: 'unverified', label: 'Unverified' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Verified' },
  { id: 'declined', label: 'Declined' },
  { id: 'resubmission_requested', label: 'Resubmit' },
  { id: 'pending_review', label: 'KYC review' },
  { id: 'watchlist_hit', label: 'Watchlist' },
]

function parseKycFromUrl(kyc: string | null, watchlist: string | null): AdminUsersKycFilter {
  if (watchlist === 'review') return 'watchlist_hit'
  if (kyc === 'pending_review') return 'pending_review'
  if (kyc && KYC_FILTERS.some((f) => f.id === kyc)) return kyc as AdminUsersKycFilter
  return 'all'
}

export function UserManagement() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [searchDebounced, setSearchDebounced] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [kycFilter, setKycFilter] = useState<AdminUsersKycFilter>('all')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    const status = searchParams?.get('status')
    if (status === 'active' || status === 'inactive' || status === 'banned') {
      setStatusFilter(status)
    } else if (status === 'all' || !status) {
      setStatusFilter('all')
    }
    setKycFilter(parseKycFromUrl(searchParams?.get('kyc') ?? null, searchParams?.get('watchlist') ?? null))
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
    (patch: {
      page?: number
      status?: StatusFilter
      kyc?: AdminUsersKycFilter
      q?: string
    }) => {
      const params = new URLSearchParams({ tab: 'users' })
      const nextPage = patch.page ?? page
      const nextStatus = patch.status ?? statusFilter
      const nextKyc = patch.kyc ?? kycFilter
      const nextQ = patch.q ?? searchDebounced

      if (nextPage > 1) params.set('page', String(nextPage))
      if (nextStatus !== 'all') params.set('status', nextStatus)
      if (nextKyc === 'watchlist_hit') {
        params.set('watchlist', 'review')
      } else if (nextKyc === 'pending_review') {
        params.set('kyc', 'pending_review')
      } else if (nextKyc !== 'all') {
        params.set('kyc', nextKyc)
      }
      if (nextQ.trim()) params.set('q', nextQ.trim())

      router.replace(`/admin?${params.toString()}`, { scroll: false })
    },
    [page, statusFilter, kycFilter, searchDebounced, router]
  )

  useEffect(() => {
    if (searchDebounced !== (searchParams?.get('q') ?? '')) {
      setPage(1)
      syncUrl({ page: 1, q: searchDebounced })
    }
  }, [searchDebounced, searchParams, syncUrl])

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getUsers({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchDebounced || undefined,
        kycFilter: kycFilter !== 'all' ? kycFilter : undefined,
        page,
        pageSize: PAGE_SIZE,
      })

      if (result.error || !result.data) {
        setError(result.error || 'Failed to load users')
        setUsers([])
        setTotalCount(0)
        setTotalPages(1)
        return
      }

      setUsers(result.data as UserProfile[])
      setTotalCount(result.count)
      setTotalPages(result.totalPages)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, kycFilter, searchDebounced, page])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    setActionError(null)
    const result = await updateUserStatus(userId, newStatus)
    if (!result.success) {
      setActionError(result.error || 'Failed to update user status.')
      return
    }
    await fetchUsers()
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    setActionError(null)
    const result = await updateUserRole(userId, newRole)
    if (!result.success) {
      setActionError(result.error || 'Failed to update user role.')
      return
    }
    await fetchUsers()
  }

  const setStatus = (status: StatusFilter) => {
    setStatusFilter(status)
    setPage(1)
    syncUrl({ status, page: 1 })
  }

  const setKyc = (kyc: AdminUsersKycFilter) => {
    setKycFilter(kyc)
    setPage(1)
    syncUrl({ kyc, page: 1 })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        )
      case 'inactive':
        return (
          <Badge variant="secondary">
            <UserX className="w-3 h-3 mr-1" />
            Inactive
          </Badge>
        )
      case 'banned':
        return (
          <Badge variant="destructive">
            <Ban className="w-3 h-3 mr-1" />
            Banned
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge className="bg-purple-100 text-purple-800">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Users className="w-3 h-3 mr-1" />
            User
          </Badge>
        )
    }
  }

  const getKycBadge = (kycStatus?: string) => {
    switch (kycStatus) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        )
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>
      case 'resubmission_requested':
        return <Badge className="bg-orange-100 text-orange-800">Resubmit</Badge>
      default:
        return <Badge variant="outline">Unverified</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-design-text-heading">User Management</h1>
        <Badge variant="outline" className="text-sm">{totalCount} users</Badge>
      </div>

      {actionError && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <Ban className="h-4 w-4" />
          {actionError}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
          <Button onClick={fetchUsers} className="mt-2" variant="outline" size="sm">
            Retry
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Platform Users
          </CardTitle>
          <div className="flex flex-col gap-3 pt-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search name, username, or email…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'active', 'inactive', 'banned'] as StatusFilter[]).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatus(status)}
                >
                  {status === 'all' ? 'All statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-design-gray-100 pt-3">
              {KYC_FILTERS.map((f) => (
                <Button
                  key={f.id}
                  variant={kycFilter === f.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setKyc(f.id)}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-design-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-design-text-muted">
              No users found matching your criteria.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>KYC</TableHead>
                    <TableHead>Payout method</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const payoutSummary = payoutDetailsSummary(
                      user.payout_method,
                      user.payout_details
                    )
                    return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">{user.full_name || 'Unnamed user'}</div>
                        <div className="text-sm text-design-text-muted">@{user.username || 'unknown'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>{getKycBadge(user.kyc_status)}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-design-text-heading">
                          {payoutMethodLabel(user.payout_method)}
                        </div>
                        {payoutSummary && (
                          <div className="text-xs text-design-text-muted mt-0.5 max-w-[220px] truncate" title={payoutSummary}>
                            {payoutSummary}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-design-text-muted">
                          <Calendar className="h-4 w-4" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          {user.status === 'active' ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Ban className="h-4 w-4 mr-1" />
                                  Ban
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Ban User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Ban {user.full_name}? They will lose access to the platform.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleUpdateUserStatus(user.id, 'banned')}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Ban User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : user.status === 'banned' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateUserStatus(user.id, 'active')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Unban
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateUserStatus(user.id, 'active')}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Activate
                            </Button>
                          )}
                          {user.role !== 'admin' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Shield className="h-4 w-4 mr-1" />
                                  Make Admin
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Promote to Admin</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Grant admin access to {user.full_name}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleUpdateUserRole(user.id, 'admin')}
                                  >
                                    Grant Admin Access
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
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
