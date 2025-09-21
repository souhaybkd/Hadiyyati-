'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ProfileImage } from "@/components/shared/ProfileImage"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  getOrdersForAdmin, 
  getOrderDetailsForAdmin, 
  updateOrderStatus 
} from '@/lib/actions/admin'
import type { DetailedOrder } from '@/lib/types/database'
import { 
  ShoppingCart, 
  Search, 
  Calendar, 
  DollarSign, 
  User, 
  Package, 
  Eye,
  Edit,
  RefreshCw,
  Mail,
  MessageSquare,
  Gift,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react'

export function OrderManagement() {
  const [orders, setOrders] = useState<DetailedOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed' | 'refunded'>('all')
  const [selectedOrder, setSelectedOrder] = useState<DetailedOrder | null>(null)
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false)
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  const fetchOrders = useCallback(async (showRefreshing = true) => {
    try {
      if (showRefreshing) setRefreshing(true)
      const result = await getOrdersForAdmin({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
        limit: 100
      })
      
      if (result.data) {
        setOrders(result.data)
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      if (showRefreshing) setRefreshing(false)
    }
  }, [statusFilter, searchTerm])

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true)
      await fetchOrders(false)
      setLoading(false)
    }
    loadOrders()
  }, [fetchOrders])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(false)
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const handleViewDetails = async (order: DetailedOrder) => {
    setSelectedOrder(order)
    setNewStatus(order.status)
    setAdminNotes(order.admin_notes || '')
    
    // Fetch full order details
    try {
      setOrderDetailsLoading(true)
      const detailedOrder = await getOrderDetailsForAdmin(order.id)
      setSelectedOrder(detailedOrder)
    } catch (error) {
      console.error('Error fetching order details:', error)
    } finally {
      setOrderDetailsLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return
    
    try {
      setStatusUpdateLoading(true)
      await updateOrderStatus(selectedOrder.id, newStatus, adminNotes)
      
      // Refresh orders and close dialog
      await fetchOrders()
      setSelectedOrder(null)
    } catch (error) {
      console.error('Error updating order status:', error)
    } finally {
      setStatusUpdateLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => 
    order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.stripe_session_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.buyer?.full_name && order.buyer.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (order.buyer?.username && order.buyer.username.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        )
      case 'refunded':
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Refunded
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
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

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-design-text-heading">Order Management</h1>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">{filteredOrders.length} orders</Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchOrders()}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Orders Overview
          </CardTitle>
          <div className="flex gap-4 pt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search orders, customers, emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'completed', 'failed', 'refunded'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status as any)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Details</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Receiver(s)</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-mono text-sm font-medium">
                        {order.id.slice(0, 8)}...
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {order.order_items?.length || 0} item(s)
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {order.buyer && (
                        <>
                          <ProfileImage 
                            avatarUrl={order.buyer.avatar_url} 
                            size="sm"
                          />
                          <div>
                            <div className="font-medium text-sm">{order.buyer.full_name}</div>
                            <div className="text-xs text-muted-foreground">@{order.buyer.username}</div>
                          </div>
                        </>
                      )}
                      {!order.buyer && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{order.customer_email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.is_gift && order.receivers.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-500" />
                        <div>
                          <div className="font-medium text-sm">
                            {order.receivers[0].full_name}
                          </div>
                          {order.receivers.length > 1 && (
                            <div className="text-xs text-muted-foreground">
                              +{order.receivers.length - 1} more
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">-</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        ${order.total_amount.toFixed(2)} {order.currency.toUpperCase()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    {order.is_gift ? (
                      <Badge variant="secondary">
                        <Gift className="w-3 h-3 mr-1" />
                        Gift
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <Package className="w-3 h-3 mr-1" />
                        Purchase
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(order.created_at), 'MMM dd, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(order)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            {getStatusIcon(selectedOrder?.status || '')}
                            Order Details - {selectedOrder?.id.slice(0, 8)}...
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Complete order information and management options
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        
                        {orderDetailsLoading ? (
                          <div className="text-center py-8">Loading order details...</div>
                        ) : selectedOrder && (
                          <OrderDetailsView 
                            order={selectedOrder}
                            newStatus={newStatus}
                            setNewStatus={setNewStatus}
                            adminNotes={adminNotes}
                            setAdminNotes={setAdminNotes}
                            onStatusUpdate={handleStatusUpdate}
                            statusUpdateLoading={statusUpdateLoading}
                          />
                        )}
                        
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setSelectedOrder(null)}>
                            Close
                          </AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-design-text-muted">
              No orders found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Order Details Component
function OrderDetailsView({ 
  order, 
  newStatus, 
  setNewStatus, 
  adminNotes, 
  setAdminNotes, 
  onStatusUpdate, 
  statusUpdateLoading 
}: {
  order: DetailedOrder
  newStatus: string
  setNewStatus: (status: string) => void
  adminNotes: string
  setAdminNotes: (notes: string) => void
  onStatusUpdate: () => void
  statusUpdateLoading: boolean
}) {
  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order ID:</span>
              <span className="font-mono">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stripe Session:</span>
              <span className="font-mono text-sm">{order.stripe_session_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-semibold">${order.total_amount.toFixed(2)} {order.currency.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span>{format(new Date(order.created_at), 'PPP p')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Updated:</span>
              <span>{format(new Date(order.updated_at), 'PPP p')}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span>{order.customer_email}</span>
            </div>
            {order.buyer && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Buyer:</span>
                  <div className="flex items-center gap-2">
                    <ProfileImage avatarUrl={order.buyer.avatar_url} size="sm" />
                    <div className="text-right">
                      <div className="font-medium">{order.buyer.full_name}</div>
                      <div className="text-sm text-muted-foreground">@{order.buyer.username}</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Receivers (if gift) */}
      {order.is_gift && order.receivers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Gift Recipients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {order.receivers.map((receiver) => (
                <div key={receiver.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <ProfileImage avatarUrl={receiver.avatar_url} size="sm" />
                  <div>
                    <div className="font-medium">{receiver.full_name}</div>
                    <div className="text-sm text-muted-foreground">@{receiver.username}</div>
                    <div className="text-xs text-muted-foreground">{receiver.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                {item.image_url && (
                  <img 
                    src={item.image_url} 
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-medium">{item.title}</h4>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-semibold">${item.price.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Qty: {item.quantity || 1}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Message */}
      {order.custom_message && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Gift Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm italic p-3 bg-muted rounded-lg">"{order.custom_message}"</p>
          </CardContent>
        </Card>
      )}

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Admin Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Update Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal notes about this order..."
                rows={3}
              />
            </div>
          </div>
          <Button 
            onClick={onStatusUpdate}
            disabled={statusUpdateLoading || newStatus === order.status}
            className="w-full"
          >
            {statusUpdateLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Order'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 