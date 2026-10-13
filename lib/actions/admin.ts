'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { recordAdminAudit } from '@/lib/admin-audit'

const USER_STATUSES = ['active', 'inactive', 'banned', 'suspended'] as const
const USER_ROLES = ['user', 'admin'] as const

export type AdminUsersKycFilter =
  | 'all'
  | 'unverified'
  | 'pending'
  | 'approved'
  | 'declined'
  | 'resubmission_requested'
  | 'pending_review'
  | 'watchlist_hit'

function sanitizeAdminSearch(term: string): string {
  return term.replace(/[%_,()]/g, '').trim()
}

function applyUsersKycFilter(query: any, kycFilter?: AdminUsersKycFilter) {
  if (!kycFilter || kycFilter === 'all') return query
  switch (kycFilter) {
    case 'pending_review':
      return query.in('kyc_status', ['pending', 'resubmission_requested'])
    case 'watchlist_hit':
      return query.eq('watchlist_review_status', 'potential_match')
    case 'unverified':
    case 'pending':
    case 'approved':
    case 'declined':
    case 'resubmission_requested':
      return query.eq('kyc_status', kycFilter)
    default:
      return query
  }
}

// User Management Actions
export async function getUsers(filters?: {
  status?: string
  role?: string
  search?: string
  kycFilter?: AdminUsersKycFilter
  page?: number
  pageSize?: number
}) {
  const supabase = await createSupabaseServerClient()
  const pageSize = Math.min(Math.max(filters?.pageSize ?? 20, 1), 100)
  const page = Math.max(filters?.page ?? 1, 1)
  const offset = (page - 1) * pageSize

  try {
    await requireAdmin(supabase)

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.role) {
      query = query.eq('role', filters.role)
    }

    const search = filters?.search ? sanitizeAdminSearch(filters.search) : ''
    if (search) {
      query = query.or(
        `username.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%`
      )
    }

    query = applyUsersKycFilter(query, filters?.kycFilter)

    query = query.range(offset, offset + pageSize - 1)

    const { data, error, count } = await query

    if (error) throw error

    const profiles = data || []
    const userIds = profiles.map((row) => row.id as string)

    const payoutByUser = new Map<
      string,
      { payout_method: string; payout_details: Record<string, unknown> }
    >()

    if (userIds.length > 0) {
      const { data: payoutRows, error: payoutError } = await supabase
        .from('payout_settings')
        .select('user_id, payout_method, payout_details')
        .in('user_id', userIds)
        .eq('is_active', true)

      if (payoutError) {
        console.error('Error fetching payout settings for admin users list:', payoutError)
      } else {
        for (const row of payoutRows || []) {
          payoutByUser.set(row.user_id, {
            payout_method: row.payout_method,
            payout_details: (row.payout_details as Record<string, unknown>) || {},
          })
        }
      }
    }

    const enriched = profiles.map((profile) => {
      const payout = payoutByUser.get(profile.id as string)
      return {
        ...profile,
        payout_method: payout?.payout_method ?? null,
        payout_details: payout?.payout_details ?? null,
      }
    })

    const totalCount = count ?? 0
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

    return {
      data: enriched,
      count: totalCount,
      page,
      pageSize,
      totalPages,
      error: null,
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    return {
      data: null,
      count: 0,
      page,
      pageSize,
      totalPages: 1,
      error: 'Failed to fetch users',
    }
  }
}

export async function updateUserStatus(userId: string, status: string) {
  const supabase = await createSupabaseServerClient()

  try {
    const actor = await requireAdmin(supabase)

    if (!USER_STATUSES.includes(status as (typeof USER_STATUSES)[number])) {
      throw new Error('Invalid user status')
    }

    const { data: target, error: targetError } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', userId)
      .single()

    if (targetError || !target) {
      throw new Error('User not found')
    }

    const previousStatus = target.status ?? 'unknown'

    const { error } = await supabase
      .from('profiles')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) throw error

    await recordAdminAudit({
      actorId: actor.id,
      action: 'user_status_changed',
      targetUserId: userId,
      metadata: { previousStatus, newStatus: status },
    })

    revalidatePath('/admin')
    return { success: true, error: null }
  } catch (error) {
    console.error('Error updating user status:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update user status' }
  }
}

