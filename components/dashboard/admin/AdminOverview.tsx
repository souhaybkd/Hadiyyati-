'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getAdminQueueStats, type AdminQueueStats } from '@/lib/actions/admin'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import {
  ShoppingCart,
  AlertTriangle,
  CreditCard,
  ShieldAlert,
  UserCheck,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

const emptyQueue: AdminQueueStats = {
  pendingOrders: 0,
  failedOrders: 0,
  failedWhishPayments: 0,
  failedStripePayments: 0,
  kycPendingReview: 0,
  watchlistHits: 0,
  error: null,
}

type QueueCard = {
  titleKey: string
  descKey: string
  count: number
  href: string
  icon: typeof ShoppingCart
  accent: string
  urgent?: boolean
}

export function AdminOverview() {
  const { t } = useLanguage()
  const [stats, setStats] = useState<AdminQueueStats>(emptyQueue)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const result = await getAdminQueueStats()
    setStats(result)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const queueCards: QueueCard[] = [
    {
      titleKey: 'admin.queue.pendingOrders',
      descKey: 'admin.queue.pendingOrdersDesc',
      count: stats.pendingOrders,
      href: '/admin?tab=orders&status=pending',
      icon: ShoppingCart,
      accent: 'text-amber-600',
      urgent: stats.pendingOrders > 0,
    },
    {
      titleKey: 'admin.queue.failedOrders',
      descKey: 'admin.queue.failedOrdersDesc',
      count: stats.failedOrders,
      href: '/admin?tab=orders&status=failed',
      icon: AlertTriangle,
      accent: 'text-red-600',
      urgent: stats.failedOrders > 0,
    },
    {
      titleKey: 'admin.queue.failedWhish',
      descKey: 'admin.queue.failedWhishDesc',
      count: stats.failedWhishPayments,
      href: '/admin?tab=transactions&gateway=whish&status=failed',
      icon: CreditCard,
      accent: 'text-orange-600',
      urgent: stats.failedWhishPayments > 0,
    },
    {
      titleKey: 'admin.queue.failedStripe',
      descKey: 'admin.queue.failedStripeDesc',
      count: stats.failedStripePayments,
      href: '/admin?tab=transactions&gateway=stripe&status=failed',
      icon: CreditCard,
      accent: 'text-rose-600',
      urgent: stats.failedStripePayments > 0,
    },
    {
      titleKey: 'admin.queue.kycReview',
      descKey: 'admin.queue.kycReviewDesc',
      count: stats.kycPendingReview,
      href: '/admin?tab=compliance&filter=kyc_issues',
      icon: UserCheck,
      accent: 'text-blue-600',
      urgent: stats.kycPendingReview > 0,
    },
    {
      titleKey: 'admin.queue.watchlist',
      descKey: 'admin.queue.watchlistDesc',
      count: stats.watchlistHits,
      href: '/admin?tab=compliance&filter=watchlist_hit',
      icon: ShieldAlert,
      accent: 'text-purple-600',
      urgent: stats.watchlistHits > 0,
    },
  ]

  // Stripe failed orders are a subset of failed orders — avoid double-counting in the header badge.
  const totalAttention =
    stats.pendingOrders +
    stats.failedOrders +
    stats.failedWhishPayments +
    stats.kycPendingReview +
    stats.watchlistHits

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-design-text-heading">{t('admin.queue.title')}</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (stats.error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-design-text-heading">{t('admin.queue.title')}</h1>
        <Card>
          <CardContent className="pt-6 text-center text-red-600">
            <p>{stats.error}</p>
            <Button onClick={load} className="mt-4" variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('admin.queue.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-design-text-heading">{t('admin.queue.title')}</h1>
          <p className="mt-1 text-design-text-muted">{t('admin.queue.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('admin.queue.refresh')}
          </Button>
          {totalAttention === 0 ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {t('admin.queue.allClear')}
            </Badge>
          ) : (
            <Badge variant="destructive">
              {t('admin.queue.needsAttention', { count: totalAttention })}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {queueCards.map((card) => (
          <Link key={card.href} href={card.href} className="group block">
            <Card
              className={`h-full transition-shadow hover:shadow-lg ${
                card.urgent ? 'border-design-primary/30' : ''
              }`}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium text-design-text-heading">
                    {t(card.titleKey)}
                  </CardTitle>
                  <CardDescription className="text-xs">{t(card.descKey)}</CardDescription>
                </div>
                <card.icon className={`h-5 w-5 shrink-0 ${card.accent}`} />
              </CardHeader>
              <CardContent className="flex items-end justify-between">
                <span className="text-3xl font-bold text-design-text-heading">{card.count}</span>
                <span className="flex items-center text-sm text-design-primary opacity-0 transition-opacity group-hover:opacity-100">
                  {t('admin.queue.open')}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
