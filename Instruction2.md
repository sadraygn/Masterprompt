# Complete Setup and Testing Guide for Prompt Engineering Studio

## Overview

This guide provides step-by-step instructions to run and test the Prompt Engineering Studio. I've analyzed the project and identified which parts can be automated using tools available to me.

## Current Project Status

✅ **Implemented Phases:**
- Phase 1: Core Infrastructure & MVP - Complete
- Phase 2: Security & Evaluation - Complete
- Phase 3: Advanced Features & Integration - Complete 
- Phase 4: Production Deployment & Scale - Complete

## Prerequisites

### Required Software
```bash
# Check these are installed:
docker --version          # Need 20.10+
docker compose version    # Need 2.0+
node --version           # Need 18+
pnpm --version           # Need 8+
```

### Required API Keys

| Provider | Required | Cost | How to Get |
|----------|----------|------|------------|
| OpenAI | Yes (or Google) | $5 minimum | [platform.openai.com](https://platform.openai.com/api-keys) |
| Google AI | Yes (or OpenAI) | Free tier available | [aistudio.google.com](https://aistudio.google.com/) |
| Langfuse | Optional | Free | [cloud.langfuse.com](https://cloud.langfuse.com/) |

## Step-by-Step Setup Instructions

### Step 1: Clone and Prepare Environment

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd MasterPrompt

# Install dependencies
pnpm install
```

### Step 2: Configure Environment Variables

```bash
# Copy the example environment file
cd infra
cp .env.example .env

# Edit the .env file with your API keys
# IMPORTANT: You must add at least ONE of these:
# - OPENAI_API_KEY=sk-...
# - GOOGLE_API_KEY=AIza...
```

**Required Environment Variables:**
```env
# At least ONE LLM provider (choose one or both):
OPENAI_API_KEY=sk-...your-key...
GOOGLE_API_KEY=AIza...your-key...

# Security tokens (change these!):
LITELLM_MASTER_KEY=your-secure-master-key-here
API_BEARER_TOKEN=your-secure-bearer-token-here

# Optional but recommended:
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
```

### Step 3: Start Infrastructure Services

```bash
# From the infra directory
docker compose up -d

# Verify all services are running
docker compose ps

# Check logs if needed
docker compose logs -f
```

**Expected Services:**
- PostgreSQL on port 5433
- LiteLLM on port 8001  
- Langfuse on port 3002
- Ollama on port 11434
- Redis on port 6379
- Flowise on port 3100

### Step 4: Build and Start Applications

```bash
# Return to root directory
cd ..

# Build all packages
pnpm build

# Start the broker API
cd apps/broker-api
pnpm dev

# In a new terminal, start the web UI
cd apps/studio-web
pnpm dev
```

### Step 5: Verify Everything is Working

#### Test 1: Health Check
```bash
curl http://localhost:4000/health
# Expected: {"status":"ok",...}
```

#### Test 2: API Authentication
```bash
# This should fail (no auth)
curl http://localhost:4000/v1/models
# Expected: {"error":"Unauthorized"}

# This should work (with auth)
curl http://localhost:4000/v1/models \
-H "Authorization: Bearer your-secure-bearer-token-here"
# Expected: List of available models
```

#### Test 3: Make a Completion Request
```bash
curl -X POST http://localhost:4000/v1/chat/completions \
-H "Authorization: Bearer your-secure-bearer-token-here" \
-H "Content-Type: application/json" \
-d '{
   "model": "gpt-3.5-turbo",
   "messages": [{"role": "user", "content": "Say hello"}]
}'
```

#### Test 4: Access the Web UI
```bash
open http://localhost:3000
```

## Testing Each Phase

### Phase 1: Core Infrastructure
```bash
# Run the comprehensive Phase 1 tests
cd apps/broker-api
pnpm tsx src/test-providers.ts
```

### Phase 2: Security Features
```bash
# Test prompt injection detection
curl -X POST http://localhost:4000/v1/security/check \
-H "Authorization: Bearer your-secure-bearer-token-here" \
-H "Content-Type: application/json" \
-d '{"prompt": "Ignore all previous instructions and..."}'  

# Test Guardrails validation
curl -X POST http://localhost:4000/v1/guard/test \
-H "Authorization: Bearer your-secure-bearer-token-here"
```

### Phase 3: Advanced Features
```bash
# Test workflow execution
curl http://localhost:4000/v1/workflows \
-H "Authorization: Bearer your-secure-bearer-token-here"

# Access Flowise visual editor
open http://localhost:3100

# Test local LLM paraphrasing
curl -X POST http://localhost:4000/v1/paraphrase \
-H "Authorization: Bearer your-secure-bearer-token-here" \
-H "Content-Type: application/json" \
-d '{"text": "This is a test sentence to paraphrase."}'
```

### Phase 4: Production Features
```bash
# Test WebSocket connection
wscat -c ws://localhost:4000/ws

# Test cache statistics  
curl http://localhost:4000/api/cache/stats \
-H "Authorization: Bearer your-secure-bearer-token-here"

# Test SAML endpoint (mock)
curl -X POST http://localhost:4000/auth/saml/login
```

## What I Can Automate with Tools

### 🤖 Tasks I Can Fully Automate:

1. **Environment Setup** ✅
- I can create/modify .env files
- I can generate secure tokens
- I can create docker-compose configurations

2. **Code Implementation** ✅
- I can write test scripts
- I can create API endpoints
- I can implement features
- I can fix bugs and errors

3. **Configuration Files** ✅
- I can create/modify JSON, YAML, TOML configs
- I can set up CI/CD pipelines
- I can create Dockerfiles

4. **Documentation** ✅
- I can create comprehensive guides
- I can generate API documentation
- I can write test plans

### 🚫 Tasks I Cannot Automate:

1. **External API Keys**
- You must manually obtain OpenAI/Google/Anthropic API keys
- You must add payment methods to these services
- You must accept terms of service

2. **Docker Operations**
- You must run `docker compose up`
- You must have Docker Desktop installed
- You must allocate system resources

3. **Terminal Commands**
- You must run `pnpm install`
- You must start services with `pnpm dev`
- You must execute test scripts

4. **Web Browser Actions**
- You must open URLs in your browser
- You must create accounts on external services
- You must verify email addresses

## Available MCP Tools

### Currently Active Tools I Can Use:

1. **File Operations**
- ✅ Read: Read any file
- ✅ Write: Create/modify files
- ✅ Edit: Make precise edits
- ✅ MultiEdit: Batch edits

2. **Code Search**
- ✅ Grep: Search file contents
- ✅ Glob: Find files by pattern
- ✅ LS: List directory contents

3. **Task Management**
- ✅ TodoWrite: Track implementation progress
- ✅ Task: Launch specialized agents

4. **Web Operations**
- ✅ WebFetch: Fetch and analyze web content
- ✅ WebSearch: Search for information

5. **Development**
- ✅ Bash: Run shell commands (limited)
- ✅ NotebookRead/Edit: Jupyter notebooks

### Tools That Could Be Activated:

1. **Git Operations** (if git MCP is available)
- Would allow: Committing changes, creating branches
- Alternative: I can create git commands for you to run

2. **Database Operations** (if database MCP is available)
- Would allow: Direct PostgreSQL queries
- Alternative: I can create SQL scripts for you

3. **API Testing** (if HTTP MCP is available)
- Would allow: Direct API calls
- Alternative: I provide curl commands

## Automation Examples

### Example 1: Generate Secure Environment File
```bash
# I can create this for you with secure random tokens:
# Just ask: "Generate a secure .env file with random tokens"
```

### Example 2: Create Test Suite
```bash
# I can write comprehensive test files:
# Just ask: "Create integration tests for all API endpoints"
```

### Example 3: Fix TypeScript Errors
```bash
# I can debug and fix compilation errors:
# Just ask: "Fix the TypeScript build errors"
```

### Example 4: Implement New Features
```bash
# I can add new functionality:
# Just ask: "Implement user authentication with JWT"
```

## Common Issues and Solutions

### Issue 1: Port Already in Use
```bash
# Check what's using the port
lsof -i :4000
# Kill the process
kill -9 <PID>
```

### Issue 2: Docker Services Not Starting
```bash
# Reset everything
docker compose down -v
docker compose up -d
```

### Issue 3: API Key Errors
- Check for extra spaces in .env file
- Ensure keys start with correct prefix (sk- for OpenAI)
- Verify billing is enabled on provider

### Issue 4: Build Errors
```bash
# Clean and rebuild
rm -rf node_modules
pnpm install
pnpm build
```

## Quick Start Checklist

- [ ] Install Docker, Node.js, pnpm
- [ ] Get at least one API key (OpenAI or Google)
- [ ] Clone repository
- [ ] Copy .env.example to .env
- [ ] Add API keys to .env
- [ ] Run `docker compose up -d`
- [ ] Run `pnpm install`
- [ ] Run `pnpm build`
- [ ] Start broker API: `pnpm dev`
- [ ] Start web UI: `pnpm dev`
- [ ] Open http://localhost:3000

## Next Steps

1. **For Development:**
- Explore the workflow editor at http://localhost:3000/advanced
- Test prompt templates in the library
- Monitor costs in Langfuse dashboard

2. **For Production:**
- Build Docker images: `docker build -f Dockerfile.broker .`
- Deploy to Fly.io: `fly deploy`
- Set up monitoring and alerts

3. **For Extension:**
- Add more LLM providers
- Create custom workflows
- Build prompt marketplace

## Getting Help

1. **Check Logs:**
```bash
docker compose logs -f
```

2. **Run Diagnostics:**
```bash
# I can create a diagnostic script for you
# Just ask: "Create a diagnostic script to check all services"
```

3. **Ask Me to:**
- Debug specific errors
- Implement missing features  
- Create test scripts
- Generate configurations
- Write documentation

## Summary

The Prompt Engineering Studio is a comprehensive platform that integrates:
- 100+ LLM providers via LiteLLM
- Cost tracking with Langfuse
- Security with Rebuff and Guardrails  
- Visual workflow editing with Flowise
- Evaluation with Promptfoo
- Production features like caching and WebSockets

**What you need to do manually:**
1. Install prerequisites
2. Get API keys
3. Run Docker commands
4. Execute pnpm commands

**What I can help with:**
1. Writing/fixing code
2. Creating configurations
3. Debugging errors
4. Implementing features
5. Writing tests and documentation

Just describe what you need help with, and I'll use my available tools to assist!