export async function updateUserRole(userId: string, role: string) {
  const supabase = await createSupabaseServerClient()

  try {
    const actor = await requireAdmin(supabase)

    if (!USER_ROLES.includes(role as (typeof USER_ROLES)[number])) {
      throw new Error('Invalid role')
    }

    if (actor.id === userId && role !== 'admin') {
      throw new Error('You cannot remove your own admin access')
    }

    const { data: target, error: targetError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (targetError || !target) {
      throw new Error('User not found')
    }

    const previousRole = target.role ?? 'user'

    const { error } = await supabase
      .from('profiles')
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) throw error

    await recordAdminAudit({
      actorId: actor.id,
      action: 'user_role_changed',
      targetUserId: userId,
      metadata: { previousRole, newRole: role },
    })

    revalidatePath('/admin')
    return { success: true, error: null }
  } catch (error) {
    console.error('Error updating user role:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update user role' }
  }
}

export type AdminQueueStats = {
  pendingOrders: number
  failedOrders: number
  failedWhishPayments: number
  failedStripePayments: number
  kycPendingReview: number
  watchlistHits: number
  error: string | null
}

async function requireAdmin(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') {
    throw new Error('Admin access required')
  }

  return user
}

/** Action-oriented counts for the admin overview (work queues, not lifetime totals). */
export async function getAdminQueueStats(): Promise<AdminQueueStats> {
  const supabase = await createSupabaseServerClient()

  const empty: AdminQueueStats = {
    pendingOrders: 0,
    failedOrders: 0,
    failedWhishPayments: 0,
    failedStripePayments: 0,
    kycPendingReview: 0,
    watchlistHits: 0,
    error: null,
  }

  try {
    await requireAdmin(supabase)

    const [
      { count: pendingOrders },
      { count: failedOrders },
      { count: failedWhishPayments },
      { count: failedStripePayments },
      { count: kycPendingReview },
      { count: watchlistHits },
    ] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
      supabase.from('whish_payments').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed')
        .not('stripe_session_id', 'like', 'whish_%'),
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('kyc_status', ['pending', 'declined', 'resubmission_requested'] as const),
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('watchlist_review_status', 'potential_match'),
    ])

    return {
      pendingOrders: pendingOrders || 0,
      failedOrders: failedOrders || 0,
      failedWhishPayments: failedWhishPayments || 0,
      failedStripePayments: failedStripePayments || 0,
      kycPendingReview: kycPendingReview || 0,
      watchlistHits: watchlistHits || 0,
      error: null,
    }
  } catch (error) {
    console.error('Error fetching admin queue stats:', error)
    return {
      ...empty,
      error: error instanceof Error ? error.message : 'Failed to load admin queue',
    }
  }
}

export type AdminPaymentIssue = {
  id: string
  gateway: 'whish' | 'stripe'
  status: string
  amount: number
  currency: string
  customerEmail: string | null
  createdAt: string
  reference: string
  orderId: string | null
}

export async function getPaymentIssuesForAdmin(filters?: {
  gateway?: 'whish' | 'stripe' | 'all'
  status?: 'failed' | 'pending' | 'all'
  limit?: number
}): Promise<{ data: AdminPaymentIssue[]; error: string | null }> {
  const supabase = await createSupabaseServerClient()
  const limit = filters?.limit ?? 50
  const gateway = filters?.gateway ?? 'all'
  const status = filters?.status ?? 'failed'

  try {
    await requireAdmin(supabase)

    const issues: AdminPaymentIssue[] = []

    if (gateway === 'whish' || gateway === 'all') {
      let whishQuery = supabase
        .from('whish_payments')
        .select('id, external_id, customer_email, amount, currency, status, created_at, order_id')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (status !== 'all') {
        whishQuery = whishQuery.eq('status', status)
      }

      const { data: whishRows, error: whishError } = await whishQuery
      if (whishError) throw whishError

      for (const row of whishRows || []) {
        issues.push({
          id: row.id,
          gateway: 'whish',
          status: row.status,
          amount: Number(row.amount),
          currency: row.currency,
          customerEmail: row.customer_email,
          createdAt: row.created_at,
          reference: String(row.external_id),
          orderId: row.order_id,
        })
      }
    }

    if (gateway === 'stripe' || gateway === 'all') {
      let stripeQuery = supabase
        .from('orders')
        .select('id, customer_email, total_amount, currency, status, created_at, stripe_session_id')
        .not('stripe_session_id', 'like', 'whish_%')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (status !== 'all') {
        stripeQuery = stripeQuery.eq('status', status)
      } else {
        stripeQuery = stripeQuery.in('status', ['failed', 'pending'])
      }

      const { data: orderRows, error: orderError } = await stripeQuery
      if (orderError) throw orderError

      for (const row of orderRows || []) {
        issues.push({
          id: row.id,
          gateway: 'stripe',
          status: row.status,
          amount: Number(row.total_amount),
          currency: row.currency,
          customerEmail: row.customer_email,
          createdAt: row.created_at,
          reference: row.stripe_session_id,
          orderId: row.id,
        })
      }
    }

    issues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return { data: issues.slice(0, limit), error: null }
  } catch (error) {
    console.error('Error fetching payment issues:', error)
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch payment issues',
    }
  }
}

