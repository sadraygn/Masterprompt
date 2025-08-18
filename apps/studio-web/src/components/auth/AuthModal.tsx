'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/browserClient'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { GlassButton } from '@/components/ui/GlassButton'
import { LuxuryCard } from '@/components/ui/LuxuryCard'
import { GradientText } from '@/components/ui/GradientText'
import { X } from 'lucide-react'

interface AuthModalProps {
  mode: 'signin' | 'signup'
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AuthModal({ mode, isOpen, onClose, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === 'signup') {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (error) throw error
        
        if (data?.user?.identities?.length === 0) {
          setError('A user with this email already exists')
        } else {
          setMessage('Check your email for the confirmation link!')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
        
        // Successful sign in
        if (onSuccess) {
          onSuccess()
        } else {
          window.location.href = '/studio'
        }
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during authentication')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      setError(error.message || 'An error occurred during OAuth authentication')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md px-4">
        <LuxuryCard variant="glass" padding="lg" className="relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <GradientText as="h2" size="2xl" variant="cosmic" animate>
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </GradientText>
            <p className="text-gray-400 mt-2">
              {mode === 'signin' 
                ? 'Sign in to access your prompt studio' 
                : 'Join us to start enhancing your prompts'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-all duration-300"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-all duration-300"
                placeholder="••••••••"
                disabled={loading}
                minLength={6}
              />
            </div>

            {/* Error/Success messages */}
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-700 rounded-xl">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
            {message && (
              <div className="p-3 bg-green-900/20 border border-green-700 rounded-xl">
                <p className="text-sm text-green-400">{message}</p>
              </div>
            )}

            {/* Submit button */}
            <LuxuryButton
              type="submit"
              variant="glow"
              className="w-full"
              disabled={loading}
              gradientFrom="from-purple-600"
              gradientVia="via-violet-600"
              gradientTo="to-blue-600"
            >
              {loading 
                ? 'Processing...' 
                : mode === 'signin' 
                  ? 'Sign In' 
                  : 'Sign Up'}
            </LuxuryButton>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-900/50 text-gray-400">Or continue with</span>
            </div>
          </div>

          {/* OAuth buttons */}
          <div className="space-y-3">
            <GlassButton
              onClick={() => handleOAuthSignIn('google')}
              className="w-full"
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </GlassButton>

            <GlassButton
              onClick={() => handleOAuthSignIn('github')}
              className="w-full"
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub
            </GlassButton>
          </div>

          {/* Switch mode */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => {
                  setEmail('')
                  setPassword('')
                  setError(null)
                  setMessage(null)
                  // Toggle mode
                  window.dispatchEvent(new CustomEvent('auth-mode-switch', {
                    detail: { mode: mode === 'signin' ? 'signup' : 'signin' }
                  }))
                }}
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </LuxuryCard>
      </div>
    </div>
  )
}