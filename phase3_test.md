# Phase 3 Testing Guide - Advanced Features & Integration

This guide provides comprehensive testing procedures for all Phase 3 components including Flowise integration, LCEL workflows, CI/CD pipelines, and local LLM features.

## Prerequisites

- All Phase 1 and Phase 2 components running
- Docker services started with new containers (Flowise, Redis)
- Node.js 20+ and pnpm installed
- GitHub repository set up (for CI/CD testing)

## 1. Flowise Integration Testing

### 1.1 Docker Container Health

1. **Verify Flowise containers are running**
   ```bash
   docker ps | grep flowise
   ```
   **Expected**: Two containers - `flowise` and `flowise-worker`

2. **Check Flowise health**
   ```bash
   curl http://localhost:3100/api/v1/health
   ```
   **Expected**: 200 OK response

3. **Verify Redis is running**
   ```bash
   docker ps | grep redis
   redis-cli ping
   ```
   **Expected**: PONG response

### 1.2 Flowise UI Access

1. **Direct Flowise Access**
   - Open http://localhost:3100
   - **Expected**: Flowise dashboard loads

2. **Create a test chatflow**
   - Click "Add New"
   - Drag and drop nodes
   - Connect them
   - Save the flow
   - **Expected**: Flow saves successfully

### 1.3 Studio Web Integration

1. **Access Advanced Route**
   ```bash
   # Start the frontend dev server
   cd apps/studio-web
   pnpm dev
   ```
   - Navigate to http://localhost:3000/advanced
   - **Expected**: Visual workflow editor page loads

2. **Test Iframe Embedding**
   - Select a workflow from sidebar
   - **Expected**: Flowise editor loads in iframe
   - Try creating/editing a flow
   - **Expected**: Changes are saved

3. **Test Security Headers**
   - Open browser DevTools
   - Check iframe sandbox attributes
   - **Expected**: Proper sandbox restrictions applied

## 2. LCEL Workflows Testing

### 2.1 Workflow Package Build

1. **Build workflows package**
   ```bash
   cd packages/workflows
   pnpm build
   pnpm type-check
   ```
   **Expected**: Build succeeds without errors

### 2.2 Workflow Registry

1. **Test workflow registration**
   ```bash
   cd packages/workflows
   pnpm test
   ```

2. **Test hot reloading** (development mode)
   ```bash
   # In one terminal
   cd apps/broker-api
   pnpm dev
   
   # In another terminal, modify a workflow file
   echo "// test comment" >> packages/workflows/src/templates/completion-workflow.ts
   ```
   **Expected**: See "Workflow reloaded" in broker API logs

### 2.3 Workflow Execution

1. **List available workflows**
   ```bash
   curl http://localhost:4000/v1/workflows \
     -H "Authorization: Bearer bearer-token-change-me"
   ```
   **Expected**: JSON array of 5 workflows

2. **Execute completion workflow**
   ```bash
   curl -X POST http://localhost:4000/v1/workflows/execute \
     -H "Authorization: Bearer bearer-token-change-me" \
     -H "Content-Type: application/json" \
     -d '{
       "workflowId": "completion-workflow",
       "input": { "input": "Hello, how are you?" }
     }'
   ```
   **Expected**: Successful completion with result

3. **Execute QA workflow**
   ```bash
   curl -X POST http://localhost:4000/v1/workflows/execute \
     -H "Authorization: Bearer bearer-token-change-me" \
     -H "Content-Type: application/json" \
     -d '{
       "workflowId": "qa-workflow",
       "input": {
         "context": "Paris is the capital of France.",
         "question": "What is the capital of France?"
       }
     }'
   ```
   **Expected**: Answer mentioning Paris

### 2.4 Flowise Sync

1. **Export LCEL to Flowise**
   ```bash
   curl -X POST http://localhost:4000/v1/workflows/sync \
     -H "Authorization: Bearer bearer-token-change-me" \
     -H "Content-Type: application/json" \
     -d '{
       "workflowId": "completion-workflow",
       "direction": "toFlowise"
     }'
   ```
   **Expected**: Success with chatflowId

2. **List Flowise chatflows**
   ```bash
   curl http://localhost:4000/v1/workflows/flowise/chatflows \
     -H "Authorization: Bearer bearer-token-change-me"
   ```
   **Expected**: Shows exported workflow

## 3. Local LLM (Ollama) Testing

### 3.1 Ollama Health Check

1. **Verify Ollama is running**
   ```bash
   curl http://localhost:11434/api/tags
   ```
   **Expected**: List of available models

2. **Check paraphrase endpoint health**
   ```bash
   curl http://localhost:4000/v1/paraphrase/health
   ```
   **Expected**: `{"status":"ok","service":"ollama","available":true}`

### 3.2 Paraphrase Feature

1. **Test basic paraphrase**
   ```bash
   curl -X POST http://localhost:4000/v1/paraphrase \
     -H "Content-Type: application/json" \
     -d '{
       "text": "The quick brown fox jumps over the lazy dog."
     }'
   ```
   **Expected**: Paraphrased text with latency < 1000ms

2. **Test styled paraphrase**
   ```bash
   curl -X POST http://localhost:4000/v1/paraphrase \
     -H "Content-Type: application/json" \
     -d '{
       "text": "I need help with my computer.",
       "style": "formal"
     }'
   ```
   **Expected**: Formal version of the text