// Platform Statistics
export async function getPlatformStats() {
  const supabase = await createSupabaseServerClient()
  
  try {
    // Check admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
  
    if (adminProfile?.role !== 'admin') {
      throw new Error('Admin access required')
  }

    // Get all statistics in parallel
    const [
      { count: totalUsers },
      { count: totalOrders },
      { count: totalWishlistItems },
      { count: totalMessages },
      { count: totalNotifications },
      { data: revenueData }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('wishlist_items').select('*', { count: 'exact', head: true }),
      supabase.from('gift_messages').select('*', { count: 'exact', head: true }),
      supabase.from('gift_notifications').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('total_amount').eq('status', 'completed')
    ])

    // Calculate total revenue
    const totalRevenue = revenueData?.reduce((sum, order) => 
      sum + parseFloat(order.total_amount || '0'), 0
    ) || 0

    // Get active users (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', thirtyDaysAgo.toISOString())

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: recentActivity } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalOrders: totalOrders || 0,
      totalRevenue,
      totalWishlistItems: totalWishlistItems || 0,
      totalMessages: totalMessages || 0,
      totalNotifications: totalNotifications || 0,
      recentActivity: recentActivity || 0,
      error: null
    }
  } catch (error) {
    console.error('Error fetching platform stats:', error)
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalOrders: 0,
      totalRevenue: 0,
      totalWishlistItems: 0,
      totalMessages: 0,
      totalNotifications: 0,
      recentActivity: 0,
      error: error instanceof Error ? error.message : 'Failed to fetch platform statistics'
    }
  }
}

// Order Management
export async function getOrdersForAdmin(filters?: {
  status?: string
  search?: string
  limit?: number
  offset?: number
}) {
  const supabase = await createSupabaseServerClient()
  
  try {
    // Check admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        buyer:profiles!orders_user_id_fkey(id, username, full_name, email, avatar_url),
        owner:profiles!orders_owner_id_fkey(id, username, full_name, email, avatar_url)
      `)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.search) {
      query = query.or(`customer_email.ilike.%${filters.search}%,id.ilike.%${filters.search}%`)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error, count } = await query

    if (error) throw error

    // Process the data to include receiver details
    const processedData = await Promise.all((data || []).map(async (order) => {
      let receivers: Array<Pick<{ id: string; username: string; full_name: string; email: string; avatar_url?: string }, 'id' | 'username' | 'full_name' | 'email' | 'avatar_url'>> = []
      
      // If it's a gift, get receiver details from wishlist_owner_ids
      if (order.is_gift && order.wishlist_owner_ids) {
        const ownerIds = order.wishlist_owner_ids.split(',').filter(Boolean)
        
        if (ownerIds.length > 0) {
          const { data: receiverProfiles } = await supabase
            .from('profiles')
            .select('id, username, full_name, email, avatar_url')
            .in('id', ownerIds)
          
          receivers = receiverProfiles || []
        }
      }
      
      return {
        ...order,
        receivers
      }
    }))

    return { data: processedData, count, error: null }
  } catch (error) {
    console.error('Error fetching orders:', error)
    return { data: null, count: 0, error: 'Failed to fetch orders' }
  }
}

// Get detailed order information by ID
export async function getOrderDetailsForAdmin(orderId: string) {
  const supabase = await createSupabaseServerClient()
  
  try {
    // Check admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        gift_messages(*),
        gift_receipts(*),
        thank_you_notes(*),
        gift_notifications(*),
        buyer:profiles!orders_user_id_fkey(id, username, full_name, email, avatar_url),
        owner:profiles!orders_owner_id_fkey(id, username, full_name, email, avatar_url)
      `)
      .eq('id', orderId)
      .single()

    if (error) throw error

    // Get receiver details if it's a gift
    let receivers: Array<Pick<{ id: string; username: string; full_name: string; email: string; avatar_url?: string }, 'id' | 'username' | 'full_name' | 'email' | 'avatar_url'>> = []
    if (order.is_gift && order.wishlist_owner_ids) {
      const ownerIds = order.wishlist_owner_ids.split(',').filter(Boolean)
      
      if (ownerIds.length > 0) {
        const { data: receiverProfiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, email, avatar_url')
          .in('id', ownerIds)
        
        receivers = receiverProfiles || []
      }
    }

    return {
      ...order,
      receivers
    }
  } catch (error) {
    console.error('Error fetching order details:', error)
    throw new Error('Failed to fetch order details')
  }
}

