import { Langfuse } from 'langfuse';
import { env } from './env.js';

let langfuseInstance: Langfuse | null = null;

export function getLangfuse(): Langfuse | null {
  if (!env.LANGFUSE_PUBLIC_KEY || !env.LANGFUSE_SECRET_KEY) {
    console.warn('⚠️  Langfuse keys not configured - tracing disabled');
    return null;
  }

  if (!langfuseInstance) {
    langfuseInstance = new Langfuse({
      publicKey: env.LANGFUSE_PUBLIC_KEY,
      secretKey: env.LANGFUSE_SECRET_KEY,
      baseUrl: env.LANGFUSE_HOST,
      flushAt: 1, // Flush immediately in development
      flushInterval: 10000, // 10 seconds
    });
  }

  return langfuseInstance;
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (langfuseInstance) {
    await langfuseInstance.shutdownAsync();
  }
});