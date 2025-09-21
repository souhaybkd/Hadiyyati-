'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { 
  PayoutSettings, 
  PayoutDetails,
  BankTransferDetails,
  WesternUnionDetails,
  MobileMoneyDetails
} from '@/lib/types/database'

export async function getUserPayoutSettings(): Promise<PayoutSettings | null> {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth')
  }

  const { data, error } = await supabase
    .from('payout_settings')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No payout settings found, return null
      return null
    }
    console.error('Error fetching payout settings:', error)
    throw new Error('Failed to fetch payout settings')
  }

  return data as PayoutSettings
}

export async function savePayoutSettings(formData: FormData) {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth')
  }

  try {
    const payoutMethod = formData.get('payout_method') as string
    
    // Validate payout method
    if (!['bank', 'western_union', 'taptap', 'whish'].includes(payoutMethod)) {
      throw new Error('Invalid payout method')
    }

    // Extract details based on payout method
    let payoutDetails: PayoutDetails

    switch (payoutMethod) {
      case 'bank':
        const iban = formData.get('iban') as string
        const accountName = formData.get('accountName') as string
        
        if (!iban || !accountName) {
          throw new Error('IBAN and Account Name are required for bank transfer')
        }
        
        payoutDetails = {
          iban: iban.trim(),
          accountName: accountName.trim()
        } as BankTransferDetails
        break

      case 'western_union':
        const fullName = formData.get('fullName') as string
        const country = formData.get('country') as string
        const phoneNumber = formData.get('phoneNumber') as string
        
        if (!fullName || !country || !phoneNumber) {
          throw new Error('Full Name, Country, and Phone Number are required for Western Union')
        }
        
        payoutDetails = {
          fullName: fullName.trim(),
          country: country.trim(),
          phoneNumber: phoneNumber.trim()
        } as WesternUnionDetails
        break

      case 'taptap':
      case 'whish':
        const mobileMoneyNumber = formData.get('mobileMoneyNumber') as string
        
        if (!mobileMoneyNumber) {
          throw new Error('Mobile Money Number is required')
        }
        
        payoutDetails = {
          mobileMoneyNumber: mobileMoneyNumber.trim()
        } as MobileMoneyDetails
        break

      default:
        throw new Error('Invalid payout method')
    }

    // First, deactivate any existing payout settings
    await supabase
      .from('payout_settings')
      .update({ is_active: false })
      .eq('user_id', user.id)

    // Insert new payout settings
    const { error: insertError } = await supabase
      .from('payout_settings')
      .insert({
        user_id: user.id,
        payout_method: payoutMethod,
        payout_details: payoutDetails,
        is_active: true
      })

    if (insertError) {
      console.error('Error saving payout settings:', insertError)
      throw new Error('Failed to save payout settings')
    }

    revalidatePath('/dashboard')
    return { success: true }

  } catch (error) {
    console.error('Error in savePayoutSettings:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to save payout settings')
  }
}

export async function deletePayoutSettings() {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth')
  }

  try {
    const { error } = await supabase
      .from('payout_settings')
      .update({ is_active: false })
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting payout settings:', error)
      throw new Error('Failed to delete payout settings')
    }

    revalidatePath('/dashboard')
    return { success: true }

  } catch (error) {
    console.error('Error in deletePayoutSettings:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to delete payout settings')
  }
}
