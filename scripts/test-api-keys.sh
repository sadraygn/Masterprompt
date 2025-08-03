#!/bin/bash

# Test API Keys Configuration
# This script validates that API keys are properly configured

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "==========================================="
echo "API Key Configuration Test"
echo "==========================================="
echo ""

# Load environment variables
if [ -f "infra/.env" ]; then
    export $(cat infra/.env | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: infra/.env file not found${NC}"
    exit 1
fi

# Function to test API endpoint
test_api() {
    local provider=$1
    local model=$2
    local key_var=$3
    
    echo "Testing $provider..."
    
    # Check if key is set
    if [ -z "${!key_var}" ] || [[ "${!key_var}" == *"..."* ]]; then
        echo -e "${YELLOW}⚠ $provider: API key not configured${NC}"
        return 1
    fi
    
    # Test the API
    RESPONSE=$(curl -s -X POST http://localhost:8001/v1/chat/completions \
        -H "Authorization: Bearer ${LITELLM_MASTER_KEY:-sk-1234567890abcdef}" \
        -H "Content-Type: application/json" \
        -d "{
            \"model\": \"$model\",
            \"messages\": [{\"role\": \"user\", \"content\": \"Say 'test successful' in 3 words\"}],
            \"max_tokens\": 10
        }" 2>&1)
    
    if echo "$RESPONSE" | grep -q "test successful\|Test successful"; then
        echo -e "${GREEN}✓ $provider: Working correctly${NC}"
        return 0
    elif echo "$RESPONSE" | grep -q "Invalid API Key\|Incorrect API key"; then
        echo -e "${RED}✗ $provider: Invalid API key${NC}"
        return 1
    elif echo "$RESPONSE" | grep -q "error"; then
        echo -e "${RED}✗ $provider: Error - $(echo $RESPONSE | grep -o '"message":"[^"]*"' | cut -d'"' -f4)${NC}"
        return 1
    else
        echo -e "${YELLOW}⚠ $provider: Unexpected response${NC}"
        return 1
    fi
}

# Check if LiteLLM is running
if ! curl -s http://localhost:8001/health > /dev/null 2>&1; then
    echo -e "${RED}Error: LiteLLM is not running${NC}"
    echo "Start it with: cd infra && docker compose up -d"
    exit 1
fi

echo "LiteLLM is running. Testing API keys..."
echo ""

# Test each provider
WORKING_PROVIDERS=0

test_api "OpenAI" "gpt-3.5-turbo" "OPENAI_API_KEY" && ((WORKING_PROVIDERS++))
echo ""

test_api "Google Gemini" "gemini-pro" "GOOGLE_API_KEY" && ((WORKING_PROVIDERS++))
echo ""

test_api "Anthropic Claude" "claude-3-haiku-20240307" "ANTHROPIC_API_KEY" && ((WORKING_PROVIDERS++))
echo ""

# Test Ollama (local)
echo "Testing Ollama (local)..."
if docker ps | grep -q "ollama"; then
    RESPONSE=$(curl -s -X POST http://localhost:8001/v1/chat/completions \
        -H "Authorization: Bearer ${LITELLM_MASTER_KEY:-sk-1234567890abcdef}" \
        -H "Content-Type: application/json" \
        -d '{
            "model": "ollama/llama3",
            "messages": [{"role": "user", "content": "Say test"}],
            "max_tokens": 10
        }' 2>&1)
    
    if echo "$RESPONSE" | grep -q "content"; then
        echo -e "${GREEN}✓ Ollama: Working correctly${NC}"
        ((WORKING_PROVIDERS++))
    else
        echo -e "${YELLOW}⚠ Ollama: Not available (models may need to be pulled)${NC}"
    fi
else
    echo -e "${RED}✗ Ollama: Container not running${NC}"
fi
echo ""

# Summary
echo "==========================================="
echo "Summary"
echo "==========================================="
echo ""

if [ $WORKING_PROVIDERS -eq 0 ]; then
    echo -e "${RED}No working LLM providers found!${NC}"
    echo ""
    echo "You need at least one working provider. Either:"
    echo "1. Add your OpenAI API key to infra/.env"
    echo "2. Add your Google AI API key to infra/.env"
    echo "3. Pull Ollama models: docker exec -it infra-ollama-1 ollama pull llama3"
elif [ $WORKING_PROVIDERS -eq 1 ]; then
    echo -e "${YELLOW}1 working provider found${NC}"
    echo "This is sufficient to use the application."
else
    echo -e "${GREEN}$WORKING_PROVIDERS working providers found${NC}"
    echo "Excellent! You have multiple LLM options available."
fi

echo ""
echo "To test through the broker API:"
echo "curl -X POST http://localhost:4000/v1/chat/completions \\"
echo "  -H \"Authorization: Bearer ${API_BEARER_TOKEN:-your-bearer-token}\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"model\": \"gpt-3.5-turbo\", \"messages\": [{\"role\": \"user\", \"content\": \"Hello\"}]}'"