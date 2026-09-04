'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { translations, type Language } from '@/lib/i18n/translations'

type Direction = 'ltr' | 'rtl'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  direction: Direction
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')
  const [direction, setDirection] = useState<Direction>('ltr')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language
      if (savedLanguage === 'en' || savedLanguage === 'ar') {
        setLanguage(savedLanguage)
      }
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    const newDirection = language === 'ar' ? 'rtl' : 'ltr'
    setDirection(newDirection)

    if (typeof window !== 'undefined' && document) {
      document.documentElement.dir = newDirection
      document.documentElement.lang = language
      localStorage.setItem('language', language)
    }
  }, [language, mounted])

  const t = (key: string, vars?: Record<string, string | number>): string => {
    const table = translations[language] || translations.en
    let value = table[key] || translations.en[key] || key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        value = value.split(`{${k}}`).join(String(v))
      }
    }
    return value
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        direction,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
