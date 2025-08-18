'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browserClient'
import { GlassButton } from '@/components/ui/GlassButton'
import { GradientText } from '@/components/ui/GradientText'
import { LogOut, User } from 'lucide-react'
import { useState } from 'react'

interface StudioHeaderProps {
  userEmail?: string | null
}

export function StudioHeader({ userEmail }: StudioHeaderProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <header className="border-b border-white/10 bg-white/5 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/studio">
              <GradientText as="h1" size="2xl" variant="cosmic" animate>
                🚀 GeniusPrompt
              </GradientText>
            </Link>
            
            <nav className="flex space-x-4">
              <Link href="/studio">
                <GlassButton size="sm" intensity="light">
                  Enhance
                </GlassButton>
              </Link>
              <Link href="/paraphrase">
                <GlassButton size="sm" intensity="light">
                  Paraphrase
                </GlassButton>
              </Link>
              <Link href="/advanced">
                <GlassButton size="sm" intensity="light">
                  Workflows
                </GlassButton>
              </Link>
              <Link href="/library">
                <GlassButton size="sm" intensity="light">
                  Library
                </GlassButton>
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {userEmail && (
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <User className="w-4 h-4" />
                <span>{userEmail}</span>
              </div>
            )}
            
            <GlassButton
              size="sm"
              onClick={handleSignOut}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>{loading ? 'Signing out...' : 'Sign Out'}</span>
            </GlassButton>
          </div>
        </div>
      </div>
    </header>
  )
}