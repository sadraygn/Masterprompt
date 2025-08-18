'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Create a Supabase client for browser/client-side usage
 * This client is used for authentication and database operations from React components
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file'
    )
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  )
}