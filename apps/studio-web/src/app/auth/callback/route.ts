import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/serverClient'

/**
 * Handle OAuth callback from Supabase
 * Exchange the authorization code for a session
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/studio'

  if (code) {
    const supabase = await createClient()
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // Successful authentication, redirect to the intended page
        return NextResponse.redirect(new URL(next, requestUrl.origin))
      }
    } catch (error) {
      console.error('Error exchanging code for session:', error)
    }
  }

  // If there was an error or no code, redirect to the landing page
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}