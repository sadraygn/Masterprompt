'use client';

import { useState } from 'react';

interface WorkflowRunnerProps {
  workflowId: string;
}

export function WorkflowRunner({ workflowId }: WorkflowRunnerProps) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [parameters, setParameters] = useState<Record<string, any>>({
    temperature: 0.7,
    maxTokens: 1000,
    model: 'gpt-3.5-turbo'
  });

  const runWorkflow = async () => {
    setIsRunning(true);
    setOutput('');

    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId,
          input,
          parameters
        })
      });

      const data = await response.json();
      
      if (data.error) {
        setOutput(`Error: ${data.error}`);
      } else {
        setOutput(data.result || 'No output generated');
      }
    } catch (error) {
      setOutput(`Error running workflow: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getWorkflowConfig = () => {
    switch (workflowId) {
      case 'completion':
        return {
          title: 'Completion Workflow',
          inputLabel: 'Enter your prompt',
          inputPlaceholder: 'Write a story about...'
        };
      case 'summarization':
        return {
          title: 'Summarization Workflow',
          inputLabel: 'Text to summarize',
          inputPlaceholder: 'Paste the text you want to summarize...'
        };
      case 'qa':
        return {
          title: 'Q&A Workflow',
          inputLabel: 'Context and Question',
          inputPlaceholder: 'Context: [paste context]\n\nQuestion: [your question]'
        };
      case 'code-review':
        return {
          title: 'Code Review Workflow',
          inputLabel: 'Code to review',
          inputPlaceholder: 'Paste your code here for AI review...'
        };
      case 'data-extraction':
        return {
          title: 'Data Extraction Workflow',
          inputLabel: 'Unstructured text',
          inputPlaceholder: 'Paste text to extract structured data from...'
        };
      default:
        return {
          title: 'Custom Workflow',
          inputLabel: 'Input',
          inputPlaceholder: 'Enter your input...'
        };
    }
  };

  const config = getWorkflowConfig();

  return (
    <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">{config.title}</h2>
        <p className="text-sm text-gray-500 mt-1">Configure and run this workflow</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Parameters */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Parameters</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Model</label>
              <select
                value={parameters.model}
                onChange={(e) => setParameters({ ...parameters, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="gemini-pro">Gemini Pro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Temperature: {parameters.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={parameters.temperature}
                onChange={(e) => setParameters({ ...parameters, temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Max Tokens</label>
              <input
                type="number"
                value={parameters.maxTokens}
                onChange={(e) => setParameters({ ...parameters, maxTokens: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        {/* Input */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            {config.inputLabel}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={config.inputPlaceholder}
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Run Button */}
        <div>
          <button
            onClick={runWorkflow}
            disabled={isRunning || !input}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
          >
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Running Workflow...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Run Workflow
              </>
            )}
          </button>
        </div>

        {/* Output */}
        {output && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-900">
                Output
              </label>
              <button
                onClick={() => navigator.clipboard.writeText(output)}
                className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
              >
                Copy
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                {output}
              </pre>
            </div>
          </div>
        )}

        {/* Workflow Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="ml-3 text-sm text-blue-800">
              <p className="font-medium">How this workflow works:</p>
              <p className="mt-1">
                {workflowId === 'completion' && 'Generates creative text based on your prompt using LangChain LCEL.'}
                {workflowId === 'summarization' && 'Creates concise summaries while preserving key information.'}
                {workflowId === 'qa' && 'Answers questions using the provided context as reference.'}
                {workflowId === 'code-review' && 'Analyzes code for bugs, style issues, and improvements.'}
                {workflowId === 'data-extraction' && 'Extracts structured data from unstructured text using NLP.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}