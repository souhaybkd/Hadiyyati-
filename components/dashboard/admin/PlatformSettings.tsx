'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, DollarSign, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { getPlatformFeePercentage, updatePlatformFeePercentage } from '@/lib/actions/platform-settings'

export function PlatformSettings() {
  const [feePercentage, setFeePercentage] = useState<number>(10)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load current platform fee percentage
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true)
      try {
        const currentFee = await getPlatformFeePercentage()
        setFeePercentage(currentFee)
      } catch (err) {
        setError('Failed to load platform settings')
        console.error('Error loading platform settings:', err)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      await updatePlatformFeePercentage(feePercentage)
      setSuccess('Platform fee percentage updated successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update platform fee')
    } finally {
      setSaving(false)
    }
  }

  const calculateExamplePayout = (price: number) => {
    return price * (1 - (feePercentage / 100))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-design-text-heading">Platform Settings</h1>
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
      <h1 className="text-3xl font-bold text-design-text-heading">Platform Settings</h1>
      
      {/* Platform Fee Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Platform Fee Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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

          <div className="grid md:grid-cols-2 gap-6">
            {/* Fee Configuration */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feePercentage">Platform Fee Percentage</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="feePercentage"
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    value={feePercentage}
                    onChange={(e) => setFeePercentage(parseFloat(e.target.value) || 0)}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground font-medium">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Percentage of each gift purchase that goes to the platform (0% - 50%)
                </p>
              </div>

              <Button 
                onClick={handleSave} 
                disabled={saving || feePercentage < 0 || feePercentage > 50}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Platform Fee
                  </>
                )}
              </Button>
            </div>

            {/* Preview Examples */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Payout Examples</h4>
              <div className="space-y-3">
                {[10, 25, 50, 100].map((price) => (
                  <div key={price} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Gift Price: ${price}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        Payout: ${calculateExamplePayout(price).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Fee: ${(price * (feePercentage / 100)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Impact Information */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Important Notes</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Changing the platform fee will affect all future gift purchases</li>
              <li>• Existing wishlist items will show updated payout amounts</li>
              <li>• Users will see the expected payout when adding items to their wishlist</li>
              <li>• This fee helps cover platform costs, payment processing, and support</li>
            </ul>
          </div>
        </CardContent>
      </Card>


    </div>
  )
} 