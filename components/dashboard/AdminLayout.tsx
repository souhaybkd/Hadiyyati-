'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { AuthProvider } from './AuthProvider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { 
  Package,
  Package2,
  Users,
  Settings,
  BarChart3,
  ShoppingCart,
  DollarSign,
  Shield,
  Gift,
  Menu,
  Bell,
  Database
} from 'lucide-react'

const adminNavigation = [
  { name: 'Overview', tab: 'overview', icon: BarChart3 },
  { name: 'Users', tab: 'users', icon: Users },
  { name: 'Orders', tab: 'orders', icon: ShoppingCart },
  { name: 'Transactions', tab: 'transactions', icon: DollarSign },
  { name: 'Notifications', tab: 'notifications', icon: Bell },
  { name: 'Platform Settings', tab: 'settings', icon: Settings },
]

function AdminSidebarNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAdminDashboard = pathname === '/admin';
  const [currentTab, setCurrentTab] = useState('overview');

  useEffect(() => {
    const tab = searchParams?.get('tab') || 'overview';
    setCurrentTab(tab);
  }, [searchParams]);

  return (
    <nav className={className}>
      <ul className="space-y-2">
        {adminNavigation.map((item) => (
          <li key={item.name}>
            <Link
              href={`/admin?tab=${item.tab}`}
              scroll={false}
              className={`flex items-center gap-3 px-4 py-3 rounded-design-button text-design-body transition-design ${
                (currentTab === item.tab || (!currentTab && item.tab === 'overview'))
                  ? 'bg-design-primary text-white shadow-design-light'
                  : 'text-design-text-muted hover:bg-design-gray-100 hover:text-design-text-heading'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-design-light border-design-gray-200 md:block md:sticky md:top-0 md:h-screen">
          <div className="flex h-full flex-col gap-2">
            <div className="flex h-16 items-center border-b border-design-gray-200 px-4 lg:h-[60px] lg:px-6">
              <Link href="/" className="flex items-center gap-2 font-semibold text-design-text-heading">
                <Shield className="h-6 w-6 text-design-primary" />
                <span className="">Admin Panel</span>
              </Link>
            </div>
            <div className="flex-1 p-4">
              <AdminSidebarNav />
            </div>
            <div className="mt-auto p-4">
              <div className="flex items-center gap-2 text-sm text-design-text-muted">
                <Database className="h-4 w-4" />
                <span>Platform Management</span>
              </div>
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
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <SheetHeader>
                  <SheetTitle>Admin Menu</SheetTitle>
                </SheetHeader>
                <AdminSidebarNav className="mt-8"/>
              </SheetContent>
            </Sheet>
            <div className="w-full flex-1 flex items-center justify-center">
              <Link href="/" className="flex items-center gap-2 font-semibold text-design-text-heading">
                <Shield className="h-6 w-6 text-design-primary" />
                <span className="text-lg">Admin Panel</span>
              </Link>
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6 bg-white">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
} 