'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { prepareGiftNotificationData, sendGiftNotificationEmails } from '@/lib/email-notifications'

export type Order = {
  id: string
  user_id: string
  stripe_session_id: string
  status: 'pending' | 'completed' | 'failed'
  total_amount: number
  currency: string
  customer_email: string
  custom_message: string | null
  is_gift: boolean
  wishlist_owner_ids: string | null
  created_at: string
  updated_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  wishlist_item_id: string
  title: string
  description: string | null
  price: number
  quantity: number
  image_url: string | null
  created_at: string
}

// Create order record after successful payment
export async function createOrder(
  stripeSessionId: string,
  totalAmount: number,
  currency: string,
  customerEmail: string,
  customMessage: string | null,
  isGift: boolean,
  wishlistOwnerIds: string | null,
  items: Array<{
    wishlist_item_id: string
    title: string
    description: string | null
    price: number
    quantity: number
    image_url: string | null
  }>
) {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      stripe_session_id: stripeSessionId,
      status: 'completed',
      total_amount: totalAmount,
      currency,
      customer_email: customerEmail,
      custom_message: customMessage,
      is_gift: isGift,
      wishlist_owner_ids: wishlistOwnerIds,
      owner_id: isGift ? wishlistOwnerIds : user.id
    })
    .select()
    .single()

  if (orderError) {
    console.error('Error creating order:', orderError)
    throw new Error('Failed to create order')
  }

  // Create order items
  const orderItems = items.map(item => ({
    order_id: order.id,
    wishlist_item_id: item.wishlist_item_id,
    title: item.title,
    description: item.description,
    price: item.price,
    quantity: item.quantity,
    image_url: item.image_url
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    console.error('Error creating order items:', itemsError)
    throw new Error('Failed to create order items')
  }

  // Note: Items are no longer automatically marked as purchased
  // The wishlist owner can manually mark items as purchased in their dashboard

  // Send gift notification if it's a gift order
  if (isGift && wishlistOwnerIds) {
    try {
      await sendGiftNotification(
        order.id,
        wishlistOwnerIds,
        user.id,
        customerEmail.split('@')[0], // Use email prefix as sender name for now
        customMessage,
        items.map(item => ({
          title: item.title,
          price: item.price,
          image_url: item.image_url
        }))
      )
    } catch (notificationError) {
      console.error('Failed to send gift notification:', notificationError)
      // Don't throw error as order was created successfully
    }
  }

  // Revalidate multiple paths to ensure dashboard updates
  revalidatePath('/dashboard')
  revalidatePath('/dashboard?tab=history')
  revalidatePath('/dashboard?tab=analytics')
  
  return order
}

// Get user's orders
export async function getUserOrders(): Promise<Order[]> {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }

  return orders || []
}

// Get order with items
export async function getOrderWithItems(orderId: string): Promise<(Order & { items: OrderItem[] }) | null> {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (orderError || !order) {
    console.error('Error fetching order:', orderError)
    return null
  }

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)

  if (itemsError) {
    console.error('Error fetching order items:', itemsError)
    return { ...order, items: [] }
  }

  return { ...order, items: items || [] }
}

// Send gift notification to wishlist owner with proper database tracking
export async function sendGiftNotification(
  orderId: string,
  wishlistOwnerId: string,
  senderId: string,
  senderName: string,
  customMessage: string | null,
  items: Array<{ title: string; price: number; image_url: string | null }>
) {
  const supabase = await createSupabaseServerClient()
  
  // Get wishlist owner's profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('email, full_name, username')
    .eq('id', wishlistOwnerId)
    .single()

  if (error || !profile) {
    console.error('Error fetching wishlist owner profile:', error)
    throw new Error('Failed to get wishlist owner information')
  }

  try {
    // Create gift message if custom message provided
    if (customMessage) {
      const { error: messageError } = await supabase
        .from('gift_messages')
        .insert({
          order_id: orderId,
          sender_id: senderId,
          recipient_id: wishlistOwnerId,
          message: customMessage,
          is_private: false
        })

      if (messageError) {
        console.error('Error creating gift message:', messageError)
      }
    }

    // Create gift notification
    const { error: notificationError } = await supabase
      .from('gift_notifications')
      .insert({
        order_id: orderId,
        recipient_id: wishlistOwnerId,
        notification_type: 'gift_received',
        email_sent: false,
        is_read: false,
        metadata: {
          sender_name: senderName,
          items_count: items.length,
          total_items: items,
          has_custom_message: !!customMessage
        }
      })

    if (notificationError) {
      console.error('Error creating gift notification:', notificationError)
    }

    // Detailed logging for gift notification tracking [[memory:3315689]]
    console.log(`[GIFT_NOTIFICATION] Gift received notification created for order ${orderId}. Sender: ${senderName}, Recipient: ${profile.full_name || profile.username} (${profile.email}), Items: ${items.length}, Custom message: ${!!customMessage}`)

    // Send email notification using Resend
    try {
      const notificationData = await prepareGiftNotificationData(
        orderId,
        senderName,
        profile.email,
        customMessage || undefined
      )

      if (notificationData) {
        const emailResult = await sendGiftNotificationEmails(notificationData)
        
        if (emailResult.success) {
          console.log(`✅ Email notification sent successfully to ${profile.email}`)
          
          // Update notification record to mark email as sent
          await supabase
            .from('gift_notifications')
            .update({
              email_sent: true,
              email_sent_at: new Date().toISOString()
            })
            .eq('order_id', orderId)
            .eq('recipient_id', wishlistOwnerId)
        } else {
          console.error(`❌ Failed to send email notification: ${emailResult.error}`)
        }
      }
    } catch (emailError) {
      console.error('❌ Error sending email notification:', emailError)
      // Don't throw error as the main notification was created successfully
    }

    return { success: true }
  } catch (error) {
    console.error('Error in sendGiftNotification:', error)
    throw new Error('Failed to send gift notification')
  }
}

// Update order status
export async function updateOrderStatus(orderId: string, status: 'pending' | 'completed' | 'failed') {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating order status:', error)
    throw new Error('Failed to update order status')
  }

  revalidatePath('/dashboard')
  return { success: true }
} 