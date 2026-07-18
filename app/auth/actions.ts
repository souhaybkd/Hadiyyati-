'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseServiceClient } from '@/lib/supabase-service'

export async function requestPasswordReset(email: string) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Check if user exists by trying to find them in auth.users
    // Note: We can't directly query auth.users, so we'll just attempt the reset
    // Supabase will handle the case where the email doesn't exist
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/update-password?redirectTo=/dashboard`,
    })

    if (resetError) {
        // Don't reveal if email exists or not for security
        return { error: { message: 'If this email is registered, you will receive a password reset link.' } }
    }

    return { success: true }
  } catch (error) {
    console.error('Password reset error:', error)
    return { error: { message: 'Failed to send password reset email. Please try again.' } }
  }
}

export async function logout() {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
        return { error: { message: 'Failed to logout.' } }
    }

    return { success: true }
}

// Permanently deletes the current user's account and associated data.
export async function deleteAccount() {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: { message: 'You must be signed in to delete your account.' } }
    }

    const uid = user.id
    const service = createSupabaseServiceClient()

    try {
        // thank_you_notes has FK constraints with NO ACTION on delete, which would
        // block removing the profile, so clear those references first.
        await service
            .from('thank_you_notes')
            .delete()
            .or(`sender_id.eq.${uid},recipient_id.eq.${uid}`)

        // Deleting the profile cascades to wishlist_items and wishlist_views, and
        // nulls out references in orders / transactions / gift messages.
        const { error: profileError } = await service
            .from('profiles')
            .delete()
            .eq('id', uid)

        if (profileError) {
            console.error('Error deleting profile during account deletion:', profileError)
            return { error: { message: 'Failed to delete account. Please contact support.' } }
        }

        // Remove the authentication record (the actual login).
        const { error: authError } = await service.auth.admin.deleteUser(uid)
        if (authError) {
            console.error('Error deleting auth user during account deletion:', authError)
            return { error: { message: 'Failed to delete account. Please contact support.' } }
        }

        // End the current session.
        await supabase.auth.signOut()

        return { success: true }
    } catch (error) {
        console.error('Delete account error:', error)
        return { error: { message: 'Failed to delete account. Please contact support.' } }
    }
} 