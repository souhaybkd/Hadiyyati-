import { createSupabaseServerClient } from '@/lib/supabase-server'

interface GiftNotificationData {
  orderId: string
  senderName: string
  senderEmail: string
  giftItems: Array<{
    title: string
    price: number
    image_url?: string
    description?: string
    quantity?: number
  }>
  giftMessage?: string
  totalAmount: number
  recipientIds: string[]
}

export async function sendGiftNotificationEmails(data: GiftNotificationData) {
  console.log('📧 Starting gift notification email process for order:', data.orderId)
  
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get recipient details
    const { data: recipients, error: recipientsError } = await supabase
      .from('profiles')
      .select('id, username, full_name, email')
      .in('id', data.recipientIds)

    if (recipientsError) {
      console.error('❌ Error fetching recipients:', recipientsError)
      throw new Error('Failed to fetch recipient details')
    }

    if (!recipients || recipients.length === 0) {
      console.log('⚠️ No recipients found for gift notification')
      return { success: false, error: 'No recipients found' }
    }

    console.log(`📧 Sending notifications to ${recipients.length} recipient(s)`)

    // Send email to each recipient
    const emailPromises = recipients.map(async (recipient) => {
      try {
        console.log(`📧 Sending notification to ${recipient.full_name} (${recipient.email})`)
        
        // Call our email API
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'gift_notification',
            recipientEmail: recipient.email,
            recipientName: recipient.full_name,
            senderName: data.senderName,
            giftItems: data.giftItems,
            giftMessage: data.giftMessage,
            totalAmount: data.totalAmount,
            orderId: data.orderId,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`Email API error: ${errorData.error}`)
        }

        const result = await response.json()
        console.log(`✅ Email sent successfully to ${recipient.email}:`, result.emailId)
        
        return {
          recipientId: recipient.id,
          recipientEmail: recipient.email,
          success: true,
          emailId: result.emailId,
        }
      } catch (error) {
        console.error(`❌ Failed to send email to ${recipient.email}:`, error)
        return {
          recipientId: recipient.id,
          recipientEmail: recipient.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    })

    const results = await Promise.all(emailPromises)
    
    // Count successful and failed emails
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)

    console.log(`📧 Email notification summary:`)
    console.log(`✅ Successful: ${successful.length}`)
    console.log(`❌ Failed: ${failed.length}`)

    if (failed.length > 0) {
      console.log('❌ Failed notifications:', failed.map(f => f.recipientEmail))
    }

    return {
      success: successful.length > 0,
      totalSent: successful.length,
      totalFailed: failed.length,
      results,
      error: failed.length === results.length ? 'All email notifications failed' : null,
    }

  } catch (error) {
    console.error('❌ Gift notification error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// Helper function to extract gift notification data from order
export async function prepareGiftNotificationData(
  orderId: string,
  senderName: string,
  senderEmail: string,
  customMessage?: string
): Promise<GiftNotificationData | null> {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get order with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('❌ Error fetching order:', orderError)
      return null
    }

    // Extract recipient IDs from wishlist_owner_ids
    const recipientIds = order.wishlist_owner_ids 
      ? order.wishlist_owner_ids.split(',').filter(Boolean)
      : []

    if (recipientIds.length === 0) {
      console.log('⚠️ No recipients found in order')
      return null
    }

    // Prepare gift items data
    const giftItems = (order.order_items || []).map((item: any) => ({
      title: item.title,
      price: parseFloat(item.price),
      image_url: item.image_url,
      description: item.description,
      quantity: item.quantity || 1,
    }))

    return {
      orderId,
      senderName,
      senderEmail,
      giftItems,
      giftMessage: customMessage || order.custom_message,
      totalAmount: parseFloat(order.total_amount),
      recipientIds,
    }
  } catch (error) {
    console.error('❌ Error preparing gift notification data:', error)
    return null
  }
}

// Function to send notification to specific recipients (for manual triggering)
export async function sendGiftNotificationToRecipients(
  orderId: string,
  recipientEmails: string[]
) {
  console.log('📧 Sending gift notifications to specific recipients:', recipientEmails)
  
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        buyer:profiles!orders_user_id_fkey(full_name, email)
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      throw new Error('Order not found')
    }

    // Get recipient details by email
    const { data: recipients, error: recipientsError } = await supabase
      .from('profiles')
      .select('id, username, full_name, email')
      .in('email', recipientEmails)

    if (recipientsError || !recipients) {
      throw new Error('Recipients not found')
    }

    const notificationData: GiftNotificationData = {
      orderId,
      senderName: order.buyer?.full_name || 'Anonymous',
      senderEmail: order.buyer?.email || order.customer_email,
      giftItems: order.order_items.map((item: any) => ({
        title: item.title,
        price: parseFloat(item.price),
        image_url: item.image_url,
        description: item.description,
        quantity: item.quantity || 1,
      })),
      giftMessage: order.custom_message,
      totalAmount: parseFloat(order.total_amount),
      recipientIds: recipients.map(r => r.id),
    }

    return await sendGiftNotificationEmails(notificationData)
  } catch (error) {
    console.error('❌ Error sending gift notifications:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
