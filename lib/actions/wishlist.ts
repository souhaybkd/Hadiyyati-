'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseServiceClient } from '@/lib/supabase-service'
import { revalidatePath } from 'next/cache'
import { deleteStorageFile, extractFilePathFromUrl, extractBackgroundFilePathFromUrl } from '@/lib/supabase-admin'

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  // Sensitive/internal fields — omitted from public wishlist responses.
  email?: string;
  role?: 'user' | 'admin';
  avatar_url: string | null;
  background_image_url: string | null;
  wishlist_color_palette: string | null;
  wishlist_description: string | null;
  created_at: string;
  updated_at: string;
};

export type WishlistItem = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  product_url: string | null;
  is_public: boolean;
  is_purchased: boolean;
  purchased_by: string | null;
  created_at: string;
  updated_at: string;
  sort_order: number | null;
}

export type WishlistWithProfile = {
  profile: Profile;
  items: WishlistItem[];
}

function sortWishlistItems(items: WishlistItem[]): WishlistItem[] {
  return [...items].sort((a, b) => {
    const aOrder = a.sort_order
    const bOrder = b.sort_order
    if (aOrder == null && bOrder == null) {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }
    if (aOrder == null) return 1
    if (bOrder == null) return -1
    if (aOrder !== bOrder) return aOrder - bOrder
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })
}

async function revalidateOwnerWishlist(userId: string) {
  try {
    revalidatePath('/dashboard')
    revalidatePath('/wishlist', 'layout')
  } catch (error) {
    console.error('Failed to revalidate dashboard/wishlist layout:', error)
  }

  try {
    const admin = createSupabaseServiceClient()
    const { data } = await admin
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .maybeSingle()

    if (data?.username) {
      revalidatePath(`/wishlist/${data.username}`)
    }
  } catch (error) {
    console.error('Failed to revalidate public wishlist path:', error)
  }
}

// Get current user's wishlist items
export async function getUserWishlistItems(): Promise<WishlistItem[]> {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: items, error } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching wishlist items:', error)
    return []
  }

  return sortWishlistItems(items || [])
}

// Get current user's profile
export async function getUserProfile(): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  console.log('getUserProfile: Fetching profile for user:', user.id)

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    
    // If profile doesn't exist, create it
    if (error.code === 'PGRST116') { // No rows returned
      console.log('getUserProfile: Profile not found, creating new profile...')
      
      try {
        // Extract info from user metadata or use defaults
        const userData = user.user_metadata || {}
        const email = user.email || ''
        const fullName = userData.full_name || userData.name || email.split('@')[0] || 'User'
        const username = userData.preferred_username || 
                        email.split('@')[0] || 
                        `user${Math.random().toString(36).substring(2, 8)}`

        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: username,
            full_name: fullName,
            email: email,
            avatar_url: userData.avatar_url || null,
            role: 'user'
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error creating profile:', insertError)
          
          // If username conflict, try with a random suffix
          if (insertError.code === '23505') { // Unique constraint violation
            const randomUsername = `${username}_${Math.random().toString(36).substring(2, 8)}`
            console.log('Username conflict, trying with random suffix:', randomUsername)
            
            const { data: retryProfile, error: retryError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                username: randomUsername,
                full_name: fullName,
                email: email,
                avatar_url: userData.avatar_url || null,
                role: 'user'
              })
              .select()
              .single()

            if (retryError) {
              console.error('Error creating profile with random username:', retryError)
              return null
            }
            
            console.log('Profile created successfully with random username')
            return retryProfile
          }
          
          return null
        }

        console.log('Profile created successfully')
        return newProfile
      } catch (createError) {
        console.error('Unexpected error creating profile:', createError)
        return null
      }
    }
    
    return null
  }

  console.log('getUserProfile: Profile found')
  return profile
}

// Columns that are safe to expose on public wishlist pages.
// NOTE: never include `email`, `role` or `status` here — these are returned to
// unauthenticated visitors and would leak PII / internal fields.
const PUBLIC_PROFILE_COLUMNS =
  'id, username, full_name, avatar_url, background_image_url, wishlist_color_palette, wishlist_description, created_at, updated_at'

