'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export interface GiftNotificationWithDetails {
  id: string
  order_id: string | null
  recipient_id: string | null
  notification_type: string
  email_sent: boolean
  email_sent_at: string | null
  is_read: boolean
  read_at: string | null
  metadata: any
  created_at: string
  // Joined data
  recipient_name: string | null
  recipient_username: string | null
  recipient_email: string | null
  sender_name: string | null
  sender_email: string | null
  order_total: number | null
  order_status: string | null
  items_count: number | null
}

function sanitizeNotificationSearch(term: string): string {
  return term.replace(/[%_,()]/g, '').trim()
}

// Get all gift notifications for admin (with user details)
export async function getGiftNotifications(params?: {
  page?: number
  pageSize?: number
  filter?: 'all' | 'unread' | 'read'
  search?: string
}): Promise<{
  notifications: GiftNotificationWithDetails[]
  totalCount: number
  totalPages: number
  page: number
  pageSize: number
}> {
  const supabase = await createSupabaseServerClient()
  const pageSize = Math.min(Math.max(params?.pageSize ?? 20, 1), 100)
  const page = Math.max(params?.page ?? 1, 1)
  const filter = params?.filter ?? 'all'
  const offset = (page - 1) * pageSize

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }

  let recipientIds: string[] | null = null
  const search = params?.search ? sanitizeNotificationSearch(params.search) : ''
  if (search) {
    const { data: matchingProfiles } = await supabase
      .from('profiles')
      .select('id')
      .or(`full_name.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%`)
      .limit(200)

    recipientIds = (matchingProfiles || []).map((p) => p.id)
    if (recipientIds.length === 0) {
      return {
        notifications: [],
        totalCount: 0,
        totalPages: 1,
        page,
        pageSize,
      }
    }
  }

  const applyListFilters = (query: any) => {
    let q = query
    if (filter === 'unread') q = q.eq('is_read', false)
    else if (filter === 'read') q = q.eq('is_read', true)
    if (recipientIds) q = q.in('recipient_id', recipientIds)
    return q
  }

  const { count: totalCount } = await applyListFilters(
    supabase.from('gift_notifications').select('*', { count: 'exact', head: true })
  )

  let query = applyListFilters(
    supabase.from('gift_notifications').select(`
      *,
      recipient:profiles!gift_notifications_recipient_id_fkey(
        full_name,
        username,
        email
      ),
      orders!gift_notifications_order_id_fkey(
        user_id,
        total_amount,
        status,
        customer_email
      )
    `)
  )

  const { data: notifications, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (error) {
    console.error('Error fetching gift notifications:', error)
    throw new Error('Failed to fetch gift notifications')
  }

  // Get sender details for each notification
  type NotificationRow = {
    id: string
    order_id: string | null
    recipient_id: string | null
    notification_type: string
    email_sent: boolean
    email_sent_at: string | null
    is_read: boolean
    read_at: string | null
    metadata: Record<string, unknown> | null
    created_at: string
    recipient?: { full_name: string | null; username: string | null; email: string | null } | null
    orders?: {
      user_id: string | null
      total_amount: number | null
      status: string | null
      customer_email: string | null
    } | null
  }

  const notificationsWithSenders = await Promise.all(
    (notifications as NotificationRow[] | null || []).map(async (notification) => {
      let senderName = null
      let senderEmail = null

      if (notification.orders?.user_id) {
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', notification.orders.user_id)
          .single()

        if (senderProfile) {
          senderName = senderProfile.full_name
          senderEmail = senderProfile.email
        }
      }

      return {
        id: notification.id,
        order_id: notification.order_id,
        recipient_id: notification.recipient_id,
        notification_type: notification.notification_type,
        email_sent: notification.email_sent,
        email_sent_at: notification.email_sent_at,
        is_read: notification.is_read,
        read_at: notification.read_at,
        metadata: notification.metadata,
        created_at: notification.created_at,
        recipient_name: notification.recipient?.full_name || null,
        recipient_username: notification.recipient?.username || null,
        recipient_email: notification.recipient?.email || null,
        sender_name: senderName,
        sender_email: senderEmail,
        order_total: notification.orders?.total_amount || null,
        order_status: notification.orders?.status || null,
        items_count:
          typeof notification.metadata?.items_count === 'number'
            ? notification.metadata.items_count
            : null,
      }
    })
  )

  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / pageSize))

  return {
    notifications: notificationsWithSenders,
    totalCount: totalCount || 0,
    totalPages,
    page,
    pageSize,
  }
}

// Mark notification as read/unread
export async function updateNotificationReadStatus(
  notificationId: string,
  isRead: boolean
) {
  const supabase = await createSupabaseServerClient()
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }

  const updateData: any = {
    is_read: isRead,
  }

  if (isRead) {
    updateData.read_at = new Date().toISOString()
  } else {
    updateData.read_at = null
  }

  const { error } = await supabase
    .from('gift_notifications')
    .update(updateData)
    .eq('id', notificationId)

  if (error) {
    console.error('Error updating notification read status:', error)
    throw new Error('Failed to update notification status')
  }

  revalidatePath('/admin')
  return { success: true }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead() {
  const supabase = await createSupabaseServerClient()
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }

  const { error } = await supabase
    .from('gift_notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('is_read', false)

  if (error) {
    console.error('Error marking all notifications as read:', error)
    throw new Error('Failed to mark all notifications as read')
  }

  revalidatePath('/admin')
  return { success: true }
}

// Get notification statistics
export async function getNotificationStats(): Promise<{
  total: number
  unread: number
  read: number
  todayCount: number
}> {
  const supabase = await createSupabaseServerClient()
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get all counts in parallel
  const [
    { count: total },
    { count: unread },
    { count: read },
    { count: todayCount }
  ] = await Promise.all([
    supabase.from('gift_notifications').select('*', { count: 'exact', head: true }),
    supabase.from('gift_notifications').select('*', { count: 'exact', head: true }).eq('is_read', false),
    supabase.from('gift_notifications').select('*', { count: 'exact', head: true }).eq('is_read', true),
    supabase.from('gift_notifications').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString())
  ])

  return {
    total: total || 0,
    unread: unread || 0,
    read: read || 0,
    todayCount: todayCount || 0
  }
}
