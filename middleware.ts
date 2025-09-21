import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/admin']
  const publicPaths = ['/auth', '/']
  
  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )
  
  const isPublicPath = publicPaths.some(path => 
    req.nextUrl.pathname === path
  )

  // If trying to access protected route without session
  if (isProtectedPath && !session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth'
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If trying to access auth page while logged in
  if (req.nextUrl.pathname === '/auth' && session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  // Check admin routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/auth'
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
} 