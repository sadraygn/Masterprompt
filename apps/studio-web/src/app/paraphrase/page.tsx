import { ParaphraseTool } from '@/components/paraphrase/ParaphraseTool';
import { GradientText } from '@/components/ui/GradientText';

export default function ParaphrasePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <GradientText as="h1" size="2xl" variant="sunset" animate>
            Local AI Paraphrase
          </GradientText>
          <p className="mt-1 text-sm text-gray-300/80">
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