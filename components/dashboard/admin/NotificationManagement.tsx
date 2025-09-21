'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Gift, 
  Loader2,
  AlertCircle,
  DollarSign
} from 'lucide-react'
import {
  getGiftNotifications,
  type GiftNotificationWithDetails
} from '@/lib/actions/notifications'

export function NotificationManagement() {
  const [notifications, setNotifications] = useState<GiftNotificationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const notificationData = await getGiftNotifications(1, 50, 'all')
      setNotifications(notificationData.notifications)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getNotificationMessage = (notification: GiftNotificationWithDetails) => {
    const senderName = notification.sender_name || 'Someone'
    const recipientName = notification.recipient_name || notification.recipient_username || 'Unknown'
    return `${senderName} sent a gift to ${recipientName}`
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-design-text-heading">Gift Notifications</h1>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-design-text-heading">Gift Notifications</h1>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Recent Gift Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No gift notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Gift className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">
                          {getNotificationMessage(notification)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    {notification.order_total && (
                      <div className="flex items-center gap-1 text-green-600 font-semibold">
                        <DollarSign className="h-4 w-4" />
                        <span>${notification.order_total}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 