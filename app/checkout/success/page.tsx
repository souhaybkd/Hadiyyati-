'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCart } from '@/lib/contexts/CartContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
  Gift, 
  Mail, 
  User, 
  MessageSquare, 
  Home,
  Download,
  Share2,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

interface OrderDetails {
  id: string
  status: string
  amount_total: number
  customer_email: string
  metadata: {
    custom_message?: string
    is_gift?: string
    user_id?: string
    wishlist_owner_ids?: string
  }
  line_items: Array<{
    description: string
    quantity: number
    amount_total: number
  }>
}

function SuccessContent() {
  const { clearCart } = useCart()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams?.get('session_id')
  
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!sessionId) {
        setError('No session ID provided')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/checkout/success?session_id=${sessionId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch order details')
        }

        setOrderDetails(data)
        // Clear the cart after successful payment
        clearCart()
        
        // Trigger storage event to notify other tabs to refresh dashboard
        localStorage.setItem('payment_completed', Date.now().toString())
        console.log('Payment completion event triggered for dashboard refresh')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetails()
  }, [sessionId, clearCart])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <Loader2 className="h-16 w-16 mx-auto mb-6 animate-spin text-primary" />
          <h1 className="text-2xl font-bold mb-4">Processing your order...</h1>
          <p className="text-muted-foreground">
            Please wait while we confirm your payment.
          </p>
        </div>
      </div>
    )
  }

  if (error || !orderDetails) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-destructive/10 rounded-full flex items-center justify-center">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-muted-foreground mb-8">
            {error || 'Unable to retrieve order details'}
          </p>
          <Link href="/">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const isGift = orderDetails.metadata.is_gift === 'true'
  const customMessage = orderDetails.metadata.custom_message

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground">
            {isGift ? 'Your gift has been sent!' : 'Thank you for your purchase!'}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
              <CardDescription>Order #{orderDetails.id.slice(-8)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {orderDetails.line_items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Gift className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-medium">${(item.amount_total / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center font-medium text-lg">
                <span>Total Paid</span>
                <span>${(orderDetails.amount_total / 100).toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {orderDetails.status === 'complete' ? 'Completed' : 'Processing'}
                </Badge>
                {isGift && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                    Gift
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Gift Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                {isGift ? 'Gift Information' : 'Purchase Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {customMessage && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {isGift ? 'Gift Message' : 'Personal Note'}
                      </p>
                      <p className="text-sm">{customMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  {isGift 
                    ? 'The wishlist owner will receive an email notification about this gift along with your message.'
                    : 'You will receive an email confirmation shortly.'
                  }
                </p>
              </div>

              {isGift && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">What happens next?</h4>
                  <div className="space-y-1 text-sm text-purple-700">
                    <p>• The wishlist owner gets notified about your gift</p>
                    <p>• They can see your message and coordinate delivery</p>
                    <p>• Items are marked as purchased on their wishlist</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>



        {/* Additional Information */}
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold">Thank you for using Hadiaytti!</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <p>• Email confirmation sent</p>
                  <p>• {isGift ? 'Gift notification sent to wishlist owner' : 'Order processing begins'}</p>
                </div>
                <div>
                  <p>• Payment receipt available</p>
                  <p>• Support available 24/7</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <Loader2 className="h-16 w-16 mx-auto mb-6 animate-spin text-primary" />
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
} 