import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables')
    // Allow the request to continue if env vars are missing (for development)
    // In production, you might want to return an error response
    return res
  }

  // Verified user (null if not authenticated). We use getUser() rather than
  // getSession() because getUser() validates the JWT with the Supabase auth
  // server, which is required before making authorization decisions.
  let user: { id: string } | null = null
  let supabase: ReturnType<typeof createServerClient> | null = null

  try {
    supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              res.cookies.set({
                name,
                value,
                ...options,
              })
            })
          },
        },
      }
    )

    const {
      data: { user: verifiedUser },
    } = await supabase.auth.getUser()

    user = verifiedUser
  } catch (error) {
    console.error('Middleware error:', error)
    // If there's an error, allow the request to continue
    // This prevents the entire site from breaking if Supabase is down
    return res
  }

  const session = user

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/admin']
  const publicPaths = ['/auth', '/']
  const setupUsernamePath = '/auth/setup-username'
  
  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )
  
  const isPublicPath = publicPaths.some(path => 
    req.nextUrl.pathname === path
  )
  
  const isSetupUsernamePath = req.nextUrl.pathname === setupUsernamePath
  
  // If trying to access protected route without session
  if (isProtectedPath && !session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth'
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // If trying to access setup-username without session, redirect to auth
  if (isSetupUsernamePath && !session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth'
    return NextResponse.redirect(redirectUrl)
  }
  
  // If trying to access auth page while logged in (but allow setup-username)
  if (req.nextUrl.pathname === '/auth' && session && !isSetupUsernamePath) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  // Check admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!user || !supabase) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/auth'
      return NextResponse.redirect(redirectUrl)
    }

    try {
      // Check if user is admin (reuse the already-created, authenticated client)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/dashboard'
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      // If there's an error checking admin, redirect to dashboard
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - assets (images and static files under /public/assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|assets).*)',
  ],
} 