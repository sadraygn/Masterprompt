# Setup Guide

## Local Development Setup

### 1. Environment Configuration

Copy the example environment file:
```bash
cp infra/.env.example infra/.env
```

Update with your API keys:
- `OPENAI_API_KEY`: Your OpenAI API key
- `GOOGLE_API_KEY`: Your Google AI (Gemini) API key
- `API_BEARER_TOKEN`: Change this to a secure token
- `LITELLM_MASTER_KEY`: Change this to a secure key

### 2. Start Docker Services

```bash
cd infra
docker-compose up -d
```

This starts:
- PostgreSQL (with databases for the app, LiteLLM, and Langfuse)
- LiteLLM proxy server
- Langfuse observability platform
- Ollama for local models

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Start Development Servers

In separate terminals:

```bash
# Terminal 1: Broker API
cd apps/broker-api
pnpm dev

# Terminal 2: Studio Web
cd apps/studio-web
pnpm dev
```

### 5. Access the Application

- Studio Web UI: http://localhost:3000
- API Documentation: http://localhost:4000/docs
- Langfuse Dashboard: http://localhost:3002

## Testing the Setup

### Test LiteLLM Connection

```bash
cd apps/broker-api
pnpm tsx src/test-litellm.ts
```

### Test API Endpoint

```bash
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer bearer-token-change-me" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}],
    "creativity": 5
  }'
```

## Troubleshooting

### Docker Services Not Starting

Check logs:
```bash
cd infra
docker-compose logs -f
```

### LiteLLM Connection Failed

1. Ensure Docker services are running
2. Check if LiteLLM is accessible: `curl http://localhost:8000/health`
3. Verify your API keys are correct in `.env`

### Database Connection Issues

Reset databases:
```bash
cd infra
docker-compose down -v
docker-compose up -d
```

## Production Deployment

For production deployment to Fly.io, see the [deployment guide](deployment-guide.md).