// Get public wishlist by user_id (for public sharing)
export async function getPublicWishlist(userId: string): Promise<WishlistWithProfile | null> {
  // Public pages are viewed by anonymous visitors and other users, who are not
  // allowed to read profile rows directly under RLS. Use the service client and
  // return only the explicitly whitelisted, non-sensitive columns.
  const supabase = createSupabaseServiceClient()
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(PUBLIC_PROFILE_COLUMNS)
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError)
    return null
  }

  const { data: items, error: itemsError } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('user_id', userId)
    .eq('is_public', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (itemsError) {
    console.error('Error fetching wishlist items:', itemsError)
    return { profile, items: [] }
  }

  return { profile, items: sortWishlistItems(items || []) }
}

// Get public wishlist by username
export async function getPublicWishlistByUsername(username: string): Promise<WishlistWithProfile | null> {
  // See getPublicWishlist: public visitors can't read profiles under RLS, so use
  // the service client and expose only the whitelisted public columns.
  const supabase = createSupabaseServiceClient()
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(PUBLIC_PROFILE_COLUMNS)
    .eq('username', username)
    .single()

  if (profileError || !profile) {
    console.error('Error fetching profile by username:', profileError)
    return null
  }

  const { data: items, error: itemsError } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('user_id', profile.id)
    .eq('is_public', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (itemsError) {
    console.error('Error fetching wishlist items:', itemsError)
    return { profile, items: [] }
  }

  return { profile, items: sortWishlistItems(items || []) }
}

// Add new wishlist item
export async function addWishlistItem(formData: FormData) {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const product_url = formData.get('product_url') as string
  const image_url = formData.get('image_url') as string
  const price = formData.get('price') as string
  const is_public = formData.get('is_public') === 'true'

  if (!title || !price) {
    throw new Error('Title and price are required')
  }

  const { data: lastItem } = await supabase
    .from('wishlist_items')
    .select('sort_order')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  const nextSortOrder = (lastItem?.sort_order ?? -1) + 1

  const { error } = await supabase
    .from('wishlist_items')
    .insert({
      user_id: user.id,
      title,
      description: description || null,
      product_url: product_url || null,
      image_url: image_url || null,
      price: parseFloat(price),
      is_public,
      sort_order: nextSortOrder
    })

  if (error) {
    console.error('Error adding wishlist item:', error)
    throw new Error('Failed to add item')
  }

  await revalidateOwnerWishlist(user.id)
  return { success: true }
}

// Update wishlist item
export async function updateWishlistItem(itemId: string, formData: FormData) {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const product_url = formData.get('product_url') as string
  const image_url = formData.get('image_url') as string
  const price = formData.get('price') as string
  const is_public = formData.get('is_public') === 'true'

  if (!title || !price) {
    throw new Error('Title and price are required')
  }

  // Verify the item belongs to the user
  const { data: item } = await supabase
    .from('wishlist_items')
    .select('user_id')
    .eq('id', itemId)
    .single()

  if (!item || item.user_id !== user.id) {
    throw new Error('Item not found or unauthorized')
  }

  const { error } = await supabase
    .from('wishlist_items')
    .update({
      title,
      description: description || null,
      product_url: product_url || null,
      image_url: image_url || null,
      price: parseFloat(price),
      is_public
    })
    .eq('id', itemId)

  if (error) {
    console.error('Error updating wishlist item:', error)
    throw new Error('Failed to update item')
  }

  await revalidateOwnerWishlist(user.id)
  return { success: true }
}

// Update wishlist items order
export async function updateWishlistOrder(items: { id: string, sort_order: number }[]) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User not authenticated');
    }

    if (!items.length) {
        return { success: true }
    }

    const uniqueIds = new Set(items.map((item) => item.id))
    if (uniqueIds.size !== items.length) {
        throw new Error('Failed to update item order')
    }

    const { data: owned, error: ownedError } = await supabase
        .from('wishlist_items')
        .select('id')
        .eq('user_id', user.id)

    if (ownedError) {
        console.error('Error verifying wishlist items:', ownedError)
        throw new Error('Failed to update item order')
    }

    const ownedIds = new Set((owned || []).map((row) => row.id))
    if (items.some((item) => !ownedIds.has(item.id))) {
        throw new Error('Item not found or unauthorized')
    }

    // Sequential writes: parallel updates can race and leave a stale order.
    for (const item of items) {
        const { data, error } = await supabase
            .from('wishlist_items')
            .update({ sort_order: item.sort_order })
            .eq('id', item.id)
            .eq('user_id', user.id)
            .select('id')

        if (error || !data?.length) {
            console.error('Error updating item order:', error)
            throw new Error('Failed to update item order')
        }
    }

    await revalidateOwnerWishlist(user.id)
    return { success: true };
}

