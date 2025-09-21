'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import { LanguageToggle } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Gift, Menu, X } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Contact', href: '/contact' },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <nav className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 sticky top-0 z-50 border-b border-design-gray-200 shadow-design-light">
      <div className="design-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-design-primary/10 rounded-lg flex items-center justify-center group-hover:bg-design-primary/20 transition-design">
              <Gift className="h-5 w-5 text-design-primary" />
            </div>
            <span className="text-xl font-bold text-design-text-heading">Hadiaytti</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-design hover:text-design-primary ${
                  isActive(item.href) 
                    ? 'text-design-primary font-semibold' 
                    : 'text-design-text-muted'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* <LanguageToggle /> */}

            <Button asChild size="sm">
              <Link href="/auth">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-design-button text-design-text-heading hover:bg-design-gray-100 transition-design"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-design-gray-200">
            <div className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-base font-medium transition-design hover:text-design-primary ${
                    isActive(item.href) 
                      ? 'text-design-primary font-semibold' 
                      : 'text-design-text-muted'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              <div className="pt-4 border-t border-design-gray-200">
                <div className="flex flex-col space-y-2">
                  <LanguageToggle />
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/auth">Login</Link>
                  </Button>
                  <Button asChild size="sm" className="w-full">
                    <Link href="/auth">Sign Up</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
} 