'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import type { 
  GiftHistoryItem, 
  GiftStatistics, 
  GiftAnalytics,
  AnalyticsDateFilter,
  Order,
  OrderItem,
  GiftMessage,
  ThankYouNote,
  Profile
} from '@/lib/types/database'

// Get comprehensive gift history for a user
export async function getGiftHistory(): Promise<GiftHistoryItem[]> {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  try {
    // Build the query
    let ordersQuery = supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        gift_messages(*),
        gift_receipts(*),
        thank_you_notes(*),
        gift_notifications(*)
      `)
      .eq('is_gift', true)
      .eq('status', 'completed')
      .or(`wishlist_owner_ids.like.%${user.id}%,owner_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    const { data: orders, error } = await ordersQuery

    if (error) {
      console.error('Error fetching gift history:', error)
      return []
    }

    if (!orders) return []

    // Transform data and fetch additional profile information
    const giftHistoryItems: GiftHistoryItem[] = []

    for (const order of orders) {
      // Get other party's profile information
      let otherPartyId: string | null = null
      otherPartyId = order.user_id

      let otherParty: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'> | undefined

      if (otherPartyId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .eq('id', otherPartyId)
          .single()

        if (profile) {
          otherParty = profile
        }
      }

      giftHistoryItems.push({
        id: order.id,
        order,
        items: order.order_items || [],
        message: order.gift_messages?.[0],
        receipt: order.gift_receipts?.[0],
        thankYouNote: order.thank_you_notes?.[0],
        notifications: order.gift_notifications || [],
        otherParty
      })
    }

    return giftHistoryItems
  } catch (error) {
    console.error('Error in getGiftHistory:', error)
    return []
  }
}

// Get gift statistics for a user
export async function getGiftStatistics(): Promise<GiftStatistics> {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      total_gifts_received: 0,
      total_amount_received: 0,
      completed_gifts: 0
    }
  }

  try {
    const { data, error } = await supabase
      .rpc('get_gift_statistics', { user_uuid: user.id })

    if (error) {
      console.error('Error fetching gift statistics:', error)
      return {
        total_gifts_received: 0,
        total_amount_received: 0,
        completed_gifts: 0
      }
    }

    return data[0] || {
      total_gifts_received: 0,
      total_amount_received: 0,
      completed_gifts: 0
    }
  } catch (error) {
    console.error('Error in getGiftStatistics:', error)
    return {
      total_gifts_received: 0,
      total_amount_received: 0,
      completed_gifts: 0
    }
  }
}

