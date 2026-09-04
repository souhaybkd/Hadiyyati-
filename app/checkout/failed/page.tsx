'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ShoppingCart } from 'lucide-react'
import { useLanguage } from '@/lib/contexts/LanguageContext'

export default function CheckoutFailedPage() {
  const { t } = useLanguage()

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-destructive/10 rounded-full flex items-center justify-center">
          <span className="text-2xl">❌</span>
        </div>
        <h1 className="text-2xl font-bold mb-4">{t('failed.title')}</h1>
        <p className="text-muted-foreground mb-8">
          {t('failed.body')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/checkout">
            <Button>
              <ShoppingCart className="h-4 w-4 me-2" />
              {t('failed.return')}
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline">
              <Home className="h-4 w-4 me-2" />
              {t('success.home')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
