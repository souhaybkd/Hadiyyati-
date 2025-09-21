import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { sendEmail, getEmailData, isValidEmail, type EmailType } from '@/lib/resend'
import { render } from '@react-email/render'
import GiftNotificationEmail from '@/emails/GiftNotificationEmail'

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Email notification API called')
    
    // Parse request body
    const body = await request.json()
    const { 
      type, 
      recipientEmail, 
      recipientName, 
      senderName, 
      giftItems, 
      giftMessage, 
      totalAmount,
      orderId 
    } = body

    console.log('📧 Email request data:', {
      type,
      recipientEmail,
      recipientName,
      senderName,
      itemCount: giftItems?.length,
      totalAmount,
      orderId
    })

    // Validate required fields
    if (!type || !recipientEmail || !recipientName) {
      return NextResponse.json(
        { error: 'Missing required fields: type, recipientEmail, recipientName' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!isValidEmail(recipientEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate email type
    const validTypes: EmailType[] = ['gift_notification', 'gift_received', 'thank_you_note', 'order_update']
    if (!validTypes.includes(type as EmailType)) {
      return NextResponse.json(
        { error: 'Invalid email type' },
        { status: 400 }
      )
    }

    // Get email configuration based on type
    const emailData = getEmailData(type as EmailType, {
      senderName,
      recipientName,
      status: body.status,
    })

    let emailComponent: React.ReactElement
    let subject = emailData.subject

    // Generate email component based on type
    switch (type) {
      case 'gift_notification':
        if (!senderName || !giftItems || !totalAmount) {
          return NextResponse.json(
            { error: 'Missing required fields for gift notification' },
            { status: 400 }
          )
        }
        
        emailComponent = GiftNotificationEmail({
          recipientName,
          senderName,
          giftItems,
          giftMessage,
          totalAmount,
          viewGiftUrl: emailData.viewUrl,
        })
        break

      default:
        return NextResponse.json(
          { error: 'Email type not implemented yet' },
          { status: 400 }
        )
    }

    // Send email using Resend
    const result = await sendEmail({
      to: recipientEmail,
      subject,
      react: emailComponent,
      type: type as EmailType,
    })

    if (!result.success) {
      console.error('❌ Failed to send email:', result.error)
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      )
    }

    // Log email notification in database
    if (orderId) {
      try {
        const supabase = await createSupabaseServerClient()
        
        // Find recipient by email
        const { data: recipient } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', recipientEmail)
          .single()

        if (recipient) {
          // Create gift notification record
          await supabase
            .from('gift_notifications')
            .insert({
              order_id: orderId,
              recipient_id: recipient.id,
              notification_type: type,
              email_sent: true,
              email_sent_at: new Date().toISOString(),
              metadata: {
                sender_name: senderName,
                email_id: result.data?.data?.id,
                subject,
                recipient_email: recipientEmail,
              },
            })

          console.log('✅ Gift notification logged in database')
        }
      } catch (dbError) {
        console.error('⚠️ Failed to log notification in database:', dbError)
        // Don't fail the API call if database logging fails
      }
    }

    console.log('✅ Email sent successfully:', result.data?.data?.id)
    
    return NextResponse.json({
      success: true,
      emailId: result.data?.data?.id,
      message: 'Email sent successfully',
    })

  } catch (error) {
    console.error('❌ Email API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Email Notification API',
    timestamp: new Date().toISOString(),
  })
}
