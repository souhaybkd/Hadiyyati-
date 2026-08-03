'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseServiceClient } from '@/lib/supabase-service'
import { createVeriffSession, splitFullName } from '@/lib/veriff'
import type { KycStatus } from '@/lib/types/database'
import { redirect } from 'next/navigation'

export interface UserKycInfo {
  kyc_status: KycStatus
  kyc_verified_at: string | null
  kyc_session_id: string | null
}

export async function getMyKycStatus(): Promise<UserKycInfo> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('kyc_status, kyc_verified_at, kyc_session_id')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching KYC status:', error)
    throw new Error('Failed to load verification status')
  }

  return {
    kyc_status: (data?.kyc_status as KycStatus) || 'unverified',
    kyc_verified_at: data?.kyc_verified_at ?? null,
    kyc_session_id: data?.kyc_session_id ?? null,
  }
}

/**
 * Creates a Veriff session for the logged-in user and returns the hosted URL
 * to redirect them to. Persists a pending kyc_verifications row.
 */
export async function startVeriffSession(): Promise<{ url: string }> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, email, kyc_status')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Error loading profile for Veriff:', profileError)
    throw new Error('Failed to load profile for verification')
  }

  if (profile?.kyc_status === 'approved') {
    throw new Error('Identity already verified')
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
  )
  const callback = `${siteUrl}/dashboard?tab=payouts&kyc=done`
  const { firstName, lastName } = splitFullName(profile?.full_name)
  const email = profile?.email || user.email || undefined

  const session = await createVeriffSession({
    callback,
    vendorData: user.id,
    firstName,
    lastName,
    email,
  })

  const service = createSupabaseServiceClient()
  const now = new Date().toISOString()

  const { error: insertError } = await service.from('kyc_verifications').insert({
    user_id: user.id,
    veriff_session_id: session.verification.id,
    status: 'created',
    vendor_data: user.id,
    created_at: now,
    updated_at: now,
  })

  if (insertError) {
    console.error('Error inserting kyc_verifications:', insertError)
    throw new Error('Failed to store verification session')
  }

  const { error: updateError } = await service
    .from('profiles')
    .update({
      kyc_status: 'pending',
      kyc_session_id: session.verification.id,
      updated_at: now,
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('Error updating profile KYC status:', updateError)
    throw new Error('Failed to update verification status')
  }

  return { url: session.verification.url }
}
