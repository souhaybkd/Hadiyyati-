'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Lock } from 'lucide-react'

function UpdatePasswordFormContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createSupabaseClient()

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [redirectTo, setRedirectTo] = useState('/dashboard')

    useEffect(() => {
        // Get redirect destination from URL parameters
        const redirect = searchParams?.get('redirectTo')
        if (redirect) {
            setRedirectTo(redirect)
        }
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setMessage('')

        if (password !== confirmPassword) {
            setError("Passwords do not match.")
            return
        }
        
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.")
            return
        }

        setLoading(true)

        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
            setError(error.message)
        } else {
            setMessage("Your password has been reset successfully. You will be redirected to the dashboard shortly.")
            setTimeout(() => {
                router.push(redirectTo)
            }, 3000)
        }

        setLoading(false)
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <div className="mx-auto bg-primary text-primary-content rounded-full h-16 w-16 flex items-center justify-center mb-4">
                    <Lock className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl">Reset Your Password</CardTitle>
                <CardDescription>
                    Enter your new password below.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="text-sm text-destructive text-center">{error}</p>}
                    {message && <p className="text-sm text-primary text-center">{message}</p>}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Password
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}

export function UpdatePasswordForm() {
    return (
        <Suspense fallback={
            <Card className="w-full max-w-md">
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        }>
            <UpdatePasswordFormContent />
        </Suspense>
    )
} 