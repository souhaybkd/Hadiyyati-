import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { recipientEmail } = await request.json()
    
    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'recipientEmail is required' },
        { status: 400 }
      )
    }

    // Test email data
    const testEmailData = {
      type: 'gift_notification',
      recipientEmail,
      recipientName: 'Test User',
      senderName: 'Test Sender',
      giftItems: [
        {
          title: 'Wireless Bluetooth Headphones',
          price: 99.99,
          image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
          description: 'Premium wireless headphones with noise cancellation',
        },
        {
          title: 'Smart Watch',
          price: 199.99,
          image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
          description: 'Feature-rich smartwatch with fitness tracking',
        },
      ],
      giftMessage: 'Happy Birthday! Hope you love these gifts. Enjoy! 🎉',
      totalAmount: 299.98,
      orderId: 'test_order_' + Date.now(),
    }

    // Call the send-email API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEmailData),
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to send test email', details: result },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${recipientEmail}`,
      emailId: result.emailId,
    })

  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test Email API',
    usage: 'POST with { "recipientEmail": "test@example.com" } to send a test gift notification email',
    example: {
      method: 'POST',
      body: {
        recipientEmail: 'test@example.com'
      }
    }
  })
}
