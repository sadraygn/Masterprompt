'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { GlassButton } from '@/components/ui/GlassButton'
import { LuxuryCard, LuxuryCardContent } from '@/components/ui/LuxuryCard'
import { GradientText } from '@/components/ui/GradientText'

interface Prompt {
  id: string
  title: string
  description: string
  content: string
  category: string
  source: 'awesome-prompts' | 'prompthub' | 'custom'
  tags: string[]
}

// Sample prompts - in production these would come from the synced libraries
const SAMPLE_PROMPTS: Prompt[] = [
  {
    id: '1',
    title: 'Act as a Linux Terminal',
    description: 'Respond as if you are a Linux terminal',
    content: 'I want you to act as a linux terminal. I will type commands and you will reply with what the terminal should show. I want you to only reply with the terminal output inside one unique code block, and nothing else.',
    category: 'Technical',
    source: 'awesome-prompts',
    tags: ['linux', 'terminal', 'technical']
  },
  {
    id: '2',
    title: 'JavaScript Console',
    description: 'Act as a JavaScript console',
    content: 'I want you to act as a javascript console. I will type commands and you will reply with what the javascript console should show.',
    category: 'Programming',
    source: 'awesome-prompts',
    tags: ['javascript', 'programming', 'console']
  },
  {
    id: '3',
    title: 'SQL Translator',
    description: 'Translate natural language to SQL queries',
    content: 'I want you to act as a SQL translator. I will describe what I want in plain English and you will respond with the corresponding SQL query.',
    category: 'Database',
    source: 'prompthub',
    tags: ['sql', 'database', 'translation']
  },
  {
    id: '4',
    title: 'Python Expert',
    description: 'Expert Python developer assistant',
    content: 'You are an expert Python developer. Help me write clean, efficient, and well-documented Python code following best practices.',
    category: 'Programming',
    source: 'custom',
    tags: ['python', 'programming', 'expert']
  },
  {
    id: '5',
    title: 'Story Writer',
    description: 'Creative story writing assistant',
    content: 'I want you to act as a storyteller. You will come up with entertaining stories that are engaging, imaginative and captivating for the audience.',
    category: 'Creative',
    source: 'awesome-prompts',
    tags: ['writing', 'creative', 'storytelling']
  },
  {
    id: '6',
    title: 'Code Reviewer',
    description: 'Thorough code review assistant',
    content: 'Act as a senior software engineer conducting a code review. Analyze the provided code for bugs, performance issues, security vulnerabilities, and adherence to best practices.',
    category: 'Programming',
    source: 'custom',
    tags: ['code-review', 'programming', 'quality']
  }
]

const CATEGORIES = ['All', 'Technical', 'Programming', 'Database', 'Creative', 'Business', 'Education']

export default function LibraryPage() {
  const [prompts, setPrompts] = useState<Prompt[]>(SAMPLE_PROMPTS)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filteredPrompts = prompts.filter(prompt => {
    const matchesCategory = selectedCategory === 'All' || prompt.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesCategory && matchesSearch
  })

  const copyToClipboard = (prompt: Prompt) => {
    navigator.clipboard.writeText(prompt.content)
    setCopiedId(prompt.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const usePrompt = (prompt: Prompt) => {
    // Store in localStorage to use on main page
    localStorage.setItem('selectedPrompt', JSON.stringify(prompt))
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <GradientText as="h1" size="2xl" variant="ocean" animate>
                📚 Prompt Library
              </GradientText>
              <p className="text-gray-300/80 text-sm mt-1">
                Community-curated prompts from Awesome-ChatGPT & PromptHub
              </p>
            </div>
            <Link href="/">
              <LuxuryButton size="sm" variant="gradient" gradientFrom="from-blue-500" gradientVia="via-cyan-500" gradientTo="to-teal-500">
                Back to Studio
              </LuxuryButton>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search */}
            <LuxuryCard variant="glass" padding="sm">
              <input
                type="text"
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-all duration-300"
              />
            </LuxuryCard>

            {/* Categories */}
            <LuxuryCard variant="glass" padding="sm">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Categories</h3>
              <div className="space-y-2">
                {CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </LuxuryCard>

            {/* Sources */}
            <LuxuryCard variant="glass" padding="sm">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Sources</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Awesome Prompts</span>
                  <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded-full text-xs">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">PromptHub</span>
                  <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded-full text-xs">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Custom</span>
                  <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs">
                    Local
                  </span>
                </div>
              </div>
              <GlassButton className="w-full mt-4" size="sm">
                Sync Libraries
              </GlassButton>
            </LuxuryCard>
          </div>

          {/* Prompt Grid */}
          <div className="lg:col-span-3 space-y-4">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <p className="text-gray-400">
                Found {filteredPrompts.length} prompts
              </p>
              <GlassButton size="sm">
                + Add Custom Prompt
              </GlassButton>
            </div>

            {/* Prompt Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPrompts.map(prompt => (
                <LuxuryCard
                  key={prompt.id}
                  variant="glass"
                  padding="md"
                  className="cursor-pointer"
                  onClick={() => setSelectedPrompt(prompt)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">
                      {prompt.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      prompt.source === 'awesome-prompts' 
                        ? 'bg-purple-600/20 text-purple-400'
                        : prompt.source === 'prompthub'
                        ? 'bg-yellow-600/20 text-yellow-400'
                        : 'bg-blue-600/20 text-blue-400'
                    }`}>
                      {prompt.source}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">
                    {prompt.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {prompt.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          copyToClipboard(prompt)
                        }}
                        className="p-2 text-gray-400 hover:text-white transition"
                      >
                        {copiedId === prompt.id ? (
                          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          usePrompt(prompt)
                        }}
                        className="p-2 text-gray-400 hover:text-white transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </LuxuryCard>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Prompt Detail Modal */}
      {selectedPrompt && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPrompt(null)}
        >
          <div
            className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedPrompt.title}</h2>
                  <p className="text-gray-400 mt-1">{selectedPrompt.description}</p>
                </div>
                <button
                  onClick={() => setSelectedPrompt(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 mb-6">
                <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm">
                  {selectedPrompt.content}
                </pre>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {selectedPrompt.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex space-x-3">
                  <GlassButton
                    onClick={() => copyToClipboard(selectedPrompt)}
                    size="sm"
                  >
                    Copy
                  </GlassButton>
                  <LuxuryButton
                    onClick={() => usePrompt(selectedPrompt)}
                    size="sm"
                    variant="gradient"
                    gradientFrom="from-blue-500"
                    gradientVia="via-cyan-500"
                    gradientTo="to-teal-500"
                  >
                    Use This Prompt
                  </LuxuryButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}