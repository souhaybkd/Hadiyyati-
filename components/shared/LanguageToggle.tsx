'use client'

import React from 'react'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Languages, Check } from 'lucide-react'

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Languages className="h-4 w-4" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage('en')}>
          <div className="flex items-center gap-2">
            {language === 'en' && <Check className="h-4 w-4" />}
            <span>English</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage('ar')}>
          <div className="flex items-center gap-2">
            {language === 'ar' && <Check className="h-4 w-4" />}
            <span>العربية</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 