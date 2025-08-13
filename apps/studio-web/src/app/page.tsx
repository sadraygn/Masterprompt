'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Model {
  id: string
  name: string
  provider: string
  costPer1k: number
}

const MODELS: Model[] = [
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', costPer1k: 0.01 },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', costPer1k: 0.002 },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', costPer1k: 0.015 },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', costPer1k: 0.003 },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google', costPer1k: 0.001 },
  { id: 'llama-3-70b', name: 'Llama 3 70B', provider: 'Meta', costPer1k: 0.0008 },
]

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo')
  const [creativity, setCreativity] = useState(5)
  const [thinkingDepth, setThinkingDepth] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [tokens, setTokens] = useState({ input: 0, output: 0 })
  const [cost, setCost] = useState(0)

  // Calculate temperature from creativity slider
  const temperature = creativity / 10

  // Estimate tokens (rough approximation)
  useEffect(() => {
    const inputTokens = Math.ceil(prompt.length / 4)
    setTokens(prev => ({ ...prev, input: inputTokens }))
  }, [prompt])

  const handleSubmit = async () => {
    setIsLoading(true)
    setResponse('')
    
    try {
      // Add thinking depth instruction if enabled
      const finalPrompt = thinkingDepth 
        ? `${prompt}\n\nPlease think step by step and explain your reasoning.`
        : prompt

      const res = await fetch('/api/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer d076788c857bf9eefec86b8caa560d8767387380c25a5cbb89345824d5303a81'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: finalPrompt }],
          temperature,
          stream: false
        })
      })

      const data = await res.json()
      
      if (data.error) {
        setResponse(`Error: ${data.error}`)
      } else {
        setResponse(data.choices?.[0]?.message?.content || 'No response')
        const outputTokens = Math.ceil((data.choices?.[0]?.message?.content || '').length / 4)
        setTokens({ input: tokens.input, output: outputTokens })
        
        // Calculate cost
        const model = MODELS.find(m => m.id === selectedModel)
        if (model) {
          const totalTokens = tokens.input + outputTokens
          const estimatedCost = (totalTokens / 1000) * model.costPer1k
          setCost(estimatedCost)
        }
      }
    } catch (error) {
      setResponse(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                🚀 Prompt Engineering Studio
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                100+ LLM Providers • Cost Tracking • Security Built-in
              </p>
            </div>
            <nav className="flex space-x-4">
              <Link
                href="/paraphrase"
                className="px-4 py-2 text-gray-300 hover:text-white transition"
              >
                Paraphrase
              </Link>
              <Link
                href="/advanced"
                className="px-4 py-2 text-gray-300 hover:text-white transition"
              >
                Workflows
              </Link>
              <Link
                href="/library"
                className="px-4 py-2 text-gray-300 hover:text-white transition"
              >
                Library
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
            {/* Model Selector */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Model Provider
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {Object.entries(
                  MODELS.reduce((acc, model) => {
                    if (!acc[model.provider]) acc[model.provider] = []
                    acc[model.provider].push(model)
                    return acc
                  }, {} as Record<string, Model[]>)
                ).map(([provider, models]) => (
                  <optgroup key={provider} label={provider}>
                    {models.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} (${model.costPer1k}/1k tokens)
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Controls */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
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
            </div>

            {/* Prompt Input */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Prompt
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
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !prompt}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isLoading ? 'Processing...' : 'Execute Prompt'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Output */}
          <div className="space-y-6">
            {/* Cost Tracker */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Token Usage</p>
                  <p className="text-lg font-semibold text-white">
                    {tokens.input + tokens.output} tokens
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Estimated Cost</p>
                  <p className="text-lg font-semibold text-green-400">
                    ${cost.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>

            {/* Response Output */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 flex-1">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-300">
                  Response
                </label>
                {response && (
                  <button
                    onClick={() => navigator.clipboard.writeText(response)}
                    className="text-xs px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition"
                  >
                    Copy
                  </button>
                )}
              </div>
              <div className="bg-gray-900 rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : response ? (
                  <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm">
                    {response}
                  </pre>
                ) : (
                  <p className="text-gray-500 text-center mt-8">
                    Response will appear here...
                  </p>
                )}
              </div>
              {response && (
                <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                  <span>Output: ~{tokens.output} tokens</span>
                  <span>Model: {MODELS.find(m => m.id === selectedModel)?.name}</span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <p className="text-sm font-medium text-gray-300 mb-3">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <button className="px-3 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm transition">
                  Save Prompt
                </button>
                <button className="px-3 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm transition">
                  Share
                </button>
                <button className="px-3 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm transition">
                  Add to Library
                </button>
                <button className="px-3 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm transition">
                  Run Evaluation
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-8 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-gray-300 text-sm">LiteLLM Gateway Active</span>
              </div>
              <div className="text-gray-500 text-sm">|</div>
              <span className="text-gray-400 text-sm">Langfuse Tracing: Enabled</span>
              <div className="text-gray-500 text-sm">|</div>
              <span className="text-gray-400 text-sm">Security: Rebuff + Guardrails</span>
            </div>
            <div className="text-gray-400 text-sm">
              100+ Providers Available
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}