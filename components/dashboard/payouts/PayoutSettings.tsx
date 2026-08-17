"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect, useCallback } from "react";
import { Loader2, Trash2, ShieldCheck, ShieldAlert } from "lucide-react";
import { getUserPayoutSettings, savePayoutSettings, deletePayoutSettings } from "@/lib/actions/payout-settings";
import { getMyKycStatus, startVeriffSession } from "@/lib/actions/veriff";
import { PayoutSettings as PayoutSettingsType, KycStatus } from "@/lib/types/database";
import { CheckCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

const PayoutMethods = [
    { id: "bank", label: "Bank Transfer", fields: [{ name: "iban", label: "IBAN", placeholder: "SA03 8000 0000 6080 1016 7519" }, { name: "accountName", label: "Account Holder Name", placeholder: "John Doe" }] },
    { id: "western_union", label: "Western Union", fields: [{ name: "fullName", label: "Full Name", placeholder: "John Doe" }, { name: "country", label: "Country", placeholder: "United States" }, { name: "phoneNumber", label: "Phone Number", placeholder: "+1 234 567 890" }] },
    { id: "taptap", label: "TapTap Send", fields: [{ name: "mobileMoneyNumber", label: "Mobile Money Number", placeholder: "251912345678" }] },
    { id: "whish", label: "Whish Money", fields: [{ name: "mobileMoneyNumber", label: "Mobile Money Number", placeholder: "251912345678" }] },
]

export function PayoutSettings() {
    const searchParams = useSearchParams();
    const [selectedMethod, setSelectedMethod] = useState("bank");
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [startingKyc, setStartingKyc] = useState(false);
    const [existingSettings, setExistingSettings] = useState<PayoutSettingsType | null>(null);
    const [kycStatus, setKycStatus] = useState<KycStatus>('unverified');
    const [kycVerifiedAt, setKycVerifiedAt] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    
    const currentMethod = PayoutMethods.find(m => m.id === selectedMethod);
    const isApproved = kycStatus === 'approved';
    const returnedFromKyc = searchParams?.get('kyc') === 'done';

    const flashSuccess = (message: string) => {
        setSuccess(message);
        setTimeout(() => setSuccess(null), 3000);
    };

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [settings, kyc] = await Promise.all([
                getUserPayoutSettings(),
                getMyKycStatus(),
            ]);

            if (settings) {
                setExistingSettings(settings);
                setSelectedMethod(settings.payout_method);
                setFormData(settings.payout_details as unknown as Record<string, string>);
            }

            setKycStatus(kyc.kyc_status);
            setKycVerifiedAt(kyc.kyc_verified_at);
        } catch (error) {
            console.error('Error loading payout settings:', error);
            setError(error instanceof Error ? error.message : 'Failed to load payout settings');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // After returning from Veriff, refresh a few times while decision webhook catches up
    useEffect(() => {
        if (!returnedFromKyc || kycStatus === 'approved') return;

        let attempts = 0;
        const maxAttempts = 6;
        const interval = setInterval(async () => {
            attempts += 1;
            try {
                const kyc = await getMyKycStatus();
                setKycStatus(kyc.kyc_status);
                setKycVerifiedAt(kyc.kyc_verified_at);
                if (kyc.kyc_status === 'approved' || kyc.kyc_status === 'declined' || attempts >= maxAttempts) {
                    clearInterval(interval);
                }
            } catch {
                if (attempts >= maxAttempts) clearInterval(interval);
            }
        }, 2500);

        return () => clearInterval(interval);
    }, [returnedFromKyc, kycStatus]);

    const handleStartKyc = async () => {
        setStartingKyc(true);
        setError(null);
        try {
            const result = await startVeriffSession();
            if (result.error || !result.url) {
                setError(result.error || 'Failed to start identity verification');
                setStartingKyc(false);
                return;
            }
            window.location.href = result.url;
        } catch (error) {
            console.error('Error starting Veriff session:', error);
            setError(error instanceof Error ? error.message : 'Failed to start identity verification');
            setStartingKyc(false);
        }
    };

    const handleInputChange = (fieldName: string, value: string) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isApproved) {
            setError('Identity verification is required before saving payout settings.');
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const formDataObj = new FormData();
            formDataObj.append('payout_method', selectedMethod);
            
            Object.entries(formData).forEach(([key, value]) => {
                formDataObj.append(key, value);
            });

            await savePayoutSettings(formDataObj);

            const updatedSettings = await getUserPayoutSettings();
            setExistingSettings(updatedSettings);
            flashSuccess('Payout settings saved successfully!');
            
        } catch (error) {
            console.error('Error saving payout settings:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to save payout settings';
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!existingSettings) return;
        
        setDeleting(true);
        setError(null);
        setSuccess(null);
        try {
            await deletePayoutSettings();
            setExistingSettings(null);
            setFormData({});
            setSelectedMethod("bank");
            flashSuccess('Payout settings deleted successfully!');
        } catch (error) {
            console.error('Error deleting payout settings:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete payout settings';
            setError(errorMessage);
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
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {success}
          </div>
        )}

        {/* KYC status panel */}
        <div
          className={`p-4 border rounded-md ${
            isApproved
              ? 'bg-green-50 border-green-200'
              : kycStatus === 'declined'
                ? 'bg-red-50 border-red-200'
                : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              {isApproved ? (
                <ShieldCheck className="h-5 w-5 text-green-700 mt-0.5 shrink-0" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
              )}
              <div>
                <p
                  className={`text-sm font-medium ${
                    isApproved
                      ? 'text-green-800'
                      : kycStatus === 'declined'
                        ? 'text-red-800'
                        : 'text-amber-900'
                  }`}
                >
                  {isApproved && 'Identity verified'}
                  {kycStatus === 'unverified' && 'Identity verification required'}
                  {kycStatus === 'pending' && 'Verification in progress'}
                  {kycStatus === 'declined' && 'Verification declined'}
                  {kycStatus === 'resubmission_requested' && 'Additional information needed'}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    isApproved
                      ? 'text-green-600'
                      : kycStatus === 'declined'
                        ? 'text-red-600'
                        : 'text-amber-700'
                  }`}
                >
                  {isApproved &&
                    (kycVerifiedAt
                      ? `Verified on ${new Date(kycVerifiedAt).toLocaleDateString()}`
                      : 'You can now save payout details.')}
                  {kycStatus === 'unverified' &&
                    'Complete identity verification before you can save payout settings.'}
                  {kycStatus === 'pending' &&
                    (returnedFromKyc
                      ? 'Thanks — we are waiting for Veriff to confirm your result. This usually takes a moment.'
                      : 'Finish the verification flow with Veriff, then return here.')}
                  {kycStatus === 'declined' &&
                    'Your verification was not approved. You can try again with a valid ID document.'}
                  {kycStatus === 'resubmission_requested' &&
                    'Veriff needs you to resubmit. Start a new verification session to continue.'}
                </p>
              </div>
            </div>

            {!isApproved && (
              <Button
                type="button"
                onClick={handleStartKyc}
                disabled={startingKyc}
                variant={kycStatus === 'pending' ? 'outline' : 'default'}
                className="shrink-0"
              >
                {startingKyc && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {kycStatus === 'pending'
                  ? 'Restart verification'
                  : kycStatus === 'declined' || kycStatus === 'resubmission_requested'
                    ? 'Retry verification'
                    : 'Verify identity'}
              </Button>
            )}
          </div>
        </div>

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
          <fieldset disabled={!isApproved} className={!isApproved ? 'opacity-60' : undefined}>
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
                <div className="mt-8">
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
                                    required={isApproved}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </fieldset>
          
          <div className="flex gap-2">
            <Button type="submit" disabled={saving || !isApproved} className="flex-1">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {!isApproved
                ? 'Verify identity to save'
                : saving
                  ? 'Saving...'
                  : existingSettings
                    ? 'Update Settings'
                    : 'Save Settings'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
