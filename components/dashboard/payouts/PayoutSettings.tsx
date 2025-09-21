"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { getUserPayoutSettings, savePayoutSettings, deletePayoutSettings } from "@/lib/actions/payout-settings";
import { PayoutSettings as PayoutSettingsType } from "@/lib/types/database";
// Simple toast alternative - we'll use alerts for now
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // In a real app, you'd want to implement a proper toast system
  // For now, we'll just log it and could show it in the UI
  console.log(`${type.toUpperCase()}: ${message}`);
};

const PayoutMethods = [
    { id: "bank", label: "Bank Transfer", fields: [{ name: "iban", label: "IBAN", placeholder: "SA03 8000 0000 6080 1016 7519" }, { name: "accountName", label: "Account Holder Name", placeholder: "John Doe" }] },
    { id: "western_union", label: "Western Union", fields: [{ name: "fullName", label: "Full Name", placeholder: "John Doe" }, { name: "country", label: "Country", placeholder: "United States" }, { name: "phoneNumber", label: "Phone Number", placeholder: "+1 234 567 890" }] },
    { id: "taptap", label: "TapTap Send", fields: [{ name: "mobileMoneyNumber", label: "Mobile Money Number", placeholder: "251912345678" }] },
    { id: "whish", label: "Whish Money", fields: [{ name: "mobileMoneyNumber", label: "Mobile Money Number", placeholder: "251912345678" }] },
]

export function PayoutSettings() {
    const [selectedMethod, setSelectedMethod] = useState("bank");
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [existingSettings, setExistingSettings] = useState<PayoutSettingsType | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const currentMethod = PayoutMethods.find(m => m.id === selectedMethod);

    // Load existing payout settings
    useEffect(() => {
        const loadSettings = async () => {
            try {
                setLoading(true);
                const settings = await getUserPayoutSettings();
                
                if (settings) {
                    setExistingSettings(settings);
                    setSelectedMethod(settings.payout_method);
                    setFormData(settings.payout_details as any);
                }
            } catch (error) {
                console.error('Error loading payout settings:', error);
                setError(error instanceof Error ? error.message : 'Failed to load payout settings');
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, []);

    const handleInputChange = (fieldName: string, value: string) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const formDataObj = new FormData();
            formDataObj.append('payout_method', selectedMethod);
            
            // Add all form fields to FormData
            Object.entries(formData).forEach(([key, value]) => {
                formDataObj.append(key, value);
            });

            await savePayoutSettings(formDataObj);
            showToast('Payout settings saved successfully!', 'success');
            
            // Reload settings to get the updated data
            const updatedSettings = await getUserPayoutSettings();
            setExistingSettings(updatedSettings);
            
        } catch (error) {
            console.error('Error saving payout settings:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to save payout settings';
            setError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!existingSettings) return;
        
        setDeleting(true);
        try {
            await deletePayoutSettings();
            setExistingSettings(null);
            setFormData({});
            setSelectedMethod("bank");
            showToast('Payout settings deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting payout settings:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete payout settings';
            setError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Payout Settings</CardTitle>
                    <CardDescription>
                        Choose your preferred method to receive funds.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                </CardContent>
            </Card>
        );
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payout Settings</CardTitle>
        <CardDescription>
          Choose your preferred method to receive funds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Error Message */}
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        {/* Existing Settings Info */}
        {existingSettings && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">
                  Current payout method: <span className="capitalize">{existingSettings.payout_method.replace('_', ' ')}</span>
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Last updated: {new Date(existingSettings.updated_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
              <Label className="text-base font-semibold">Select Payout Method</Label>
              <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod} className="mt-4 grid md:grid-cols-2 gap-4">
                  {PayoutMethods.map(method => (
                      <Label key={method.id} htmlFor={method.id} className="flex items-center space-x-2 border rounded-md p-4 has-[input:checked]:border-primary cursor-pointer">
                          <RadioGroupItem value={method.id} id={method.id} />
                          <span>{method.label}</span>
                      </Label>
                  ))}
              </RadioGroup>
          </div>

          {currentMethod && (
              <div>
                  <h3 className="text-lg font-semibold mb-4">Details for {currentMethod.label}</h3>
                  <div className="grid gap-4">
                      {currentMethod.fields.map(field => (
                          <div key={field.name} className="space-y-2">
                              <Label htmlFor={field.name}>{field.label} *</Label>
                              <Input 
                                  id={field.name} 
                                  name={field.name}
                                  placeholder={field.placeholder}
                                  value={formData[field.name] || ''}
                                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                                  required
                              />
                          </div>
                      ))}
                  </div>
              </div>
          )}
          
          <div className="flex gap-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {saving ? 'Saving...' : existingSettings ? 'Update Settings' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 