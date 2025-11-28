'use client'

import { createSupabaseClient } from '@/lib/supabase'

export interface UploadResult {
  success: boolean
  publicUrl?: string
  error?: string
  metadata?: {
    size: number
    width?: number
    height?: number
    format: string
  }
}

// Enhanced image optimization function
async function optimizeImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate optimal dimensions (max 512x512 for profile images)
      const MAX_SIZE = 512
      let { width, height } = img
      
      if (width > height) {
        if (width > MAX_SIZE) {
          height = (height * MAX_SIZE) / width
          width = MAX_SIZE
        }
      } else {
        if (height > MAX_SIZE) {
          width = (width * MAX_SIZE) / height
          height = MAX_SIZE
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg', // Convert to JPEG for better compression
              lastModified: Date.now()
            })
            resolve(optimizedFile)
          } else {
            reject(new Error('Failed to optimize image'))
          }
        },
        'image/jpeg',
        0.85 // 85% quality
      )
    }
    
    img.onerror = () => reject(new Error('Failed to load image for optimization'))
    img.src = URL.createObjectURL(file)
  })
}

// Enhanced file path generation with better security
function generateSecureFilePath(userId: string, originalName: string): string {
  // Sanitize filename and add timestamp
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  const safeFilename = `avatar_${timestamp}_${randomSuffix}.${extension}`
  
  return `${userId}/${safeFilename}`
}

// Enhanced image optimization function for background images (larger size allowed)
async function optimizeBackgroundImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate optimal dimensions (max 1920x1080 for background images)
      const MAX_WIDTH = 1920
      const MAX_HEIGHT = 1080
      let { width, height } = img
      
      // Calculate aspect ratio and resize if needed
      const aspectRatio = width / height
      if (width > MAX_WIDTH) {
        width = MAX_WIDTH
        height = width / aspectRatio
      }
      if (height > MAX_HEIGHT) {
        height = MAX_HEIGHT
        width = height * aspectRatio
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg', // Convert to JPEG for better compression
              lastModified: Date.now()
            })
            resolve(optimizedFile)
          } else {
            reject(new Error('Failed to optimize background image'))
          }
        },
        'image/jpeg',
        0.85 // 85% quality
      )
    }
    
    img.onerror = () => reject(new Error('Failed to load image for optimization'))
    img.src = URL.createObjectURL(file)
  })
}

// Upload profile image to Supabase Storage (client-side)
export async function uploadProfileImage(file: File, userId: string): Promise<UploadResult> {
  const supabase = createSupabaseClient()
  
  try {
    // 1. Validate user identity from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Authentication error:', userError)
      return { success: false, error: 'Authentication failed. Please log in again.' }
    }

    if (user.id !== userId) {
      console.error('User ID mismatch:', { sessionUserId: user.id, providedUserId: userId })
      return { success: false, error: 'User ID mismatch. Please refresh and try again.' }
    }

    // 2. Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // 3. Optimize image
    let fileToUpload = file
    try {
      if (file.size > 1024 * 1024) { // Only optimize files > 1MB
        fileToUpload = await optimizeImage(file)
        console.log(`Image optimized: ${file.size} -> ${fileToUpload.size} bytes`)
      }
    } catch (optimizationError) {
      console.warn('Image optimization failed, using original:', optimizationError)
      // Continue with original file if optimization fails
    }

    // 4. Generate secure file path
    const filePath = generateSecureFilePath(user.id, file.name)

    // 5. Upload the file with retry logic
    const uploadWithRetry = async (attempts = 3): Promise<any> => {
      for (let i = 0; i < attempts; i++) {
        try {
                     const { data, error } = await supabase.storage
             .from('profile-images')
             .upload(filePath, fileToUpload, {
              cacheControl: '3600',
              upsert: false,
              contentType: fileToUpload.type
            })
          
          if (error) throw error
          return { data, error: null }
        } catch (error) {
          if (i === attempts - 1) throw error
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))) // Exponential backoff
        }
      }
    }

    const { data: uploadData, error: uploadError } = await uploadWithRetry()

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      
      // Provide specific error messages
      if (uploadError.message.includes('permission')) {
        return { success: false, error: 'Permission denied. Please check your account status.' }
      }
      if (uploadError.message.includes('size')) {
        return { success: false, error: 'File is too large. Please use an image under 5MB.' }
      }
      if (uploadError.message.includes('duplicate')) {
        return { success: false, error: 'This file already exists. Please try again.' }
      }
      
      return { success: false, error: `Upload failed: ${uploadError.message}` }
    }

    // 6. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath)

    if (!publicUrlData.publicUrl) {
      return { success: false, error: 'File uploaded but failed to get public URL.' }
    }

    // 7. Return success with metadata
    return { 
      success: true, 
      publicUrl: publicUrlData.publicUrl,
      metadata: {
        size: fileToUpload.size,
        format: fileToUpload.type
      }
    }

  } catch (error) {
    console.error('Unexpected upload error:', error)
      return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred during upload.' 
    }
  }
}

