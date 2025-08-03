import { ParaphraseTool } from '@/components/paraphrase/ParaphraseTool';

export default function ParaphrasePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-semibold text-gray-900">
            Local AI Paraphrase
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Privacy-preserving text paraphrasing using local Llama 3 model
          </p>
        </div>
      </header>
      
      <main className="py-8">
        <ParaphraseTool />
      </main>
    </div>
  );
}