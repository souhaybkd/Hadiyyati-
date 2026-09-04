'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useCart } from '@/lib/contexts/CartContext'
import { getPublicGatewayStatusAction } from '@/lib/actions/payment-gateways'
import { createSupabaseClient } from '@/lib/supabase'
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
  Minus,
  AlertCircle,
  Wallet,
  CheckCircle
} from 'lucide-react'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import Link from 'next/link'

interface CheckoutForm {
  customMessage: string
  isGift: boolean
  guestEmail: string
  guestName: string
}

type PaymentMethod = 'stripe' | 'whish'

function CheckoutContent() {
  const { cartItems, removeFromCart, isHydrated } = useCart()
  const { t, direction } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [form, setForm] = useState<CheckoutForm>({
    customMessage: '',
    isGift: false,
    guestEmail: '',
    guestName: ''
  })

  // Whether a buyer account is signed in. Gifting does NOT require an account —
  // guests provide their email at checkout instead.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        setIsLoggedIn(!!user)
      } catch {
        setIsLoggedIn(false)
      }
    }
    checkAuth()
  }, [])

  // Available payment gateways (enabled + configured), loaded from the server.
  const [gateways, setGateways] = useState<{ stripe: boolean; whish: boolean }>({
    stripe: false,
    whish: false,
  })
  const [gatewaysLoading, setGatewaysLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)

  // Surface a failed Whish redirect back to the user.
  useEffect(() => {
    if (searchParams?.get('error') === 'payment_failed') {
      setError(t('checkout.paymentFailed'))
    }
  }, [searchParams, t])

  useEffect(() => {
    const loadGateways = async () => {
      try {
        const status = await getPublicGatewayStatusAction()
        setGateways(status)
        // Default to the first available method.
        setPaymentMethod(status.stripe ? 'stripe' : status.whish ? 'whish' : null)
      } catch (err) {
        console.error('Failed to load payment gateways:', err)
      } finally {
        setGatewaysLoading(false)
      }
    }
    loadGateways()
  }, [])

  const availableCount = (gateways.stripe ? 1 : 0) + (gateways.whish ? 1 : 0)

  // Calculate totals. The amount actually charged by both gateways is the sum
  // of item prices (no separate tax line), so the displayed total must match.
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  const total = subtotal

  // Get unique wishlist owners for gift recipients
  const wishlistOwners = Array.from(new Set(
    cartItems
      .filter(item => item.wishlist_owner_name)
      .map(item => item.wishlist_owner_name)
  ))

  // Function to detect phone numbers in text
  const containsPhoneNumber = (text: string): boolean => {
    // Pattern 1: Phone number formats with separators (most reliable)
    // Matches: (123) 456-7890, 123-456-7890, 123.456.7890, +1 123 456 7890, etc.
    const phonePatterns = [
      /\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4}/, // US format: (123) 456-7890, 123-456-7890
      /\+\d{1,3}[\s\-]?\d{3,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4}/, // International: +1 123 456 7890
      /\d{3}[\s\-\.]\d{3}[\s\-\.]\d{4}/, // 123-456-7890 format
      /\(\d{3}\)[\s]?\d{3}[\s\-]?\d{4}/, // (123) 456-7890 format
      /\d{10,}/, // 10+ consecutive digits (phone number length)
    ]
    
    // Check if any pattern matches
    if (phonePatterns.some(pattern => pattern.test(text))) {
      // Additional check: if it's just 10+ digits, make sure it's not part of a larger number
      // (like a year, address, etc.) by checking if it's isolated or has phone-like context
      const tenPlusDigits = /\d{10,}/
      if (tenPlusDigits.test(text)) {
        // Check if it looks like a phone number (has word boundaries or is standalone)
        const match = text.match(/\d{10,}/)
        if (match) {
          const before = text.substring(Math.max(0, match.index! - 1), match.index!)
          const after = text.substring(match.index! + match[0].length, match.index! + match[0].length + 1)
          // If surrounded by non-digit characters or at start/end, likely a phone number
          const isIsolated = (!before || !/\d/.test(before)) && (!after || !/\d/.test(after))
          if (isIsolated) {
            return true
          }
        }
      } else {
        // If it matches formatted patterns, it's definitely a phone number
        return true
      }
    }
    
    return false
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    // Check for phone numbers if it's the customMessage field
    if (name === 'customMessage') {
      if (containsPhoneNumber(value)) {
        setPhoneError(t('checkout.phoneNotAllowed'))
      } else {
        setPhoneError(null)
      }
    }
    
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      setError(t('checkout.cartEmptyError'))
      return
    }

    // Validate no phone numbers in gift message
    if (form.isGift && form.customMessage && containsPhoneNumber(form.customMessage)) {
      setError(t('checkout.phoneNotAllowed'))
      setPhoneError(t('checkout.phoneNotAllowed'))
      return
    }

    if (!paymentMethod) {
      setError(t('checkout.noMethod'))
      return
    }

    // Guests must provide a valid email so they get a receipt/reference.
    if (isLoggedIn === false) {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guestEmail.trim())
      if (!emailOk) {
        setError(t('checkout.validEmail'))
        return
      }
    }

    setLoading(true)
    setError(null)
    setPhoneError(null)

    try {
      // Route to the endpoint for the selected gateway. Both return a { url }
      // to redirect the buyer to the hosted payment page.
      const endpoint = paymentMethod === 'whish' ? '/api/checkout/whish' : '/api/checkout'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems,
          customMessage: form.customMessage,
          isGift: form.isGift,
          customerEmail: isLoggedIn === false ? form.guestEmail.trim() : undefined,
          customerName: isLoggedIn === false ? form.guestName.trim() : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to the hosted payment page (Stripe Checkout / Whish collect URL)
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Payment provider did not return a redirect URL')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  // Wait for localStorage hydration before treating an empty cart as real —
  // otherwise a refresh briefly (or permanently, on slow hydration) shows empty.
  if (!isHydrated) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <Loader2 className="h-16 w-16 mx-auto mb-6 animate-spin text-primary" />
          <h1 className="text-2xl font-bold mb-4">{t('checkout.loading')}</h1>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingCart className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-4">{t('checkout.emptyTitle')}</h1>
          <p className="text-muted-foreground mb-8">
            {t('checkout.emptyBody')}
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className={`h-4 w-4 me-2 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
              {t('checkout.continueShopping')}
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
            <ArrowLeft className={`h-4 w-4 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
            {t('checkout.backHome')}
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{t('checkout.title')}</h1>
            <p className="text-muted-foreground">{t('checkout.subtitle')}</p>
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
                    {t('checkout.giftingTo')}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t('checkout.giftsSent')}
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
                  {t('checkout.yourCart')} ({cartItems.length} {cartItems.length === 1 ? t('wishlist.item') : t('wishlist.items')})
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
                          {t('checkout.giftFor', { name: item.wishlist_owner_name })}
                        </p>
                      )}
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-medium">${item.price.toFixed(2)}</span>
                        <Badge variant="secondary">{t('checkout.qty')}: {item.quantity}</Badge>
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
                  {t('checkout.giftMessage')}
                </CardTitle>
                <CardDescription>
                  {t('checkout.giftMessageDesc')}
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
                  <Label htmlFor="isGift">{t('checkout.includeGiftMessage')}</Label>
                </div>

                {form.isGift && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="customMessage">
                        <MessageSquare className="h-4 w-4 inline mr-2" />
                        {t('checkout.yourMessage')}
                      </Label>
                      <Textarea
                        id="customMessage"
                        name="customMessage"
                        value={form.customMessage}
                        onChange={handleInputChange}
                        placeholder={t('checkout.messagePh')}
                        rows={4}
                        maxLength={500}
                        className={phoneError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
                      />
                      {phoneError && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          <span>{phoneError}</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {t('checkout.chars', { n: form.customMessage.length })}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        {t('checkout.messageNotify')}
                      </p>
                    </div>
                  </div>
                )}

                {!form.isGift && (
                  <div className="space-y-2">
                    <Label htmlFor="customMessage">
                      <MessageSquare className="h-4 w-4 inline mr-2" />
                      {t('checkout.personalNote')}
                    </Label>
                    <Textarea
                      id="customMessage"
                      name="customMessage"
                      value={form.customMessage}
                      onChange={handleInputChange}
                      placeholder={t('checkout.personalNotePh')}
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
                  {wishlistOwners.length > 0 ? t('checkout.giftSummary') : t('checkout.orderSummary')}
                </CardTitle>
                {wishlistOwners.length > 0 && (
                  <CardDescription>
                    {wishlistOwners.length === 1 
                      ? t('checkout.giftingToOne', { name: wishlistOwners[0] ?? '' })
                      : t('checkout.giftingToMany', { count: wishlistOwners.length })
                    }
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{t('cart.subtotal')}</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium text-lg">
                    <span>{t('checkout.total')}</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Guest details — only shown when not signed in. Gifting does
                    not require an account. */}
                {isLoggedIn === false && (
                  <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                    <div className="space-y-1">
                      <Label htmlFor="guestName">{t('checkout.yourName')}</Label>
                      <Input
                        id="guestName"
                        name="guestName"
                        type="text"
                        placeholder={t('checkout.yourNamePh')}
                        value={form.guestName}
                        onChange={handleInputChange}
                        autoComplete="name"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="guestEmail">
                        <Mail className="h-4 w-4 inline mr-2" />
                        {t('checkout.email')}
                      </Label>
                      <Input
                        id="guestEmail"
                        name="guestEmail"
                        type="email"
                        placeholder="you@example.com"
                        value={form.guestEmail}
                        onChange={handleInputChange}
                        autoComplete="email"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('checkout.emailHint')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment method selection */}
                <div className="space-y-2">
                  <Label>{t('checkout.paymentMethod')}</Label>
                  {gatewaysLoading ? (
                    <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground border rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('checkout.loadingPayments')}
                    </div>
                  ) : availableCount === 0 ? (
                    <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {t('checkout.noPayments')}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {gateways.stripe && (
                        <PaymentOption
                          selected={paymentMethod === 'stripe'}
                          onSelect={() => setPaymentMethod('stripe')}
                          icon={<CreditCard className="h-5 w-5" />}
                          title={t('checkout.card')}
                          description={t('checkout.cardDesc')}
                        />
                      )}
                      {gateways.whish && (
                        <PaymentOption
                          selected={paymentMethod === 'whish'}
                          onSelect={() => setPaymentMethod('whish')}
                          icon={<Wallet className="h-5 w-5" />}
                          title={t('checkout.whish')}
                          description={t('checkout.whishDesc')}
                        />
                      )}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    {error}
                  </div>
                )}

                <Button 
                  onClick={handleCheckout}
                  disabled={loading || gatewaysLoading || availableCount === 0}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                      {t('checkout.processing')}
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 me-2" />
                      {wishlistOwners.length > 0 ? t('checkout.sendGift') : t('checkout.proceed')}
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    {paymentMethod === 'whish'
                      ? t('checkout.poweredWhish')
                      : t('checkout.poweredStripe')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Gift Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  {wishlistOwners.length > 0 ? t('checkout.howGifting') : t('checkout.howItWorks')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {wishlistOwners.length > 0 ? (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-primary">1</span>
                      </div>
                      <p>{wishlistOwners.length === 1
                        ? t('checkout.howGift1', { name: wishlistOwners[0] ?? '' })
                        : t('checkout.howGift1Many', { count: wishlistOwners.length })}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-primary">2</span>
                      </div>
                      <p>{wishlistOwners.length === 1 ? t('checkout.howGift2') : t('checkout.howGift2Each')}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-primary">3</span>
                      </div>
                      <p>{wishlistOwners.length === 1 ? t('checkout.howGift3') : t('checkout.howGift3Each')}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-primary">1</span>
                      </div>
                      <p>{t('checkout.howBuy1')}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-primary">2</span>
                      </div>
                      <p>{t('checkout.howBuy2')}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-primary">3</span>
                      </div>
                      <p>{t('checkout.howBuy3')}</p>
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

function PaymentOption({
  selected,
  onSelect,
  icon,
  title,
  description,
}: {
  selected: boolean
  onSelect: () => void
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-3 p-3 border rounded-lg text-start transition-colors ${
        selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-input hover:bg-muted/50'
      }`}
    >
      <div className={`flex-shrink-0 ${selected ? 'text-primary' : 'text-muted-foreground'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {selected && <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />}
    </button>
  )
}

function CheckoutFallback() {
  const { t } = useLanguage()
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto text-center">
        <Loader2 className="h-16 w-16 mx-auto mb-6 animate-spin text-primary" />
        <h1 className="text-2xl font-bold mb-4">{t('checkout.loading')}</h1>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutContent />
    </Suspense>
  )
}
