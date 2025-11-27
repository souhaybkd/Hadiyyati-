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

  const getBorderRadius = (name: string) => {
    if (name === 'Home') return '50px 0px 0px 50px'
    if (name === 'Dashboard') return '0'
    if (name === 'Contact') return '0px 50px 50px 0px'
    return '0'
  }

  return (
    <nav className="bg-design-primary sticky top-0 z-50 border-b border-design-primary">
      <div className="design-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-design">
              <Gift className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Hadiyyati</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-0 gap-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium transition-design px-4 py-2 text-white font-semibold hover:opacity-90"
                style={{
                  backgroundImage: 'linear-gradient(to right, #D1AB30, #E8C547)',
                  borderRadius: getBorderRadius(item.name)
                }}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4 relative z-[9999]">
            {/* <LanguageToggle /> */}

            <Button asChild size="sm" className="rounded-full shadow-none text-white font-semibold hover:opacity-90" style={{ backgroundImage: 'linear-gradient(to right, #D1AB30, #E8C547)' }}>
              <Link href="/auth">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-design-button text-white hover:bg-white/20 transition-design"
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
          <div className="md:hidden py-4 border-t border-white/20">
            <div className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-base font-medium transition-design px-4 py-2 text-white font-semibold hover:opacity-90"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #D1AB30, #E8C547)',
                    borderRadius: getBorderRadius(item.name)
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              <div className="pt-4 border-t border-white/20">
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