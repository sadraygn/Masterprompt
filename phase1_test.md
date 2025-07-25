# Phase 1 Testing Guide

This comprehensive testing guide ensures all Phase 1 components are properly configured and functioning.

## Prerequisites Check

### 1. System Requirements
```bash
# Check Docker
docker --version  # Should be 20.10+
docker compose version  # Should be 2.0+

# Check Node.js and pnpm
node --version  # Should be 18+
pnpm --version  # Should be 8+

# Check ports availability
lsof -i :4000  # Should be empty (Broker API)
lsof -i :8001  # Should be empty (LiteLLM)
lsof -i :3002  # Should be empty (Langfuse)
lsof -i :5433  # Should be empty (PostgreSQL)
```

## Infrastructure Tests

### 2. Docker Services Health Check

```bash
cd infra

# Start all services
docker compose up -d

# Wait for services to initialize
sleep 10

# Check service status
docker compose ps

# Expected output:
# NAME               STATUS              PORTS
# infra-postgres-1   Up X minutes (healthy)   0.0.0.0:5433->5432/tcp
# infra-litellm-1    Up X minutes             0.0.0.0:8001->8000/tcp
# infra-langfuse-1   Up X minutes             0.0.0.0:3002->3000/tcp
# infra-ollama-1     Up X minutes             0.0.0.0:11434->11434/tcp
```

### 3. Database Connectivity Test

```bash
# Test PostgreSQL connection
docker exec infra-postgres-1 pg_isready -U postgres

# Expected: "/var/run/postgresql:5432 - accepting connections"

# Check databases created
docker exec infra-postgres-1 psql -U postgres -c "\l" | grep -E "(prompt_studio|litellm|langfuse)"

# Expected: All three databases should be listed
```

### 4. LiteLLM Service Test

```bash
# Test health endpoint
curl http://localhost:8001/health

# Test models endpoint with auth
curl http://localhost:8001/v1/models \
  -H "Authorization: Bearer sk-1234567890abcdef"

# Expected: JSON list of configured models
```

## API Key Validation Tests

### 5. Test Individual Providers

Create a test script `test-providers.ts` in `apps/broker-api/src/`:

```typescript
import { OpenAI } from 'openai';

async function testProviders() {
  const client = new OpenAI({
    apiKey: 'sk-1234567890abcdef',
    baseURL: 'http://localhost:8001/v1',
  });

  // Test each provider
  const providers = [
    { model: 'gpt-3.5-turbo', name: 'OpenAI' },
    { model: 'gemini-pro', name: 'Google Gemini' },
    { model: 'llama3', name: 'Ollama (Local)' }
  ];

  for (const provider of providers) {
    try {
      console.log(`\nTesting ${provider.name}...`);
      const response = await client.chat.completions.create({
        model: provider.model,
        messages: [{ role: 'user', content: 'Say "Hello from ' + provider.name + '"' }],
        max_tokens: 20,
      });
      console.log(`✅ ${provider.name}: ${response.choices[0].message.content}`);
    } catch (error) {
      console.log(`❌ ${provider.name}: ${error.message}`);
    }
  }
}

testProviders();
```

Run with:
```bash
cd apps/broker-api
pnpm tsx src/test-providers.ts
```

### 6. Cost Tracking Test

```bash
# Make a request and check if cost is tracked
curl -X POST http://localhost:8001/v1/chat/completions \
  -H "Authorization: Bearer sk-1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Count to 5"}]
  }'

# Check LiteLLM logs for cost information
docker logs infra-litellm-1 | grep -i "cost"
```

## Application Tests

### 7. Broker API Tests

```bash
cd apps/broker-api

# Install dependencies
pnpm install

# Run TypeScript compilation
pnpm type-check

# Start the broker API
pnpm dev

# In another terminal, test endpoints:

# Health check
curl http://localhost:4000/health
# Expected: {"status":"ok","timestamp":"...","uptime":...}

# Test authentication failure
curl http://localhost:4000/v1/chat/completions
# Expected: {"error":"Unauthorized"}

# Test with valid auth
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer bearer-token-change-me" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}],
    "creativity": 5
  }'

# Test models endpoint
curl http://localhost:4000/v1/models \
  -H "Authorization: Bearer bearer-token-change-me"
```

