'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browserClient'
import { AuthModal } from '@/components/auth/AuthModal'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { GlassButton } from '@/components/ui/GlassButton'
import { LuxuryCard } from '@/components/ui/LuxuryCard'
import { GradientText } from '@/components/ui/GradientText'
import { Sparkles, Zap, Shield, Rocket } from 'lucide-react'

export default function LandingPage() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if user is already authenticated
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          // User is authenticated, redirect to studio
          router.push('/studio')
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Error checking auth status:', error)
        setLoading(false)
      }
    }

    checkUser()

    // Listen for auth mode switch events
    const handleAuthModeSwitch = (event: CustomEvent) => {
      setAuthMode(event.detail.mode)
    }

    window.addEventListener('auth-mode-switch' as any, handleAuthModeSwitch as any)
    return () => {
      window.removeEventListener('auth-mode-switch' as any, handleAuthModeSwitch as any)
    }
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="animate-pulse">
          <GradientText as="h1" size="2xl" variant="cosmic" animate>
            Loading...
          </GradientText>
        </div>
      </div>
    )
  }

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'AI-Powered Enhancement',
      description: 'Transform simple prompts into sophisticated instructions using multiple AI models'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Instant Optimization',
      description: 'Get better results with optimized prompts tailored for your chosen AI model'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Privacy First',
      description: 'Your prompts and data are secure with enterprise-grade encryption'
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      title: 'Multiple Models',
      description: 'Support for GPT, Claude, Gemini, and more AI models'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 py-24">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo/Title */}
            <div className="mb-8 inline-flex items-center justify-center p-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl">
              <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
            </div>

            <GradientText as="h1" size="2xl" variant="cosmic" animate className="text-6xl font-bold mb-6">
              Prompt Enhancement Studio
            </GradientText>

            <p className="text-xl text-gray-300/80 mb-12 max-w-2xl mx-auto">
              Transform your simple prompts into powerful AI instructions. 
              Optimize for any model, enhance creativity, and get better results instantly.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <LuxuryButton
                onClick={() => setAuthMode('signup')}
                variant="glow"
                size="lg"
                gradientFrom="from-purple-600"
                gradientVia="via-violet-600"
                gradientTo="to-blue-600"
              >
                Get Started Free
              </LuxuryButton>
              <GlassButton
                onClick={() => setAuthMode('signin')}
                size="lg"
              >
                Sign In
              </GlassButton>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-400">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Secure & Private
              </span>
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                No Credit Card Required
              </span>
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Free Forever Plan
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <GradientText as="h2" size="xl" variant="ocean" className="text-4xl font-bold mb-4">
            Why Choose Our Studio?
          </GradientText>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Everything you need to create perfect prompts for any AI model
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <LuxuryCard
              key={index}
              variant="glass"
              padding="md"
              className="text-center hover:scale-105 transition-transform duration-300"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 mb-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl text-purple-400">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-400">
                {feature.description}
              </p>
            </LuxuryCard>
          ))}
        </div>
      </div>

      {/* How it Works Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <GradientText as="h2" size="xl" variant="sunset" className="text-4xl font-bold mb-4">
            How It Works
          </GradientText>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Three simple steps to better AI interactions
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Write Your Prompt',
                description: 'Start with your basic idea or instruction'
              },
              {
                step: '2',
                title: 'Choose Enhancement',
                description: 'Select AI model and enhancement options'
              },
              {
                step: '3',
                title: 'Get Better Results',
                description: 'Receive optimized prompt for maximum impact'
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="container mx-auto px-4 py-24">
        <LuxuryCard variant="gradient" padding="lg" className="text-center max-w-2xl mx-auto">
          <GradientText as="h2" size="xl" variant="rainbow" className="text-3xl font-bold mb-4">
            Ready to Transform Your Prompts?
          </GradientText>
          <p className="text-gray-300 mb-8">
            Join thousands of users creating better AI interactions every day.
          </p>
          <LuxuryButton
            onClick={() => setAuthMode('signup')}
            variant="glow"
            size="lg"
            gradientFrom="from-emerald-600"
            gradientVia="via-teal-600"
            gradientTo="to-cyan-600"
          >
            Start Free Now
          </LuxuryButton>
        </LuxuryCard>
      </div>

      {/* Auth Modal */}
      {authMode && (
        <AuthModal
          mode={authMode}
          isOpen={true}
          onClose={() => setAuthMode(null)}
          onSuccess={() => router.push('/studio')}
        />
      )}
    </div>
  )
}