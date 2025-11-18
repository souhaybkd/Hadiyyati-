'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'

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