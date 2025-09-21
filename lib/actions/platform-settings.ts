'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export interface PlatformSetting {
  id: string
  setting_key: string
  setting_value: any
  description: string | null
  created_at: string
  updated_at: string
}

// Get platform fee percentage (cached for performance)
export async function getPlatformFeePercentage(): Promise<number> {
  const supabase = await createSupabaseServerClient()
  
  const { data, error } = await supabase
    .from('platform_settings')
    .select('setting_value')
    .eq('setting_key', 'platform_fee_percentage')
    .single()

  if (error || !data) {
    console.error('Error fetching platform fee percentage:', error)
    return 10 // Default to 10%
  }

  return data.setting_value?.value || 10
}

// Calculate expected payout for a given price
export async function calculateExpectedPayout(price: number): Promise<number> {
  const feePercentage = await getPlatformFeePercentage()
  return price * (1 - (feePercentage / 100))
}

// Admin function to update platform fee percentage
export async function updatePlatformFeePercentage(percentage: number) {
  const supabase = await createSupabaseServerClient()
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }

  // Validate percentage
  if (percentage < 0 || percentage > 50) {
    throw new Error('Platform fee percentage must be between 0% and 50%')
  }

  // Update the setting
  const { error } = await supabase
    .from('platform_settings')
    .update({
      setting_value: { value: percentage },
      updated_at: new Date().toISOString()
    })
    .eq('setting_key', 'platform_fee_percentage')

  if (error) {
    console.error('Error updating platform fee percentage:', error)
    throw new Error('Failed to update platform fee percentage')
  }

  // Trigger recalculation of all expected payouts
  const { error: updateError } = await supabase.rpc('recalculate_all_expected_payouts')
  
  if (updateError) {
    console.error('Error recalculating expected payouts:', updateError)
    // Don't throw error as the main update was successful
  }

  // Revalidate admin pages
  revalidatePath('/admin')
  revalidatePath('/dashboard')
  
  return { success: true }
}

// Get all platform settings (admin only)
export async function getAllPlatformSettings(): Promise<PlatformSetting[]> {
  const supabase = await createSupabaseServerClient()
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }

  const { data, error } = await supabase
    .from('platform_settings')
    .select('*')
    .order('setting_key')

  if (error) {
    console.error('Error fetching platform settings:', error)
    throw new Error('Failed to fetch platform settings')
  }

  return data || []
}

// Create SQL function to recalculate all expected payouts (to be run after percentage change)
export async function createRecalculateFunction() {
  const supabase = await createSupabaseServerClient()
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE OR REPLACE FUNCTION recalculate_all_expected_payouts()
      RETURNS void AS $$
      BEGIN
        UPDATE wishlist_items 
        SET expected_payout = calculate_expected_payout(price);
      END;
      $$ LANGUAGE plpgsql;
    `
  })

  if (error) {
    console.error('Error creating recalculate function:', error)
  }
}
