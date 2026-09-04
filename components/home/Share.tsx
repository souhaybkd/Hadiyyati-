'use client'

import React from 'react'
import { useLanguage } from '@/lib/contexts/LanguageContext'

export function Share() {
  const { t } = useLanguage()
  return (
    <div className="design-section-spacing bg-design-primary">
      <div className="design-container">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-design-h2 font-bold mb-6 text-white">
            {t('home.share.title1')} <span className="text-design-secondary outline outline-2 outline-white">{t('home.share.title2')}</span>
          </h2>
          <p className="text-design-body text-white">
            {t('home.share.body')}
          </p>
        </div>
      </div>
    </div>
  )
}
