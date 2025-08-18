import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/serverClient'

/**
 * Middleware to protect routes and handle authentication
 * Runs before every request to check auth status
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  try {
    const supabase = createMiddlewareClient(request, response)
    
    // Refresh session if expired
    const { data: { session } } = await supabase.auth.getSession()
    
    // Protected routes that require authentication
    const protectedRoutes = ['/studio', '/paraphrase', '/advanced', '/library']
    const isProtectedRoute = protectedRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )
    
    // Auth callback route
    if (request.nextUrl.pathname === '/auth/callback') {
      // Handle auth callback
      const code = request.nextUrl.searchParams.get('code')
      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
      }
      // Redirect to studio after successful auth
      return NextResponse.redirect(new URL('/studio', request.url))
    }
    
    // Check if user is trying to access a protected route
    if (isProtectedRoute && !session) {
      // Redirect to landing page if not authenticated
      const redirectUrl = new URL('/', request.url)
      redirectUrl.searchParams.set('next', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    // If user is authenticated and on landing page, redirect to studio
    if (request.nextUrl.pathname === '/' && session) {
      return NextResponse.redirect(new URL('/studio', request.url))
    }
    
    return response
  } catch (error) {
    // If there's an error, continue with the request
    console.error('Middleware error:', error)
    return response
  }
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}