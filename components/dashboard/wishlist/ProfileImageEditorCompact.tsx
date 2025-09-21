'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Upload, 
  User, 
  Heart, 
  Gift, 
  Star, 
  Crown, 
  Smile, 
  Coffee, 
  Music, 
  Camera, 
  Book, 
  Palette, 
  Gamepad2,
  Plane,
  Car,
  Home,
  Loader2,
  X,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadProfileImage, validateImageFile } from '@/lib/storage'
import { useAuth } from '../AuthProvider'

const PRESET_ICONS = [
  { icon: Heart, name: 'Heart', color: 'text-red-500' },
  { icon: Gift, name: 'Gift', color: 'text-green-500' },
  { icon: Star, name: 'Star', color: 'text-yellow-500' },
  { icon: Crown, name: 'Crown', color: 'text-purple-500' },
  { icon: Smile, name: 'Smile', color: 'text-blue-500' },
  { icon: Coffee, name: 'Coffee', color: 'text-amber-600' },
  { icon: Music, name: 'Music', color: 'text-pink-500' },
  { icon: Camera, name: 'Camera', color: 'text-gray-600' },
  { icon: Book, name: 'Book', color: 'text-indigo-500' },
  { icon: Palette, name: 'Palette', color: 'text-teal-500' },
  { icon: Gamepad2, name: 'Gaming', color: 'text-orange-500' },
  { icon: Plane, name: 'Travel', color: 'text-sky-500' },
  { icon: Car, name: 'Car', color: 'text-slate-600' },
  { icon: Home, name: 'Home', color: 'text-emerald-600' },
  { icon: User, name: 'Profile', color: 'text-zinc-500' },
]

interface ProfileImageEditorCompactProps {
  currentAvatar: string | null
  onImageChange: (imageData: { type: 'icon' | 'upload', value: string }) => void
  isLoading?: boolean
}

