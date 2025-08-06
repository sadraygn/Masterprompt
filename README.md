# Prompt Engineering Studio

A comprehensive, production-ready prompt engineering platform that provides unified access to 100+ LLM providers with advanced security, evaluation, and workflow capabilities.

## 🚀 Features

### Core Capabilities
- **🔌 Unified LLM Access**: Single API for OpenAI, Anthropic, Google, and 100+ providers via LiteLLM
- **📊 Full Observability**: Request tracing, cost tracking, and performance monitoring with Langfuse
- **🔒 Enterprise Security**: Prompt injection detection (Rebuff) and output validation (Guardrails)
- **🎨 Visual Workflow Editor**: Flowise integration for drag-and-drop prompt chain creation
- **📈 Evaluation Framework**: Promptfoo for regression testing and quality assurance
- **💾 Vector Store**: Semantic search and context management with Weaviate/Qdrant
- **⚡ Production Features**: Caching, WebSockets, SAML/SSO, RBAC, and more

### Implementation Status
- ✅ **Phase 1**: Core Infrastructure & MVP
- ✅ **Phase 2**: Security & Evaluation Features  
- ✅ **Phase 3**: Advanced Features & Integration
- ✅ **Phase 4**: Production Deployment & Scale

## 📋 Prerequisites

- Docker & Docker Compose (v20.10+)
- Node.js 18+ and pnpm 8+
- At least one LLM API key:
  - OpenAI (paid, $5 minimum)
  - Google AI (free tier available)
  - Anthropic (optional)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Artvios/Masterprompt.git
cd Masterprompt
```

### 2. Run Quick Setup
```bash
./scripts/quick-setup.sh
```

### 3. Configure API Keys
```bash
# Edit infra/.env and add your API keys:
OPENAI_API_KEY=sk-...
# OR
GOOGLE_API_KEY=AIza...
```

### 4. Start the Applications
```bash
# Terminal 1 - Start Broker API
cd apps/broker-api
pnpm dev

# Terminal 2 - Start Web UI
cd apps/studio-web
pnpm dev
```

### 5. Access the Application
Open http://localhost:3000 in your browser

## 📖 Documentation

### Setup & Configuration
- [Complete Setup Guide](./Instruction2.md) - Detailed setup and testing instructions
- [Getting Started](./instructions.md) - API key setup and initial configuration
- [MCP Tools Guide](./MCP-Tools-Guide.md) - Understanding automation capabilities

### Testing Guides
- [Phase 1 Testing](./phase1_test.md) - Core infrastructure tests
- [Phase 2 Testing](./phase2_test.md) - Security features tests
- [Phase 3 Testing](./phase3_test.md) - Advanced features tests
- [Phase 4 Testing](./phase4_test.md) - Production features tests

### Architecture
- [Architecture Overview](./claude.md) - Complete system architecture
- [Implementation Phases](./phases.md) - 4-phase development plan

## 🛠️ Utility Scripts

```bash
# System diagnostics
./scripts/diagnostic.sh

# Test API keys
./scripts/test-api-keys.sh

# Quick setup
./scripts/quick-setup.sh
```

## 🏗️ Technology Stack

### Frontend
- **Framework**: Next.js 14, React 18, TypeScript
- **UI Components**: ShadCN UI, Chakra UI
- **Styling**: Tailwind CSS
- **State Management**: React Context + Hooks

### Backend
- **API Server**: Fastify (TypeScript)
- **LLM Gateway**: LiteLLM (100+ providers)
- **Workflow Engine**: LangChain LCEL
- **Visual Editor**: Flowise

### Infrastructure
- **Databases**: PostgreSQL, Redis
- **Vector Store**: Weaviate/Qdrant
- **Observability**: Langfuse
- **Security**: Rebuff, Guardrails
- **Deployment**: Docker, Fly.io

### Security & Evaluation
- **Prompt Injection**: Rebuff
- **Output Validation**: Guardrails
- **Testing**: Promptfoo, Ragas, TruLens
- **Authentication**: SAML/SSO, RBAC

## 📁 Project Structure

```
.
├── apps/
│   ├── broker-api/        # Fastify backend API
│   └── studio-web/        # Next.js frontend
├── packages/
│   ├── auth/             # Authentication & RBAC
│   ├── cache/            # Caching layer
│   ├── evaluators/       # Evaluation tools
│   ├── security/         # Security features
│   ├── shared/           # Shared utilities
│   ├── websocket/        # WebSocket support
│   └── workflows/        # LCEL workflows
├── infra/
│   ├── docker-compose.yaml
│   └── .env.example
├── scripts/              # Utility scripts
└── prompt-library/       # Curated prompts
```

## 🔧 Environment Variables

```env
# Required (at least one)
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=AIza...

# Security (change these!)
LITELLM_MASTER_KEY=your-secure-key
API_BEARER_TOKEN=your-bearer-token

# Optional
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
ANTHROPIC_API_KEY=sk-ant-...
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Test API endpoints
curl http://localhost:4000/health

# Test LLM providers
./scripts/test-api-keys.sh

# Run diagnostics
./scripts/diagnostic.sh
```

## 🚀 Deployment

### Lovable.dev Deployment (Recommended)
Deploy securely to Lovable.dev with environment variable protection:
```bash
# See complete deployment guide
📖 [Lovable.dev Deployment Guide](./LOVABLE_DEPLOYMENT.md)
```
🔒 **API keys are safely secured** - never exposed in public repositories!

### Docker Production Build
```bash
# Build images
docker build -f Dockerfile.broker -t prompt-studio-broker .
docker build -f Dockerfile.web -t prompt-studio-web .

# Run containers
docker run -p 4000:4000 prompt-studio-broker
docker run -p 3000:3000 prompt-studio-web
```

### Fly.io Deployment
```bash
fly deploy
```

## 📊 Features by Phase

### Phase 1: Core Infrastructure ✅
- LiteLLM integration for 100+ LLM providers
- Basic prompt editor with temperature control
- Langfuse tracing and cost tracking
- Docker-based local development

### Phase 2: Security & Evaluation ✅
- Rebuff prompt injection detection
- Guardrails output validation
- Promptfoo regression testing
- Vector store integration

### Phase 3: Advanced Features ✅
- Flowise visual workflow editor
- LCEL workflow templates
- CI/CD with GitHub Actions
- Local LLM support with Ollama

### Phase 4: Production & Scale ✅
- Production Docker builds
- SAML/SSO authentication
- RBAC with role management
- Intelligent caching with Redis
- WebSocket real-time updates

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

Built with excellent open-source projects:
- [LiteLLM](https://litellm.ai/) - Unified LLM API
- [Langfuse](https://langfuse.com/) - LLM observability
- [LangChain](https://langchain.com/) - LLM application framework
- [Flowise](https://flowiseai.com/) - Visual workflow builder
- [Promptfoo](https://promptfoo.dev/) - LLM testing framework

## 📞 Support

For issues and questions:
- Check the [documentation](./Instruction2.md)
- Run diagnostics: `./scripts/diagnostic.sh`
- Open an issue on GitHub

---

**Ready to engineer better prompts?** Get started with the Quick Start guide above! 🚀