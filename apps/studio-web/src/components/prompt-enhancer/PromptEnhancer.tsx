'use client';

import { useState } from 'react';
import { LuxuryButton } from '@/components/ui/LuxuryButton';
import { LuxuryCard } from '@/components/ui/LuxuryCard';
import { GradientText } from '@/components/ui/GradientText';

interface PromptEnhancerProps {
  originalPrompt: string;
  enhancementModel: string;
  targetModel?: string;
  creativity: number;
  thinkingDepth: boolean;
  onEnhanced: (enhanced: string, metrics: any) => void;
  className?: string;
}

export function PromptEnhancer({ 
  originalPrompt,
  enhancementModel,
  targetModel,
  creativity, 
  thinkingDepth, 
  onEnhanced,
  className = ''
}: PromptEnhancerProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementStyle, setEnhancementStyle] = useState<'auto' | 'technical' | 'creative' | 'balanced' | 'precise'>('auto');
  const [enhancementLevel, setEnhancementLevel] = useState<'light' | 'moderate' | 'aggressive'>('moderate');
  const [includeExamples, setIncludeExamples] = useState(false);
  const [error, setError] = useState('');

  const handleEnhance = async () => {
    if (!originalPrompt.trim()) {
      setError('Please enter a prompt to enhance');
      return;
    }

    setIsEnhancing(true);
    setError('');
    
    try {
      const response = await fetch('/api/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: originalPrompt,
          enhancementModel,
          targetModel,
          creativity,
          thinkingDepth,
          style: enhancementStyle === 'auto' ? undefined : enhancementStyle,
          enhancementLevel,
          includeExamples
        })
      });

      const data = await response.json();
      
      if (data.error) {
        setError(data.error.message || 'Enhancement failed');
      } else {
        onEnhanced(data.enhanced, data);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Enhancement error: ${errorMessage}`);
    } finally {
      setIsEnhancing(false);
    }
  };

  const getStyleDescription = () => {
    const descriptions = {
      auto: 'Automatically select based on creativity level',
      technical: 'Optimize for technical precision and clarity',
      creative: 'Enhance for creative and imaginative outputs',
      balanced: 'Balance clarity with flexibility',
      precise: 'Maximum precision and elimination of ambiguity'
    };
    return descriptions[enhancementStyle];
  };

  const getImprovementColor = (ratio: number) => {
    if (ratio >= 2) return 'text-green-500';
    if (ratio >= 1.5) return 'text-blue-500';
    if (ratio >= 1.2) return 'text-yellow-500';
    return 'text-gray-500';
  };

  return (
    <LuxuryCard variant="glass" padding="md" className={className}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <GradientText as="h3" size="lg" variant="rainbow">
            🧪 Prompt Enhancement Settings
          </GradientText>
        </div>

        {/* Enhancement Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Enhancement Style
            </label>
            <select
              value={enhancementStyle}
              onChange={(e) => setEnhancementStyle(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="auto">Auto (Based on Creativity)</option>
              <option value="technical">Technical</option>
              <option value="creative">Creative</option>
              <option value="balanced">Balanced</option>
              <option value="precise">Precise</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">{getStyleDescription()}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Enhancement Level
            </label>
            <select
              value={enhancementLevel}
              onChange={(e) => setEnhancementLevel(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="light">Light Touch</option>
              <option value="moderate">Moderate Enhancement</option>
              <option value="aggressive">Aggressive Optimization</option>
            </select>
          </div>
        </div>

        {/* Additional Options */}
        <div className="flex items-center space-x-6">
          <label className="flex items-center text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeExamples}
              onChange={(e) => setIncludeExamples(e.target.checked)}
              className="mr-2 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
            />
            Include Examples
          </label>
        </div>

        {/* Enhancement Button */}
        <LuxuryButton
          onClick={handleEnhance}
          disabled={isEnhancing || !originalPrompt.trim()}
          variant="glow"
          className="w-full"
          gradientFrom="from-purple-600"
          gradientVia="via-violet-600"
          gradientTo="to-blue-600"
        >
          {isEnhancing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enhancing Prompt...
            </span>
          ) : (
            '✨ Enhance Prompt'
          )}
        </LuxuryButton>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

      </div>
    </LuxuryCard>
  );
}