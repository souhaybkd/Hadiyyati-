import { createSupabaseServiceClient } from '@/lib/supabase-service'
import { extensionForImageMime, inferImageMimeType, validateImageFile } from '@/lib/image-file'

export const PRODUCT_IMAGES_BUCKET = 'product-images'

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
]

function friendlyStorageError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('bucket') && (lower.includes('not found') || lower.includes('not exist'))) {
    return 'The product-images storage bucket is missing in Supabase. Create a public bucket named product-images.'
  }
  if (lower.includes('row-level security') || lower.includes('unauthorized') || lower.includes('permission')) {
    return 'Storage permission denied. The product-images bucket needs public access and upload policies (or use the server upload path).'
  }
  if (lower.includes('mime') || lower.includes('not allowed') || lower.includes('invalid')) {
    return 'This image type is not allowed by the storage bucket. Enable JPEG, PNG, GIF, and WebP on product-images.'
  }
  if (lower.includes('size') || lower.includes('too large') || lower.includes('maximum')) {
    return 'File is too large. Please use an image under 5MB.'
  }
  if (lower.includes('duplicate') || lower.includes('already exists')) {
    return 'This file already exists. Please try again.'
  }
  if (lower.includes('service role') || lower.includes('missing env')) {
    return 'Server storage is not configured. Set SUPABASE_SERVICE_ROLE_KEY on the host.'
  }
  return message || 'Upload failed. Please try again.'
}

async function ensureProductImagesBucket() {
  const admin = createSupabaseServiceClient()
  const { data: buckets, error: listError } = await admin.storage.listBuckets()
  if (listError) {
    throw new Error(friendlyStorageError(listError.message))
  }

  const existing = buckets?.find((bucket) => bucket.name === PRODUCT_IMAGES_BUCKET)
  if (!existing) {
    const { error: createError } = await admin.storage.createBucket(PRODUCT_IMAGES_BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
    })
    if (createError && !createError.message.toLowerCase().includes('already exists')) {
      throw new Error(friendlyStorageError(createError.message))
    }
    return
  }

  if (!existing.public) {
    const { error: updateError } = await admin.storage.updateBucket(PRODUCT_IMAGES_BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
    })
    if (updateError) {
      throw new Error(friendlyStorageError(updateError.message))
    }
  }
}

export async function uploadProductImageForUser(userId: string, file: File): Promise<{ publicUrl: string }> {
  const validation = validateImageFile(file)
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid image')
  }

  await ensureProductImagesBucket()

  const mime = inferImageMimeType(file) || 'image/jpeg'
  const ext = extensionForImageMime(mime, file.name)
  const filePath = `${userId}/product_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const admin = createSupabaseServiceClient()

  const { error: uploadError } = await admin.storage.from(PRODUCT_IMAGES_BUCKET).upload(filePath, buffer, {
    cacheControl: '3600',
    upsert: false,
    contentType: mime === 'image/jpg' ? 'image/jpeg' : mime,
  })

  if (uploadError) {
    throw new Error(friendlyStorageError(uploadError.message))
  }

  const { data } = admin.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(filePath)
  if (!data.publicUrl) {
    throw new Error('File uploaded but failed to get a public URL. Make sure the product-images bucket is Public.')
  }

  return { publicUrl: data.publicUrl }
}
