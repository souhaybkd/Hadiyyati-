import './globals.css'
import type { Metadata } from 'next'
import { Bricolage_Grotesque } from 'next/font/google'
import { LanguageProvider } from '@/lib/contexts/LanguageContext'
import { CartProvider } from '@/lib/contexts/CartContext'
import { MainLayout } from '@/components/shared'
import { Toaster } from '@/components/ui'

const favicon = '/assets/img/Web-ICON-1.png'

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bricolage',
})

export const metadata: Metadata = {
  title: 'hadiyyati - Gift-Giving Platform',
  description: 'A bilingual gift-giving platform connecting gift-givers with recipients',
  icons: {
    icon: favicon,
    shortcut: favicon,
    apple: favicon,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={bricolage.className} suppressHydrationWarning={true}>
        <LanguageProvider>
          <CartProvider>
            <MainLayout>{children}</MainLayout>
            <Toaster />
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  )
} 