'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PromptEnhancer } from '@/components/prompt-enhancer/PromptEnhancer'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { GlassButton } from '@/components/ui/GlassButton'
import { LuxuryCard, LuxuryCardContent } from '@/components/ui/LuxuryCard'
import { GradientText } from '@/components/ui/GradientText'

interface Model {
  id: string
  name: string
  provider: string
}

const ENHANCEMENT_MODELS: Model[] = [
  // OpenAI Models
  { id: 'gpt-5', name: 'GPT-5', provider: 'OpenAI' },
  { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', provider: 'OpenAI' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  
  // Claude Models
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'Anthropic' },
  { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
  
  // Gemini Models
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google' },
  { id: 'gemini-ultra', name: 'Gemini Ultra', provider: 'Google' },
]

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [enhancementModel, setEnhancementModel] = useState('gpt-3.5-turbo')
  const [targetModel, setTargetModel] = useState('') // Empty means generic/any
  const [creativity, setCreativity] = useState(5)
  const [thinkingDepth, setThinkingDepth] = useState(false)
  const [tokens, setTokens] = useState({ input: 0, enhanced: 0 })
  const [showEnhancer, setShowEnhancer] = useState(true)
  const [enhancementData, setEnhancementData] = useState<any>(null)

  // Calculate temperature from creativity slider
  const temperature = creativity / 10

  // Estimate tokens (rough approximation)
  useEffect(() => {
    const inputTokens = Math.ceil(prompt.length / 4)
    setTokens(prev => ({ ...prev, input: inputTokens }))
  }, [prompt])

  useEffect(() => {
    if (enhancedPrompt) {
      const enhancedTokens = Math.ceil(enhancedPrompt.length / 4)
      setTokens(prev => ({ ...prev, enhanced: enhancedTokens }))
    }
  }, [enhancedPrompt])

  const handleEnhanced = (enhanced: string, data: any) => {
    setEnhancedPrompt(enhanced)
    setEnhancementData(data)
  }

  const clearEnhancement = () => {
    setEnhancedPrompt('')
    setEnhancementData(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <GradientText as="h1" size="2xl" variant="cosmic" animate>
                🚀 Prompt Enhancement Studio
              </GradientText>
              <p className="text-gray-300/80 text-sm mt-1">
                AI-Powered Prompt Optimization • Multiple Enhancement Models
              </p>
            </div>
            <nav className="flex space-x-4">
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
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            {/* Model Selectors */}
            <LuxuryCard variant="glass" padding="md">
              <div className="space-y-4">
                {/* Enhancement Model Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Enhancement AI Model <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={enhancementModel}
                    onChange={(e) => setEnhancementModel(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {Object.entries(
                      ENHANCEMENT_MODELS.reduce((acc, model) => {
                        if (!acc[model.provider]) acc[model.provider] = []
                        acc[model.provider].push(model)
                        return acc
                      }, {} as Record<string, Model[]>)
                    ).map(([provider, models]) => (
                      <optgroup key={provider} label={provider}>
                        {models.map(model => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select which AI model will enhance your prompt
                  </p>
                </div>

                {/* Target Model Selector (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Model (Optional)
                  </label>
                  <select
                    value={targetModel}
                    onChange={(e) => setTargetModel(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Generic / Any Model</option>
                    {Object.entries(
                      ENHANCEMENT_MODELS.reduce((acc, model) => {
                        if (!acc[model.provider]) acc[model.provider] = []
                        acc[model.provider].push(model)
                        return acc
                      }, {} as Record<string, Model[]>)
                    ).map(([provider, models]) => (
                      <optgroup key={provider} label={provider}>
                        {models.map(model => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Optimize the enhanced prompt for a specific AI model
                  </p>
                </div>
              </div>
            </LuxuryCard>

            {/* Controls */}
            <LuxuryCard variant="glass" padding="md">
              <div className="space-y-4">
                {/* Creativity Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Creativity Level: {creativity} (Temperature: {temperature.toFixed(1)})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={creativity}
                    onChange={(e) => setCreativity(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Focused</span>
                    <span>Balanced</span>
                    <span>Creative</span>
                  </div>
                </div>

                {/* Thinking Depth Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">
                    Thinking Depth (Step-by-Step)
                  </label>
                  <button
                    onClick={() => setThinkingDepth(!thinkingDepth)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      thinkingDepth ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        thinkingDepth ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </LuxuryCard>

            {/* Prompt Input */}
            <LuxuryCard variant="glass" padding="md">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Original Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                className="w-full h-64 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 font-mono text-sm"
              />
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  ~{tokens.input} tokens
                </div>
              </div>
            </LuxuryCard>

            {/* Prompt Enhancer */}
            {showEnhancer && (
              <PromptEnhancer
                originalPrompt={prompt}
                enhancementModel={enhancementModel}
                targetModel={targetModel}
                creativity={creativity}
                thinkingDepth={thinkingDepth}
                onEnhanced={handleEnhanced}
              />
            )}
          </div>

          {/* Right Panel - Output */}
          <div className="space-y-6">
            {/* Enhancement Info */}
            {enhancementData && (
              <LuxuryCard variant="glass" padding="sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Enhanced By</p>
                    <p className="text-lg font-semibold text-white">
                      {ENHANCEMENT_MODELS.find(m => m.id === enhancementData.enhancementModel)?.name || enhancementData.enhancementModel}
                    </p>
                  </div>
                  {enhancementData.targetModel && (
                    <div>
                      <p className="text-sm text-gray-400">Optimized For</p>
                      <p className="text-lg font-semibold text-white">
                        {ENHANCEMENT_MODELS.find(m => m.id === enhancementData.targetModel)?.name || enhancementData.targetModel}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-400">Token Change</p>
                    <p className="text-lg font-semibold text-blue-400">
                      {enhancementData.metrics?.originalTokens} → {enhancementData.metrics?.enhancedTokens}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Improvement</p>
                    <p className="text-lg font-semibold text-green-400">
                      {enhancementData.metrics?.improvementRatio}x
                    </p>
                  </div>
                </div>
              </LuxuryCard>
            )}

            {/* Enhanced Prompt Output */}
            <LuxuryCard variant="glass" padding="md" className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-300">
                  {enhancedPrompt ? 'Enhanced Prompt' : 'Enhanced Prompt Will Appear Here'}
                </label>
                {enhancedPrompt && (
                  <div className="flex space-x-2">
                    <GlassButton
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(enhancedPrompt)}
                    >
                      Copy
                    </GlassButton>
                    <GlassButton
                      size="sm"
                      onClick={clearEnhancement}
                    >
                      Clear
                    </GlassButton>
                  </div>
                )}
              </div>
              <div className="bg-gray-900 rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-y-auto">
                {enhancedPrompt ? (
                  <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm">
                    {enhancedPrompt}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <p className="text-gray-500 mb-2">No enhanced prompt yet</p>
                      <p className="text-gray-600 text-sm">
                        Enter a prompt and click "Enhance Prompt" to see the enhanced version
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {enhancedPrompt && (
                <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                  <span>Enhanced: ~{tokens.enhanced} tokens</span>
                  <span>Strategy: {enhancementData?.strategy}</span>
                </div>
              )}
            </LuxuryCard>

            {/* Quick Actions */}
            <LuxuryCard variant="glass" padding="sm">
              <p className="text-sm font-medium text-gray-300 mb-3">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <GlassButton 
                  size="sm"
                  onClick={() => setPrompt('')}
                >
                  Clear Input
                </GlassButton>
                <GlassButton 
                  size="sm"
                  onClick={() => {
                    if (enhancedPrompt) {
                      setPrompt(enhancedPrompt)
                      clearEnhancement()
                    }
                  }}
                  disabled={!enhancedPrompt}
                >
                  Use as Input
                </GlassButton>
                <GlassButton 
                  size="sm"
                  onClick={() => setShowEnhancer(!showEnhancer)}
                >
                  {showEnhancer ? 'Hide' : 'Show'} Settings
                </GlassButton>
                <GlassButton size="sm">
                  Save Prompt
                </GlassButton>
              </div>
            </LuxuryCard>
          </div>
        </div>

        {/* Status Bar */}
        <LuxuryCard variant="glass" padding="sm" className="mt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-gray-300 text-sm">Enhancement Engine Active</span>
              </div>
              <div className="text-gray-500 text-sm">|</div>
              <span className="text-gray-400 text-sm">Multiple AI Models Available</span>
              <div className="text-gray-500 text-sm">|</div>
              <span className="text-gray-400 text-sm">Powered by OpenAI, Claude & Gemini</span>
            </div>
            <div className="text-gray-400 text-sm">
              Prompt Enhancement Studio v2.0
            </div>
          </div>
        </LuxuryCard>
      </main>
    </div>
  )
}