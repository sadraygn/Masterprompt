#!/bin/bash

echo "🔍 Testing Prompt Engineering Studio API..."
echo ""

# Test health endpoint
echo "1. Testing Broker Health:"
curl -s http://localhost:4000/health \
  -H "Authorization: Bearer d076788c857bf9eefec86b8caa560d8767387380c25a5cbb89345824d5303a81" | jq

echo ""
echo "2. Testing Available Models:"
curl -s http://localhost:4000/v1/models \
  -H "Authorization: Bearer d076788c857bf9eefec86b8caa560d8767387380c25a5cbb89345824d5303a81" | jq '.data[0:3]'

echo ""
echo "3. Testing Direct Broker Completion:"
response=$(curl -s -X POST http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer d076788c857bf9eefec86b8caa560d8767387380c25a5cbb89345824d5303a81" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "What is the capital of France? Answer in one word."}],
    "temperature": 0.5
  }')
echo "$response" | jq '.choices[0].message.content'

echo ""
echo "4. Testing Frontend API Endpoint:"
response=$(curl -s -X POST http://localhost:3000/api/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer d076788c857bf9eefec86b8caa560d8767387380c25a5cbb89345824d5303a81" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "What is 10 + 10?"}],
    "temperature": 0.5
  }')
echo "$response" | jq '.choices[0].message.content'

echo ""
echo "✅ API Test Complete!"
echo ""
echo "Summary:"
echo "- Broker API: http://localhost:4000"
echo "- Frontend: http://localhost:3000"
echo "- LiteLLM: http://localhost:8001"
echo ""
echo "Your app is ready to use! Access it at http://localhost:3000"