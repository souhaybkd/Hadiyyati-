'use client'

import Link from 'next/link'
import { Gift, Heart } from 'lucide-react'
import { ProfileImage } from '@/components/shared/ProfileImage'
import { WishlistItemCard } from '@/components/wishlist/WishlistItemCard'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/contexts/LanguageContext'

export function PublicWishlistContent({
  profile,
  publicItems,
  selectedPalette,
}: {
  profile: any
  publicItems: any[]
  selectedPalette: any
}) {
  const { t } = useLanguage()
  const name = profile.full_name || profile.username

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <div className="flex justify-center items-center mx-auto mb-4">
          <ProfileImage
            avatarUrl={profile.avatar_url}
            size="xl"
            palette={selectedPalette}
          />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">
          {t('wishlist.title', { name })}
        </h1>
        <p className="text-gray-600 my-2">{profile.wishlist_description || t('wishlist.welcome')}</p>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 rounded-full text-sm text-gray-600">
          <Gift className="h-4 w-4" />
          {publicItems.length}{' '}
          {publicItems.length === 1 ? t('wishlist.item') : t('wishlist.items')}{' '}
          {t('wishlist.available')}
        </div>
      </div>

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
            {t('wishlist.noPublic')}
          </h3>
          <p className="text-gray-500">
            {t('wishlist.noPublicBody', { name })}
          </p>
        </div>
      )}

      <footer className="mt-16 pt-8 border-t border-gray-200 text-center">
        <p className="text-gray-500 text-sm">
          {t('wishlist.createOwn')}{' '}
          <Link href="/auth" className={cn('font-medium', selectedPalette.link)}>
            {t('wishlist.signUpFree')}
          </Link>
        </p>
      </footer>
    </main>
  )
}
