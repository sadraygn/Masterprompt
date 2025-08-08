import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file from broker-api directory first
config({ path: resolve(process.cwd(), '.env') });

// Load environment variables (for local development only)
// In production (Lovable.dev), environment variables are injected directly
if (process.env.NODE_ENV === 'development') {
  config({ path: resolve(process.cwd(), '../../infra/.env') });
}

export const env = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  
  // LiteLLM Configuration
  LITELLM_BASE_URL: process.env.LITELLM_BASE_URL || 'http://localhost:8001',
  LITELLM_MASTER_KEY: process.env.LITELLM_MASTER_KEY || 'sk-1234567890abcdef',
  
  // Langfuse Observability
  LANGFUSE_PUBLIC_KEY: process.env.LANGFUSE_PUBLIC_KEY || '',
  LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY || '',
  LANGFUSE_HOST: process.env.LANGFUSE_HOST || 'http://localhost:3002',
  
  // Authentication
  API_BEARER_TOKEN: process.env.API_BEARER_TOKEN || 'bearer-token-change-me',
  
  // CORS Configuration
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  BROKER_API_URL: process.env.BROKER_API_URL || 'http://localhost:4000',
  
  // LLM Provider Keys (Sensitive)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
  
  // Flowise Workflow Engine
  FLOWISE_API_URL: process.env.FLOWISE_API_URL || 'http://flowise:3000',
  FLOWISE_API_KEY: process.env.FLOWISE_API_KEY || '',
  
  // Ollama (Local LLMs)
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://ollama:11434',
  
  // Redis Caching
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  CACHE_KEY_PREFIX: process.env.CACHE_KEY_PREFIX || 'ps',
  
  // SAML Authentication (Enterprise)
  SAML_ENABLED: process.env.SAML_ENABLED === 'true',
  SAML_ENTRY_POINT: process.env.SAML_ENTRY_POINT || '',
  SAML_ISSUER: process.env.SAML_ISSUER || '',
  SAML_CERT: process.env.SAML_CERT || '',
} as const;

// Production Environment Validation
const requiredInProduction = [
  'LITELLM_MASTER_KEY',
  'API_BEARER_TOKEN',
] as const;

const requiredLLMProvider = [
  'OPENAI_API_KEY',
  'GOOGLE_API_KEY',
] as const;

// Validate required environment variables
function validateEnvironment() {
  const isProduction = env.NODE_ENV === 'production';
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required production variables
  for (const envVar of requiredInProduction) {
    if (!process.env[envVar] || process.env[envVar] === 'sk-1234567890abcdef' || process.env[envVar] === 'bearer-token-change-me') {
      if (isProduction) {
        errors.push(`❌ Missing or invalid required environment variable: ${envVar}`);
      } else {
        warnings.push(`⚠️  Using default value for: ${envVar}`);
      }
    }
  }

  // Check that at least one LLM provider is configured
  const hasLLMProvider = requiredLLMProvider.some(key => process.env[key]);
  if (!hasLLMProvider) {
    if (isProduction) {
      errors.push(`❌ At least one LLM provider key is required: ${requiredLLMProvider.join(' or ')}`);
    } else {
      warnings.push(`⚠️  No LLM provider keys configured. Add ${requiredLLMProvider.join(' or ')}`);
    }
  }

  // Log warnings in development
  if (warnings.length > 0 && !isProduction) {
    console.log('\n🔧 Environment Configuration:');
    warnings.forEach(warning => console.log(warning));
    console.log('💡 See infra/.env.example for configuration help\n');
  }

  // Throw errors in production
  if (errors.length > 0 && isProduction) {
    console.error('\n🚨 Environment Configuration Errors:');
    errors.forEach(error => console.error(error));
    console.error('\n📚 For Lovable.dev deployment, configure these in your environment variables settings.');
    throw new Error('Missing required environment variables');
  }
}

// Validate on module load
validateEnvironment();