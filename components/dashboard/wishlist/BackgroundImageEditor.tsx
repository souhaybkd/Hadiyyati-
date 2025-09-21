'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { 
  Upload, 
  Loader2,
  X,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Image as ImageIcon,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadBackgroundImage, validateImageFile } from '@/lib/storage'
import { useAuth } from '../AuthProvider'

interface BackgroundImageEditorProps {
  currentBackground: string | null
  onImageChange: (imageData: { type: 'upload' | 'remove', value: string }) => void
  isLoading?: boolean
}

export function BackgroundImageEditor({ 
  currentBackground, 
  onImageChange, 
  isLoading = false 
}: BackgroundImageEditorProps) {
  
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    // When the component loads, if there's a current background, set it as the uploaded image.
    if (currentBackground) {
      setUploadedImage(currentBackground)
    }
  }, [currentBackground])

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
      const result = await uploadBackgroundImage(file, user.id)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (result.success && result.publicUrl) {
        setUploadedImage(result.publicUrl)
        onImageChange({ type: 'upload', value: result.publicUrl })
        
        // Show success message with file size info
        const sizeKB = result.metadata?.size ? (result.metadata.size / 1024).toFixed(1) : 'unknown'
        setUploadSuccess(`Background image uploaded successfully! (${sizeKB}KB)`)
        
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

  const handleRemoveBackground = () => {
    setUploadedImage(null)
    onImageChange({ type: 'remove', value: '' })
    setUploadError(null)
    setUploadSuccess('Background image removed successfully!')
    setTimeout(() => setUploadSuccess(null), 3000)
  }

  const handleRetry = () => {
    setUploadError(null)
    setUploadSuccess(null)
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div className="space-y-3">
        <div>
          <Label className="text-base font-medium">
            {uploadedImage ? 'Change Background Image' : 'Upload Background Image'}
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            This will be displayed as the background of your public wishlist page. Recommended size: 1920x1080px or similar aspect ratio (JPG, PNG, WebP - max 5MB)
          </p>
        </div>

        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
            "hover:border-primary hover:bg-primary/5"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Uploading background image...</p>
                <div className="w-48 bg-gray-200 rounded-full h-2 mx-auto">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{Math.round(uploadProgress)}%</p>
              </div>
            </div>
          ) : (
            <>
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Drop your background image here</p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse your files
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                Choose File
              </Button>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isLoading}
        />

        {/* Success Message */}
        {uploadSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{uploadSuccess}</p>
          </div>
        )}

        {/* Error Message */}
        {uploadError && (
          <div className="flex items-center justify-between p-3 rounded-md bg-red-50 text-red-700 border border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{uploadError}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              className="text-red-600 hover:text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        )}

        {/* Remove Button for existing background */}
        {uploadedImage && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemoveBackground}
              disabled={isLoading}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Background Image
            </Button>
          </div>
        )}

        {/* Tips */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Recommended resolution: 1920x1080px (16:9 aspect ratio)</p>
          <p>• Supported formats: JPEG, PNG, WebP</p>
          <p>• Maximum file size: 5MB</p>
          <p>• The image will be optimized automatically</p>
          <p>• Background appears immediately in the preview on the right</p>
        </div>
      </div>
    </div>
  )
}
