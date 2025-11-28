import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  ExternalLink, 
  Gift, 
  Image as ImageIcon,
  ArrowLeft 
} from 'lucide-react'
import Link from 'next/link'
import { getPublicWishlistByUsername } from '@/lib/actions/wishlist'
import { trackWishlistView } from '@/lib/actions/gift-history'
import { WishlistItemCard } from '@/components/wishlist/WishlistItemCard'
import { ProfileImage } from '@/components/shared/ProfileImage'
import { cn } from '@/lib/utils'
import { Metadata } from 'next'

interface WishlistPageProps {
  params: Promise<{
    username: string
  }>
}

const palettes = {
    default: {
        bg: 'bg-gradient-to-br from-sky-50 to-blue-100',
        headerIconBg: 'bg-gradient-to-br from-sky-500 to-blue-500',
        headerIconColor: 'text-white',
        link: 'text-sky-600 hover:text-sky-700',
        buttonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
        buttonOutline: 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
    },
    sunrise: {
        bg: 'bg-gradient-to-br from-amber-50 to-orange-100',
        headerIconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
        headerIconColor: 'text-white',
        link: 'text-amber-600 hover:text-amber-700',
        buttonPrimary: 'bg-orange-600 hover:bg-orange-700 text-white',
        buttonOutline: 'border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white'
    },
    forest: {
        bg: 'bg-gradient-to-br from-emerald-50 to-green-100',
        headerIconBg: 'bg-gradient-to-br from-emerald-600 to-green-600',
        headerIconColor: 'text-white',
        link: 'text-emerald-600 hover:text-emerald-700',
        buttonPrimary: 'bg-green-600 hover:bg-green-700 text-white',
        buttonOutline: 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white'
    },
    ocean: {
        bg: 'bg-gradient-to-br from-cyan-50 to-indigo-100',
        headerIconBg: 'bg-gradient-to-br from-cyan-500 to-indigo-500',
        headerIconColor: 'text-white',
        link: 'text-indigo-600 hover:text-indigo-700',
        buttonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        buttonOutline: 'border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white'
    },
    lavender: {
        bg: 'bg-gradient-to-br from-violet-50 to-fuchsia-100',
        headerIconBg: 'bg-gradient-to-br from-violet-500 to-fuchsia-500',
        headerIconColor: 'text-white',
        link: 'text-violet-600 hover:text-violet-700',
        buttonPrimary: 'bg-violet-600 hover:bg-violet-700 text-white',
        buttonOutline: 'border-violet-600 text-violet-600 hover:bg-violet-600 hover:text-white'
    },
    rose: {
        bg: 'bg-gradient-to-br from-rose-50 to-pink-100',
        headerIconBg: 'bg-gradient-to-br from-rose-500 to-pink-500',
        headerIconColor: 'text-white',
        link: 'text-rose-600 hover:text-rose-700',
        buttonPrimary: 'bg-rose-600 hover:bg-rose-700 text-white',
        buttonOutline: 'border-rose-600 text-rose-600 hover:bg-rose-600 hover:text-white'
    },
    midnight: {
        bg: 'bg-gradient-to-br from-slate-50 to-gray-100',
        headerIconBg: 'bg-gradient-to-br from-slate-600 to-gray-600',
        headerIconColor: 'text-white',
        link: 'text-slate-700 hover:text-slate-800',
        buttonPrimary: 'bg-slate-600 hover:bg-slate-700 text-white',
        buttonOutline: 'border-slate-600 text-slate-600 hover:bg-slate-600 hover:text-white'
    },
    mint: {
        bg: 'bg-gradient-to-br from-teal-50 to-emerald-100',
        headerIconBg: 'bg-gradient-to-br from-teal-600 to-emerald-600',
        headerIconColor: 'text-white',
        link: 'text-teal-700 hover:text-teal-800',
        buttonPrimary: 'bg-teal-600 hover:bg-teal-700 text-white',
        buttonOutline: 'border-teal-600 text-teal-600 hover:bg-teal-600 hover:text-white'
    },
};


export default async function WishlistPage(props: WishlistPageProps) {
  const { username } = await props.params
  const wishlistData = await getPublicWishlistByUsername(username)

  if (!wishlistData) {
    notFound()
  }

  const { profile, items } = wishlistData
  const publicItems = items.filter(item => item.is_public)

  // Track wishlist view for analytics
  try {
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || ''
    const forwarded = headersList.get('x-forwarded-for')
    const realIp = headersList.get('x-real-ip')
    const referer = headersList.get('referer') || headersList.get('referrer')
    
    // Get the most reliable IP address
    const ipAddress = forwarded?.split(',')[0]?.trim() || realIp || '0.0.0.0'

    await trackWishlistView(
      profile.id,
      ipAddress,
      userAgent,
      referer || undefined
    )
  } catch (error) {
    // Silently handle tracking errors - don't break the page
    console.log('View tracking failed:', error)
  }

  const selectedPalette = palettes[profile.wishlist_color_palette as keyof typeof palettes] || palettes.default;

  // Background image styling
  const backgroundStyle = profile.background_image_url 
    ? {
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.9)), url(${profile.background_image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : {};

  return (
    <div 
      className={cn("min-h-screen", !profile.background_image_url && selectedPalette.bg)}
      style={backgroundStyle}
    >
      {/* Header */}
      {/* <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <div className="text-sm text-muted-foreground">
              Powered by hadiyyati
            </div>
          </div>
        </div>
      </header> */}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mx-auto mb-4">
            <ProfileImage 
              avatarUrl={profile.avatar_url}
              size="xl"
              palette={selectedPalette}
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">{profile.full_name}'s Wishlist</h1>
          <p className="text-gray-600 my-2">{profile.wishlist_description || 'Welcome to my wishlist! 🎁'}</p>

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 rounded-full text-sm text-gray-600">
            <Gift className="h-4 w-4" />
            {publicItems.length} {publicItems.length === 1 ? 'item' : 'items'} available
          </div>
        </div>

        {/* Wishlist Items */}
        {publicItems.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {publicItems.map((item) => (
              <WishlistItemCard key={item.id} item={item} profile={profile} palette={selectedPalette} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No public items yet
            </h3>
            <p className="text-gray-500">
              {profile.full_name || profile.username} hasn't added any public items to their wishlist yet.
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-500 text-sm">
            Want to create your own wishlist?{' '}
            <Link href="/auth" className={cn("font-medium", selectedPalette.link)}>
              Sign up for free
            </Link>
          </p>
        </footer>
      </main>
    </div>
  )
}

// Generate metadata for SEO
export async function generateMetadata(props: WishlistPageProps): Promise<Metadata> {
  const { username } = await props.params
  const wishlistData = await getPublicWishlistByUsername(username)

  if (!wishlistData) {
    return {
      title: 'Wishlist Not Found',
      description: 'The requested wishlist could not be found.'
    }
  }

  const { profile, items } = wishlistData
  const itemCount = items.filter(item => item.is_public).length

  return {
    title: `${profile.full_name || profile.username}'s Wishlist | hadiyyati`,
    description: `Check out ${profile.full_name || profile.username}'s wishlist with ${itemCount} items. Find the perfect gift!`,
    openGraph: {
      title: `${profile.full_name || profile.username}'s Wishlist`,
      description: `Find the perfect gift from ${profile.full_name || profile.username}'s wishlist`,
      type: 'website',
    },
  }
} 