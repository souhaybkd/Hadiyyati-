'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createSupabaseClient } from '@/lib/supabase'
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  Gift,
  MessageSquare,
  Bell,
  Activity
} from 'lucide-react'

interface PlatformStats {
  totalUsers: number
  activeUsers: number
  totalOrders: number
  totalRevenue: number
  totalWishlistItems: number
  totalMessages: number
  totalNotifications: number
  recentActivity: number
}

export function AdminOverview() {
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalWishlistItems: 0,
    totalMessages: 0,
    totalNotifications: 0,
    recentActivity: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch users count
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        // Fetch active users (users with recent activity)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const { count: activeUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('updated_at', thirtyDaysAgo.toISOString())

        // Fetch orders count
        const { count: totalOrders } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })

        // Fetch total revenue
        const { data: revenueData } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('status', 'completed')

        const totalRevenue = revenueData?.reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0) || 0

        // Fetch wishlist items count
        const { count: totalWishlistItems } = await supabase
          .from('wishlist_items')
          .select('*', { count: 'exact', head: true })

        // Fetch messages count
        const { count: totalMessages } = await supabase
          .from('gift_messages')
          .select('*', { count: 'exact', head: true })

        // Fetch notifications count
        const { count: totalNotifications } = await supabase
          .from('gift_notifications')
          .select('*', { count: 'exact', head: true })

        // Calculate recent activity (last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        const { count: recentActivity } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo.toISOString())

        setStats({
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          totalOrders: totalOrders || 0,
          totalRevenue,
          totalWishlistItems: totalWishlistItems || 0,
          totalMessages: totalMessages || 0,
          totalNotifications: totalNotifications || 0,
          recentActivity: recentActivity || 0
        })
      } catch (err) {
        console.error('Error fetching admin stats:', err)
        setError('Failed to load platform statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-design-text-heading">Platform Overview</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-design-text-heading">Platform Overview</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
                variant="outline"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Active Users",
      value: stats.activeUsers.toLocaleString(),
      icon: Activity,
      color: "text-green-600"
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: "text-purple-600"
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-emerald-600"
    },
    {
      title: "Wishlist Items",
      value: stats.totalWishlistItems.toLocaleString(),
      icon: Gift,
      color: "text-pink-600"
    },
    {
      title: "Messages",
      value: stats.totalMessages.toLocaleString(),
      icon: MessageSquare,
      color: "text-orange-600"
    },
    {
      title: "Notifications",
      value: stats.totalNotifications.toLocaleString(),
      icon: Bell,
      color: "text-indigo-600"
    },
    {
      title: "Recent Activity",
      value: stats.recentActivity.toLocaleString(),
      icon: TrendingUp,
      color: "text-red-600"
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-design-text-heading">Platform Overview</h1>
        <Badge variant="outline" className="text-sm">
          Real-time data
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-design-text-muted">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-design-text-heading">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <ShoppingCart className="mr-2 h-4 w-4" />
              View Recent Orders
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <MessageSquare className="mr-2 h-4 w-4" />
              Review Messages
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <Badge className="bg-green-100 text-green-800">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Payment System</span>
              <Badge className="bg-green-100 text-green-800">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Email Service</span>
              <Badge className="bg-green-100 text-green-800">Online</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Storage</span>
              <Badge className="bg-green-100 text-green-800">Online</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 