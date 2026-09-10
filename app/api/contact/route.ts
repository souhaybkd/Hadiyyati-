import { NextRequest, NextResponse } from 'next/server'
import { isValidEmail, sendContactEmail } from '@/lib/resend'

function asString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const firstName = asString(body.firstName)
    const lastName = asString(body.lastName)
    const email = asString(body.email)
    const subject = asString(body.subject)
    const message = asString(body.message)
    const honeypot = asString(body.company)

    if (honeypot) {
      return NextResponse.json({ success: true })
    }

    if (!firstName || !lastName || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Please fill in all fields.' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email) || firstName.length > 80 || lastName.length > 80 || subject.length > 200 || message.length > 5000) {
      return NextResponse.json(
        { error: 'Please check your details and try again.' },
        { status: 400 }
      )
    }

    const result = await sendContactEmail({
      firstName,
      lastName,
      email,
      subject,
      message,
    })

    if (!result.success) {
      console.error('Contact form send failed:', result.error)
      return NextResponse.json(
        { error: 'Failed to send your message. Please email us directly.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Failed to send your message. Please email us directly.' },
      { status: 500 }
    )
  }
}
