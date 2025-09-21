'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Check,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface ProfileImageEditorProps {
  currentAvatar: string | null
  onImageChange: (imageData: { type: 'icon' | 'upload', value: string }) => void
  isLoading?: boolean
}

export function ProfileImageEditor({ 
  currentAvatar, 
  onImageChange, 
  isLoading = false 
}: ProfileImageEditorProps) {
  const [selectedIcon, setSelectedIcon] = useState<string | null>(
    currentAvatar?.startsWith('icon:') ? currentAvatar.replace('icon:', '') : null
  )
  const [uploadedImage, setUploadedImage] = useState<string | null>(
    currentAvatar && !currentAvatar.startsWith('icon:') ? currentAvatar : null
  )
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleIconSelect = (iconName: string) => {
    setSelectedIcon(iconName)
    setUploadedImage(null)
    setUploadError(null)
    onImageChange({ type: 'icon', value: iconName })
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image must be smaller than 2MB')
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      // Convert to base64 for preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        setUploadedImage(imageData)
        setSelectedIcon(null)
        onImageChange({ type: 'upload', value: imageData })
        setIsUploading(false)
      }
      reader.onerror = () => {
        setUploadError('Failed to read image file')
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      setUploadError('Failed to process image')
      setIsUploading(false)
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
    onImageChange({ type: 'icon', value: 'User' })
  }

  const getCurrentIcon = () => {
    if (selectedIcon) {
      return PRESET_ICONS.find(icon => icon.name === selectedIcon)
    }
    return PRESET_ICONS.find(icon => icon.name === 'User')
  }

  const currentIcon = getCurrentIcon()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Image
        </CardTitle>
        <CardDescription>
          Choose an icon or upload your own image for your public wishlist
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Image Preview */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center overflow-hidden">
              {uploadedImage ? (
                <img 
                  src={uploadedImage} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : currentIcon ? (
                <currentIcon.icon className={cn("h-8 w-8 text-white")} />
              ) : (
                <User className="h-8 w-8 text-white" />
              )}
            </div>
            {(uploadedImage || selectedIcon) && (
              <Button
                variant="outline"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={clearImage}
                disabled={isLoading}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div>
            <p className="font-medium">Current Profile Image</p>
            <p className="text-sm text-muted-foreground">
              {uploadedImage ? 'Custom uploaded image' : 
               selectedIcon ? `${selectedIcon} icon` : 'Default user icon'}
            </p>
          </div>
        </div>

        <Separator />

        {/* Icon Selection */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Choose an Icon</Label>
            <p className="text-sm text-muted-foreground">
              Select from our collection of preset icons
            </p>
          </div>
          
          <div className="grid grid-cols-5 gap-3">
            {PRESET_ICONS.map((icon) => (
              <Button
                key={icon.name}
                variant={selectedIcon === icon.name ? "default" : "outline"}
                className={cn(
                  "h-16 w-16 p-0 flex-col gap-1",
                  selectedIcon === icon.name && "ring-2 ring-primary"
                )}
                onClick={() => handleIconSelect(icon.name)}
                disabled={isLoading}
                title={icon.name}
              >
                <icon.icon className={cn("h-6 w-6", 
                  selectedIcon === icon.name ? "text-primary-foreground" : icon.color
                )} />
                <span className="text-xs truncate">{icon.name}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* File Upload */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Upload Custom Image</Label>
            <p className="text-sm text-muted-foreground">
              Upload your own image (JPG, PNG, GIF - max 2MB)
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
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Uploading image...</p>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Drop your image here</p>
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

          {uploadError && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            Tips for best results
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use square images for the best fit</li>
            <li>• Recommended size: 200x200 pixels or larger</li>
            <li>• Ensure good contrast for readability</li>
            <li>• Keep file size under 2MB</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 