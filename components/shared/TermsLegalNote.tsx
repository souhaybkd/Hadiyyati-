'use client'

import { useLanguage } from '@/lib/contexts/LanguageContext'

export function TermsLegalNote() {
  const { t } = useLanguage()

  return (
    <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      {t('terms.legalNote')}
    </p>
  )
}
