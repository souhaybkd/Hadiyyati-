'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LogOut, Loader2, CheckCircle, AlertCircle } from "lucide-react";
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
  } from "@/components/ui/alert-dialog";
import { logout, deleteAccount } from "@/app/auth/actions";
import { getUserProfile, updateProfile, type Profile } from "@/lib/actions/wishlist";
import { useLanguage } from "@/lib/contexts/LanguageContext";

export function ProfileSettings() {
    const { t } = useLanguage()
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();
    
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
    });

    useEffect(() => {
        async function loadProfile() {
            try {
                const userProfile = await getUserProfile();
                if (userProfile) {
                    setProfile(userProfile);
                    setFormData({
                        username: userProfile.username || '',
                        full_name: userProfile.full_name || '',
                    });
                }
            } catch (err) {
                setError('Failed to load profile.');
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const form = new FormData();
            form.append('username', formData.username);
            form.append('full_name', formData.full_name);
            
            await updateProfile(form);
            setSuccess("Profile updated successfully!");
        } catch (err: any) {
            setError(err.message || "Failed to update profile.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            router.push('/auth');
        } catch (error) {
            console.error('Logout error:', error);
            // Optionally, show an error message to the user
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        setError(null);
        try {
            const result = await deleteAccount();
            if (result?.error) {
                setError(result.error.message);
                setIsDeleting(false);
                return;
            }
            // Account deleted — send the user to the home page.
            router.push('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete account.');
            setIsDeleting(false);
        }
    };
    
    if (loading) {
        return <div className="flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
    <div className="space-y-6">
        {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
            </div>
        )}
        {success && (
            <div className="bg-emerald-500/10 text-emerald-600 p-3 rounded-md flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <p>{success}</p>
            </div>
        )}
        <Card>
            <CardHeader>
                <CardTitle>{t('dash.publicProfile')}</CardTitle>
                <CardDescription>{t('dash.publicProfileDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="username">{t('dash.username')}</Label>
                    <Input id="username" name="username" value={formData.username} onChange={handleInputChange} />
                    <p className="text-sm text-muted-foreground">{t('dash.wishlistUrl', { username: formData.username })}</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="full_name">{t('dash.fullName')}</Label>
                    <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} />
                </div>
                
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                    {t('dash.saveChanges')}
                </Button>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>{t('dash.emailAddress')}</CardTitle>
                <CardDescription>{t('dash.emailLocked')}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="font-semibold">{profile?.email}</p>
            </CardContent>
        </Card>

        {/* The rest of the component remains the same (Password, Logout, Danger Zone) */}
        
        <Card>
            <CardHeader>
                <CardTitle>{t('dash.changePassword')}</CardTitle>
                <CardDescription>{t('dash.changePasswordDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button onClick={() => router.push('/auth/update-password')}>
                    {t('dash.setPassword')}
                </Button>
            </CardContent>
        </Card>

        <Card className="border-destructive">
            <CardHeader>
                <CardTitle>{t('dash.accountActions')}</CardTitle>
                <CardDescription>{t('dash.accountActionsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full"
                >
                    {isLoggingOut ? (
                        <>
                            <Loader2 className="h-4 w-4 me-2 animate-spin" />
                            {t('dash.loggingOut')}
                        </>
                    ) : (
                        <>
                            <LogOut className="h-4 w-4 me-2" />
                            {t('dash.logout')}
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>

        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive">{t('dash.danger')}</CardTitle>
                <CardDescription>{t('dash.dangerDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isDeleting}>
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                                    {t('dash.deleting')}
                                </>
                            ) : (
                                t('dash.deleteAccount')
                            )}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>{t('dash.deleteSure')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('dash.deleteAccountBody')}
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>{t('dash.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleDeleteAccount()
                            }}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? t('dash.deleting') : t('dash.deleteMyAccount')}
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    </div>
  );
} 