### 8. Temperature Mapping Test

```bash
# Test creativity slider mapping
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer bearer-token-change-me" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Test"}],
    "creativity": 0
  }'
# Should use temperature 0

curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer bearer-token-change-me" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Test"}],
    "creativity": 10
  }'
# Should use temperature 2.0
```

### 9. Langfuse Integration Test

```bash
# Access Langfuse UI
open http://localhost:3002

# Default login (if not configured):
# Create account on first access

# Make a request through broker
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer bearer-token-change-me" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Test trace"}],
    "userId": "test-user",
    "sessionId": "test-session"
  }'

# Check Langfuse UI for the trace
```

### 10. Error Handling Tests

```bash
# Test invalid model
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer bearer-token-change-me" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "invalid-model",
    "messages": [{"role": "user", "content": "Test"}]
  }'

# Test malformed request
curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer bearer-token-change-me" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": "not-an-array"
  }'

# Test rate limiting (if configured)
for i in {1..10}; do
  curl -X POST http://localhost:4000/v1/chat/completions \
    -H "Authorization: Bearer bearer-token-change-me" \
    -H "Content-Type: application/json" \
    -d '{"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "Test"}]}'
done
```

## Performance Tests

### 11. Response Time Test

```bash
# Test response time
time curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer bearer-token-change-me" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Reply with one word"}],
    "max_tokens": 5
  }'

# Expected: < 5 seconds for simple prompts
```

### 12. Concurrent Request Test

Create `concurrent-test.sh`:
```bash
#!/bin/bash
for i in {1..5}; do
  curl -X POST http://localhost:4000/v1/chat/completions \
    -H "Authorization: Bearer bearer-token-change-me" \
    -H "Content-Type: application/json" \
    -d '{
      "model": "gpt-3.5-turbo",
      "messages": [{"role": "user", "content": "Count to 3"}],
      "userId": "user-'$i'"
    }' &
done
wait
```

## Validation Checklist

### ✅ Phase 1 Completion Criteria

- [ ] All Docker services running and healthy
- [ ] PostgreSQL accessible on port 5433
- [ ] LiteLLM proxy accessible on port 8001
- [ ] Broker API running on port 4000
- [ ] API authentication working
- [ ] At least one LLM provider functional
- [ ] Temperature mapping working correctly
- [ ] Error handling returning proper status codes
- [ ] Logs showing requests and responses
- [ ] Basic monitoring via docker logs

### 🚧 Optional but Recommended

- [ ] Langfuse tracing visible
- [ ] Cost tracking in logs
- [ ] Ollama local models working
- [ ] Multiple providers tested
- [ ] API documentation accessible at /docs

## Debugging Commands

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker logs infra-litellm-1 -f
docker logs infra-postgres-1 -f

# Check disk usage
docker system df

# Clean up if needed
docker compose down -v  # Warning: removes data
docker system prune -a  # Warning: removes all unused data

# Test database connection directly
docker exec -it infra-postgres-1 psql -U postgres -d prompt_studio

# Check LiteLLM config
docker exec infra-litellm-1 cat /app/config.yaml
```

## Common Issues and Solutions

### Port Already in Use
```bash
# Find process using port
lsof -i :8001
# Kill process if needed
kill -9 <PID>
```

### Database Connection Failed
```bash
# Ensure postgres is healthy
docker compose ps
# Restart postgres
docker compose restart postgres
```

### API Key Invalid
- Check for extra spaces or newlines
- Ensure proper quoting in .env file
- Verify key format matches provider

### Memory Issues
```bash
# Check Docker memory
docker stats
# Increase Docker Desktop memory limit
```

## Next Steps

Once all tests pass:
1. Document any custom configurations
2. Save working .env file securely
3. Proceed to Phase 2 implementation
4. Set up monitoring alerts
5. Create backup of working state