3. **Test batch paraphrase**
   ```bash
   curl -X POST http://localhost:4000/v1/paraphrase/batch \
     -H "Content-Type: application/json" \
     -d '{
       "texts": ["Hello", "How are you?", "Nice to meet you"],
       "style": "casual"
     }'
   ```
   **Expected**: Array of paraphrased texts

### 3.3 UI Testing

1. **Access paraphrase UI**
   - Navigate to http://localhost:3000/paraphrase
   - Enter text
   - Select style
   - Click "Paraphrase"
   - **Expected**: Result appears with low latency

## 4. CI/CD Pipeline Testing

### 4.1 GitHub Actions Setup

1. **Verify workflow files exist**
   ```bash
   ls -la .github/workflows/
   ```
   **Expected**: Shows pr-evaluation.yml, deploy.yml, scheduled-eval.yml

2. **Test workflow syntax**
   ```bash
   # Install act for local testing (optional)
   brew install act # or appropriate package manager
   
   # Dry run
   act -n pull_request
   ```

### 4.2 PR Evaluation Workflow

1. **Create a test branch**
   ```bash
   git checkout -b test/phase3-evaluation
   echo "# Test prompt" > prompts/test.md
   git add prompts/test.md
   git commit -m "Test PR evaluation"
   git push origin test/phase3-evaluation
   ```

2. **Create PR and observe**
   - Create PR on GitHub
   - **Expected**: Workflow runs automatically
   - Check: Linting, type checking, unit tests, evaluations

### 4.3 Evaluation Scripts

1. **Test threshold checking**
   ```bash
   cd packages/evaluators
   # Create mock results
   echo '{"quality":{"score":0.85},"security":{"score":0.92}}' > results/latest.json
   node scripts/check-thresholds.js
   ```
   **Expected**: "All evaluation thresholds passed!"

## 5. Integration Testing

### 5.1 End-to-End Workflow Creation

1. **Create workflow in Flowise UI**
   - Go to http://localhost:3000/advanced
   - Create new workflow visually
   - Save it

2. **Sync to LCEL**
   - Click "Export to LCEL" button
   - **Expected**: Sync indicator shows success

3. **Execute via API**
   - Use the workflow ID from Flowise
   - Execute via broker API
   - **Expected**: Workflow runs successfully

### 5.2 Performance Testing

1. **Measure paraphrase latency**
   ```bash
   # Run 10 requests and measure
   for i in {1..10}; do
     time curl -X POST http://localhost:4000/v1/paraphrase \
       -H "Content-Type: application/json" \
       -d '{"text": "Test text for performance measurement."}' \
       -o /dev/null -s
   done
   ```
   **Expected**: Average < 1 second

2. **Test workflow execution performance**
   ```bash
   # Time workflow execution
   time curl -X POST http://localhost:4000/v1/workflows/execute \
     -H "Authorization: Bearer bearer-token-change-me" \
     -H "Content-Type: application/json" \
     -d '{"workflowId": "completion-workflow", "input": {"input": "Hi"}}' \
     -o /dev/null -s
   ```

## 6. Security Testing

### 6.1 Authentication

1. **Test unauthorized access**
   ```bash
   curl http://localhost:4000/v1/workflows
   ```
   **Expected**: 401 Unauthorized

2. **Test invalid token**
   ```bash
   curl http://localhost:4000/v1/workflows \
     -H "Authorization: Bearer invalid-token"
   ```
   **Expected**: 401 Unauthorized

### 6.2 Iframe Security

1. **Check CSP headers**
   - Open DevTools on /advanced page
   - Check Content-Security-Policy
   - **Expected**: Restrictive CSP for iframe

## 7. Troubleshooting

### Common Issues

1. **Flowise not accessible**
   - Check Docker logs: `docker logs masterprompt-flowise-1`
   - Verify PostgreSQL has flowise database
   - Check Redis connection

2. **Workflows not loading**
   - Ensure packages are built: `pnpm build`
   - Check broker API logs
   - Verify file paths are correct

3. **Ollama paraphrase slow**
   - Check if model is downloaded: `docker exec masterprompt-ollama-1 ollama list`
   - Pull model if needed: `docker exec masterprompt-ollama-1 ollama pull llama3:8b`

4. **GitHub Actions failing**
   - Check secrets are set (OPENAI_API_KEY, etc.)
   - Verify file paths in workflows
   - Check evaluation thresholds

## 8. Phase 3 Checklist

- [ ] Flowise containers running and healthy
- [ ] Visual workflow editor accessible at /advanced
- [ ] All 5 workflow templates executable
- [ ] Bi-directional sync working (LCEL ↔ Flowise)
- [ ] Ollama paraphrase responds in < 1s
- [ ] GitHub Actions workflows valid
- [ ] PR evaluation runs on prompt changes
- [ ] Security headers properly set
- [ ] Hot reloading works in development
- [ ] All TypeScript types correct

## Next Steps

1. **Production Deployment**
   - Configure production environment variables
   - Set up proper API keys and secrets
   - Configure domain and SSL

2. **Advanced Features**
   - Implement remaining collaboration features
   - Create evaluation dashboard UI
   - Add more workflow templates

3. **Performance Optimization**
   - Add caching for workflows
   - Optimize Flowise sync
   - Implement workflow versioning

## Success Metrics

- Flowise integration fully functional
- All workflow templates execute successfully
- CI/CD pipeline catches issues before merge
- Local LLM responds within latency target
- 100% of security tests pass