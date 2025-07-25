import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '../../infra/.env') });

export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  
  // LiteLLM
  LITELLM_BASE_URL: process.env.LITELLM_BASE_URL || 'http://localhost:8000',
  LITELLM_MASTER_KEY: process.env.LITELLM_MASTER_KEY || 'sk-1234567890abcdef',
  
  // Langfuse
  LANGFUSE_PUBLIC_KEY: process.env.LANGFUSE_PUBLIC_KEY || '',
  LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY || '',
  LANGFUSE_HOST: process.env.LANGFUSE_HOST || 'http://localhost:3002',
  
  // Auth
  API_BEARER_TOKEN: process.env.API_BEARER_TOKEN || 'bearer-token-change-me',
  
  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
} as const;

// Validate required env vars
const requiredEnvVars = [
  'LITELLM_MASTER_KEY',
  'API_BEARER_TOKEN',
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️  Missing required environment variable: ${envVar}`);
  }
}