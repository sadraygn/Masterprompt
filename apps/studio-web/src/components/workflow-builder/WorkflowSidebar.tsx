'use client';

import { useState, useEffect } from 'react';

interface Workflow {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

interface WorkflowSidebarProps {
  onSelectWorkflow: (workflowId: string) => void;
  selectedWorkflow: string | null;
}

export function WorkflowSidebar({ onSelectWorkflow, selectedWorkflow }: WorkflowSidebarProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fetch workflows from API
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows');
      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
      // Use mock data for now
      setWorkflows([
        { id: 'completion-workflow', name: 'Basic Completion', description: 'Simple prompt completion workflow', tags: ['basic'] },
        { id: 'summarization-workflow', name: 'Text Summarization', description: 'Summarize long text into key points', tags: ['summarization'] },
        { id: 'qa-workflow', name: 'Question Answering', description: 'Answer questions based on context', tags: ['qa', 'rag'] },
        { id: 'code-review-workflow', name: 'Code Review', description: 'Automated code review', tags: ['code', 'quality'] },
        { id: 'data-extraction-workflow', name: 'Data Extraction', description: 'Extract structured data', tags: ['extraction', 'nlp'] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Workflows</h2>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Workflow List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading workflows...</div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No workflows found</div>
        ) : (
          <div className="p-2">
            {filteredWorkflows.map((workflow) => (
              <button
                key={workflow.id}
                onClick={() => onSelectWorkflow(workflow.id)}
                className={`w-full text-left p-3 rounded-md mb-2 transition-colors ${
                  selectedWorkflow === workflow.id
                    ? 'bg-blue-50 border-blue-500 border'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{workflow.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {workflow.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200">
        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          + Create New Workflow
        </button>
        <button className="w-full px-4 py-2 mt-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
          Import from Flowise
        </button>
      </div>
    </aside>
  );
}