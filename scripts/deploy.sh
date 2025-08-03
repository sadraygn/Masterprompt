#!/bin/bash

# Deploy script for MasterPrompt to Fly.io
set -e

echo "🚀 Deploying MasterPrompt to Fly.io..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo -e "${RED}❌ fly CLI is not installed. Please install it from https://fly.io/docs/getting-started/installing-flyctl/${NC}"
    exit 1
fi

# Function to deploy an app
deploy_app() {
    local app_name=$1
    local config_file=$2
    
    echo -e "${YELLOW}📦 Deploying $app_name...${NC}"
    
    # Check if app exists, create if not
    if ! fly apps list | grep -q "$app_name"; then
        echo "Creating app $app_name..."
        fly apps create "$app_name"
    fi
    
    # Deploy the app
    fly deploy --config "$config_file" --app "$app_name"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $app_name deployed successfully!${NC}"
    else
        echo -e "${RED}❌ Failed to deploy $app_name${NC}"
        exit 1
    fi
}

# Function to set secrets
set_secrets() {
    local app_name=$1
    shift
    local secrets=("$@")
    
    echo -e "${YELLOW}🔐 Setting secrets for $app_name...${NC}"
    
    for secret in "${secrets[@]}"; do
        if [[ -z "${!secret}" ]]; then
            echo -e "${RED}⚠️  Warning: $secret is not set${NC}"
        fi
    done
    
    # Set all secrets at once
    fly secrets set "${secrets[@]}" --app "$app_name"
}

# Deploy broker API
echo -e "${GREEN}=== Deploying Broker API ===${NC}"

# Required secrets for broker API
BROKER_SECRETS=(
    "LITELLM_MASTER_KEY"
    "OPENAI_API_KEY"
    "GOOGLE_API_KEY"
    "API_BEARER_TOKEN"
    "LANGFUSE_PUBLIC_KEY"
    "LANGFUSE_SECRET_KEY"
    "DATABASE_URL"
    "REDIS_URL"
    "FLOWISE_SECRET_KEY"
)

# Set secrets for broker API
set_secrets "masterprompt-broker" "${BROKER_SECRETS[@]}"

# Deploy broker API
deploy_app "masterprompt-broker" "fly.toml"

# Get broker API URL
BROKER_URL=$(fly info --app masterprompt-broker --json | jq -r '.Hostname' | sed 's/^/https:\/\//')
echo "Broker API URL: $BROKER_URL"

# Deploy web app
echo -e "${GREEN}=== Deploying Studio Web ===${NC}"

# Set broker API URL for web app
fly secrets set BROKER_API_URL="$BROKER_URL" --app masterprompt-web

# Required secrets for web app
WEB_SECRETS=(
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
    "API_BEARER_TOKEN"
)

# Set secrets for web app
set_secrets "masterprompt-web" "${WEB_SECRETS[@]}"

# Deploy web app
deploy_app "masterprompt-web" "fly.web.toml"

# Show deployment status
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo "Broker API: https://masterprompt-broker.fly.dev"
echo "Studio Web: https://masterprompt-web.fly.dev"

# Show app status
echo -e "${YELLOW}📊 App Status:${NC}"
fly status --app masterprompt-broker
fly status --app masterprompt-web

echo -e "${GREEN}✨ Deployment completed successfully!${NC}"