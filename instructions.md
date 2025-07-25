# Getting Started with Prompt Engineering Studio

This guide will walk you through obtaining all necessary API keys and setting up your development environment.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ and pnpm installed
- A GitHub account (for version control)
- Basic command line knowledge

## Step 1: Obtain API Keys

### OpenAI API Key (Required for GPT models)

1. **Create OpenAI Account**
   - Go to [https://platform.openai.com/signup](https://platform.openai.com/signup)
   - Sign up with your email or Google account

2. **Add Payment Method**
   - Navigate to [https://platform.openai.com/account/billing](https://platform.openai.com/account/billing)
   - Add a credit card (minimum $5 credit required)
   - Set a monthly spending limit for safety

3. **Generate API Key**
   - Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Click "Create new secret key"
   - Name it (e.g., "Prompt Engineering Studio")
   - Copy the key immediately (it won't be shown again)
   - Save it securely

### Google AI (Gemini) API Key (Required for Gemini models)

1. **Access Google AI Studio**
   - Visit [https://aistudio.google.com/](https://aistudio.google.com/)
   - Sign in with your Google account

2. **Get API Key**
   - Click on "Get API key" in the left sidebar
   - Click "Create API key"
   - Select "Create API key in new project" or choose existing
   - Copy the generated key

3. **Enable Billing (Optional but recommended)**
   - Free tier: 60 requests per minute
   - For production use, enable billing in Google Cloud Console

### Langfuse API Keys (Optional for Phase 1)

1. **Create Langfuse Account**
   - Go to [https://cloud.langfuse.com/auth/sign-up](https://cloud.langfuse.com/auth/sign-up)
   - Sign up for free account

2. **Create Project**
   - After login, create a new project
   - Name it "Prompt Engineering Studio"

3. **Get API Keys**
   - Go to Settings → API Keys
   - Create new API keys
   - Copy both Public and Secret keys

### Anthropic API Key (Optional - for Claude models)

1. **Create Account**
   - Visit [https://console.anthropic.com/](https://console.anthropic.com/)
   - Sign up and verify email

2. **Add Payment**
   - Add payment method
   - Minimum $5 credit required

3. **Generate Key**
   - Go to API Keys section
   - Create new key
   - Copy and save securely

## Step 2: Local Ollama Setup (Optional - for local models)

### macOS/Linux
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull models
ollama pull llama3
ollama pull codellama
```

### Windows
1. Download installer from [https://ollama.com/download/windows](https://ollama.com/download/windows)
2. Run the installer
3. Open Command Prompt and run:
   ```cmd
   ollama pull llama3
   ollama pull codellama
   ```

### Docker (Already included in our setup)
```bash
# Models will be pulled automatically when you run docker-compose
```

## Step 3: Environment Configuration

1. **Copy the environment template**
   ```bash
   cd infra
   cp .env.example .env
   ```

2. **Edit the .env file**
   ```bash
   # Open in your preferred editor
   nano .env  # or vim, code, etc.
   ```

3. **Add your API keys**
   ```env
   # ---- LLM Providers ----
   OPENAI_API_KEY=sk-...your-openai-key...
   GOOGLE_API_KEY=AIza...your-google-key...
   
   # Optional providers
   ANTHROPIC_API_KEY=sk-ant-...your-anthropic-key...
   
   # ---- Langfuse (Optional for Phase 1) ----
   LANGFUSE_PUBLIC_KEY=pk-lf-...
   LANGFUSE_SECRET_KEY=sk-lf-...
   
   # ---- Security ----
   # Change these default values!
   LITELLM_MASTER_KEY=your-secure-master-key-here
   API_BEARER_TOKEN=your-secure-bearer-token-here
   ```

## Step 4: Verify Setup

1. **Start Docker services**
   ```bash
   cd infra
   docker compose up -d
   ```

2. **Check service health**
   ```bash
   docker compose ps
   ```

3. **Run verification test**
   ```bash
   cd ../apps/broker-api
   pnpm tsx src/test-litellm.ts
   ```

## Step 5: Cost Management Tips

### OpenAI
- Set usage limits: [https://platform.openai.com/account/limits](https://platform.openai.com/account/limits)
- Monitor usage: [https://platform.openai.com/usage](https://platform.openai.com/usage)
- GPT-3.5-turbo: ~$0.002 per 1K tokens
- GPT-4: ~$0.03 per 1K tokens

### Google AI (Gemini)
- Free tier: 60 requests/minute
- Monitor in Google Cloud Console
- Gemini Pro: Free tier available

### Best Practices
1. Start with GPT-3.5-turbo for testing
2. Use Gemini Pro free tier when possible
3. Set daily spend limits in LiteLLM config
4. Monitor costs via Langfuse dashboard
5. Use local Ollama models for development

## Troubleshooting

### "Invalid API Key" Error
- Ensure no extra spaces in the key
- Check if key starts with correct prefix (sk- for OpenAI)
- Verify billing is enabled on the provider

### Connection Refused
- Check if Docker services are running
- Verify ports aren't blocked by firewall
- Ensure no other services use ports 4000, 8001, 3002

### Rate Limiting
- Implement exponential backoff
- Use different models for load distribution
- Consider upgrading tier if needed

## Security Notes

1. **Never commit API keys**
   - .env is gitignored by default
   - Use environment variables only

2. **Rotate keys regularly**
   - Set calendar reminders
   - Revoke unused keys

3. **Use separate keys for environments**
   - Development vs Production
   - Different keys per developer

4. **Monitor usage**
   - Set up alerts for unusual activity
   - Review logs regularly