'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function CTA() {
  return (
    <div className="design-section-spacing bg-design-primary">
      <div className="design-container">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-design-h2 font-bold mb-4 text-white">
            Start Your Wishlist Today
          </h2>
          <p className="text-lg mb-8 text-white max-w-2xl mx-auto">
            Create and share your perfect wishlist in minutes. It's free, easy, and the best way to get the gifts you truly want.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="px-8 py-6 text-lg group shadow-none rounded-full text-white font-semibold hover:opacity-90" style={{ backgroundImage: 'linear-gradient(to right, #D1AB30, #E8C547)' }}>
              <Link href="/auth">
                Get Started for Free
                <ArrowRight className="ml-2 h-5 w-5 transition-design group-hover:translate-x-1" />
              </Link>
            </Button>

          </div>
        </div>
      </div>
    </div>
  )
} 