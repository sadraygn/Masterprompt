#!/bin/bash

# Quick Setup Script for Prompt Engineering Studio
# This script automates the initial setup process

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "==========================================="
echo "Prompt Engineering Studio - Quick Setup"
echo "==========================================="
echo ""

# Function to generate random string
generate_random_string() {
    openssl rand -hex 16
}

# Check prerequisites
echo "Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker Desktop from https://docker.com"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}pnpm not found. Installing...${NC}"
    npm install -g pnpm
fi

echo -e "${GREEN}✓ All prerequisites installed${NC}"
echo ""

# Setup environment file
echo "Setting up environment configuration..."
if [ ! -f "infra/.env" ]; then
    if [ -f "infra/.env.example" ]; then
        cp infra/.env.example infra/.env
        echo -e "${GREEN}✓ Created .env file from template${NC}"
        
        # Generate secure tokens
        MASTER_KEY="sk-ps-$(generate_random_string)"
        BEARER_TOKEN="bearer-ps-$(generate_random_string)"
        
        # Update tokens in .env file
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/LITELLM_MASTER_KEY=.*/LITELLM_MASTER_KEY=$MASTER_KEY/" infra/.env
            sed -i '' "s/API_BEARER_TOKEN=.*/API_BEARER_TOKEN=$BEARER_TOKEN/" infra/.env
        else
            # Linux
            sed -i "s/LITELLM_MASTER_KEY=.*/LITELLM_MASTER_KEY=$MASTER_KEY/" infra/.env
            sed -i "s/API_BEARER_TOKEN=.*/API_BEARER_TOKEN=$BEARER_TOKEN/" infra/.env
        fi
        
        echo -e "${GREEN}✓ Generated secure tokens${NC}"
        echo ""
        echo -e "${YELLOW}IMPORTANT: You must add your API keys to infra/.env${NC}"
        echo "Required (at least one):"
        echo "  - OPENAI_API_KEY=sk-..."
        echo "  - GOOGLE_API_KEY=AIza..."
        echo ""
    else
        echo -e "${RED}Error: infra/.env.example not found${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}.env file already exists${NC}"
fi

# Install dependencies
echo "Installing dependencies..."
pnpm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Start Docker services
echo "Starting Docker services..."
cd infra
docker compose pull
docker compose up -d
cd ..
echo -e "${GREEN}✓ Docker services started${NC}"
echo ""

# Wait for services to be ready
echo "Waiting for services to initialize..."
sleep 10

# Check service health
echo "Checking service health..."
SERVICES_OK=true

if ! docker ps | grep -q "postgres"; then
    echo -e "${RED}✗ PostgreSQL not running${NC}"
    SERVICES_OK=false
fi

if ! docker ps | grep -q "litellm"; then
    echo -e "${RED}✗ LiteLLM not running${NC}"
    SERVICES_OK=false
fi

if ! docker ps | grep -q "redis"; then
    echo -e "${RED}✗ Redis not running${NC}"
    SERVICES_OK=false
fi

if $SERVICES_OK; then
    echo -e "${GREEN}✓ All services running${NC}"
else
    echo -e "${RED}Some services failed to start. Check docker logs:${NC}"
    echo "  docker compose -f infra/docker-compose.yaml logs"
fi
echo ""

# Build packages
echo "Building packages..."
pnpm build || {
    echo -e "${YELLOW}Build failed. This is normal if API keys are not configured yet.${NC}"
}
echo ""

# Final instructions
echo "==========================================="
echo "Setup Complete!"
echo "==========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Add your API keys to infra/.env"
echo "   ${YELLOW}This is required before the application will work!${NC}"
echo ""
echo "2. Start the broker API:"
echo "   cd apps/broker-api && pnpm dev"
echo ""
echo "3. Start the web UI (in a new terminal):"
echo "   cd apps/studio-web && pnpm dev"
echo ""
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "For detailed instructions, see: Instruction2.md"
echo "To check system status, run: ./scripts/diagnostic.sh"