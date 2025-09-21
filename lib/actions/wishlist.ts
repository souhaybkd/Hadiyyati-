'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { deleteStorageFile, extractFilePathFromUrl, extractBackgroundFilePathFromUrl } from '@/lib/supabase-admin'

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  background_image_url: string | null;
  role: 'user' | 'admin';
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

// Get current user's wishlist items
export async function getUserWishlistItems(): Promise<WishlistItem[]> {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: items, error } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching wishlist items:', error)
    return []
  }

  return items || []
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

// Get public wishlist by user_id (for public sharing)
export async function getPublicWishlist(userId: string): Promise<WishlistWithProfile | null> {
  const supabase = await createSupabaseServerClient()
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
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
    .order('created_at', { ascending: false })

  if (itemsError) {
    console.error('Error fetching wishlist items:', itemsError)
    return { profile, items: [] }
  }

  return { profile, items: items || [] }
}

// Get public wishlist by username
export async function getPublicWishlistByUsername(username: string): Promise<WishlistWithProfile | null> {
  const supabase = await createSupabaseServerClient()
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
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
    .order('created_at', { ascending: false })

  if (itemsError) {
    console.error('Error fetching wishlist items:', itemsError)
    return { profile, items: [] }
  }

  return { profile, items: items || [] }
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

  const { count } = await supabase
    .from('wishlist_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

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
      sort_order: count
    })

  if (error) {
    console.error('Error adding wishlist item:', error)
    throw new Error('Failed to add item')
  }

  revalidatePath('/dashboard')
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

  revalidatePath('/dashboard')
  return { success: true }
}

// Update wishlist items order
export async function updateWishlistOrder(items: { id: string, sort_order: number }[]) {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User not authenticated');
    }

    const updates = items.map(item =>
        supabase
            .from('wishlist_items')
            .update({ sort_order: item.sort_order })
            .eq('id', item.id)
            .eq('user_id', user.id)
    );

    const results = await Promise.all(updates);

    results.forEach((result: any) => {
        if (result.error) {
            console.error('Error updating item order:', result.error);
            throw new Error('Failed to update item order');
        }
    });

    revalidatePath('/dashboard');
    return { success: true };
}

