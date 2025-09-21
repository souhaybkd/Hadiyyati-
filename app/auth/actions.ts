'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function requestPasswordReset(email: string) {
  const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.rpc('user_exists', { requested_email: email })

    if (error || !data) {
        return { error: { message: 'This email is not registered.' } }
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password?redirectTo=/dashboard`,
    })

    return { error: resetError }
}

export async function logout() {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
        return { error: { message: 'Failed to logout.' } }
    }

    return { success: true }
} 