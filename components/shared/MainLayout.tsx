'use client'

import { usePathname } from 'next/navigation'
import { Navbar, Footer } from '@/components/shared'
import { CartSidebar } from '@/components/wishlist/CartSidebar'

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDashboardPage = pathname?.startsWith('/dashboard')
  const isAdminPage = pathname?.startsWith('/admin')
  const isWishlistPage = pathname?.startsWith('/wishlist')

  // The DashboardLayout provides its own nav and structure
  // Wishlist pages have their own custom layout
  if (isDashboardPage || isWishlistPage || isAdminPage) {
    return (
      <>
        {children}
        <CartSidebar />
      </>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 design-container">
        {children}
      </main>
      <Footer />
      <CartSidebar />
    </div>
  )
} 