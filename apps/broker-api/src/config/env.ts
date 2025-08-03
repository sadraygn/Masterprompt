import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '../../infra/.env') });

export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  
  // LiteLLM
  LITELLM_BASE_URL: process.env.LITELLM_BASE_URL || 'http://localhost:8001',
  LITELLM_MASTER_KEY: process.env.LITELLM_MASTER_KEY || 'sk-1234567890abcdef',
  
  // Langfuse
  LANGFUSE_PUBLIC_KEY: process.env.LANGFUSE_PUBLIC_KEY || '',
  LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY || '',
  LANGFUSE_HOST: process.env.LANGFUSE_HOST || 'http://localhost:3002',
  
  // Auth
  API_BEARER_TOKEN: process.env.API_BEARER_TOKEN || 'bearer-token-change-me',
  
  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Security
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  
  // Flowise
  FLOWISE_API_URL: process.env.FLOWISE_API_URL || 'http://flowise:3000',
  FLOWISE_API_KEY: process.env.FLOWISE_API_KEY || '',
  
  // Ollama
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://ollama:11434',
  
  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // SAML
  SAML_ENABLED: process.env.SAML_ENABLED === 'true',
  SAML_ENTRY_POINT: process.env.SAML_ENTRY_POINT || '',
  SAML_ISSUER: process.env.SAML_ISSUER || '',
  SAML_CERT: process.env.SAML_CERT || '',
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