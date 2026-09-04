'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AuthProvider } from './AuthProvider'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { 
  Package2,
  Heart,
  BarChart3,
  History,
  DollarSign,
  User,
  Menu
} from 'lucide-react'

import { LanguageToggle } from '@/components/shared'
import { useLanguage } from '@/lib/contexts/LanguageContext'

const navigation = [
  { key: 'dash.wishlist', tab: 'wishlist', icon: Heart },
  { key: 'dash.analytics', tab: 'analytics', icon: BarChart3 },
  { key: 'dash.history', tab: 'history', icon: History },
  { key: 'dash.payouts', tab: 'payouts', icon: DollarSign },
  { key: 'dash.profile', tab: 'profile', icon: User },
]

function SidebarNav({ className }: { className?: string }) {
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useState('wishlist');
  const { t } = useLanguage()

  useEffect(() => {
    const tab = searchParams?.get('tab') || 'wishlist';
    setCurrentTab(tab);
  }, [searchParams]);

  return (
    <nav className={className}>
      <ul className="space-y-2">
        {navigation.map((item) => (
          <li key={item.tab}>
            <Link
              href={`/dashboard?tab=${item.tab}`}
              scroll={false}
              className={`flex items-center gap-3 px-4 py-3 rounded-design-button text-design-body transition-design ${
                (currentTab === item.tab || (!currentTab && item.tab === 'wishlist'))
                  ? 'bg-design-primary text-white shadow-design-light'
                  : 'text-design-text-muted hover:bg-design-gray-100 hover:text-design-text-heading'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {t(item.key)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage()

  return (
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-e bg-design-light border-design-gray-200 md:block md:sticky md:top-0 md:h-screen">
          <div className="flex h-full flex-col gap-2">
            <div className="flex h-16 items-center justify-between border-b border-design-gray-200 px-4 lg:h-[60px] lg:px-6">
              <Link href="/" className="flex items-center gap-2 font-semibold text-design-text-heading">
                <Package2 className="h-6 w-6 text-design-primary" />
                <span className="">hadiyyati</span>
              </Link>
              <LanguageToggle variant="muted" />
            </div>
            <div className="flex-1 p-4">
              <SidebarNav />
            </div>
            <div className="mt-auto p-4">
              {/* Logout moved to profile page */}
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <header className="flex h-16 items-center gap-4 border-b bg-design-light border-design-gray-200 px-4 lg:h-[60px] lg:px-6 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">{t('dash.nav')}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <SheetHeader>
                  <SheetTitle>{t('dash.nav')}</SheetTitle>
                </SheetHeader>
                <SidebarNav className="mt-8"/>
              </SheetContent>
            </Sheet>
            <div className="w-full flex-1 flex items-center justify-center">
              <Link href="/" className="flex items-center gap-2 font-semibold text-design-text-heading">
                <Package2 className="h-6 w-6 text-design-primary" />
                <span className="text-lg">hadiyyati</span>
              </Link>
            </div>
            <LanguageToggle variant="muted" />
          </header>
          <main className="flex flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6 bg-white">
            {children}
          </main>
        </div>
      </div>
  );
} 