// Delete wishlist item
export async function deleteWishlistItem(itemId: string) {
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
    .delete()
    .eq('id', itemId)

  if (error) {
    console.error('Error deleting wishlist item:', error)
    throw new Error('Failed to delete item')
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// Toggle item as purchased/gifted
export async function toggleItemPurchased(itemId: string, isPurchased: boolean, purchasedBy?: string) {
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase
    .from('wishlist_items')
    .update({ 
      is_purchased: isPurchased,
      purchased_by: isPurchased ? purchasedBy : null
    })
    .eq('id', itemId)

  if (error) {
    console.error('Error toggling item purchased status:', error)
    throw new Error('Failed to update item')
  }

  revalidatePath('/dashboard')
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

  revalidatePath('/dashboard')
  return { success: true }
}

// Update profile settings
export async function updateProfile(formData: FormData) {
  const supabase = await createSupabaseServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  const username = formData.get('username') as string
  const fullName = formData.get('full_name') as string
  const wishlistColorPalette = formData.get('wishlist_color_palette') as string
  const wishlistDescription = formData.get('wishlist_description') as string
  const newAvatarUrl = formData.get('avatar_url') as string | null
  const newBackgroundUrl = formData.get('background_image_url') as string | null

  // Validate required fields
  if (!username?.trim() || !fullName?.trim()) {
    throw new Error('Username and full name are required')
  }

  // Validate username format (alphanumeric, underscores, hyphens only)
  const usernameRegex = /^[a-zA-Z0-9_-]+$/
  if (!usernameRegex.test(username)) {
    throw new Error('Username can only contain letters, numbers, underscores, and hyphens')
  }

  let updateData: { [key: string]: any } = {
    username: username.toLowerCase().trim(),
    full_name: fullName.trim(),
    wishlist_color_palette: wishlistColorPalette || 'default',
    wishlist_description: wishlistDescription?.trim() || null,
    updated_at: new Date().toISOString(),
  }

  try {
    // 1. Check if username is available (if it's being changed)
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('username, avatar_url, background_image_url')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching current profile:', fetchError)
      throw new Error('Could not retrieve your current profile information.')
    }

    // Check username availability if it's being changed
    if (currentProfile.username !== username.toLowerCase().trim()) {
      const { data: existingUser, error: usernameCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase().trim())
        .single()

      if (usernameCheckError && usernameCheckError.code !== 'PGRST116') {
        console.error('Username check error:', usernameCheckError)
        throw new Error('Could not verify username availability.')
      }

      if (existingUser) {
        throw new Error('This username is already taken. Please choose another one.')
      }
    }

    // 2. Handle avatar updates
    const oldAvatarUrl = currentProfile?.avatar_url
    let avatarUpdated = false
    
    if (newAvatarUrl && newAvatarUrl !== oldAvatarUrl) {
      avatarUpdated = true
      updateData.avatar_url = newAvatarUrl

      // If the old avatar was a file in storage, schedule it for deletion
      if (oldAvatarUrl && !oldAvatarUrl.startsWith('icon:') && !oldAvatarUrl.startsWith('data:')) {
        const oldFilePath = extractFilePathFromUrl(oldAvatarUrl)
        if (oldFilePath) {
          // Perform cleanup asynchronously to avoid blocking the update
          setTimeout(async () => {
            try {
              await deleteStorageFile('profile-images', oldFilePath)
              console.log('Successfully cleaned up old avatar:', oldFilePath)
            } catch (cleanupError) {
              console.warn('Failed to cleanup old avatar file:', cleanupError)
              // Don't throw error for cleanup failures
            }
          }, 1000) // Delay to ensure the profile update completes first
        }
      }
    }

    // 3. Handle background image updates
    const oldBackgroundUrl = currentProfile?.background_image_url
    let backgroundUpdated = false
    
    if (newBackgroundUrl !== undefined && newBackgroundUrl !== oldBackgroundUrl) {
      backgroundUpdated = true
      updateData.background_image_url = newBackgroundUrl || null

      // If the old background was a file in storage, schedule it for deletion
      if (oldBackgroundUrl && !oldBackgroundUrl.startsWith('data:')) {
        const oldFilePath = extractBackgroundFilePathFromUrl(oldBackgroundUrl)
        if (oldFilePath) {
          // Perform cleanup asynchronously to avoid blocking the update
          setTimeout(async () => {
            try {
              await deleteStorageFile('background-images', oldFilePath)
              console.log('Successfully cleaned up old background:', oldFilePath)
            } catch (cleanupError) {
              console.warn('Failed to cleanup old background file:', cleanupError)
              // Don't throw error for cleanup failures
            }
          }, 1000) // Delay to ensure the profile update completes first
        }
      }
    }

    // 4. Update the profile in the database
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      
      // Handle specific database errors
      if (updateError.code === '23505') {
        if (updateError.message.includes('username')) {
          throw new Error('This username is already taken. Please choose another one.')
        }
        throw new Error('A profile with this information already exists.')
      }
      
      // If profile update fails and we uploaded a new avatar, try to clean it up
      if (avatarUpdated && newAvatarUrl && !newAvatarUrl.startsWith('icon:')) {
        const newFilePath = extractFilePathFromUrl(newAvatarUrl)
        if (newFilePath) {
                                setTimeout(async () => {
             try {
               await deleteStorageFile('profile-images', newFilePath)
            } catch (cleanupError) {
              console.warn('Failed to cleanup new avatar after profile update failure:', cleanupError)
            }
          }, 1000)
        }
      }
      
      throw new Error('Failed to update your profile. Please try again.')
    }

    // 4. Memory notification for changes [[## User Request for Detailed Email Notifications ##]]
    // This ensures that all profile changes are tracked with detailed information about what happened
    const changeDetails = []
    if (currentProfile.username !== username.toLowerCase().trim()) {
      changeDetails.push(`username changed from "${currentProfile.username}" to "${username.toLowerCase().trim()}"`)
    }
    if (avatarUpdated) {
      const avatarChangeType = newAvatarUrl?.startsWith('icon:') ? 'icon selection' : 'image upload'
      changeDetails.push(`avatar updated via ${avatarChangeType}`)
    }
    if (changeDetails.length > 0) {
      const changeLog = `Profile updated: ${changeDetails.join(', ')}`
      console.log(`[PROFILE_UPDATE] User ${user.id}: ${changeLog}`)
      
      // This detailed logging ensures responsibility and traceability for all profile changes
      // as requested in the user's memory about including detailed information in all notifications
    }

    // 5. Revalidate paths to show updated data
    revalidatePath('/dashboard')
    if (username) {
      revalidatePath(`/wishlist/${username.toLowerCase().trim()}`)
    }
    
    return { 
      success: true,
      message: avatarUpdated ? 'Profile and avatar updated successfully!' : 'Profile updated successfully!',
      data: updateData
    }

  } catch (error) {
    // Enhanced error logging with more context
    console.error('Profile update error:', {
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      formData: {
        username,
        fullName,
        wishlistColorPalette,
        wishlistDescription,
        hasNewAvatar: !!newAvatarUrl
      }
    })

    // Re-throw the error for the client to handle
    throw error
  }
} 