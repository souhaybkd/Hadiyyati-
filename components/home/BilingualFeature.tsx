'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Globe, Check, Languages } from 'lucide-react'

export function BilingualFeature() {
  const features = [
    {
      text: 'Complete Arabic language support with proper RTL text direction',
      icon: Check
    },
    {
      text: 'Seamless English interface with LTR text direction',
      icon: Check
    },
    {
      text: 'Automatic language detection and easy switching between languages',
      icon: Check
    }
  ]

  return (
    <div className="design-section-spacing bg-white">
      <div className="design-container">
        <div className="grid lg:grid-cols-2 gap-design-grid items-center">
         



        </div>
      </div>
    </div>
  )
} 