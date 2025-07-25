#!/bin/bash
set -e

echo "🚀 Setting up Prompt Engineering Studio..."

# Check for required tools
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required but not installed. Install with: npm install -g pnpm" >&2; exit 1; }

# Copy environment file if it doesn't exist
if [ ! -f infra/.env ]; then
    echo "📋 Creating .env file from template..."
    cp infra/.env.example infra/.env
    echo "⚠️  Please update infra/.env with your API keys"
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Start Docker services
echo "🐳 Starting Docker services..."
cd infra && docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."
docker-compose ps

# Pull Ollama models
echo "🤖 Pulling Ollama models..."
docker exec -it masterprompt-ollama-1 ollama pull llama3 || echo "⚠️  Failed to pull llama3 model"

echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Update infra/.env with your API keys"
echo "2. Run 'pnpm dev' to start the development servers"
echo "3. Access the services:"
echo "   - LiteLLM Proxy: http://localhost:8000"
echo "   - Langfuse: http://localhost:3002"
echo "   - Broker API: http://localhost:4000 (after starting)"
echo "   - Studio Web: http://localhost:3000 (after starting)"