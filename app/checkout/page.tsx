'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/contexts/CartContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  Gift, 
  CreditCard, 
  ArrowLeft, 
  Loader2, 
  Heart,
  MessageSquare,
  User,
  Mail,
  Trash2,
  Plus,
  Minus
} from 'lucide-react'
import Link from 'next/link'

interface CheckoutForm {
  customMessage: string
  isGift: boolean
}

export default function CheckoutPage() {
  const { cartItems, removeFromCart, clearCart } = useCart()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<CheckoutForm>({
    customMessage: '',
    isGift: false
  })

  // Calculate totals
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  const tax = subtotal * 0.08 // 8% tax rate
  const total = subtotal + tax

  // Get unique wishlist owners for gift recipients
  const wishlistOwners = Array.from(new Set(
    cartItems
      .filter(item => item.wishlist_owner_name)
      .map(item => item.wishlist_owner_name)
  ))

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      setError('Your cart is empty')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems,
          customMessage: form.customMessage,
          isGift: form.isGift
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingCart className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-8">
            Add some items to your cart to continue with checkout.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-start gap-4 mb-8">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Checkout</h1>
            <p className="text-muted-foreground">Complete your gift purchase</p>
          </div>
        </div>

        {/* Gift Recipients Section */}
        {wishlistOwners.length > 0 && (
          <Card className="mb-8 border-2 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-primary">
                    You're gifting to:
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    These items will be sent as gifts
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {wishlistOwners.map((ownerName, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
                    <User className="h-4 w-4 mr-1" />
                    {ownerName}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Cart Items & Gift Options */}
          <div className="space-y-6">
            {/* Cart Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Your Cart ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <Gift className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{item.title}</h3>
                      {item.wishlist_owner_name && (
                        <p className="text-sm text-primary font-medium mb-1">
                          <Gift className="h-3 w-3 inline mr-1" />
                          Gift for {item.wishlist_owner_name}
                        </p>
                      )}
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-medium">${item.price.toFixed(2)}</span>
                        <Badge variant="secondary">Qty: {item.quantity}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Gift Message */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Gift Message
                </CardTitle>
                <CardDescription>
                  Add a personal message for the wishlist owner
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isGift"
                    name="isGift"
                    checked={form.isGift}
                    onChange={handleInputChange}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isGift">Include a gift message</Label>
                </div>

                {form.isGift && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="customMessage">
                        <MessageSquare className="h-4 w-4 inline mr-2" />
                        Your Message
                      </Label>
                      <Textarea
                        id="customMessage"
                        name="customMessage"
                        value={form.customMessage}
                        onChange={handleInputChange}
                        placeholder="Write a heartfelt message for the wishlist owner..."
                        rows={4}
                        maxLength={500}
                      />
                      <p className="text-xs text-muted-foreground">
                        {form.customMessage.length}/500 characters
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        The wishlist owner will receive your message along with the gift notification.
                      </p>
                    </div>
                  </div>
                )}

                {!form.isGift && (
                  <div className="space-y-2">
                    <Label htmlFor="customMessage">
                      <MessageSquare className="h-4 w-4 inline mr-2" />
                      Personal Note (Optional)
                    </Label>
                    <Textarea
                      id="customMessage"
                      name="customMessage"
                      value={form.customMessage}
                      onChange={handleInputChange}
                      placeholder="Add a personal note to your purchase..."
                      rows={3}
                      maxLength={500}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {wishlistOwners.length > 0 ? 'Gift Order Summary' : 'Order Summary'}
                </CardTitle>
                {wishlistOwners.length > 0 && (
                  <CardDescription>
                    {wishlistOwners.length === 1 
                      ? `Gifting to ${wishlistOwners[0]}`
                      : `Gifting to ${wishlistOwners.length} people`
                    }
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    {error}
                  </div>
                )}

                <Button 
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      {wishlistOwners.length > 0 ? 'Send Gift' : 'Proceed to Payment'}
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Secure checkout powered by Stripe
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Gift Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  {wishlistOwners.length > 0 ? 'How gifting works' : 'How it works'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {wishlistOwners.length > 0 ? (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-primary">1</span>
                      </div>
                      <p>You purchase these items as gifts for {wishlistOwners.length === 1 ? wishlistOwners[0] : `${wishlistOwners.length} people`}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-primary">2</span>
                      </div>
                      <p>{wishlistOwners.length === 1 ? 'They get' : 'They each get'} notified about your thoughtful gift</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-primary">3</span>
                      </div>
                      <p>{wishlistOwners.length === 1 ? 'They receive' : 'They each receive'} your personal message and can coordinate delivery</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-primary">1</span>
                      </div>
                      <p>You purchase items from someone's wishlist</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-primary">2</span>
                      </div>
                      <p>The wishlist owner gets notified about your gift</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-primary">3</span>
                      </div>
                      <p>They receive your message</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>


          </div>
        </div>
      </div>
    </div>
  )
} 