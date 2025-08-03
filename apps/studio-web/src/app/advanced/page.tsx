'use client';

import { useState, useEffect } from 'react';
import { WorkflowSidebar } from '@/components/workflow-builder/WorkflowSidebar';
import { FlowiseEmbed } from '@/components/workflow-builder/FlowiseEmbed';
import { SyncIndicator } from '@/components/workflow-builder/SyncIndicator';

export default function AdvancedPage() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <WorkflowSidebar 
        onSelectWorkflow={setSelectedWorkflow}
        selectedWorkflow={selectedWorkflow}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">
              Visual Workflow Editor
            </h1>
            <div className="flex items-center gap-4">
              <SyncIndicator 
                isSyncing={isSyncing}
                lastSync={lastSync}
              />
              <button
                onClick={() => {/* TODO: Implement sync */}}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Sync with Code
              </button>
            </div>
          </div>
        </header>
        
        {/* Flowise Iframe */}
        <main className="flex-1 p-6">
          {selectedWorkflow ? (
            <FlowiseEmbed 
              workflowId={selectedWorkflow}
              onSync={(data) => {
                setIsSyncing(true);
                // TODO: Implement sync logic
                setTimeout(() => {
                  setIsSyncing(false);
                  setLastSync(new Date());
                }, 2000);
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">No workflow selected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by selecting a workflow from the sidebar or creating a new one.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}