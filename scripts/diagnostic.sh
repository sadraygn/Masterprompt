#!/bin/bash

# Prompt Engineering Studio - Diagnostic Script
# This script checks the health of all services and configurations

set -e

echo "==========================================="
echo "Prompt Engineering Studio - System Diagnostics"
echo "==========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is not installed"
        return 1
    fi
}

check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${GREEN}✓${NC} Port $1 is in use by: $(lsof -Pi :$1 -sTCP:LISTEN -t | xargs ps -p | tail -n 1 | awk '{print $4}')"
        return 0
    else
        echo -e "${RED}✗${NC} Port $1 is not in use"
        return 1
    fi
}

check_docker_service() {
    if docker ps --format "table {{.Names}}" | grep -q "$1"; then
        echo -e "${GREEN}✓${NC} Docker service $1 is running"
        return 0
    else
        echo -e "${RED}✗${NC} Docker service $1 is not running"
        return 1
    fi
}

check_url() {
    if curl -s -o /dev/null -w "%{http_code}" "$1" | grep -q "^[23]"; then
        echo -e "${GREEN}✓${NC} $2 is accessible at $1"
        return 0
    else
        echo -e "${RED}✗${NC} $2 is not accessible at $1"
        return 1
    fi
}

check_env_var() {
    if [ -f "infra/.env" ]; then
        if grep -q "^$1=" "infra/.env" && ! grep -q "^$1=$2" "infra/.env"; then
            echo -e "${GREEN}✓${NC} $1 is configured"
            return 0
        else
            echo -e "${YELLOW}⚠${NC} $1 is not configured or using default value"
            return 1
        fi
    else
        echo -e "${RED}✗${NC} infra/.env file not found"
        return 1
    fi
}

# System Requirements
echo "1. Checking System Requirements"
echo "-------------------------------"
check_command docker
check_command "docker compose" || check_command docker-compose
check_command node
check_command pnpm
echo ""

# Version checks
echo "2. Version Information"
echo "---------------------"
if command -v docker &> /dev/null; then
    echo "Docker: $(docker --version | cut -d' ' -f3 | tr -d ',')"
fi
if command -v node &> /dev/null; then
    echo "Node.js: $(node --version)"
fi
if command -v pnpm &> /dev/null; then
    echo "pnpm: $(pnpm --version)"
fi
echo ""

# Environment Configuration
echo "3. Environment Configuration"
echo "---------------------------"
if [ -f "infra/.env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    check_env_var "OPENAI_API_KEY" "sk-..."
    check_env_var "GOOGLE_API_KEY" "AIza..."
    check_env_var "LITELLM_MASTER_KEY" "sk-1234567890abcdef"
    check_env_var "API_BEARER_TOKEN" "bearer-token-change-me"
else
    echo -e "${RED}✗${NC} .env file not found in infra/"
    echo -e "${YELLOW}→${NC} Run: cd infra && cp .env.example .env"
fi
echo ""

# Docker Services
echo "4. Docker Services Status"
echo "------------------------"
if docker info &> /dev/null; then
    check_docker_service "postgres"
    check_docker_service "litellm"
    check_docker_service "langfuse"
    check_docker_service "ollama"
    check_docker_service "redis"
    check_docker_service "flowise"
else
    echo -e "${RED}✗${NC} Docker is not running"
fi
echo ""

# Port Availability
echo "5. Port Status"
echo "--------------"
check_port 4000  # Broker API
check_port 8001  # LiteLLM
check_port 3002  # Langfuse
check_port 5433  # PostgreSQL
check_port 6379  # Redis
check_port 3100  # Flowise
check_port 11434 # Ollama
check_port 3000  # Studio Web
echo ""

# Service Health Checks
echo "6. Service Health Checks"
echo "------------------------"
check_url "http://localhost:8001/health" "LiteLLM"
check_url "http://localhost:4000/health" "Broker API"
check_url "http://localhost:3002" "Langfuse UI"
check_url "http://localhost:3100" "Flowise UI"
check_url "http://localhost:3000" "Studio Web UI"
echo ""

# Database Connectivity
echo "7. Database Connectivity"
echo "-----------------------"
if docker ps --format "table {{.Names}}" | grep -q "postgres"; then
    if docker exec -i $(docker ps -qf "name=postgres") pg_isready -U postgres &> /dev/null; then
        echo -e "${GREEN}✓${NC} PostgreSQL is accepting connections"
        
        # Check databases
        DBS=$(docker exec -i $(docker ps -qf "name=postgres") psql -U postgres -t -c "SELECT datname FROM pg_database WHERE datistemplate = false;")
        for db in prompt_studio litellm langfuse; do
            if echo "$DBS" | grep -q "$db"; then
                echo -e "${GREEN}✓${NC} Database '$db' exists"
            else
                echo -e "${RED}✗${NC} Database '$db' not found"
            fi
        done
    else
        echo -e "${RED}✗${NC} PostgreSQL is not accepting connections"
    fi
else
    echo -e "${RED}✗${NC} PostgreSQL container not running"
fi
echo ""

# Node Modules
echo "8. Node Dependencies"
echo "-------------------"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Root node_modules exists"
else
    echo -e "${RED}✗${NC} Root node_modules missing - run: pnpm install"
fi

for app in "apps/broker-api" "apps/studio-web"; do
    if [ -d "$app/node_modules" ]; then
        echo -e "${GREEN}✓${NC} $app node_modules exists"
    else
        echo -e "${YELLOW}⚠${NC} $app node_modules missing"
    fi
done
echo ""

# Build Status
echo "9. Build Status"
echo "---------------"
for app in "apps/broker-api" "apps/studio-web"; do
    if [ -d "$app/dist" ] || [ -d "$app/.next" ]; then
        echo -e "${GREEN}✓${NC} $app is built"
    else
        echo -e "${YELLOW}⚠${NC} $app needs building - run: pnpm build"
    fi
done
echo ""

# Summary
echo "==========================================="
echo "Summary"
echo "==========================================="

# Count issues
ERRORS=0
WARNINGS=0

# Rerun checks silently to count
{
    check_command docker || ((ERRORS++))
    check_command node || ((ERRORS++))
    check_command pnpm || ((ERRORS++))
    [ -f "infra/.env" ] || ((ERRORS++))
    check_docker_service "postgres" || ((WARNINGS++))
    check_docker_service "litellm" || ((WARNINGS++))
    [ -d "node_modules" ] || ((WARNINGS++))
} &> /dev/null

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All systems operational!${NC}"
else
    echo -e "${RED}Errors: $ERRORS${NC} | ${YELLOW}Warnings: $WARNINGS${NC}"
    echo ""
    echo "Quick fixes:"
    if ! command -v docker &> /dev/null; then
        echo "1. Install Docker Desktop from https://docker.com"
    fi
    if ! [ -f "infra/.env" ]; then
        echo "2. Create .env file: cd infra && cp .env.example .env"
    fi
    if ! docker ps &> /dev/null; then
        echo "3. Start Docker Desktop"
    fi
    if ! [ -d "node_modules" ]; then
        echo "4. Install dependencies: pnpm install"
    fi
fi

echo ""
echo "For detailed setup instructions, see: Instruction2.md"