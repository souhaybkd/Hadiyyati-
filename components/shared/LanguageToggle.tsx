'use client'

import React from 'react'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import { Button } from '@/components/ui/button'

export function LanguageToggle({ variant = 'gold' }: { variant?: 'gold' | 'muted' }) {
  const { language, setLanguage, t } = useLanguage()

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={t('nav.language')}
      onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
      className={
        variant === 'gold'
          ? 'rounded-full text-white font-semibold hover:bg-white/20 px-3'
          : 'rounded-full text-design-text-heading font-semibold hover:bg-design-gray-100 px-3'
      }
    >
      {language === 'en' ? 'عربي' : 'EN'}
    </Button>
  )
}
