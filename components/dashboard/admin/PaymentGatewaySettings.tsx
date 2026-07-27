'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  Wallet,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react'
import {
  getGatewaySettingsForAdmin,
  updateStripeSettings,
  updateWhishSettings,
  type AdminGatewaySettings,
} from '@/lib/actions/payment-gateways'

type SecretField = 'stripeSecret' | 'stripeWebhook' | 'whishSecret'

export function PaymentGatewaySettings() {
  const [settings, setSettings] = useState<AdminGatewaySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingStripe, setSavingStripe] = useState(false)
  const [savingWhish, setSavingWhish] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [visible, setVisible] = useState<Record<SecretField, boolean>>({
    stripeSecret: false,
    stripeWebhook: false,
    whishSecret: false,
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await getGatewaySettingsForAdmin()
        setSettings(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payment gateway settings')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const flash = (message: string) => {
    setSuccess(message)
    setTimeout(() => setSuccess(null), 3000)
  }

  const toggleVisible = (field: SecretField) =>
    setVisible((prev) => ({ ...prev, [field]: !prev[field] }))

  const updateStripe = (patch: Partial<AdminGatewaySettings['stripe']>) =>
    setSettings((prev) => (prev ? { ...prev, stripe: { ...prev.stripe, ...patch } } : prev))

  const updateWhish = (patch: Partial<AdminGatewaySettings['whish']>) =>
    setSettings((prev) => (prev ? { ...prev, whish: { ...prev.whish, ...patch } } : prev))

  const handleSaveStripe = async () => {
    if (!settings) return
    setSavingStripe(true)
    setError(null)
    setSuccess(null)
    try {
      await updateStripeSettings(settings.stripe)
      flash('Stripe settings saved successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save Stripe settings')
    } finally {
      setSavingStripe(false)
    }
  }

  const handleSaveWhish = async () => {
    if (!settings) return
    setSavingWhish(true)
    setError(null)
    setSuccess(null)
    try {
      await updateWhishSettings(settings.whish)
      flash('Whish settings saved successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save Whish settings')
    } finally {
      setSavingWhish(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-design-text-heading">Payment Gateways</h1>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-design-text-heading">Payment Gateways</h1>
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-red-700 text-sm">{error || 'Unable to load settings.'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-design-text-heading">Payment Gateways</h1>
        <p className="text-muted-foreground mt-1">
          Enable, disable and configure the payment providers offered at checkout.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-green-700 text-sm">{success}</span>
        </div>
      )}

      {/* Stripe */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Stripe
                {settings.stripe.is_enabled ? (
                  <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                ) : (
                  <Badge variant="secondary">Disabled</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Accept card payments through Stripe Checkout.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Label htmlFor="stripe-enabled" className="text-sm">
                {settings.stripe.is_enabled ? 'On' : 'Off'}
              </Label>
              <Switch
                id="stripe-enabled"
                checked={settings.stripe.is_enabled}
                onCheckedChange={(checked) => updateStripe({ is_enabled: checked })}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stripe-secret">Secret Key</Label>
            <div className="flex items-center gap-2">
              <Input
                id="stripe-secret"
                type={visible.stripeSecret ? 'text' : 'password'}
                placeholder="sk_live_..."
                value={settings.stripe.secretKey}
                onChange={(e) => updateStripe({ secretKey: e.target.value })}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => toggleVisible('stripeSecret')}
              >
                {visible.stripeSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stripe-publishable">Publishable Key</Label>
            <Input
              id="stripe-publishable"
              type="text"
              placeholder="pk_live_..."
              value={settings.stripe.publishableKey}
              onChange={(e) => updateStripe({ publishableKey: e.target.value })}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stripe-webhook">Webhook Signing Secret</Label>
            <div className="flex items-center gap-2">
              <Input
                id="stripe-webhook"
                type={visible.stripeWebhook ? 'text' : 'password'}
                placeholder="whsec_..."
                value={settings.stripe.webhookSecret}
                onChange={(e) => updateStripe({ webhookSecret: e.target.value })}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => toggleVisible('stripeWebhook')}
              >
                {visible.stripeWebhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Used to verify Stripe webhook events at /api/webhooks/stripe.
            </p>
          </div>

          <Button onClick={handleSaveStripe} disabled={savingStripe} className="w-full sm:w-auto">
            {savingStripe ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Stripe Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Whish */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Whish Pay
                {settings.whish.is_enabled ? (
                  <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                ) : (
                  <Badge variant="secondary">Disabled</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Accept payments through the Whish Pay balance.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Label htmlFor="whish-enabled" className="text-sm">
                {settings.whish.is_enabled ? 'On' : 'Off'}
              </Label>
              <Switch
                id="whish-enabled"
                checked={settings.whish.is_enabled}
                onCheckedChange={(checked) => updateWhish({ is_enabled: checked })}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whish-channel">Channel</Label>
            <Input
              id="whish-channel"
              type="text"
              placeholder="Value provided by Whish"
              value={settings.whish.channel}
              onChange={(e) => updateWhish({ channel: e.target.value })}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whish-secret">Secret</Label>
            <div className="flex items-center gap-2">
              <Input
                id="whish-secret"
                type={visible.whishSecret ? 'text' : 'password'}
                placeholder="Value provided by Whish"
                value={settings.whish.secret}
                onChange={(e) => updateWhish({ secret: e.target.value })}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => toggleVisible('whishSecret')}
              >
                {visible.whishSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whish-website">Website URL</Label>
            <Input
              id="whish-website"
              type="text"
              placeholder="https://yourdomain.com"
              value={settings.whish.websiteUrl}
              onChange={(e) => updateWhish({ websiteUrl: e.target.value })}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Sent as the <code>websiteUrl</code> header on every Whish request.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whish-environment">Environment</Label>
            <select
              id="whish-environment"
              value={settings.whish.environment}
              onChange={(e) =>
                updateWhish({ environment: e.target.value as 'sandbox' | 'production' })
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="sandbox">Sandbox (testing)</option>
              <option value="production">Production (live)</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Sandbox and Production use different credentials — enter the set Whish issued
              for the selected environment.
            </p>
          </div>

          <Button onClick={handleSaveWhish} disabled={savingWhish} className="w-full sm:w-auto">
            {savingWhish ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Whish Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Important Notes</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• A gateway only appears at checkout when it is enabled and fully configured.</li>
          <li>• Secrets are stored server-side and never exposed to buyers.</li>
          <li>• If both gateways are enabled, customers choose their preferred method at checkout.</li>
        </ul>
      </div>
    </div>
  )
}
