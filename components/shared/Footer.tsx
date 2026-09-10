'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail } from 'lucide-react'
import { useLanguage } from '@/lib/contexts/LanguageContext'

export function Footer() {
  const { t } = useLanguage()
  return (
    <footer dir="ltr" className="bg-design-light text-design-secondary">
      <div className="design-container py-12">
        <div className="flex flex-col items-center gap-8 text-center md:flex-row md:justify-between md:text-left">
          {/* Logo and Info */}
          <div>
            <div className="mb-4 flex justify-center md:justify-start">
              <Image
                src="/assets/img/LOGO.png"
                alt="Hadiyyati"
                width={140}
                height={168}
                className="h-16 w-auto object-contain md:h-[4.5rem]"
              />
            </div>
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <Mail className="h-4 w-4 text-design-secondary" />
              <a href="mailto:info@hadiyyati.me" className="text-design-secondary hover:opacity-80 transition-design">
                info@hadiyyati.me
              </a>
            </div>
            <p className="text-design-secondary mt-2 text-sm">
              <a href="https://www.hadiyyati.me" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-design">
                www.hadiyyati.me
              </a>
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-4 relative z-[100]">
            <Link href="/about" className="text-sm font-medium transition-design px-4 py-2 text-white font-semibold hover:opacity-90" style={{ backgroundImage: 'linear-gradient(to right, #D1AB30, #E8C547)', borderRadius: '50px 0px 0px 50px' }}>
              {t('footer.about')}
            </Link>
            <Link href="/contact" className="text-sm font-medium transition-design px-4 py-2 text-white font-semibold hover:opacity-90" style={{ backgroundImage: 'linear-gradient(to right, #D1AB30, #E8C547)',}}>
              {t('footer.contact')}
            </Link>
            <Link href="/terms" className="text-sm font-medium transition-design px-4 py-2 text-white font-semibold hover:opacity-90" style={{ backgroundImage: 'linear-gradient(to right, #D1AB30, #E8C547)', borderRadius: '0px 50px 50px 0px' }}>
              {t('footer.terms')}
            </Link>
          </div>
        </div>

        <div className="border-t-[3px] border-design-secondary mt-12 pt-8 text-center text-design-secondary">
          © 2025 Hadiyyati Ltd. {t('footer.rights')}
        </div>
      </div>
    </footer>
  )
} 