async function unlinkWishlistItemReferences(itemId: string) {
  try {
    const admin = createSupabaseServiceClient()
    await admin.from('order_items').update({ wishlist_item_id: null }).eq('wishlist_item_id', itemId)
    await admin.from('transactions').update({ wishlist_item_id: null }).eq('wishlist_item_id', itemId)
  } catch (error) {
    console.error('Could not unlink wishlist item references:', error)
  }
}

async function deleteProductImage(imageUrl: string | null) {
  if (!imageUrl || !imageUrl.includes('/product-images/')) return
  try {
    const path = decodeURIComponent(imageUrl.split('/product-images/')[1]?.split('?')[0] || '')
    if (path) {
      await deleteStorageFile('product-images', path)
    }
  } catch (error) {
    console.error('Could not delete product image:', error)
  }
}

// Delete wishlist item
export async function deleteWishlistItem(itemId: string) {
  if (!itemId) {
    throw new Error('Item not found')
  }

  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: item, error: fetchError } = await supabase
    .from('wishlist_items')
    .select('id, user_id, image_url')
    .eq('id', itemId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchError) {
    console.error('Error loading wishlist item for delete:', fetchError)
    throw new Error('Failed to delete item')
  }

  if (!item) {
    throw new Error('Item not found or unauthorized')
  }

  let { data: deletedRows, error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', user.id)
    .select('id')

  if (error?.code === '23503') {
    await unlinkWishlistItemReferences(itemId)
    const retry = await supabase
      .from('wishlist_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', user.id)
      .select('id')
    deletedRows = retry.data
    error = retry.error
  }

  if (error) {
    console.error('Error deleting wishlist item:', error)
    throw new Error('Failed to delete item')
  }

  if (!deletedRows?.length) {
    throw new Error('Failed to delete item')
  }

  await deleteProductImage(item.image_url)

  await revalidateOwnerWishlist(user.id)
  return { success: true }
}

// Toggle item as purchased/gifted (manual toggle by wishlist owner)
export async function toggleItemPurchased(itemId: string, isPurchased: boolean, purchasedBy?: string) {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Verify the item belongs to the user
  const { data: item } = await supabase
    .from('wishlist_items')
    .select('user_id')
    .eq('id', itemId)
    .single()

  if (!item || item.user_id !== user.id) {
    throw new Error('Item not found or unauthorized')
  }

  const { error } = await supabase
    .from('wishlist_items')
    .update({ 
      is_purchased: isPurchased,
      purchased_by: isPurchased ? (purchasedBy || null) : null
    })
    .eq('id', itemId)

  if (error) {
    console.error('Error toggling item purchased status:', error)
    throw new Error('Failed to update item')
  }

  await revalidateOwnerWishlist(user.id)
  return { success: true }
}

// Toggle item public status
export async function toggleItemPublic(itemId: string, isPublic: boolean) {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Verify the item belongs to the user
  const { data: item } = await supabase
    .from('wishlist_items')
    .select('user_id')
    .eq('id', itemId)
    .single()

  if (!item || item.user_id !== user.id) {
    throw new Error('Item not found or unauthorized')
  }

  const { error } = await supabase
    .from('wishlist_items')
    .update({ is_public: isPublic })
    .eq('id', itemId)

  if (error) {
    console.error('Error toggling item public status:', error)
    throw new Error('Failed to update item')
  }

  await revalidateOwnerWishlist(user.id)
  return { success: true }
}

export type ProfileUpdateResult = {
  success: boolean
  error?: string
  message?: string
}

function profileUpdateErrorMessage(error: unknown): string {
  if (!(error instanceof Error) || !error.message) {
    return 'Failed to update your profile. Please try again.'
  }
  if (error.message.includes('Server Components render') || error.message.includes('digest')) {
    return 'Failed to update your profile. Please try again.'
  }
  return error.message
}

