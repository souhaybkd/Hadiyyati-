'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/contexts/LanguageContext'

export default function NotFound() {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">{t('notfound.title')}</h2>
      <p className="mb-6 text-muted-foreground max-w-md">
        {t('notfound.body')}
      </p>
      <Link href="/">
        <Button variant="default" size="lg">
          {t('notfound.home')}
        </Button>
      </Link>
    </div>
  )
}