// Enhanced image optimization function for product images
async function optimizeProductImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate optimal dimensions (max 800x800 for product images)
      const MAX_SIZE = 800
      let { width, height } = img
      
      if (width > height) {
        if (width > MAX_SIZE) {
          height = (height * MAX_SIZE) / width
          width = MAX_SIZE
        }
      } else {
        if (height > MAX_SIZE) {
          width = (width * MAX_SIZE) / height
          height = MAX_SIZE
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg', // Convert to JPEG for better compression
              lastModified: Date.now()
            })
            resolve(optimizedFile)
          } else {
            reject(new Error('Failed to optimize product image'))
          }
        },
        'image/jpeg',
        0.85 // 85% quality
      )
    }
    
    img.onerror = () => reject(new Error('Failed to load image for optimization'))
    img.src = URL.createObjectURL(file)
  })
}

// Generate secure file path for product images
function generateProductFilePath(userId: string, originalName: string): string {
  // Sanitize filename and add timestamp
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  const safeFilename = `product_${timestamp}_${randomSuffix}.${extension}`
  
  return `${userId}/${safeFilename}`
}

// Upload product image to Supabase Storage (client-side)
export async function uploadProductImage(file: File, userId: string): Promise<UploadResult> {
  const supabase = createSupabaseClient()
  
  try {
    // 1. Validate user identity from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Authentication error:', userError)
      return { success: false, error: 'Authentication failed. Please log in again.' }
    }

    if (user.id !== userId) {
      console.error('User ID mismatch:', { sessionUserId: user.id, providedUserId: userId })
      return { success: false, error: 'User ID mismatch. Please refresh and try again.' }
    }

    // 2. Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // 3. Optimize image for product (800x800 max)
    let fileToUpload = file
    try {
      if (file.size > 1024 * 1024) { // Only optimize files > 1MB
        fileToUpload = await optimizeProductImage(file)
        console.log(`Product image optimized: ${file.size} -> ${fileToUpload.size} bytes`)
      }
    } catch (optimizationError) {
      console.warn('Product image optimization failed, using original:', optimizationError)
      // Continue with original file if optimization fails
    }

    // 4. Generate secure file path
    const filePath = generateProductFilePath(user.id, file.name)

    // 5. Upload the file with retry logic
    const uploadWithRetry = async (attempts = 3): Promise<any> => {
      for (let i = 0; i < attempts; i++) {
        try {
          const { data, error } = await supabase.storage
            .from('product-images')
            .upload(filePath, fileToUpload, {
              cacheControl: '3600',
              upsert: false,
              contentType: fileToUpload.type
            })
          
          if (error) throw error
          return { data, error: null }
        } catch (error) {
          if (i === attempts - 1) throw error
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))) // Exponential backoff
        }
      }
    }

    const { data: uploadData, error: uploadError } = await uploadWithRetry()

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      
      // Provide specific error messages
      if (uploadError.message.includes('permission')) {
        return { success: false, error: 'Permission denied. Please check your account status.' }
      }
      if (uploadError.message.includes('size')) {
        return { success: false, error: 'File is too large. Please use an image under 5MB.' }
      }
      if (uploadError.message.includes('duplicate')) {
        return { success: false, error: 'This file already exists. Please try again.' }
      }
      
      return { success: false, error: `Upload failed: ${uploadError.message}` }
    }

    // 6. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    if (!publicUrlData.publicUrl) {
      return { success: false, error: 'File uploaded but failed to get public URL.' }
    }

    // 7. Return success with metadata
    return { 
      success: true, 
      publicUrl: publicUrlData.publicUrl,
      metadata: {
        size: fileToUpload.size,
        format: fileToUpload.type
      }
    }

  } catch (error) {
    console.error('Unexpected upload error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred during upload.' 
    }
  }
}

