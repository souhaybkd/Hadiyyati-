'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import { LanguageToggle } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()
  const { t, direction } = useLanguage()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  const navigation = [
    { key: 'nav.home', href: '/' },
    { key: 'nav.dashboard', href: '/dashboard' },
    { key: 'nav.contact', href: '/contact' },
  ]

  const getBorderRadius = (index: number) => {
    const isFirst = index === 0
    const isLast = index === navigation.length - 1
    if (direction === 'rtl') {
      if (isFirst) return '0px 50px 50px 0px'
      if (isLast) return '50px 0px 0px 50px'
      return '0'
    }
    if (isFirst) return '50px 0px 0px 50px'
    if (isLast) return '0px 50px 50px 0px'
    return '0'
  }

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-200">
      <div className="design-container">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <Image
              src="/assets/img/LOGO.png"
              alt="Hadiyyati"
              width={100}
              height={120}
              className="h-9 w-auto object-contain md:h-10"
              priority
            />
          </Link>

          <div className="hidden md:flex items-center gap-3">
            {navigation.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium transition-design px-4 py-2 text-white font-semibold hover:opacity-90"
                style={{
                  backgroundImage: 'linear-gradient(to right, #D1AB30, #E8C547)',
                  borderRadius: getBorderRadius(index),
                }}
              >
                {t(item.key)}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2 relative z-[9999]">
            <LanguageToggle variant="muted" />
            <Button asChild size="sm" className="rounded-full shadow-none text-white font-semibold hover:opacity-90" style={{ backgroundImage: 'linear-gradient(to right, #D1AB30, #E8C547)' }}>
              <Link href="/auth">{t('nav.getStarted')}</Link>
            </Button>
          </div>

          <button
            className="md:hidden p-2 rounded-design-button text-design-text-heading hover:bg-gray-100 transition-design"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-2">
              {navigation.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-base font-medium transition-design px-4 py-2 text-white font-semibold hover:opacity-90"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #D1AB30, #E8C547)',
                    borderRadius: getBorderRadius(index),
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t(item.key)}
                </Link>
              ))}

              <div className="pt-4 border-t border-gray-200 flex flex-col gap-2">
                <LanguageToggle variant="muted" />
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/auth">{t('nav.login')}</Link>
                </Button>
                <Button asChild size="sm" className="w-full">
                  <Link href="/auth">{t('nav.register')}</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