async function isUsernameTaken(username: string, userId: string): Promise<boolean | null> {
  const supabase = await createSupabaseServerClient()
  const { data: rpcAvailable, error: rpcError } = await supabase
    .rpc('is_username_available', { check_username: username })

  if (!rpcError) {
    return rpcAvailable === false
  }

  console.warn('is_username_available RPC failed, falling back to service lookup:', rpcError)
  try {
    const admin = createSupabaseServiceClient()
    const { data, error } = await admin
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .neq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Username fallback lookup failed:', error)
      return null
    }
    return !!data
  } catch (error) {
    console.error('Username fallback lookup failed:', error)
    return null
  }
}

// Update profile settings
export async function updateProfile(formData: FormData): Promise<ProfileUpdateResult> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Please log in again to save your profile.' }
    }

    const username = String(formData.get('username') || '').trim()
    const fullName = String(formData.get('full_name') || '').trim()
    const wishlistColorPalette = String(formData.get('wishlist_color_palette') || 'default').trim() || 'default'
    const wishlistDescription = String(formData.get('wishlist_description') || '').trim()
    const sentAvatar = formData.has('avatar_url')
    const sentBackground = formData.has('background_image_url')
    const newAvatarUrl = sentAvatar ? String(formData.get('avatar_url') || '') : null
    const newBackgroundUrl = sentBackground ? String(formData.get('background_image_url') || '') : null

    if (!username || !fullName) {
      return { success: false, error: 'Username and full name are required' }
    }

    const nextUsername = username.toLowerCase()
    const usernameRegex = /^[a-zA-Z0-9_-]+$/

    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('username, avatar_url, background_image_url')
      .eq('id', user.id)
      .single()

    if (fetchError || !currentProfile) {
      console.error('Error fetching current profile:', fetchError)
      return { success: false, error: 'Could not retrieve your current profile information.' }
    }

    if (currentProfile.username !== nextUsername) {
      if (!usernameRegex.test(nextUsername)) {
        return { success: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' }
      }

      const taken = await isUsernameTaken(nextUsername, user.id)
      if (taken === true) {
        return { success: false, error: 'This username is already taken. Please choose another one.' }
      }
    }

    const updateData: Record<string, string | null> = {
      username: nextUsername,
      full_name: fullName,
      wishlist_color_palette: wishlistColorPalette,
      wishlist_description: wishlistDescription || null,
      updated_at: new Date().toISOString(),
    }

    const oldAvatarUrl = currentProfile.avatar_url
    let avatarUpdated = false
    if (sentAvatar && newAvatarUrl && newAvatarUrl !== oldAvatarUrl) {
      avatarUpdated = true
      updateData.avatar_url = newAvatarUrl
    }

    const oldBackgroundUrl = currentProfile.background_image_url
    if (sentBackground && newBackgroundUrl !== (oldBackgroundUrl || '')) {
      updateData.background_image_url = newBackgroundUrl || null
    }

    let writer = supabase
    try {
      writer = createSupabaseServiceClient()
    } catch (error) {
      console.warn('Service client unavailable for profile update, using user session:', error)
    }

    const { error: updateError } = await writer
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      if (updateError.code === '23505') {
        return { success: false, error: 'This username is already taken. Please choose another one.' }
      }
      return { success: false, error: 'Failed to update your profile. Please try again.' }
    }

    if (avatarUpdated && oldAvatarUrl && !oldAvatarUrl.startsWith('icon:') && !oldAvatarUrl.startsWith('data:')) {
      const oldFilePath = extractFilePathFromUrl(oldAvatarUrl)
      if (oldFilePath) {
        void deleteStorageFile('profile-images', oldFilePath)
      }
    }

    if (sentBackground && oldBackgroundUrl && oldBackgroundUrl !== (newBackgroundUrl || '') && !oldBackgroundUrl.startsWith('data:')) {
      const oldFilePath = extractBackgroundFilePathFromUrl(oldBackgroundUrl)
      if (oldFilePath) {
        void deleteStorageFile('background-images', oldFilePath)
      }
    }

    await revalidateOwnerWishlist(user.id)
    if (currentProfile.username && currentProfile.username !== nextUsername) {
      try {
        revalidatePath(`/wishlist/${currentProfile.username}`)
      } catch (error) {
        console.error('Failed to revalidate previous wishlist URL:', error)
      }
    }

    return {
      success: true,
      message: avatarUpdated ? 'Profile and avatar updated successfully!' : 'Profile updated successfully!',
    }
  } catch (error) {
    console.error('Profile update error:', error)
    return { success: false, error: profileUpdateErrorMessage(error) }
  }
} 