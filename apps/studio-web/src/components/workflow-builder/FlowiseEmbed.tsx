'use client';

import { useEffect, useRef, useState } from 'react';

interface FlowiseEmbedProps {
  workflowId: string;
  onSync?: (data: any) => void;
}

export function FlowiseEmbed({ workflowId, onSync }: FlowiseEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const flowiseUrl = process.env.NEXT_PUBLIC_FLOWISE_URL || 'http://localhost:3100';
  
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Set up message listener for iframe communication
    const handleMessage = (event: MessageEvent) => {
      // Verify origin
      if (!event.origin.startsWith(flowiseUrl)) {
        return;
      }

      // Handle different message types
      switch (event.data.type) {
        case 'flowiseReady':
          setIsLoading(false);
          break;
          
        case 'workflowUpdated':
          if (onSync) {
            onSync(event.data.workflow);
          }
          break;
          
        case 'error':
          setError(event.data.message);
          setIsLoading(false);
          break;
      }
    };

    window.addEventListener('message', handleMessage);

    // Send initial configuration to iframe
    const sendConfig = () => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'configure',
          workflowId,
          apiKey: process.env.NEXT_PUBLIC_FLOWISE_API_KEY,
        }, flowiseUrl);
      }
    };

    // Wait for iframe to load
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', () => {
        setTimeout(sendConfig, 500); // Give Flowise time to initialize
      });
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [workflowId, flowiseUrl, onSync]);

  // Handle sync button click
  const handleSyncClick = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'exportWorkflow',
      }, flowiseUrl);
    }
  };

  return (
    <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading Flowise editor...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
          <div className="text-center max-w-md">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Failed to load Flowise</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Reload
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button
          onClick={handleSyncClick}
          className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
        >
          Export to LCEL
        </button>
        <button
          onClick={() => iframeRef.current?.contentWindow?.location.reload()}
          className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
        >
          Refresh
        </button>
      </div>

      {/* Flowise Iframe */}
      <iframe
        ref={iframeRef}
        src={`${flowiseUrl}/canvas/${workflowId}?embed=true`}
        className="w-full h-full border-0"
        title="Flowise Workflow Editor"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />

      {/* Security Note */}
      <div className="absolute bottom-0 left-0 right-0 bg-yellow-50 border-t border-yellow-200 px-4 py-2 text-xs text-yellow-800">
        <strong>Security Note:</strong> This editor is embedded from Flowise. Only interact with trusted workflows.
      </div>
    </div>
  );
}