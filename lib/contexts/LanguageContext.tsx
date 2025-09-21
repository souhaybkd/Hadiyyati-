'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Language = 'en' | 'ar'
type Direction = 'ltr' | 'rtl'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  direction: Direction
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translation strings
const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.contact': 'Contact',
    'nav.terms': 'Terms',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.logout': 'Logout',
    
    // Homepage
    'home.title': 'Share Your Wishlist, Make Dreams Come True',
    'home.subtitle': 'Connect with friends and family through meaningful gift-giving',
    'home.cta.register': 'Get Started',
    'home.cta.browse': 'Browse Wishlists',
    
    // Auth
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.loginWithGoogle': 'Login with Google',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.dontHaveAccount': "Don't have an account?",
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.wishlist': 'My Wishlist',
    'dashboard.shared': 'Shared with Me',
    'dashboard.history': 'Gift History',
    'dashboard.settings': 'Settings',
    'dashboard.analytics': 'Analytics',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.success': 'Success!',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
  },
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.dashboard': 'لوحة التحكم',
    'nav.contact': 'تواصل',
    'nav.terms': 'الشروط',
    'nav.login': 'تسجيل الدخول',
    'nav.register': 'إنشاء حساب',
    'nav.logout': 'تسجيل الخروج',
    
    // Homepage
    'home.title': 'شارك قائمة أمنياتك، حقق الأحلام',
    'home.subtitle': 'تواصل مع الأصدقاء والعائلة من خلال إهداء هادف',
    'home.cta.register': 'ابدأ الآن',
    'home.cta.browse': 'تصفح قوائم الأمنيات',
    
    // Auth
    'auth.login': 'تسجيل الدخول',
    'auth.register': 'إنشاء حساب',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.confirmPassword': 'تأكيد كلمة المرور',
    'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'auth.loginWithGoogle': 'تسجيل الدخول بجوجل',
    'auth.alreadyHaveAccount': 'لديك حساب بالفعل؟',
    'auth.dontHaveAccount': 'ليس لديك حساب؟',
    
    // Dashboard
    'dashboard.title': 'لوحة التحكم',
    'dashboard.wishlist': 'قائمة أمنياتي',
    'dashboard.shared': 'مشاركة معي',
    'dashboard.history': 'تاريخ الهدايا',
    'dashboard.settings': 'الإعدادات',
    'dashboard.analytics': 'الإحصائيات',
    
    // Common
    'common.loading': 'جارٍ التحميل...',
    'common.error': 'حدث خطأ',
    'common.success': 'نجح!',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.edit': 'تعديل',
    'common.delete': 'حذف',
  },
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')
  const [direction, setDirection] = useState<Direction>('ltr')
  const [mounted, setMounted] = useState(false)

  // Hydration fix: Only run client-side code after mount
  useEffect(() => {
    setMounted(true)
    
    // Load saved language from localStorage only on client
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
        setLanguage(savedLanguage)
      }
    }
  }, [])

  useEffect(() => {
    // Only update DOM if component is mounted (client-side)
    if (!mounted) return
    
    // Update direction based on language
    const newDirection = language === 'ar' ? 'rtl' : 'ltr'
    setDirection(newDirection)
    
    // Update document direction and language only on client
    if (typeof window !== 'undefined' && document) {
      document.documentElement.dir = newDirection
      document.documentElement.lang = language
      
      // Save to localStorage
      localStorage.setItem('language', language)
    }
  }, [language, mounted])

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key
  }

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
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