export function ProfileImageEditorCompact({ 
  currentAvatar, 
  onImageChange, 
  isLoading = false 
}: ProfileImageEditorCompactProps) {
  const { user, loading: authLoading } = useAuth()
  const [selectedIcon, setSelectedIcon] = useState<string | null>(
    currentAvatar?.startsWith('icon:') ? currentAvatar.replace('icon:', '') : null
  )
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // When the component loads, if the current avatar is a URL, set it as the uploaded image.
    if (currentAvatar && !currentAvatar.startsWith('icon:')) {
      setUploadedImage(currentAvatar)
    }
  }, [currentAvatar])

  const handleIconSelect = (iconName: string) => {
    setSelectedIcon(iconName)
    setUploadedImage(null)
    setUploadError(null)
    setUploadSuccess(null)
    onImageChange({ type: 'icon', value: iconName })
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return

    setUploadError(null)
    setUploadSuccess(null)
    setUploadProgress(0)
    
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file')
      return
    }

    // Since middleware protects this page, we can assume the user is logged in.
    // We just wait for the user object to be available from the AuthProvider.
    if (authLoading || !user) {
      setUploadError("Please wait a moment and try again...")
      return
    }
    
    setIsUploading(true)
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 15
      })
    }, 200)
    
    try {
      const result = await uploadProfileImage(file, user.id)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (result.success && result.publicUrl) {
        setUploadedImage(result.publicUrl)
        setSelectedIcon(null)
        onImageChange({ type: 'upload', value: result.publicUrl })
        
        // Show success message with file size info
        const sizeKB = result.metadata?.size ? (result.metadata.size / 1024).toFixed(1) : 'unknown'
        setUploadSuccess(`Image uploaded successfully! (${sizeKB}KB)`)
        
        // Clear success message after 3 seconds
        setTimeout(() => setUploadSuccess(null), 3000)
      } else {
        setUploadError(result.error || 'Upload failed. Please try again.')
      }
    } catch (error) {
      clearInterval(progressInterval)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.'
      setUploadError(errorMessage)
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const clearImage = () => {
    setUploadedImage(null)
    setSelectedIcon(null)
    setUploadError(null)
    setUploadSuccess(null)
    // Notify parent that the image has been cleared, reverting to a default or null state.
    // We select the 'User' icon as a default fallback.
    onImageChange({ type: 'icon', value: 'User' }) 
  }

  const retryUpload = () => {
    setUploadError(null)
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const getCurrentIcon = () => {
    if (uploadedImage) {
      return (
        <img 
          src={uploadedImage} 
          alt="Profile" 
          className="h-full w-full object-cover"
          onError={() => {
            // Fallback to default icon if image fails to load
            setUploadedImage(null)
            setSelectedIcon('User')
            onImageChange({ type: 'icon', value: 'User' })
          }}
        />
      )
    }
    
    if (selectedIcon) {
      const iconData = PRESET_ICONS.find(i => i.name === selectedIcon)
      if (iconData) {
        const Icon = iconData.icon
        return <Icon className={cn('h-8 w-8', iconData.color)} />
      }
    }
    
    return <User className="h-8 w-8 text-design-text-muted" />
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-6 bg-design-background-muted rounded-lg">
        <Loader2 className="h-6 w-6 animate-spin text-design-text-muted" />
      </div>
    )
  }
  
  return (
    <div className="space-y-4 p-4 border border-design-separator rounded-lg bg-design-background-card">
      <div className="flex items-center gap-4">
        {/* Image Preview */}
        <div className="relative h-20 w-20 rounded-full bg-design-background-muted flex items-center justify-center overflow-hidden border-2 border-design-separator">
          {getCurrentIcon()}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
              <div className="text-white text-xs font-medium">
                {Math.round(uploadProgress)}%
              </div>
            </div>
          )}
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium text-design-text-heading">Your Avatar</p>
          <p className="text-xs text-design-text-muted">Upload a custom image or select an icon.</p>
          {(uploadedImage || selectedIcon !== 'User') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearImage}
              className="mt-1 text-xs h-auto px-1.5 py-0.5"
              disabled={isUploading}
            >
              <X className="h-3 w-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Success Message */}
      {uploadSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <p className="text-sm text-green-800">{uploadSuccess}</p>
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{uploadError}</p>
          </div>
          <Button
            onClick={retryUpload}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-100"
            disabled={isUploading}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {/* Dropzone and Upload Area */}
      <div
        className={cn(
          'relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer',
          isDragging ? 'border-design-accent bg-design-accent/10' : 'border-design-separator',
          'hover:border-design-accent/80',
          isUploading && 'pointer-events-none opacity-50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isLoading || isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center space-y-3 text-center">
            <Loader2 className="animate-spin h-8 w-8 text-design-accent" />
            <div className="space-y-1">
              <p className="text-sm text-design-text-muted font-medium">Uploading...</p>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-design-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2 text-center">
            <Upload className="h-8 w-8 text-design-text-muted" />
            <p className="text-sm text-design-text-muted">Drag & drop or click to upload</p>
            <p className="text-xs text-design-text-muted">JPEG, PNG, GIF, WebP • Max 5MB</p>
          </div>
        )}
      </div>

      <div className="w-full flex justify-center items-center my-4">
        <Separator className="w-1/4" />
        <p className="text-xs text-design-text-muted uppercase mx-4">Or</p>
        <Separator className="w-1/4" />
      </div>

      <div className="space-y-3 w-full">
        <Label className="text-sm font-medium text-design-text-heading text-center block">Select an Icon</Label>
        <div className="grid grid-cols-5 gap-3">
          {PRESET_ICONS.map(({ icon: Icon, name, color }) => (
            <button
              key={name}
              type="button"
              onClick={() => handleIconSelect(name)}
              disabled={isUploading}
              className={cn(
                'flex items-center justify-center p-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-design-accent',
                selectedIcon === name 
                  ? 'border-design-accent bg-design-accent/10' 
                  : 'border-transparent hover:bg-design-background-muted',
                isUploading && 'opacity-50 cursor-not-allowed'
              )}
              aria-label={`Select ${name} icon`}
            >
              <Icon className={cn('h-7 w-7', color)} />
            </button>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800 font-medium mb-1">💡 Tips for best results:</p>
        <ul className="text-xs text-blue-700 space-y-0.5">
          <li>• Use square images (1:1 ratio) for best fit</li>
          <li>• Images are automatically optimized for web</li>
          <li>• Recommended size: 200×200px or larger</li>
        </ul>
      </div>
    </div>
  )
}