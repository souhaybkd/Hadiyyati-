'use client'

import React from 'react'
import Link from 'next/link'
import { Gift, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-design-light text-design-text-body">
      <div className="design-container py-12">
        <div className="flex flex-col items-center gap-8 text-center md:flex-row md:justify-between md:text-left">
          {/* Logo and Info */}
          <div>
            <div className="mb-4 flex items-center justify-center gap-2 md:justify-start">
              <Gift className="h-6 w-6 text-design-primary" />
              <span className="text-xl font-bold text-design-text-heading">Hadiaytti</span>
            </div>
            <p className="text-design-text-muted mb-2 max-w-md">Level 1, 12 Sample St, Sydney NSW 2000</p>
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <Mail className="h-4 w-4 text-design-primary" />
              <a href="mailto:contact@hadiaytti.com" className="text-design-text-muted hover:text-design-primary transition-design">
                contact@hadiaytti.com
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-4">
            <Link href="/about" className="text-design-text-body hover:text-design-primary transition-design">
              About
            </Link>
            <Link href="/contact" className="text-design-text-body hover:text-design-primary transition-design">
              Contact
            </Link>
            <Link href="/terms" className="text-design-text-body hover:text-design-primary transition-design">
              Terms
            </Link>
            <Link href="/privacy" className="text-design-text-body hover:text-design-primary transition-design">
              Privacy
            </Link>
          </div>
        </div>

        <div className="border-t border-design-gray-200 mt-12 pt-8 text-center text-design-text-muted">
          © 2024 Hadiaytti. All rights reserved.
        </div>
      </div>
    </footer>
  )
} 