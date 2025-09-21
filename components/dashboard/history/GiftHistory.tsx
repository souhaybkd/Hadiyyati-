'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { format } from 'date-fns'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { ProfileImage } from "@/components/shared/ProfileImage"
import {
  getGiftHistory,
  getGiftStatistics,
  sendThankYouNote,
  markNotificationAsRead
} from '@/lib/actions/gift-history'
import type {
  GiftHistoryItem,
  GiftStatistics,
} from '@/lib/types/database'
import {
  Search,
  Download,
  Calendar,
  DollarSign,
  Gift,
  Heart,
  Eye,
  MessageSquare,
  Receipt,
  MoreVertical,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

interface GiftHistoryProps {
  initialData?: GiftHistoryItem[]
}

export function GiftHistory({ initialData }: GiftHistoryProps) {
  const [giftHistory, setGiftHistory] = useState<GiftHistoryItem[]>(initialData || [])
  const [statistics, setStatistics] = useState<GiftStatistics | null>(null)
  const [loading, setLoading] = useState(!initialData)
  const [refreshing, setRefreshing] = useState(false)
  const [thankYouNote, setThankYouNote] = useState('')
  const [selectedGift, setSelectedGift] = useState<GiftHistoryItem | null>(null)

  // Refresh data function
  const refreshData = useCallback(async (showRefreshingState = true) => {
    if (showRefreshingState) setRefreshing(true)
    try {
      const [historyData, statsData] = await Promise.all([
        getGiftHistory(),
        getGiftStatistics(),
      ])
      setGiftHistory(historyData)
      setStatistics(statsData)
      console.log('Gift history refreshed:', historyData.length, 'items')
    } catch (error) {
      console.error('Error refreshing gift history:', error)
    } finally {
      if (showRefreshingState) setRefreshing(false)
    }
  }, [])

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [historyData, statsData] = await Promise.all([
          getGiftHistory(),
          getGiftStatistics(),
        ])
        setGiftHistory(historyData)
        setStatistics(statsData)
      } catch (error) {
        console.error('Error loading gift history:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Set up automatic refresh every 30 seconds to catch new payments
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData(false) // Refresh without showing loading state
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [refreshData])

  // Listen for storage events (when user navigates back from payment success)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'payment_completed') {
        console.log('Payment completion detected, refreshing gift history')
        refreshData()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [refreshData])

  // Listen for focus events (when user comes back to the tab)
  useEffect(() => {
    const handleFocus = () => {
      refreshData(false)
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refreshData])

  // Filter and search logic
  const filteredGifts = useMemo(() => {
    return giftHistory
  }, [giftHistory])

  const handleSendThankYou = async (gift: GiftHistoryItem) => {
    if (!thankYouNote.trim() || !gift.otherParty?.id) return

    try {
      const result = await sendThankYouNote(
        gift.order.id,
        gift.otherParty.id,
        thankYouNote,
        false
      )

      if (result.success) {
        setThankYouNote('')
        setSelectedGift(null)
        // Refresh data after sending thank you note
        await refreshData()
      }
    } catch (error) {
      console.error('Error sending thank you note:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'refunded':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <Package className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'failed':
        return 'destructive'
      case 'refunded':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics and Refresh */}
      <div className="flex justify-between items-center">
        <h2 className="text-design-h2 font-bold text-design-text-heading">Gift History</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refreshData()}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {statistics && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gifts Received</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_gifts_received}</div>
              <p className="text-xs text-muted-foreground">
                ${statistics.total_amount_received.toFixed(2)} total received
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.completed_gifts}</div>
              <p className="text-xs text-muted-foreground">
                Successfully processed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gift History List */}
      <div className="space-y-4">
        {filteredGifts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Gift className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No gifts found</h3>
              <p className="text-muted-foreground text-center">
                {'Start sending or receiving gifts to see your history here.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredGifts.map((gift) => (
            <Card key={gift.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {gift.otherParty && (
                      <ProfileImage
                        avatarUrl={gift.otherParty.avatar_url}
                        size="sm"
                      />
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={'secondary'}
                          className="capitalize"
                        >
                          {'Received from'}
                        </Badge>
                        <span className="font-medium">
                          {gift.otherParty?.full_name || gift.otherParty?.username || 'Anonymous'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(gift.order.created_at), 'PPP')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusColor(gift.order.status) as any}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(gift.order.status)}
                        <span className="capitalize">{gift.order.status}</span>
                      </div>
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {gift.receipt && (
                          <DropdownMenuItem>
                            <Receipt className="h-4 w-4 mr-2" />
                            View Receipt
                          </DropdownMenuItem>
                        )}
                        {!gift.thankYouNote && (
                          <DropdownMenuItem onClick={() => setSelectedGift(gift)}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Send Thank You
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Gift Items */}
                <div className="space-y-2">
                  {gift.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{item.title}</h4>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${item.price.toFixed(2)}</p>
                        {(item.quantity || 1) > 1 && (
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity || 1}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gift Message */}
                {gift.order.custom_message && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Gift Message:</p>
                    <p className="text-sm italic">"{gift.order.custom_message}"</p>
                  </div>
                )}

                {/* Thank You Note */}
                {gift.thankYouNote && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium mb-1 text-green-800">Thank You Note:</p>
                    <p className="text-sm text-green-700 italic">"{gift.thankYouNote.message}"</p>
                    <p className="text-xs text-green-600 mt-1">
                      Sent {gift.thankYouNote.sent_at ? format(new Date(gift.thankYouNote.sent_at), 'PPP') : 'Unknown date'}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Total Amount */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="text-lg font-bold">${gift.order.total_amount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Thank You Note Dialog */}
      <AlertDialog open={!!selectedGift} onOpenChange={() => setSelectedGift(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Thank You Note</AlertDialogTitle>
            <AlertDialogDescription>
              Send a thank you message to{' '}
              {selectedGift?.otherParty?.full_name || selectedGift?.otherParty?.username || 'the sender'}{' '}
              for their thoughtful gift.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="thank-you-message">Your message</Label>
            <textarea
              id="thank-you-message"
              className="w-full mt-2 p-3 border rounded-md resize-none"
              rows={4}
              placeholder="Thank you so much for..."
              value={thankYouNote}
              onChange={(e) => setThankYouNote(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setSelectedGift(null)
              setThankYouNote('')
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedGift && handleSendThankYou(selectedGift)}
              disabled={!thankYouNote.trim()}
            >
              Send Thank You
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 