// Extract file path from a Supabase Storage URL
export function extractFilePathFromUrl(avatarUrl: string): string | null {
  try {
    // Only process if it's a Supabase storage URL
    if (!avatarUrl || !avatarUrl.includes('supabase.co') || avatarUrl.startsWith('icon:') || avatarUrl.startsWith('data:')) {
      return null
    }

    const url = new URL(avatarUrl)
    // The pathname is typically /storage/v1/object/public/profile-images/user-id/filename.ext
    // We want to extract "user-id/filename.ext"
    const pathParts = url.pathname.split('/profile-images/')
    
    if (pathParts.length > 1) {
      return pathParts[1]
    }
    
    return null
  } catch (error) {
    console.error('Failed to extract file path:', error)
    return null
  }
}

// Enhanced image validation with better error messages
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No file selected' }
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Please select an image file' }
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    return { valid: false, error: `File size (${sizeMB}MB) exceeds 5MB limit` }
  }

  // Check minimum size (avoid tiny images)
  if (file.size < 1024) {
    return { valid: false, error: 'Image file is too small (minimum 1KB)' }
  }

  // Check file extension
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Supported formats: JPEG, PNG, GIF, WebP' }
  }

  // Check filename for security
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return { valid: false, error: 'Invalid filename' }
  }

  return { valid: true }
}

// Delete profile image from storage
export async function deleteProfileImage(filePath: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseClient()
  
  try {
    const { error } = await supabase.storage
      .from('profile-images')
      .remove([filePath])
    
    if (error) {
      console.error('Delete error:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Unexpected delete error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete image'
    }
  }
}

// Generate secure file path for background images
function generateBackgroundFilePath(userId: string, originalName: string): string {
  // Sanitize filename and add timestamp
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  const safeFilename = `background_${timestamp}_${randomSuffix}.${extension}`
  
  return `${userId}/${safeFilename}`
}

// Upload background image to Supabase Storage (client-side)
export async function uploadBackgroundImage(file: File, userId: string): Promise<UploadResult> {
  const supabase = createSupabaseClient()
  
  try {
    // 1. Validate user identity from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Authentication error:', userError)
      return { success: false, error: 'Authentication failed. Please log in again.' }
    }

    if (user.id !== userId) {
      console.error('User ID mismatch:', { sessionUserId: user.id, providedUserId: userId })
      return { success: false, error: 'User ID mismatch. Please refresh and try again.' }
    }

    // 2. Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // 3. Optimize image for background (larger dimensions allowed)
    let fileToUpload = file
    try {
      if (file.size > 1024 * 1024) { // Only optimize files > 1MB
        fileToUpload = await optimizeBackgroundImage(file)
        console.log(`Background image optimized: ${file.size} -> ${fileToUpload.size} bytes`)
      }
    } catch (optimizationError) {
      console.warn('Background image optimization failed, using original:', optimizationError)
      // Continue with original file if optimization fails
    }

    // 4. Generate secure file path
    const filePath = generateBackgroundFilePath(user.id, file.name)

    // 5. Upload the file with retry logic
    const uploadWithRetry = async (attempts = 3): Promise<any> => {
      for (let i = 0; i < attempts; i++) {
        try {
          const { data, error } = await supabase.storage
            .from('background-images')
            .upload(filePath, fileToUpload, {
              cacheControl: '3600',
              upsert: false,
              contentType: fileToUpload.type
            })
          
          if (error) throw error
          return { data, error: null }
        } catch (error) {
          if (i === attempts - 1) throw error
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))) // Exponential backoff
        }
      }
    }

    const { data: uploadData, error: uploadError } = await uploadWithRetry()

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      
      // Provide specific error messages
      if (uploadError.message.includes('permission')) {
        return { success: false, error: 'Permission denied. Please check your account status.' }
      }
      if (uploadError.message.includes('size')) {
        return { success: false, error: 'File is too large. Please use an image under 5MB.' }
      }
      if (uploadError.message.includes('duplicate')) {
        return { success: false, error: 'This file already exists. Please try again.' }
      }
      
      return { success: false, error: `Upload failed: ${uploadError.message}` }
    }

    // 6. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('background-images')
      .getPublicUrl(filePath)

    if (!publicUrlData.publicUrl) {
      return { success: false, error: 'File uploaded but failed to get public URL.' }
    }

    // 7. Return success with metadata
    return { 
      success: true, 
      publicUrl: publicUrlData.publicUrl,
      metadata: {
        size: fileToUpload.size,
        format: fileToUpload.type
      }
    }

  } catch (error) {
    console.error('Unexpected upload error:', error)
      return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred during upload.' 
    }
  }
}

