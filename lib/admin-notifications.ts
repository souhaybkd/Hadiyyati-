// Server-only: uses the Supabase service role. Never import from client code.
import { createSupabaseServiceClient } from '@/lib/supabase-service'
import { getEmailSiteUrl } from '@/lib/email-brand'
import { sendAdminNotificationEmail } from '@/lib/resend'

// Only notify for accounts created recently, so replaying the call for an old
// user id can't trigger emails.
const NEW_SIGNUP_WINDOW_MS = 60 * 60 * 1000

/**
 * Email the admin inbox about a newly registered user.
 * Safe to call more than once per user: an app_metadata flag ensures the
 * email goes out only once (email/password signup, email confirmation and
 * Google OAuth callback all call this).
 */
export async function notifyAdminOfNewSignup(userId: string): Promise<void> {
  try {
    if (!userId) return
    const service = createSupabaseServiceClient()
    const { data, error } = await service.auth.admin.getUserById(userId)
    const user = data?.user
    if (error || !user) return

    if (user.app_metadata?.admin_signup_notified) return

    const createdAt = new Date(user.created_at).getTime()
    if (!Number.isFinite(createdAt) || Date.now() - createdAt > NEW_SIGNUP_WINDOW_MS) return

    // Mark first so concurrent calls don't double-send.
    const { error: flagError } = await service.auth.admin.updateUserById(userId, {
      app_metadata: { ...user.app_metadata, admin_signup_notified: true },
    })
    if (flagError) {
      console.error('Admin signup notification: failed to set flag', flagError)
      return
    }

    const meta = user.user_metadata || {}
    const provider = user.app_metadata?.provider || 'email'

    await sendAdminNotificationEmail({
      subject: `New user signed up: ${user.email ?? userId}`,
      heading: 'New user sign-up',
      rows: [
        ['Name', meta.full_name || meta.name || '—'],
        ['Username', meta.preferred_username || '—'],
        ['Email', user.email || '—'],
        ['Sign-up method', provider],
        ['Email confirmed', user.email_confirmed_at ? 'Yes' : 'Not yet'],
        ['Signed up at', new Date(user.created_at).toUTCString()],
        ['User ID', user.id],
      ],
      link: { label: 'Open admin dashboard', href: `${getEmailSiteUrl()}/admin` },
    })
  } catch (error) {
    console.error('Admin signup notification failed:', error)
  }
}

/** Email the admin inbox when a user starts identity (KYC) verification. */
export async function notifyAdminOfKycStart({
  userId,
  email,
  fullName,
  sessionId,
}: {
  userId: string
  email?: string | null
  fullName?: string | null
  sessionId: string
}): Promise<void> {
  try {
    await sendAdminNotificationEmail({
      subject: `KYC verification started: ${email || userId}`,
      heading: 'User started KYC verification',
      rows: [
        ['Name', fullName || '—'],
        ['Email', email || '—'],
        ['User ID', userId],
        ['Veriff session ID', sessionId],
        ['Started at', new Date().toUTCString()],
      ],
      link: { label: 'Open admin dashboard', href: `${getEmailSiteUrl()}/admin` },
    })
  } catch (error) {
    console.error('Admin KYC notification failed:', error)
  }
}
