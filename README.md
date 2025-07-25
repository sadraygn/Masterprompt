# Modern Prompt Engineering Studio

A full-stack application for prompt engineering with 100+ LLM providers, built on proven open-source components with a "90% wheels, 10% glue" architecture.

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ and pnpm
- API keys for at least one LLM provider (OpenAI, Google, etc.)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd MasterPrompt
```

2. Run the setup script:
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

3. Update your API keys in `infra/.env`:
```env
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...
```

4. Start the development servers:
```bash
pnpm dev
```

## 🏗️ Architecture

The system consists of:

- **Broker API** (Fastify): Central gateway for all LLM requests
- **Studio Web** (Next.js): Modern UI for prompt engineering
- **LiteLLM Proxy**: Unified interface to 100+ LLM providers
- **Langfuse**: Observability and cost tracking
- **PostgreSQL**: Data persistence
- **Ollama**: Local LLM support

## 📍 Service URLs

- **Studio Web**: http://localhost:3000
- **Broker API**: http://localhost:4000
- **API Docs**: http://localhost:4000/docs
- **Langfuse**: http://localhost:3002
- **LiteLLM Proxy**: http://localhost:8001

## 🔑 Authentication

The Broker API uses bearer token authentication. Include the token from your `.env` file:

```bash
Authorization: Bearer <your-token>
```

## 🧪 Testing

Test the LiteLLM connection:
```bash
cd apps/broker-api
pnpm tsx src/test-litellm.ts
```

## 📚 Documentation

- [Architecture Overview](claude.md)
- [Implementation Phases](phases.md)
- [API Documentation](http://localhost:4000/docs)

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT