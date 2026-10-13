'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { subDays } from 'date-fns'
import {
  getScheduledPayoutDate,
  isScheduledPayoutReached,
  ORDER_PAYOUT_DELAY_DAYS,
} from '@/lib/payout-schedule'
import { payoutDetailsSummary, payoutMethodLabel } from '@/lib/payout-display'

export type PayoutQueueFilter = 'due' | 'upcoming' | 'paid' | 'needs_setup' | 'all'

export type AdminPayoutQueueItem = {
  orderId: string
  orderDate: string
  payoutDueDate: string
  isDue: boolean
  daysUntilDue: number
  payoutAmount: number
  currency: string
  receiverId: string | null
  receiverName: string
  receiverEmail: string | null
  payoutMethod: string | null
  payoutMethodLabel: string
  payoutDetailsSummary: string | null
  payoutReady: boolean
  blockers: string[]
  paidAt: string | null
  paidNote: string | null
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

  return { supabase, user }
}

function daysUntil(due: Date, from: Date = new Date()): number {
  const ms = due.getTime() - from.getTime()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return fallback
}

export async function getPayoutQueueForAdmin(params?: {
  filter?: PayoutQueueFilter
  page?: number
  pageSize?: number
}): Promise<{
  items: AdminPayoutQueueItem[]
  totalCount: number
  totalPages: number
  page: number
  pageSize: number
  payoutDelayDays: number
  error: string | null
}> {
  const filter = params?.filter ?? 'due'
  const pageSize = Math.min(Math.max(params?.pageSize ?? 20, 1), 100)
  const page = Math.max(params?.page ?? 1, 1)
  const offset = (page - 1) * pageSize

  const empty = {
    items: [],
    totalCount: 0,
    totalPages: 1,
    page,
    pageSize,
    payoutDelayDays: ORDER_PAYOUT_DELAY_DAYS,
    error: null,
  }

  try {
    const { supabase } = await assertAdmin()

    const dueCutoff = subDays(new Date(), ORDER_PAYOUT_DELAY_DAYS).toISOString()

    let query = supabase
      .from('orders')
      .select(
        `
        id,
        created_at,
        total_amount,
        currency,
        status,
        is_gift,
        owner_id,
        payout_sent_at,
        payout_admin_note,
        order_items(price, quantity),
        owner:profiles!orders_owner_id_fkey(id, full_name, email, username, kyc_status, watchlist_cleared)
      `,
        { count: 'exact' }
      )
      .eq('status', 'completed')
      .eq('is_gift', true)
      .order('created_at', { ascending: true })

    switch (filter) {
      case 'paid':
        query = query.not('payout_sent_at', 'is', null)
        break
      case 'due':
        query = query.is('payout_sent_at', null).lte('created_at', dueCutoff)
        break
      case 'upcoming':
        query = query.is('payout_sent_at', null).gt('created_at', dueCutoff)
        break
      case 'needs_setup':
        query = query.is('payout_sent_at', null)
        break
      case 'all':
      default:
        break
    }

    const useInMemoryPagination = filter === 'needs_setup'

    const { data: orders, error, count } = useInMemoryPagination
      ? await query.limit(400)
      : await query.range(offset, offset + pageSize - 1)

    if (error) throw error

    const ownerIds = (orders || [])
      .map((o) => o.owner_id as string | null)
      .filter(Boolean) as string[]

    const payoutByUser = new Map<
      string,
      { payout_method: string; payout_details: Record<string, unknown> }
    >()

    if (ownerIds.length > 0) {
      const { data: payoutRows } = await supabase
        .from('payout_settings')
        .select('user_id, payout_method, payout_details')
        .in('user_id', ownerIds)
        .eq('is_active', true)

      for (const row of payoutRows || []) {
        payoutByUser.set(row.user_id, {
          payout_method: row.payout_method,
          payout_details: (row.payout_details as Record<string, unknown>) || {},
        })
      }
    }

    const now = new Date()
    let items: AdminPayoutQueueItem[] = (orders || []).map((order) => {
      const ownerRaw = order.owner as
        | {
            id: string
            full_name: string
            email: string
            username: string
            kyc_status: string
            watchlist_cleared: boolean
          }
        | {
            id: string
            full_name: string
            email: string
            username: string
            kyc_status: string
            watchlist_cleared: boolean
          }[]
        | null
      const owner = Array.isArray(ownerRaw) ? ownerRaw[0] : ownerRaw

      const receiverId = order.owner_id as string | null
      const payoutDue = getScheduledPayoutDate(order.created_at)
      const isDue = isScheduledPayoutReached(order.created_at, now)
      const daysLeft = daysUntil(payoutDue, now)

      const itemsList =
        (order.order_items as Array<{ price: number; quantity?: number }>) || []

      const payoutAmount = itemsList.reduce((sum, item) => {
        const qty = item.quantity ?? 1
        return sum + Number(item.price) * qty
      }, 0)

      const payout = receiverId ? payoutByUser.get(receiverId) : undefined
      const method = payout?.payout_method ?? null
      const detailsSummary = payoutDetailsSummary(method, payout?.payout_details)

      const blockers: string[] = []
      if (!receiverId) blockers.push('No receiver on order')
      if (owner?.kyc_status !== 'approved') blockers.push('Identity not verified')
      if (!owner?.watchlist_cleared) blockers.push('Sanctions screening not cleared')
      if (!method) blockers.push('No payout method saved')

      const payoutReady = blockers.length === 0

      return {
        orderId: order.id,
        orderDate: order.created_at,
        payoutDueDate: payoutDue.toISOString(),
        isDue,
        daysUntilDue: daysLeft,
        payoutAmount: Math.round(payoutAmount * 100) / 100,
        currency: order.currency || 'USD',
        receiverId,
        receiverName: owner?.full_name || owner?.username || 'Unknown',
        receiverEmail: owner?.email ?? null,
        payoutMethod: method,
        payoutMethodLabel: payoutMethodLabel(method),
        payoutDetailsSummary: detailsSummary,
        payoutReady,
        blockers,
        paidAt: order.payout_sent_at as string | null,
        paidNote: order.payout_admin_note as string | null,
      }
    })

    let totalCount = count ?? items.length

    if (filter === 'needs_setup') {
      items = items.filter((i) => !i.paidAt && !i.payoutReady)
      totalCount = items.length
      items = items.slice(offset, offset + pageSize)
    }

    return {
      items,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
      page,
      pageSize,
      payoutDelayDays: ORDER_PAYOUT_DELAY_DAYS,
      error: null,
    }
  } catch (err) {
    console.error('getPayoutQueueForAdmin:', err)
    return {
      ...empty,
      error: toErrorMessage(err, 'Failed to load payout queue'),
    }
  }
}

export async function markOrderPayoutSent(
  orderId: string,
  adminNote?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { supabase, user } = await assertAdmin()

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, is_gift, payout_sent_at')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      return { success: false, error: 'Order not found' }
    }

    if (order.status !== 'completed' || !order.is_gift) {
      return { success: false, error: 'Only completed gift orders can be marked as paid out' }
    }

    if (order.payout_sent_at) {
      return { success: false, error: 'Payout already marked as sent' }
    }

    const now = new Date().toISOString()
    const { error } = await supabase
      .from('orders')
      .update({
        payout_sent_at: now,
        payout_sent_by: user.id,
        payout_admin_note: adminNote?.trim() || null,
        updated_at: now,
      })
      .eq('id', orderId)

    if (error) throw error

    revalidatePath('/admin')
    return { success: true }
  } catch (err) {
    console.error('markOrderPayoutSent:', err)
    return {
      success: false,
      error: toErrorMessage(err, 'Failed to mark payout sent'),
    }
  }
}
