'use client'

import { useState } from 'react'
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
                
                // Redirect to dashboard on successful login
                window.location.href = '/dashboard'
            } else if (mode === 'register') {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                        },
                    },
                })
                
                if (error) {
                    setError(error.message)
                    return
                }
                
                // Check if email confirmation is required
                if (data.user && !data.session) {
                    setSuccess('Please check your email for a confirmation link.')
                } else {
                    // Redirect to dashboard on successful signup
                    window.location.href = '/dashboard'
                }
            } else if (mode === 'forgot') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/auth/update-password?redirectTo=/dashboard`,
                })
                
                if (error) {
                    setError(error.message)
                    return
                }
                
                setSuccess('Password reset link sent to your email.')
            }
        } catch (error) {
            setError('Authentication failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        setError('')
        
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
                }
            })
            
            if (error) {
                setError(error.message)
                setIsLoading(false)
            }
            // If successful, user will be redirected, so we don't set loading to false
        } catch (error) {
            setError('Failed to login with Google. Please try again.')
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
                    <CardTitle className="text-design-h3 text-design-text-heading">Reset Password</CardTitle>
                    <CardDescription className="text-design-text-muted">
                        Enter your email address and we'll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-design-text-heading">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
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
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-design-small text-design-text-muted">
                            Remember your password?
                            <Button variant="link" onClick={() => setMode('login')} className="text-design-primary">
                                Back to Login
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
                        ? 'Welcome back! Sign in to your account' 
                        : 'Create your account to get started'
                    }
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'register' && (
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-design-text-heading">Full Name</Label>
                            <Input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your full name"
                                required
                                className="h-12"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-design-text-heading">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            className="h-12"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-design-text-heading">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
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
                        {isLoading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
                    </Button>
                </form>

                <div className="text-center space-y-4">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-design-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-design-small">
                            <span className="bg-white px-2 text-design-text-muted">or</span>
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
                        {isLoading ? 'Connecting...' : 'Continue with Google'}
                    </Button>
                </div>

                <div className="text-center">
                    <p className="text-design-small text-design-text-muted pt-2">
                        {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                        <button 
                           
                            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                            className="text-design-primary text-design-small"
                        >
                            {mode === 'login' ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </div>

                {mode === 'login' && (
                    <div className="text-center">
                        <button type="button" onClick={() => setMode('forgot')} className="text-design-primary text-design-small">
                            Forgot your password?
                        </button>
                        
                    </div>
                )}
            </CardContent>
        </Card>
    )
} 