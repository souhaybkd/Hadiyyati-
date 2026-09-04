import { Resend } from 'resend'

// Initialize Resend only when needed to avoid build-time errors
let resend: Resend | null = null

function getResend() {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

// Email configuration
export const EMAIL_CONFIG = {
  from: process.env.RESEND_FROM_EMAIL || 'hadiyyati <noreply@hadiyyati.com>',
  replyTo: process.env.RESEND_REPLY_TO_EMAIL || 'support@hadiyyati.com',
  domain: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
} as const

// Email types
export type EmailType = 'gift_notification' | 'gift_received' | 'thank_you_note' | 'order_update'

// Email sending function with error handling
export async function sendEmail({
  to,
  subject,
  react,
  type,
}: {
  to: string | string[]
  subject: string
  react: React.ReactElement
  type: EmailType
}) {
  try {
    console.log(`📧 Sending ${type} email to:`, to)
    
    const resendInstance = getResend()
    const result = await resendInstance.emails.send({
      from: EMAIL_CONFIG.from,
      to,
      subject,
      react,
      replyTo: EMAIL_CONFIG.replyTo,
    })

    console.log(`✅ Email sent successfully:`, result)
    return { success: true, data: result }
  } catch (error) {
    console.error(`❌ Failed to send ${type} email:`, error)
    return { success: false, error }
  }
}

const CONTACT_TO = process.env.CONTACT_TO_EMAIL || 'info@hadiyyati.me'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendContactEmail({
  firstName,
  lastName,
  email,
  subject,
  message,
}: {
  firstName: string
  lastName: string
  email: string
  subject: string
  message: string
}) {
  const name = `${firstName} ${lastName}`.trim()
  const html = `
    <div style="font-family: sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin: 0 0 16px;">New contact form message</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
    </div>
  `

  try {
    const resendInstance = getResend()
    const result = await resendInstance.emails.send({
      from: EMAIL_CONFIG.from,
      to: CONTACT_TO,
      replyTo: email,
      subject: `Contact form: ${subject}`,
      html,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
    })

    if (result.error) {
      console.error('❌ Failed to send contact email:', result.error)
      return { success: false, error: result.error }
    }

    return { success: true, data: result }
  } catch (error) {
    console.error('❌ Failed to send contact email:', error)
    return { success: false, error }
  }
}

// Utility function to validate email addresses
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Get email template data for different notification types
export function getEmailData(type: EmailType, data: any) {
  const baseUrl = EMAIL_CONFIG.domain
  
  switch (type) {
    case 'gift_notification':
      return {
        subject: `🎁 You've received a gift from ${data.senderName}!`,
        viewUrl: `${baseUrl}/dashboard?tab=history`,
      }
    case 'gift_received':
      return {
        subject: `🎉 Your gift to ${data.recipientName} has been delivered!`,
        viewUrl: `${baseUrl}/dashboard?tab=history`,
      }
    case 'thank_you_note':
      return {
        subject: `💝 ${data.senderName} sent you a thank you note!`,
        viewUrl: `${baseUrl}/dashboard?tab=history`,
      }
    case 'order_update':
      return {
        subject: `📦 Order Update: ${data.status}`,
        viewUrl: `${baseUrl}/dashboard?tab=history`,
      }
    default:
      return {
        subject: '📧 Notification from hadiyyati',
        viewUrl: `${baseUrl}/dashboard`,
      }
  }
}
