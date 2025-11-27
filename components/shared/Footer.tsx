'use client'

import React from 'react'
import Link from 'next/link'
import { Gift, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-design-light text-design-secondary">
      <div className="design-container py-12">
        <div className="flex flex-col items-center gap-8 text-center md:flex-row md:justify-between md:text-left">
          {/* Logo and Info */}
          <div>
            <div className="mb-4 flex items-center justify-center gap-2 md:justify-start">
              <Gift className="h-6 w-6 text-design-secondary" />
              <span className="text-xl font-bold text-design-secondary">Hadiyyati</span>
            </div>
            <p className="text-design-secondary mb-2 max-w-md">5, Brayford Square, London, E1 0SG, UNITED KINGDOM</p>
            <p className="text-design-secondary mb-2 text-sm">Company Number: 16762322</p>
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <Mail className="h-4 w-4 text-design-secondary" />
              <a href="mailto:info@hadiyyati.com" className="text-design-secondary hover:opacity-80 transition-design">
                info@hadiyyati.com
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
              About
            </Link>
            <Link href="/contact" className="text-sm font-medium transition-design px-4 py-2 text-white font-semibold hover:opacity-90" style={{ backgroundImage: 'linear-gradient(to right, #D1AB30, #E8C547)',}}>
              Contact
            </Link>
            <Link href="/terms" className="text-sm font-medium transition-design px-4 py-2 text-white font-semibold hover:opacity-90" style={{ backgroundImage: 'linear-gradient(to right, #D1AB30, #E8C547)', borderRadius: '0px 50px 50px 0px' }}>
              Terms
            </Link>
          </div>
        </div>

        <div className="border-t-[3px] border-design-secondary mt-12 pt-8 text-center text-design-secondary">
          © 2025 Hadiyyati Ltd. All rights reserved.
        </div>
      </div>
    </footer>
  )
} 