// Update order status
export async function updateOrderStatus(orderId: string, status: string, adminNotes?: string) {
  const supabase = await createSupabaseServerClient()
  
  try {
    // Check admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminProfile?.role !== 'admin') {
      throw new Error('Admin access required')
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (adminNotes) {
      updateData.admin_notes = adminNotes
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin')
    return data
  } catch (error) {
    console.error('Error updating order status:', error)
    throw new Error('Failed to update order status')
  }
}

// Message Management
export async function getMessagesForAdmin(filters?: {
  type?: 'gift_messages' | 'thank_you_notes'
  limit?: number
  offset?: number
}) {
  const supabase = await createSupabaseServerClient()
  
  try {
    // Check admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
  
    if (adminProfile?.role !== 'admin') {
      throw new Error('Admin access required')
  }

    const table = filters?.type || 'gift_messages'
    
    let query = supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, error, count } = await query

    if (error) throw error

    return { data, count, error: null }
  } catch (error) {
    console.error('Error fetching messages:', error)
    return { data: null, count: 0, error: 'Failed to fetch messages' }
  }
}

export type AdminAuditLogEntry = {
  id: string
  action: string
  created_at: string
  actor_id: string
  target_user_id: string | null
  metadata: Record<string, unknown>
  actor_email?: string
  actor_name?: string
  target_email?: string
  target_name?: string
}

export async function getAdminAuditLog(limit = 40): Promise<{
  data: AdminAuditLogEntry[]
  error: string | null
}> {
  const supabase = await createSupabaseServerClient()

  try {
    await requireAdmin(supabase)

    const { data: rows, error } = await supabase
      .from('admin_audit_log')
      .select('id, action, created_at, actor_id, target_user_id, metadata')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    const profileIds = new Set<string>()
    for (const row of rows || []) {
      profileIds.add(row.actor_id)
      if (row.target_user_id) profileIds.add(row.target_user_id)
    }

    const profilesById = new Map<string, { email: string; full_name: string }>()
    if (profileIds.size > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', Array.from(profileIds))

      for (const p of profiles || []) {
        profilesById.set(p.id, { email: p.email, full_name: p.full_name })
      }
    }

    const data: AdminAuditLogEntry[] = (rows || []).map((row) => {
      const actor = profilesById.get(row.actor_id)
      const target = row.target_user_id ? profilesById.get(row.target_user_id) : undefined
      return {
        id: row.id,
        action: row.action,
        created_at: row.created_at,
        actor_id: row.actor_id,
        target_user_id: row.target_user_id,
        metadata: (row.metadata as Record<string, unknown>) || {},
        actor_email: actor?.email,
        actor_name: actor?.full_name,
        target_email: target?.email,
        target_name: target?.full_name,
      }
    })

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching admin audit log:', error)
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to load audit log',
    }
  }
}

// Check if user is admin
export async function checkAdminAccess() {
  const supabase = await createSupabaseServerClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { isAdmin: false, error: 'Not authenticated' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    return { 
      isAdmin: profile?.role === 'admin', 
      error: null,
      user: user 
    }
  } catch (error) {
    console.error('Error checking admin access:', error)
    return { 
      isAdmin: false, 
      error: 'Failed to verify admin access',
      user: null 
    }
  }
} 