'use client'

import { 
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
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ICON_MAP = {
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
  Gaming: Gamepad2,
  Travel: Plane,
  Car,
  Home,
  Profile: User,
  User,
}

interface ProfileImageProps {
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  iconClassName?: string
  palette?: {
    headerIconBg?: string
    headerIconColor?: string
  }
}

export function ProfileImage({ 
  avatarUrl, 
  size = 'md', 
  className, 
  iconClassName,
  palette 
}: ProfileImageProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24'
  }

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-10 w-10'
  }

  const renderIcon = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName as keyof typeof ICON_MAP] || User
    return (
      <IconComponent 
        className={cn(
          iconSizeClasses[size],
          palette?.headerIconColor || 'text-white',
          iconClassName
        )} 
      />
    )
  }

  const renderContent = () => {
    if (!avatarUrl) {
      return renderIcon('Heart')
    }

    if (avatarUrl.startsWith('icon:')) {
      const iconName = avatarUrl.replace('icon:', '')
      return renderIcon(iconName)
    }

    // Handle uploaded images (base64, HTTP, or Supabase Storage URLs)
    if (avatarUrl.startsWith('data:') || 
        avatarUrl.startsWith('http') || 
        avatarUrl.startsWith('https://')) {
      return (
        <img 
          src={avatarUrl} 
          alt="Profile" 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to default icon if image fails to load
            e.currentTarget.style.display = 'none'
          }}
        />
      )
    }

    return renderIcon('Heart')
  }

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center overflow-hidden',
      sizeClasses[size],
      palette?.headerIconBg || 'bg-gradient-to-br from-sky-500 to-blue-500',
      className
    )}>
      {renderContent()}
    </div>
  )
} 