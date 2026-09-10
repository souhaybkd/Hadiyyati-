const MIME_FROM_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
])

export function inferImageMimeType(file: File): string {
  const type = (file.type || '').toLowerCase().trim()
  if (type === 'image/jpg') return 'image/jpeg'
  if (type && ALLOWED_MIME_TYPES.has(type)) return type === 'image/jpg' ? 'image/jpeg' : type

  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  return MIME_FROM_EXTENSION[ext] || ''
}

export function extensionForImageMime(mime: string, originalName: string): string {
  if (mime.includes('png')) return 'png'
  if (mime.includes('gif')) return 'gif'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('heic') || mime.includes('heif')) return 'heic'
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  if (ext === 'jpeg') return 'jpg'
  if (['jpg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(ext)) return ext
  return 'jpg'
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file selected' }
  }

  const mime = inferImageMimeType(file)
  if (!mime) {
    return { valid: false, error: 'Please select an image file (JPEG, PNG, GIF, or WebP)' }
  }

  if (!ALLOWED_MIME_TYPES.has(mime) && !ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: 'Supported formats: JPEG, PNG, GIF, WebP' }
  }

  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    return { valid: false, error: `File size (${sizeMB}MB) exceeds 5MB limit` }
  }

  if (file.size < 1024) {
    return { valid: false, error: 'Image file is too small (minimum 1KB)' }
  }

  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return { valid: false, error: 'Invalid filename' }
  }

  return { valid: true }
}