// Enhanced image optimization function for product images
async function optimizeProductImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate optimal dimensions (max 800x800 for product images)
      const MAX_SIZE = 800
      let { width, height } = img
      
      if (width > height) {
        if (width > MAX_SIZE) {
          height = (height * MAX_SIZE) / width
          width = MAX_SIZE
        }
      } else {
        if (height > MAX_SIZE) {
          width = (width * MAX_SIZE) / height
          height = MAX_SIZE
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg', // Convert to JPEG for better compression
              lastModified: Date.now()
            })
            resolve(optimizedFile)
          } else {
            reject(new Error('Failed to optimize product image'))
          }
        },
        'image/jpeg',
        0.85 // 85% quality
      )
    }
    
    img.onerror = () => reject(new Error('Failed to load image for optimization'))
    img.src = URL.createObjectURL(file)
  })
}

// Generate secure file path for product images
function generateProductFilePath(userId: string, originalName: string): string {
  // Sanitize filename and add timestamp
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  const safeFilename = `product_${timestamp}_${randomSuffix}.${extension}`
  
  return `${userId}/${safeFilename}`
}

// Upload product image to Supabase Storage (client-side)
export async function uploadProductImage(file: File, userId: string): Promise<UploadResult> {
  const supabase = createSupabaseClient()
  
  try {
    // 1. Validate user identity from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Authentication error:', userError)
      return { success: false, error: 'Authentication failed. Please log in again.' }
    }

    if (user.id !== userId) {
      console.error('User ID mismatch:', { sessionUserId: user.id, providedUserId: userId })
      return { success: false, error: 'User ID mismatch. Please refresh and try again.' }
    }

    // 2. Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // 3. Optimize image for product (800x800 max)
    let fileToUpload = file
    try {
      if (file.size > 1024 * 1024) { // Only optimize files > 1MB
        fileToUpload = await optimizeProductImage(file)
        console.log(`Product image optimized: ${file.size} -> ${fileToUpload.size} bytes`)
      }
    } catch (optimizationError) {
      console.warn('Product image optimization failed, using original:', optimizationError)
      // Continue with original file if optimization fails
    }

    // 4. Generate secure file path
    const filePath = generateProductFilePath(user.id, file.name)

    // 5. Upload the file with retry logic
    const uploadWithRetry = async (attempts = 3): Promise<any> => {
      for (let i = 0; i < attempts; i++) {
        try {
          const { data, error } = await supabase.storage
            .from('product-images')
            .upload(filePath, fileToUpload, {
              cacheControl: '3600',
              upsert: false,
              contentType: fileToUpload.type
            })
          
          if (error) throw error
          return { data, error: null }
        } catch (error) {
          if (i === attempts - 1) throw error
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))) // Exponential backoff
        }
      }
    }

    const { data: uploadData, error: uploadError } = await uploadWithRetry()

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      
      // Provide specific error messages
      if (uploadError.message.includes('permission')) {
        return { success: false, error: 'Permission denied. Please check your account status.' }
      }
      if (uploadError.message.includes('size')) {
        return { success: false, error: 'File is too large. Please use an image under 5MB.' }
      }
      if (uploadError.message.includes('duplicate')) {
        return { success: false, error: 'This file already exists. Please try again.' }
      }
      
      return { success: false, error: `Upload failed: ${uploadError.message}` }
    }

    // 6. Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    if (!publicUrlData.publicUrl) {
      return { success: false, error: 'File uploaded but failed to get public URL.' }
    }

    // 7. Return success with metadata
    return { 
      success: true, 
      publicUrl: publicUrlData.publicUrl,
      metadata: {
        size: fileToUpload.size,
        format: fileToUpload.type
      }
    }

  } catch (error) {
    console.error('Unexpected upload error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred during upload.' 
    }
  }
}