'use client';

import { useState, useEffect } from 'react';

interface Workflow {
  id: string;
  name: string;
  description: string;
  type: string;
  status: 'ready' | 'loading' | 'error';
}

const BUILT_IN_WORKFLOWS: Workflow[] = [
  {
    id: 'completion',
    name: 'Completion Workflow',
    description: 'Generate text completions with customizable parameters',
    type: 'completion',
    status: 'ready'
  },
  {
    id: 'summarization',
    name: 'Summarization Workflow',
    description: 'Create concise summaries of long texts',
    type: 'summarization',
    status: 'ready'
  },
  {
    id: 'qa',
    name: 'Q&A Workflow',
    description: 'Answer questions based on provided context',
    type: 'qa',
    status: 'ready'
  },
  {
    id: 'code-review',
    name: 'Code Review Workflow',
    description: 'Analyze and review code with AI assistance',
    type: 'code-review',
    status: 'ready'
  },
  {
    id: 'data-extraction',
    name: 'Data Extraction Workflow',
    description: 'Extract structured data from unstructured text',
    type: 'data-extraction',
    status: 'ready'
  }
];

interface WorkflowListProps {
  selectedWorkflow: string | null;
  onSelectWorkflow: (id: string) => void;
}

export function WorkflowList({ selectedWorkflow, onSelectWorkflow }: WorkflowListProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>(BUILT_IN_WORKFLOWS);
  const [isFlowiseAvailable, setIsFlowiseAvailable] = useState(false);

  useEffect(() => {
    // Check if Flowise is available
    const checkFlowise = async () => {
      try {
        const flowiseUrl = process.env.NEXT_PUBLIC_FLOWISE_URL || 'http://localhost:3100';
        const response = await fetch(`${flowiseUrl}/api/v1/chatflows`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          setIsFlowiseAvailable(true);
          const data = await response.json();
          // Add Flowise workflows if available
          const flowiseWorkflows = data.map((flow: any) => ({
            id: flow.id,
            name: flow.name,
            description: flow.description || 'Flowise visual workflow',
            type: 'flowise',
            status: 'ready' as const
          }));
          setWorkflows([...BUILT_IN_WORKFLOWS, ...flowiseWorkflows]);
        }
      } catch (error) {
        console.log('Flowise not available, using built-in workflows only');
      }
    };

    checkFlowise();
  }, []);

  return (
    <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Available Workflows</h2>
        <p className="text-sm text-gray-500 mt-1">
          {isFlowiseAvailable ? 'Built-in + Flowise workflows' : 'Built-in workflows (Flowise offline)'}
        </p>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            onClick={() => onSelectWorkflow(workflow.id)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedWorkflow === workflow.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{workflow.description}</p>
              </div>
              <div className="ml-4">
                {workflow.type === 'flowise' ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Visual
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    LCEL
                  </span>
                )}
              </div>
            </div>
            
            {workflow.status === 'loading' && (
              <div className="mt-2">
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '50%' }}></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          + Create New Workflow
        </button>
      </div>
    </div>
  );
}