'use client';

import { useState, useEffect } from 'react';
import { WorkflowList } from '@/components/workflow-builder/WorkflowList';
import { WorkflowRunner } from '@/components/workflow-builder/WorkflowRunner';
import { FlowiseEmbed } from '@/components/workflow-builder/FlowiseEmbed';
import { GradientText } from '@/components/ui/GradientText';
import { LuxuryCard } from '@/components/ui/LuxuryCard';

export default function AdvancedPage() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [isFlowiseWorkflow, setIsFlowiseWorkflow] = useState(false);

  // Check if selected workflow is a Flowise workflow (has UUID format)
  useEffect(() => {
    if (selectedWorkflow) {
      // UUID format check for Flowise workflows
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedWorkflow);
      setIsFlowiseWorkflow(isUUID);
    }
  }, [selectedWorkflow]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Sidebar with Workflow List */}
      <div className="w-80 border-r border-white/10 bg-white/5 backdrop-blur-md">
        <WorkflowList 
          selectedWorkflow={selectedWorkflow}
          onSelectWorkflow={setSelectedWorkflow}
        />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white/5 backdrop-blur-lg border-b border-white/10">
          <div className="px-6 py-4">
            <GradientText as="h1" size="2xl" variant="forest" animate>
              Workflow Engine
            </GradientText>
            <p className="text-sm text-gray-300/80 mt-1">
              LangChain LCEL workflows with optional Flowise visual editing
            </p>
          </div>
        </header>
        
        {/* Workflow Content */}
        <main className="flex-1 p-6 overflow-auto">
          {selectedWorkflow ? (
            isFlowiseWorkflow ? (
              <FlowiseEmbed 
                workflowId={selectedWorkflow}
                onSync={(data) => {
                  console.log('Syncing Flowise workflow:', data);
                }}
              />
            ) : (
              <WorkflowRunner workflowId={selectedWorkflow} />
            )
          ) : (
            <div className="h-full flex items-center justify-center">
              <LuxuryCard variant="glass" padding="lg" className="text-center max-w-md">
                <svg
                  className="mx-auto h-12 w-12 text-purple-400 animate-float"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-100">No workflow selected</h3>
                <p className="mt-1 text-sm text-gray-300/80">
                  Get started by selecting a workflow from the sidebar or creating a new one.
                </p>
              </LuxuryCard>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}