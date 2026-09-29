# FarmwiseAI Foundation Architecture (Phase 1)

## Overview
Phase 1 implements the foundational architecture for the FarmwiseAI Agentic Agriculture Intelligence Platform in compliance with the FarmwiseAI Campus Product Challenge (Task 1).

## Monorepo Layout
\\\
.
├── config/                     # System configs (team, models, thresholds, costs)
│   ├── team.json               # Team ID (XX), ap-south-1, FAI-TCE-LambdaExecutionRole
│   ├── models.config.json      # 7 models (Bedrock Ministral 8B/3B, Titan, Gemini, Claude)
│   ├── thresholds.json         # Routing & confidence thresholds, circuit breakers
│   └── costs.config.json       # Cost per 1k tokens / image for routed vs benchmark
├── packages/
│   └── agent-core/             # Zod schemas, repository interfaces, sample data adapters
│       ├── src/schemas/        # Request, Plan, StepResult, Verification, FinalResult, Health
│       └── src/adapters/       # In-memory & dataset-grounded repositories
├── services/
│   ├── api-gateway-handler/    # AWS Lambda HTTP API handler (/health, CORS, routing)
│   ├── orchestrator/           # Orchestrator service skeleton
│   ├── chatbot/                # RAG Chatbot service skeleton
│   └── report-generator/       # Report Generator service skeleton
├── apps/
│   └── web/                    # React 18 + Vite + TypeScript + Tailwind CSS UI shell
├── infra/
│   └── scripts/                # deploy.sh, deploy.ps1, dev-server.ts
├── eval/                       # Sample cases and evaluation inputs
└── docs/                       # Architectural specifications
\\\

## AWS Event Account Compliance
- **Region**: Strictly enforced as \p-south-1\ (Mumbai).
- **Execution Role**: Uses pre-existing \FAI-TCE-LambdaExecutionRole\.
- **Resource Naming**: Enforced \ai-tce-teamXX-*\ prefix for all S3 buckets, DynamoDB tables, and Lambda functions.
- **Budget Monitoring**: Per-step token accounting and cost tracking against the \ limit.
