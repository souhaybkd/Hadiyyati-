import { createClient } from '@supabase/supabase-js'

// Initialize admin client only when needed to avoid build-time errors
let supabaseAdmin: any = null

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
    }

    if (!supabaseServiceRoleKey) {
      throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
  }
  return supabaseAdmin
}

/**
 * Deletes a file from Supabase Storage.
 * This should only be used in server-side code.
 *
 * @param bucketName - The name of the storage bucket.
 * @param filePath - The path of the file to delete (e.g., 'user-id/image.png').
 * @returns An object indicating success or failure.
 */
export async function deleteStorageFile(bucketName: string, filePath: string): Promise<{ success: boolean; error?: string }> {
  if (!filePath || filePath.startsWith('icon:')) {
    // Nothing to delete for icons or empty paths
    return { success: true }
  }

  try {
    const admin = getSupabaseAdmin()
    const { error } = await admin.storage
      .from(bucketName)
      .remove([filePath])

    if (error) {
      // It's okay if the file doesn't exist (e.g., old avatar was an icon)
      if (error.message.includes('Not Found')) {
        console.warn(`File not found, but proceeding: ${filePath}`)
        return { success: true }
      }
      
      console.error(`Failed to delete file from Supabase Storage: ${error.message}`)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
    console.error(`Unexpected error deleting file: ${errorMessage}`)
    return { success: false, error: errorMessage }
  }
}

/**
 * Extracts the file path from a Supabase Storage URL.
 * This is a server-side utility.
 *
 * @param avatarUrl - The full URL of the avatar.
 * @returns The file path, or null if it's not a valid storage URL.
 */
export function extractFilePathFromUrl(avatarUrl: string): string | null {
  if (!avatarUrl || !avatarUrl.includes('supabase.co') || avatarUrl.startsWith('icon:')) {
    return null
  }

  try {
    const url = new URL(avatarUrl)
    // The path is typically /storage/v1/object/public/profile-images/user-id/filename.ext
    // We want to extract "user-id/filename.ext"
    const pathParts = url.pathname.split('/profile-images/')
    
    if (pathParts.length > 1) {
      return pathParts[1]
    }
    
    return null
  } catch (error) {
    console.error('Failed to extract file path from URL:', error)
    return null
  }
}

/**
 * Extracts the file path from a Supabase Storage background image URL.
 * This is a server-side utility.
 *
 * @param backgroundUrl - The full URL of the background image.
 * @returns The file path, or null if it's not a valid storage URL.
 */
export function extractBackgroundFilePathFromUrl(backgroundUrl: string): string | null {
  if (!backgroundUrl || !backgroundUrl.includes('supabase.co')) {
    return null
  }

  try {
    const url = new URL(backgroundUrl)
    // The path is typically /storage/v1/object/public/background-images/user-id/filename.ext
    // We want to extract "user-id/filename.ext"
    const pathParts = url.pathname.split('/background-images/')
    
    if (pathParts.length > 1) {
      return pathParts[1]
    }
    
    return null
  } catch (error) {
    console.error('Failed to extract background file path from URL:', error)
    return null
  }
} 