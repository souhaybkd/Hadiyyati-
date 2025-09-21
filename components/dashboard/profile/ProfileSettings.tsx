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
import { logout } from "@/app/auth/actions";
import { getUserProfile, updateProfile, type Profile } from "@/lib/actions/wishlist";
import { cn } from "@/lib/utils";

export function ProfileSettings() {
    const [isLoggingOut, setIsLoggingOut] = useState(false);
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
                <CardTitle>Public Profile</CardTitle>
                <CardDescription>This information will be displayed on your public wishlist page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" name="username" value={formData.username} onChange={handleInputChange} />
                    <p className="text-sm text-muted-foreground">Your public wishlist URL will be: /wishlist/{formData.username}</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} />
                </div>
                
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Email Address</CardTitle>
                <CardDescription>Your registered email address cannot be changed.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="font-semibold">{profile?.email}</p>
            </CardContent>
        </Card>

        {/* The rest of the component remains the same (Password, Logout, Danger Zone) */}
        
        <Card>
            <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password here. It's a good idea to use a strong password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button onClick={() => router.push('/auth/update-password')}>
                    Set New Password
                </Button>
            </CardContent>
        </Card>

        <Card className="border-destructive">
            <CardHeader>
                <CardTitle>Account Actions</CardTitle>
                <CardDescription>Manage your account and session.</CardDescription>
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
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Logging out...
                        </>
                    ) : (
                        <>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>

        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>This action is permanent and cannot be undone.</CardDescription>
            </CardHeader>
            <CardContent>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">Delete Account</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your
                            account and remove your data from our servers.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    </div>
  );
} 