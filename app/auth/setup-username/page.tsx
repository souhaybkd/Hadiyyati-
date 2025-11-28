'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Gift, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase'

export default function SetupUsernamePage() {
  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseClient()

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }
      setIsAuthenticated(true)

      // Check if user already has a profile with a username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      if (profile?.username && !profile.username.startsWith('user')) {
        // User already has a proper username, redirect to dashboard
        router.push('/dashboard')
      }
    }
    checkAuth()
  }, [router, supabase])

  // Check username availability
  const checkUsernameAvailability = async (usernameToCheck: string): Promise<boolean> => {
    if (!usernameToCheck.trim()) {
      setUsernameError('Username is required')
      return false
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    if (!usernameRegex.test(usernameToCheck)) {
      setUsernameError('Username can only contain letters, numbers, underscores, and hyphens')
      return false
    }

    if (usernameToCheck.length < 3) {
      setUsernameError('Username must be at least 3 characters')
      return false
    }

    if (usernameToCheck.length > 30) {
      setUsernameError('Username must be less than 30 characters')
      return false
    }

    setIsCheckingUsername(true)
    setUsernameError('')

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', usernameToCheck.toLowerCase().trim())
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking username:', error)
        setUsernameError('Unable to check username availability. Please try again.')
        setIsCheckingUsername(false)
        return false
      }

      if (data) {
        setUsernameError('This username is already taken')
        setIsCheckingUsername(false)
        return false
      }

      setUsernameError('')
      setIsCheckingUsername(false)
      return true
    } catch (error) {
      console.error('Error checking username:', error)
      setUsernameError('Unable to check username availability. Please try again.')
      setIsCheckingUsername(false)
      return false
    }
  }

  // Debounced username availability check
  useEffect(() => {
    if (username.trim().length >= 3) {
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(username)
      }, 500)

      return () => clearTimeout(timeoutId)
    } else if (username.trim().length > 0 && username.trim().length < 3) {
      setUsernameError('Username must be at least 3 characters')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validate username before submitting
    const isUsernameAvailable = await checkUsernameAvailability(username)
    if (!isUsernameAvailable) {
      setError(usernameError || 'Please choose a different username')
      setIsLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to set a username')
        router.push('/auth')
        return
      }

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', user.id)
        .single()

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ username: username.toLowerCase().trim() })
          .eq('id', user.id)

        if (updateError) {
          if (updateError.code === '23505') {
            setError('This username is already taken. Please choose another one.')
          } else {
            setError('Failed to update username. Please try again.')
          }
          setIsLoading(false)
          return
        }
      } else {
        // Create new profile
        const userData = user.user_metadata || {}
        const email = user.email || ''
        const fullName = userData.full_name || userData.name || email.split('@')[0] || 'User'

        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: username.toLowerCase().trim(),
            full_name: fullName,
            email: email,
            avatar_url: userData.avatar_url || null,
            role: 'user'
          })

        if (insertError) {
          if (insertError.code === '23505') {
            setError('This username is already taken. Please choose another one.')
          } else {
            setError('Failed to create profile. Please try again.')
          }
          setIsLoading(false)
          return
        }
      }

      // Success - redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error setting username:', error)
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-design-card">
        <CardHeader className="text-center">
          <div className="mx-auto bg-design-primary/10 text-design-primary rounded-design-card h-16 w-16 flex items-center justify-center mb-6">
            <Gift className="h-8 w-8" />
          </div>
          <CardTitle className="text-design-h3 text-design-text-heading">
            Choose Your Username
          </CardTitle>
          <CardDescription className="text-design-text-muted">
            Pick a unique username for your wishlist. This will be your public profile URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-design-text-heading">
                Username *
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setUsernameError('')
                }}
                placeholder="your-username"
                required
                className="h-12"
                disabled={isCheckingUsername || isLoading}
                autoFocus
              />
              {usernameError && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {usernameError}
                </p>
              )}
              {!usernameError && username.trim().length >= 3 && !isCheckingUsername && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Username available
                </p>
              )}
              {isCheckingUsername && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Checking availability...
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Your wishlist will be at: hadiyyati.me/{username || 'your-username'}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-design-button">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-design-small text-red-700">{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || isCheckingUsername || !!usernameError || username.trim().length < 3}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Continue to Dashboard'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

