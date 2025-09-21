'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

// User Management Actions
export async function getUsers(filters?: {
  status?: string
  role?: string
  search?: string
  limit?: number
  offset?: number
}) {
  const supabase = await createSupabaseServerClient()
  
  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.role) {
      query = query.eq('role', filters.role)
    }

    if (filters?.search) {
      query = query.or(`username.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

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
    console.error('Error fetching users:', error)
    return { data: null, count: 0, error: 'Failed to fetch users' }
  }
}

export async function updateUserStatus(userId: string, status: string) {
  const supabase = await createSupabaseServerClient()

  try {
    // Check if current user is admin
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

    const { error } = await supabase
      .from('profiles')
      .update({ 
        status,
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId)

    if (error) throw error

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
    // Check if current user is admin
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

    const { error } = await supabase
      .from('profiles')
      .update({ 
        role, 
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) throw error

    revalidatePath('/admin')
    return { success: true, error: null }
  } catch (error) {
    console.error('Error updating user role:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update user role' }
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