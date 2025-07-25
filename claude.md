# Modern Prompt Engineering Studio Architecture

## Executive Summary

This project delivers a full‑stack Prompt & Context Engineering Studio that can be stood up in days—not months—by composing proven open‑source "building blocks" behind a clean Next.js interface. A Fastify "broker" routes every request through LiteLLM, giving your app instant access to 100+ commercial and open LLM endpoints with built‑in retry and cost limits [LiteLLM](https://www.litellm.ai/?utm_source=chatgpt.com). Each call is traced by Langfuse, which records exact tokens, latency, and dollar cost so product, finance, and ops teams all see the same granular telemetry [Langfuse](https://langfuse.com/docs/tracing?utm_source=chatgpt.com).

Core prompt logic is expressed with LangChain's Expression Language (LCEL)—simple RunnableSequence pipes that stay readable and can be hot‑reloaded in an embedded Flowise canvas for no‑code editing or demos [LangChain](https://python.langchain.com/docs/concepts/lcel/?utm_source=chatgpt.com) | [FlowiseAI](https://flowiseai.com/?utm_source=chatgpt.com). Evaluation and safety are first‑class: Promptfoo YAML matrices catch regressions, OpenAI Evals runs in CI, Ragas scores RAG faithfulness, and TruLens flags hallucinations and bias [Promptfoo](https://www.promptfoo.dev/?utm_source=chatgpt.com) | [OpenAI Evals](https://github.com/openai/evals?utm_source=chatgpt.com) | [Ragas](https://docs.ragas.io/en/stable/?utm_source=chatgpt.com) | [TruLens](https://www.trulens.org/?utm_source=chatgpt.com). A dual shield of Rebuff (pre‑call prompt‑injection firewall) and Guardrails (post‑call JSON/schema validator with automatic retries) hardens the pipeline against both hostile inputs and malformed outputs [Rebuff](https://github.com/protectai/rebuff?utm_source=chatgpt.com) | [Guardrails](https://www.guardrailsai.com/blog/guardrails-litellm-validate-llm-output?utm_source=chatgpt.com).

For memory and retrieval, the studio lets you choose between Weaviate's hybrid BM25 + vector search or Qdrant's new "named vectors" with optional on‑disk storage, wiring either one in via Docker and a single .env flag [Weaviate](https://weaviate.io/?utm_source=chatgpt.com) | [Qdrant](https://qdrant.tech/documentation/?utm_source=chatgpt.com). A local Llama 3 served through Ollama powers the instant "Plain‑English paraphrase" feature, cutting latency and keeping sensitive prompts on‑prem [Ollama](https://ollama.ai/?utm_source=chatgpt.com). Finally, weekly GitHub actions sync community‑curated prompt libraries (Awesome‑ChatGPT‑Prompts & PromptHub), while the CI pipeline lints, tests, evaluates, and auto‑deploys to Fly.io—ensuring that every merge is safe, cost‑efficient, and traceable [Awesome ChatGPT Prompts](https://github.com/f/awesome-chatgpt-prompts?utm_source=chatgpt.com) | [PromptHub](https://github.com/deepset-ai/prompthub?utm_source=chatgpt.com).

In short, the blueprint combines high‑leverage components—each battle‑tested in production—to give users a single page where they can draft, secure, evaluate, version, and share prompts across any major model provider. The result is a "90% wheels, 10% glue" architecture that minimizes custom code yet scales cleanly from hobby‑tier to enterprise workloads.

## Architecture Overview

A modern prompt‑engineering studio can be built in four layers: (1) an opinionated React/Next UI, (2) a single TypeScript "broker" API that routes calls through LiteLLM for 100‑plus model providers and logs every request to Langfuse/LangSmith, **(3) a workflow engine (LangChain + LCEL) wrapped in Flowise for no‑code graph editing, and (4) an evaluation/security side‑car combining Promptfoo, Ragas, Guardrails, Rebuff, TruLens, and OpenAI Evals. Public prompt sets from Awesome‑ChatGPT‑Prompts and PromptHub feed the library panel; context lives in vector stores such as Weaviate or Qdrant. The result is a web app that lets you draft, paraphrase, A/B‑test, secure, version, and share prompts in minutes—without rewriting any wheel.

## 0. Project‑level TL;DR

- React/Next UI for editing prompts, sliders, context drawer and evaluation grid.
- TypeScript "Broker" (Fastify) that proxies all LLM traffic through LiteLLM, logs every step to Langfuse, and attaches cost metadata. [LiteLLM](https://docs.litellm.ai/docs/proxy/cost_tracking?utm_source=chatgpt.com) | [Langfuse](https://langfuse.com/docs/tracing?utm_source=chatgpt.com)
- Workflow engine = LangChain LCEL pipes (+ optional visual editing via Flowise iframe). [LangChain](https://python.langchain.com/docs/concepts/lcel/?utm_source=chatgpt.com) | [Flowise](https://flowiseai.com/?utm_source=chatgpt.com)
- Evaluation & security side‑car combining Promptfoo, OpenAI Evals, Ragas, TruLens, Rebuff PI detector and Guardrails output schema. [Promptfoo](https://www.promptfoo.dev/?utm_source=chatgpt.com) | [TruLens](https://www.trulens.org/?utm_source=chatgpt.com) | [Ragas](https://docs.ragas.io/en/stable/?utm_source=chatgpt.com) | [Rebuff](https://github.com/protectai/rebuff?utm_source=chatgpt.com) | [Guardrails](https://www.guardrailsai.com/blog/guardrails-litellm-validate-llm-output?utm_source=chatgpt.com)
- Prompt Library Sync from Awesome ChatGPT Prompts + PromptHub; context stored in Weaviate or Qdrant. [Awesome ChatGPT Prompts](https://github.com/f/awesome-chatgpt-prompts?utm_source=chatgpt.com) | [PromptHub](https://github.com/deepset-ai/prompthub?utm_source=chatgpt.com) | [Weaviate](https://weaviate.io/?utm_source=chatgpt.com) | [Qdrant](https://qdrant.tech/documentation/?utm_source=chatgpt.com)

## 1. Repository Layout

```
.
├── apps/
│ ├── studio-web/         # React / Next.js UI
│ └── broker-api/         # Fastify + LiteLLM gateway
├── packages/
│ ├── workflows/          # LCEL chains & Flowise JSON
│ ├── evaluators/         # Promptfoo, Ragas, TruLens configs
│ └── security/           # Rebuff & Guardrails rules
├── vector-db/            # Docker‑compose for Weaviate/Qdrant
├── prompt‑library/
│ ├── awesome-prompts/    # git submodule f/awesome-chatgpt-prompts
│ └── prompthub/          # synced JSON via cron
├── infra/
│ ├── docker-compose.yaml
│ └── fly.toml            # hobby cloud deploy
└── claude.md             # this file
```

## 2. Environment Variables (.env.example)

```bash
# ---- Broker / LiteLLM ----
LITELLM_MASTER_KEY=<random>
LITELLM_LANGFUSE_PUBLIC_KEY=<key>
LITELLM_LANGFUSE_SECRET_KEY=<key>
LITELLM_SPEND_BUDGET_USD=10 # per‑user daily budget

# ---- LLM Providers ----
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=

# ---- Langfuse ----
LANGFUSE_HOST=http://localhost:3002

# ---- Vector DB ----
WEAVIATE_HOST=http://weaviate:8080 # or QDRANT_HOST
```

## 3. Backend "Broker" API

### 3.1 Fastify + LiteLLM router

```typescript
import { completion } from "litellm";              // unified 100+ LLMs
import { Langfuse } from "langfuse-js";           // full trace & cost
import rebuff from "@protectai/rebuff";           // PI defence
import { guard } from "@guardrails-ai/express-middleware"; // output validation
```

**Steps per request:**

1. `Rebuff.precheck(req.body.prompt)` → abort if injection risk ≥ 0.7.
2. `completion({model, messages, temperature})` handled by LiteLLM with automatic retry/fallback. [LiteLLM](https://www.litellm.ai/?utm_source=chatgpt.com)
3. Capture `response_cost` and `latency_ms` (LiteLLM cost hooks). [LiteLLM Cost Tracking](https://docs.litellm.ai/docs/proxy/cost_tracking?utm_source=chatgpt.com)
4. `Guardrails.validate(resp)` against JSON schema or regex. [Guardrails](https://www.guardrailsai.com/blog/guardrails-litellm-validate-llm-output?utm_source=chatgpt.com)
5. Emit trace to Langfuse with cost tags for dashboarding. [Langfuse](https://langfuse.com/docs/model-usage-and-cost?utm_source=chatgpt.com)

### 3.2 LCEL pipelines

Example runnable chain saved in `packages/workflows/summarize.ts`:

```typescript
import { RunnableSequence } from "@langchain/core/runnables"; // LCEL
import { PromptTemplate } from "@langchain/core/prompts";     // template vars

export const summarize = RunnableSequence.from([
  PromptTemplate.fromTemplate("Summarize:\n\n{document}\n\n--\nTL;DR:"),
  completion,
  new JsonOutputParser()
]);
```

## 4. Frontend (studio‑web)

- ShadCN/Chakra components for editor, sliders, toggles.
- Creativity 0‑10 slider → temperature 0–1 mapping.
- Thinking‑Depth toggle injects or removes "think step‑by‑step" prompt chunk.
- Cost chip streams tokens + $ from LiteLLM's cost map. [LiteLLM](https://docs.litellm.ai/docs/completion/token_usage?utm_source=chatgpt.com)
- Evaluation grid renders Promptfoo JSON results side‑by‑side. [Promptfoo](https://www.promptfoo.dev/?utm_source=chatgpt.com)
- Embed Flowise canvas inside /advanced route via iframe (/flowise/agentflow). [Flowise](https://flowiseai.com/?utm_source=chatgpt.com)

## 5. Evaluation & Testing

| Layer | Tool | Purpose |
|-------|------|---------|
| Prompt regression | Promptfoo YAML matrices | catch quality drift [Promptfoo](https://www.promptfoo.dev/?utm_source=chatgpt.com) |
| RAG metrics | Ragas (context_precision, answer_relevance, groundedness) | quantify retrieval quality [Ragas](https://docs.ragas.io/en/stable/?utm_source=chatgpt.com) |
| Agent behaviour | TruLens feedback functions | monitor hallucinations & bias [TruLens](https://www.trulens.org/?utm_source=chatgpt.com) |
| CI gating | OpenAI Evals GitHub action | block merge on failure |

## 6. Security Hardening

- Rebuff inbound PI filter with multi‑layer heuristics + LLM detector. [Rebuff](https://github.com/protectai/rebuff?utm_source=chatgpt.com)
- Guardrails output schema enforcing JSON / regex / enum constraints. [Guardrails](https://www.guardrailsai.com/blog/guardrails-litellm-validate-llm-output?utm_source=chatgpt.com)
- Rate limiting & budgets via LiteLLM proxy. [LiteLLM](https://docs.litellm.ai/docs/proxy/cost_tracking?utm_source=chatgpt.com)
- Secrets stored in Docker secrets / Fly.io secrets manager.

## 7. Prompt Library Sync Jobs

```yaml
# infra/sync-prompts.yml (GitHub Actions)
- name: Sync Awesome‑ChatGPT‑Prompts
  run: |
    git submodule update --remote prompt-library/awesome-prompts

- name: Sync PromptHub
  run: |
    pip install prompthub-py
    python scripts/pull_prompthub.py
```

`pull_prompthub.py` uses the PromptHub REST endpoint https://api.prompthub.deepset.ai to fetch JSON, strip PII, and store under `prompt-library/prompthub/`. [PromptHub](https://prompthub.deepset.ai/?utm_source=chatgpt.com)

## 8. Vector Store Options

- **Weaviate** default docker‑compose (`infra/vector-db/weaviate.yml`) – GraphQL & hybrid search. [Weaviate](https://weaviate.io/?utm_source=chatgpt.com)
- **Qdrant** drop‑in alternative, supports named vectors & on‑disk storage. [Qdrant](https://qdrant.tech/documentation/?utm_source=chatgpt.com) | [Qdrant Vectors](https://qdrant.tech/documentation/concepts/vectors/?utm_source=chatgpt.com)
- Choose by setting `VECTOR_DB=weaviate|qdrant` in `.env`.

## 9. Deployment Recipes

### 9.1 Local Dev

```bash
docker compose -f infra/docker-compose.yaml up -d
cd apps/studio-web && pnpm dev
```

**Services spun up:**

| Service | Port |
|---------|------|
| Langfuse UI | 3002 |
| Weaviate | 8080 |
| Broker‑API | 4000 |
| Next.js UI | 3000 |
| Flowise | 3001 |

### 9.2 Fly.io (single line)

```bash
fly launch --dockerfile infra/Dockerfile --remote-only
```

### 9.3 Self‑host Flowise (optional)

Flowise can also run as a separate container (`flowise/flowise`) and exposes `/embedded/:id` for iframe use. [Flowise Docs](https://docs.flowiseai.com/getting-started?utm_source=chatgpt.com) | [Flowise GitHub](https://github.com/FlowiseAI/Flowise?utm_source=chatgpt.com)

## 10. CI/CD Pipeline

1. Lint + Type‑check (`pnpm turbo lint`).
2. Unit tests for broker & workflows.
3. Promptfoo matrix over last 20 critical prompts; fail if score < 0.8. [Promptfoo](https://www.promptfoo.dev/?utm_source=chatgpt.com)
4. OpenAI Evals (`oaieval check`) for new tasks.
5. Docker image build & push; Fly.io deploy.

## 11. Roadmap

| Phase | Goal |
|-------|------|
| M1 | MVP shipped: editor ➜ LiteLLM ➜ Langfuse traces. |
| M2 | Add Promptfoo, Rebuff, Guardrails; prompt library sync. |
| M3 | Multi‑tenant workspaces & RBAC (Flowise env vars). [Flowise Workspaces](https://docs.flowiseai.com/using-flowise/workspaces?utm_source=chatgpt.com) |
| M4 | Enterprise: SAML, usage billing dashboard, canary evaluation on model version bumps. |

## 12. Appendix — Key Docs & Inspiration

| Topic | Source |
|-------|--------|
| LiteLLM unified API & spend tracking | [docs.litellm.ai](https://docs.litellm.ai/docs/proxy/cost_tracking?utm_source=chatgpt.com) |
| Langfuse observability | [langfuse.com](https://langfuse.com/docs/tracing?utm_source=chatgpt.com) |
| LangChain LCEL | [langchain docs](https://python.langchain.com/docs/concepts/lcel/?utm_source=chatgpt.com) |
| Prompt templates | [PromptTemplate API](https://python.langchain.com/api_reference/core/prompts/langchain_core.prompts.prompt.PromptTemplate.html?utm_source=chatgpt.com) |
| Flowise visual builder | [flowiseai.com docs](https://docs.flowiseai.com/?utm_source=chatgpt.com) |
| Promptfoo evaluations | [promptfoo.dev](https://www.promptfoo.dev/?utm_source=chatgpt.com) |
| Ragas RAG metrics | [docs.ragas.io](https://docs.ragas.io/en/stable/?utm_source=chatgpt.com) |
| Rebuff injection defence | [GitHub protectai/rebuff](https://github.com/protectai/rebuff?utm_source=chatgpt.com) |
| Guardrails validation | [guardrailsai.com blog](https://www.guardrailsai.com/blog/guardrails-litellm-validate-llm-output?utm_source=chatgpt.com) |
| Weaviate vector DB | [weaviate.io](https://weaviate.io/?utm_source=chatgpt.com) |
| Qdrant vector DB | [qdrant.tech docs](https://qdrant.tech/documentation/?utm_source=chatgpt.com) |
| Awesome ChatGPT Prompts | [github.com/f/awesome-chatgpt-prompts](https://github.com/f/awesome-chatgpt-prompts?utm_source=chatgpt.com) |
| PromptHub | [deepset‑ai/prompthub](https://github.com/deepset-ai/prompthub?utm_source=chatgpt.com) |
| TruLens feedback functions | [trulens.org](https://www.trulens.org/?utm_source=chatgpt.com) |