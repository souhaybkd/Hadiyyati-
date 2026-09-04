'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Gift, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { useLanguage } from '@/lib/contexts/LanguageContext'
import { createSupabaseClient } from '@/lib/supabase'

export function AuthForm() {
    const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [username, setUsername] = useState('')
    const [usernameError, setUsernameError] = useState('')
    const [isCheckingUsername, setIsCheckingUsername] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const { t } = useLanguage()
    const supabase = createSupabaseClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            if (mode === 'login') {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                
                if (error) {
                    setError(error.message)
                    return
                }
                
                // Redirect to dashboard on successful login, or back to the
                // page that sent the user here (e.g. /checkout). Only allow
                // relative in-app paths to avoid open-redirect issues.
                const redirectParam = new URLSearchParams(window.location.search).get('redirectTo')
                const destination =
                    redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
                        ? redirectParam
                        : '/dashboard'
                window.location.href = destination
            } else if (mode === 'register') {
                // Validate username before signup
                if (!username.trim()) {
                    setError(t('auth.usernameRequired'))
                    setIsLoading(false)
                    return
                }

                const isUsernameAvailable = await checkUsernameAvailability(username)
                if (!isUsernameAvailable) {
                    setError(usernameError || t('auth.chooseDifferentUsername'))
                    setIsLoading(false)
                    return
                }

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                            preferred_username: username.toLowerCase().trim(),
                        },
                    },
                })
                
                if (error) {
                    setError(error.message)
                    return
                }
                
                // Check if email confirmation is required
                if (data.user && !data.session) {
                    setSuccess(t('auth.checkEmail'))
                } else {
                    // Redirect to dashboard on successful signup
                    window.location.href = '/dashboard'
                }
            } else if (mode === 'forgot') {
                // Use environment variable if available, otherwise fall back to window.location.origin
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${siteUrl}/auth/update-password?redirectTo=/dashboard`,
                })
                
                if (error) {
                    setError(error.message)
                    return
                }
                
                setSuccess(t('auth.resetSent'))
            }
        } catch (error) {
            setError(t('auth.failed'))
        } finally {
            setIsLoading(false)
        }
    }

    // Check username availability
    const checkUsernameAvailability = async (usernameToCheck: string): Promise<boolean> => {
        if (!usernameToCheck.trim()) {
            setUsernameError(t('auth.usernameRequired'))
            return false
        }

        // Validate username format
        const usernameRegex = /^[a-zA-Z0-9_-]+$/
        if (!usernameRegex.test(usernameToCheck)) {
            setUsernameError(t('auth.usernameFormat'))
            return false
        }

        if (usernameToCheck.length < 3) {
            setUsernameError(t('auth.usernameMin'))
            return false
        }

        if (usernameToCheck.length > 30) {
            setUsernameError(t('auth.usernameMax'))
            return false
        }

        setIsCheckingUsername(true)
        setUsernameError('')

        try {
            // Availability is checked via a SECURITY DEFINER function, since users
            // can't read other profile rows directly under RLS.
            const { data: isAvailable, error } = await supabase
                .rpc('is_username_available', { check_username: usernameToCheck })

            if (error) {
                console.error('Error checking username:', error)
                setUsernameError(t('common.error'))
                setIsCheckingUsername(false)
                return false
            }

            if (!isAvailable) {
                setUsernameError(t('auth.chooseDifferentUsername'))
                setIsCheckingUsername(false)
                return false
            }

            setUsernameError('')
            setIsCheckingUsername(false)
            return true
        } catch (error) {
            console.error('Error checking username:', error)
            setUsernameError(t('common.error'))
            setIsCheckingUsername(false)
            return false
        }
    }

    // Handle username change
    const handleUsernameChange = (value: string) => {
        setUsername(value)
        setUsernameError('')
    }

    // Debounced username availability check
    useEffect(() => {
        if (username.trim().length >= 3) {
            const timeoutId = setTimeout(() => {
                checkUsernameAvailability(username)
            }, 500)

            return () => clearTimeout(timeoutId)
        } else if (username.trim().length > 0 && username.trim().length < 3) {
            setUsernameError(t('auth.usernameMin'))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username])

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        setError('')
        
        try {
            // Use environment variable if available, otherwise fall back to window.location.origin
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
            const redirectUrl = `${siteUrl}/auth/callback?next=/dashboard`
            
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl
                }
            })
            
            if (error) {
                setError(error.message)
                setIsLoading(false)
            }
            // If successful, user will be redirected, so we don't set loading to false
        } catch (error) {
            setError(t('auth.failed'))
            setIsLoading(false)
        }
    }

    if (mode === 'forgot') {
        return (
            <Card className="w-full max-w-xl shadow-design-card">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-design-primary/10 text-design-primary rounded-design-card h-16 w-16 flex items-center justify-center mb-6">
                        <Gift className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-design-h3 text-design-text-heading">{t('auth.forgotTitle')}</CardTitle>
                    <CardDescription className="text-design-text-muted">
                        {t('auth.forgotSubtitle')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-design-text-heading">{t('auth.email')}</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('auth.emailPh')}
                                required
                                className="h-12"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-design-button">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <span className="text-design-small text-red-700">{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-design-button">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-design-small text-green-700">{success}</span>
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? t('auth.sending') : t('auth.sendReset')}
                        </Button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-design-small text-design-text-muted">
                            {t('auth.rememberPassword')}
                            <Button variant="link" onClick={() => setMode('login')} className="text-design-primary">
                                {t('auth.backToLogin')}
                            </Button>
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-xl shadow-design-card">
            <CardHeader className="text-center">
                <div className="mx-auto bg-design-primary/10 text-design-primary rounded-design-card h-16 w-16 flex items-center justify-center mb-6">
                    <Gift className="h-8 w-8" />
                </div>
                <CardTitle className="text-design-h3 text-design-text-heading">{mode === 'login' ? t('auth.login') : t('auth.register')}</CardTitle>
                <CardDescription className="text-design-text-muted">
                    {mode === 'login' 
                        ? t('auth.welcomeBack')
                        : t('auth.createAccount')
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'register' && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-design-text-heading">{t('auth.fullName')}</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t('auth.fullNamePh')}
                                    required
                                    className="h-12"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-design-text-heading">
                                    {t('auth.username')} *
                                </Label>
                                <Input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => handleUsernameChange(e.target.value)}
                                    placeholder="your-username"
                                    required
                                    className="h-12"
                                    disabled={isCheckingUsername}
                                />
                                {usernameError && (
                                    <p className="text-sm text-red-600">{usernameError}</p>
                                )}
                                {!usernameError && username.trim().length >= 3 && !isCheckingUsername && (
                                    <p className="text-sm text-green-600 flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        {t('auth.usernameAvailable')}
                                    </p>
                                )}
                                {isCheckingUsername && (
                                    <p className="text-sm text-muted-foreground">{t('auth.checkingUsername')}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    {t('auth.wishlistAt', { username: username || t('home.hero.yourName') })}
                                </p>
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-design-text-heading">{t('auth.email')}</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('auth.emailPh')}
                            required
                            className="h-12"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-design-text-heading">{t('auth.password')}</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t('auth.passwordPh')}
                                required
                                className="h-12 pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-design-text-muted" />
                                ) : (
                                    <Eye className="h-4 w-4 text-design-text-muted" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-design-button">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <span className="text-design-small text-red-700">{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-design-button">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-design-small text-green-700">{success}</span>
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? t('auth.pleaseWait') : (mode === 'login' ? t('auth.signIn') : t('auth.createAccountBtn'))}
                    </Button>
                </form>

                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-design-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-design-small">
                            <span className="bg-white px-2 text-design-text-muted">{t('auth.or')}</span>
                        </div>
                    </div>

                    <Button 
                        variant="outline" 
                        className="w-full" 
                        disabled={isLoading}
                        onClick={handleGoogleLogin}
                    >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        {isLoading ? t('auth.connecting') : t('auth.google')}
                    </Button>
                </div>

                <div className="text-center">
                    <p className="text-design-small text-design-text-muted pt-2">
                        {mode === 'login' ? `${t('auth.noAccount')} ` : `${t('auth.hasAccount')} `}
                        <button 
                           
                            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                            className="text-design-primary text-design-small"
                        >
                            {mode === 'login' ? t('auth.signUp') : t('auth.signIn')}
                        </button>
                    </p>
                </div>

                {mode === 'login' && (
                    <div className="text-center">
                        <button type="button" onClick={() => setMode('forgot')} className="text-design-primary text-design-small">
                            {t('auth.forgotPassword')}
                        </button>
                        
                    </div>
                )}
            </CardContent>
        </Card>
    )
} 