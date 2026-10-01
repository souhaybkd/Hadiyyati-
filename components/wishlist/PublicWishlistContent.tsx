'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Gift, Heart, ShoppingCart } from 'lucide-react'
import { ProfileImage } from '@/components/shared/ProfileImage'
import { LanguageToggle } from '@/components/shared/LanguageToggle'
import { WishlistItemCard } from '@/components/wishlist/WishlistItemCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCart } from '@/lib/contexts/CartContext'
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
  const { cartItems, openCart } = useCart()
  const name = profile.full_name || profile.username
  const description = profile.wishlist_description?.trim()

  return (
    <>
    <header dir="ltr" className="sticky top-0 z-20 border-b border-white/60 bg-white/80 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="shrink-0">
          <Image
            src="/assets/img/LOGO.png"
            alt="Hadiyyati"
            width={140}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />
        </Link>
        <div className="flex items-center gap-1">
          <LanguageToggle variant="muted" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative rounded-full"
            aria-label={t('cart.open')}
            onClick={openCart}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItems.length > 0 && (
              <span className="absolute -top-0.5 -end-0.5 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold leading-5 text-center">
                {cartItems.length}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
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
        <p dir="auto" className="text-gray-600 my-2">{description || t('wishlist.welcome')}</p>

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

      <footer dir="ltr" className="mt-16 pt-8 border-t border-gray-200 text-center">
        <p className="text-gray-500 text-sm">
          {t('wishlist.createOwn')}{' '}
          <Link href="/auth" className={cn('font-medium', selectedPalette.link)}>
            {t('wishlist.signUpFree')}
          </Link>
        </p>
      </footer>
    </main>
    </>
  )
}
