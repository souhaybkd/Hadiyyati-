'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Lock } from 'lucide-react'
import { useLanguage } from '@/lib/contexts/LanguageContext'

function UpdatePasswordFormContent() {
    const { t } = useLanguage()
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
            setError(t('auth.passwordsMismatch'))
            return
        }
        
        if (password.length < 6) {
            setError(t('auth.passwordMin'))
            return
        }

        setLoading(true)

        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
            setError(error.message)
        } else {
            setMessage(t('auth.passwordResetOk'))
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
                <CardTitle className="text-2xl">{t('auth.resetPassword')}</CardTitle>
                <CardDescription>
                    {t('auth.resetPasswordDesc')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">{t('auth.newPassword')}</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
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
                        {t('auth.updatePassword')}
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