// Get gift analytics with detailed insights
export async function getGiftAnalytics(period: AnalyticsDateFilter['period'] = 'this_year'): Promise<GiftAnalytics> {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      totalGiftsThisYear: 0,
      totalReceivedThisYear: 0,
      totalWishlistViews: 0,
      topGiftCategories: [],
      monthlyStats: [],
      recentActivity: []
    }
  }

  try {
    const now = new Date()
    let startDate: string
    let endDate: string

    // Calculate date range based on period
    switch (period) {
      case 'this_month':
        startDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        break
      case 'last_month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        startDate = `${lastMonth.getFullYear()}-${(lastMonth.getMonth() + 1).toString().padStart(2, '0')}-01`
        endDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).toISOString().split('T')[0]
        break
      case 'this_year':
      default:
        startDate = `${now.getFullYear()}-01-01`
        endDate = `${now.getFullYear()}-12-31`
        break
    }

    // Get gifts data for the period
    const { data: giftsReceived } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('is_gift', true)
      .eq('status', 'completed')
      .or(`wishlist_owner_ids.like.%${user.id}%,owner_id.eq.${user.id}`)
      .gte('created_at', startDate + 'T00:00:00.000Z')
      .lte('created_at', endDate + 'T23:59:59.999Z')

    // Get wishlist views for the period
    const { data: wishlistViewsData } = await supabase
      .from('wishlist_views')
      .select('viewed_at')
      .eq('wishlist_owner_id', user.id)
      .gte('viewed_at', startDate)
      .lte('viewed_at', endDate)

    const totalGiftsThisYear = giftsReceived?.length || 0
    const totalReceivedThisYear = giftsReceived?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
    const totalWishlistViews = wishlistViewsData?.length || 0

    // Get monthly statistics based on the selected period
    const monthlyStats = []
    
    if (period === 'this_month' || period === 'last_month') {
      // For single month periods, show daily stats
      const targetDate = period === 'this_month' ? now : new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate()
      
      for (let day = 1; day <= Math.min(daysInMonth, 30); day += 5) { // Show every 5 days to avoid clutter
        const dayStart = `${targetDate.getFullYear()}-${(targetDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
        const dayEnd = `${targetDate.getFullYear()}-${(targetDate.getMonth() + 1).toString().padStart(2, '0')}-${Math.min(day + 4, daysInMonth).toString().padStart(2, '0')}`

        const { data: dailyGifts } = await supabase
          .from('orders')
          .select('total_amount')
          .or(`wishlist_owner_ids.like.%${user.id}%,owner_id.eq.${user.id}`)
          .eq('is_gift', true)
          .eq('status', 'completed')
          .gte('created_at', dayStart)
          .lte('created_at', dayEnd)

        const { data: dailyViews } = await supabase
          .from('wishlist_views')
          .select('viewed_at')
          .eq('wishlist_owner_id', user.id)
          .gte('viewed_at', dayStart)
          .lte('viewed_at', dayEnd)

        monthlyStats.push({
          month: `${day}-${Math.min(day + 4, daysInMonth)}`,
          giftsReceived: dailyGifts?.length || 0,
          amountReceived: dailyGifts?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0,
          wishlistViews: dailyViews?.length || 0
        })
      }
    } else {
      // For yearly period, show monthly stats
      const year = now.getFullYear()
      for (let month = 1; month <= 12; month++) {
        const monthStart = `${year}-${month.toString().padStart(2, '0')}-01`
        const monthEnd = new Date(year, month, 0).toISOString().split('T')[0]

        const { data: monthlyGifts } = await supabase
          .from('orders')
          .select('total_amount')
          .or(`wishlist_owner_ids.like.%${user.id}%,owner_id.eq.${user.id}`)
          .eq('is_gift', true)
          .eq('status', 'completed')
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd)

        const { data: monthlyViews } = await supabase
          .from('wishlist_views')
          .select('viewed_at')
          .eq('wishlist_owner_id', user.id)
          .gte('viewed_at', monthStart)
          .lte('viewed_at', monthEnd)

        monthlyStats.push({
          month: new Date(year, month - 1).toLocaleString('default', { month: 'short' }),
          giftsReceived: monthlyGifts?.length || 0,
          amountReceived: monthlyGifts?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0,
          wishlistViews: monthlyViews?.length || 0
        })
      }
    }

    // Get recent activity (last 10 gifts)
    const recentActivity = await getGiftHistory()
    const limitedRecentActivity = recentActivity.slice(0, 10)

    // Create mock top gift categories (this would require item categorization)
    const topGiftCategories = [
      { category: 'Electronics', count: 5, totalAmount: 750 },
      { category: 'Books', count: 8, totalAmount: 200 },
      { category: 'Fashion', count: 3, totalAmount: 450 },
      { category: 'Home & Garden', count: 2, totalAmount: 300 }
    ]

    return {
      totalGiftsThisYear,
      totalReceivedThisYear,
      totalWishlistViews,
      topGiftCategories,
      monthlyStats,
      recentActivity: limitedRecentActivity
    }
  } catch (error) {
    console.error('Error in getGiftAnalytics:', error)
    return {
      totalGiftsThisYear: 0,
      totalReceivedThisYear: 0,
      totalWishlistViews: 0,
      topGiftCategories: [],
      monthlyStats: [],
      recentActivity: []
    }
  }
}

// Send a thank you note
export async function sendThankYouNote(
  orderId: string,
  recipientId: string,
  message: string,
  isPublic: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  try {
    const { error } = await supabase
      .from('thank_you_notes')
      .insert({
        order_id: orderId,
        sender_id: user.id,
        recipient_id: recipientId,
        message,
        is_public: isPublic
      })

    if (error) {
      console.error('Error sending thank you note:', error)
      return { success: false, error: 'Failed to send thank you note' }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error in sendThankYouNote:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Mark gift notification as read
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  try {
    const { error } = await supabase
      .from('gift_notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', notificationId)
      .eq('recipient_id', user.id)

    if (error) {
      console.error('Error marking notification as read:', error)
      return { success: false }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error)
    return { success: false }
  }
}

// Get gift receipt
export async function getGiftReceipt(orderId: string) {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const { data: receipt, error } = await supabase
      .from('gift_receipts')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (error) {
      console.error('Error fetching gift receipt:', error)
      return null
    }

    return receipt
  } catch (error) {
    console.error('Error in getGiftReceipt:', error)
    return null
  }
}

// Track wishlist view for analytics
export async function trackWishlistView(
  wishlistOwnerId: string,
  viewerIpAddress?: string,
  userAgent?: string,
  referrer?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .rpc('track_wishlist_view', {
        wishlist_owner_uuid: wishlistOwnerId,
        viewer_uuid: user?.id || null,
        ip_address: viewerIpAddress || null,
        user_agent_string: userAgent || null,
        referrer_url: referrer || null
      })

    if (error) {
      console.error('Error tracking wishlist view:', error)
      return { success: false, error: 'Failed to track view' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in trackWishlistView:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
} 

// Create gift message
export async function createGiftMessage(
  orderId: string,
  senderId: string,
  recipientId: string,
  message: string,
  isPrivate: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient()
  
  try {
    const { error } = await supabase
      .from('gift_messages')
      .insert({
        order_id: orderId,
        sender_id: senderId,
        recipient_id: recipientId,
        message,
        is_private: isPrivate
      })

    if (error) {
      console.error('Error creating gift message:', error)
      return { success: false, error: 'Failed to create gift message' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in createGiftMessage:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Create gift notification with detailed email tracking
export async function createGiftNotification(
  orderId: string,
  recipientId: string,
  notificationType: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient()
  
  try {
    const { error } = await supabase
      .from('gift_notifications')
      .insert({
        order_id: orderId,
        recipient_id: recipientId,
        notification_type: notificationType,
        email_sent: false,
        is_read: false,
        metadata: metadata || {}
      })

    if (error) {
      console.error('Error creating gift notification:', error)
      return { success: false, error: 'Failed to create gift notification' }
    }

    // Log detailed notification creation for responsibility tracking [[memory:3315689]]
    console.log(`[GIFT_NOTIFICATION] Created ${notificationType} notification for order ${orderId}, recipient ${recipientId}. Details: ${JSON.stringify(metadata || {})}`)

    return { success: true }
  } catch (error) {
    console.error('Error in createGiftNotification:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Update gift notification email status with detailed tracking
export async function updateGiftNotificationEmailStatus(
  notificationId: string,
  emailSent: boolean,
  emailDetails?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient()
  
  try {
    const updateData: any = {
      email_sent: emailSent,
      email_sent_at: emailSent ? new Date().toISOString() : null
    }

    // If email details are provided, merge them into metadata
    if (emailDetails) {
      const { data: existingNotification } = await supabase
        .from('gift_notifications')
        .select('metadata')
        .eq('id', notificationId)
        .single()

      if (existingNotification) {
        updateData.metadata = {
          ...(existingNotification.metadata || {}),
          email: emailDetails
        }
      }
    }

    const { error } = await supabase
      .from('gift_notifications')
      .update(updateData)
      .eq('id', notificationId)

    if (error) {
      console.error('Error updating gift notification email status:', error)
      return { success: false, error: 'Failed to update email status' }
    }

    // Detailed logging for email notification tracking [[memory:3315689]]
    const emailStatus = emailSent ? 'sent' : 'failed'
    console.log(`[EMAIL_NOTIFICATION] Email ${emailStatus} for notification ${notificationId}. Details: ${JSON.stringify(emailDetails || {})}`)

    return { success: true }
  } catch (error) {
    console.error('Error in updateGiftNotificationEmailStatus:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Create gift receipt
export async function createGiftReceipt(
  orderId: string,
  receiptNumber: string,
  receiptData: Record<string, any>,
  pdfUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient()
  
  try {
    const { error } = await supabase
      .from('gift_receipts')
      .insert({
        order_id: orderId,
        receipt_number: receiptNumber,
        receipt_data: receiptData,
        pdf_url: pdfUrl
      })

    if (error) {
      console.error('Error creating gift receipt:', error)
      return { success: false, error: 'Failed to create gift receipt' }
    }

    // Detailed logging for receipt creation [[memory:3315689]]
    console.log(`[GIFT_RECEIPT] Created receipt ${receiptNumber} for order ${orderId}. PDF: ${pdfUrl || 'none'}`)

    return { success: true }
  } catch (error) {
    console.error('Error in createGiftReceipt:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
} 