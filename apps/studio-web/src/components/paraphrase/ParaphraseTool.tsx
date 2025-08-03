'use client';

import { useState } from 'react';

type Style = 'formal' | 'casual' | 'technical' | 'simple';

interface ParaphraseResult {
  original: string;
  paraphrased: string;
  style?: string;
  latency: number;
  model: string;
}

export function ParaphraseTool() {
  const [text, setText] = useState('');
  const [style, setStyle] = useState<Style | ''>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParaphraseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParaphrase = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/paraphrase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          style: style || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to paraphrase');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show toast or feedback
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          AI Paraphrase Tool
        </h2>
        
        <div className="space-y-4">
          {/* Input Text */}
          <div>
            <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
              Text to paraphrase
            </label>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter the text you want to paraphrase..."
              className="w-full min-h-[150px] px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              maxLength={5000}
            />
            <div className="mt-1 text-sm text-gray-500">
              {text.length}/5000 characters
            </div>
          </div>

          {/* Style Selection */}
          <div>
            <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-2">
              Style (optional)
            </label>
            <select
              id="style"
              value={style}
              onChange={(e) => setStyle(e.target.value as Style | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Default</option>
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
              <option value="technical">Technical</option>
              <option value="simple">Simple</option>
            </select>
          </div>

          {/* Action Button */}
          <button
            onClick={handleParaphrase}
            disabled={!text.trim() || loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Paraphrasing...
              </span>
            ) : (
              'Paraphrase'
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-6 space-y-4">
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-2">Original Text</h3>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-gray-700">{result.original}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Paraphrased Text</h3>
                <button
                  onClick={() => copyToClipboard(result.paraphrased)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Copy
                </button>
              </div>
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-gray-700">{result.paraphrased}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 pt-2">
              <span>Model: {result.model}</span>
              <span>Latency: {result.latency}ms</span>
              {result.style && <span>Style: {result.style}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <svg className="h-5 w-5 text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Privacy First</h3>
            <p className="mt-1 text-sm text-green-700">
              This paraphrase feature uses a local LLM (Llama 3) running on your infrastructure. 
              Your text never leaves your servers, ensuring complete privacy and data security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}