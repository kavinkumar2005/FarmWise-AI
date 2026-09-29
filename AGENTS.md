# MASTER PROMPT: FarmwiseAI Agentic Agriculture Intelligence Platform

> How to use in Antigravity: save this as AGENTS.md (or a workspace rule under .agent/rules/) so every agent sees it. Then start the Agent Manager and say: "Execute PHASE 1 only. Produce an Implementation Plan artifact first." Approve each plan, then continue phase by phase. Do not ask for the whole build in one go.

---

## 0. ROLE AND MISSION

You are a senior full-stack + AI-systems engineer team. Build **"FarmwiseAI Agentic Agriculture Intelligence Platform"**: a website where a farmer submits a field photograph, survey number, location, and optional land document / crop-soil data (by typing or by **speaking in Tamil or English**), and an **agentic multi-model AI system** plans the request, routes each step to the right model or tool, verifies the results, and returns a **verified parcel-level advisory**, a **classified land-record map**, a **government-format report**, and a **hallucination-safe chatbot**.

This is for the FarmwiseAI Campus Product Challenge, **Task 1: Multi-Model, Multimodal and Agentic AI System**. The judges evaluate: planning, multimodal input, multi-agent orchestration, proprietary vs open-weight routing, tool calling, shared state, verification, confidence, fallback, latency and cost. The architecture must be **generic and reusable**, and must NOT hard-code answers to any example query.

Target users: farmers (simple, large-touch, Tamil-first friendly) and officers (detail, evidence, reports).

---

## 1. HARD CONSTRAINTS (never violate)

**AWS (event account rules)**
- Region: **ap-south-1 (Mumbai) only.** Never create anything elsewhere. No cross-region Bedrock inference profiles.
- Allowed services only: **S3, Lambda, API Gateway, DynamoDB, CloudWatch Logs, Bedrock (invoke only)**.
- Allowed Bedrock models ONLY: **Ministral 3B Instruct, Ministral 8B Instruct, Amazon Titan Text Embeddings V2, Amazon Titan Multimodal Embeddings.**
- DO NOT use: EC2, RDS, OpenSearch, Cognito, Transcribe, Polly, Textract, Rekognition, Location Service, Secrets Manager, CloudFront, Amplify, or anything else not listed above. Do not create IAM users/roles, do not touch Organizations/account settings, do not make S3 buckets public.
- Lambda execution role: use existing **FAI-TCE-LambdaExecutionRole**. Never create a role.
- Naming: every resource ai-tce-teamXX-<name> (S3 buckets, Lambdas, DynamoDB tables are enforced). Read XX from config/team.json.
- Budget is USD 100 per team, not a hard cap. Prefer cheap models first, cache results, avoid idle resources, log estimated cost per run.
- On AccessDenied: check region, role, name prefix, service list. Never try to bypass it. Report it to me instead.

**Data and compliance**
- Use only permitted, authorized data and APIs. Never expose or commit credentials. API keys live in Lambda environment variables (set via CLI from a git-ignored .env.deploy), never in frontend code or git.
- FarmwiseAI-provided datasets are restricted: never publish them. The UI must clearly label each data item's origin: FarmwiseAI-provided / Public source / User-uploaded / AI-generated / Sample data.
- Farmer and owner details are personal data: mask partly by default (e.g., "R. K****"), show full only in an officer view, add a consent checkbox on upload.
- Real FarmwiseAI data arrives only after shortlisting. Build **data adapters** (ParcelRepository, LandRecordRepository, FieldImageRepository, AdvisoryCorpus) with a sample implementation now (clearly labelled synthetic data, several villages/parcels/crops) and a armwise implementation to plug in later. Sample data is only for development. The pipeline logic must be fully data-driven.

**Model requirements (Task 1 rules)**
- At least **3 models with distinct, justified roles**: 2 proprietary + 1 open-weight/smaller. Never send the same prompt to several models just to look multi-model.
- Model registry (config-driven, models.config.json):
  - ministral-8b / ministral-3b (Bedrock, open-weight): cheap steps such as plan drafting, structured extraction, translation-light tasks, routine chatbot turns, query rewriting.
  - 	itan-text-embed-v2: RAG embeddings. 	itan-multimodal-embed: image embeddings for cheap first-pass crop/stage matching (kNN vs verified reference images).
  - gemini-flash (proprietary, Google API): first-line multimodal image analysis, Tamil audio transcription fallback.
  - gemini-pro and/or claude-sonnet (proprietary): escalation. **Claude acts as Verifier/Critic and complex planner**; Gemini Pro handles hard vision cases.
  - Use whatever current model IDs are available in the keys provided; keep IDs in config, never hard-coded in logic.

---

## 2. TECH STACK

- **Frontend:** React + Vite + TypeScript, Tailwind CSS, shadcn/ui, framer-motion, Recharts, react-leaflet (Leaflet + OpenStreetMap tiles), react-i18next (en, 	a), Zustand for state. Deploy target: Vercel/Netlify or local (S3 must remain private).
- **Backend:** Node.js 20 + TypeScript on Lambda, AWS SDK v3, esbuild bundling, Zod for schemas. Deploy with **AWS CLI scripts** (scripts/deploy.sh), NOT SAM/CDK (they try to create roles).
- **Geo:** turf.js in Lambda (point-in-polygon, area, buffer, intersect, distance). GeoJSON in S3, index in DynamoDB.
- **Weather:** Open-Meteo API (no key): current, 7-day forecast, recent rainfall history.
- **Voice:** Web Speech API (	a-IN, en-IN) primary; MediaRecorder + Gemini audio transcription fallback.
- **Report:** HTML + print CSS with embedded Noto Sans Tamil, exported to PDF (browser print / html2pdf), plus a server-side fallback endpoint.
- **Orchestration:** Custom lightweight agent framework in TypeScript (/packages/agent-core): Planner, Router, Agent base class, Tool registry, Shared State, Verifier, Trace recorder. No heavy frameworks required.

---

## 3. ARCHITECTURE

`
Browser (React) ──HTTPS──► API Gateway ──► Lambda: api-gateway-handler
   │  voice/text/photo/doc                         │
   │                                   ┌───────────┴────────────┐
   │                                   ▼                        ▼
   │                       Lambda: orchestrator          Lambda: chatbot (RAG)
   │   SSE live trace ◄── (Function URL, streaming)      Lambda: report-generator
   │                                   │
   │            ┌───────────┬──────────┼───────────┬───────────┬────────────┐
   │            ▼           ▼          ▼           ▼           ▼            ▼
   │        Geography   LandRecord   Image     Weather    AgriKnowledge  Verifier
   │          Agent       Agent      Agent      Agent        Agent         Agent
   │            └───────────┴──────────┴───────────┴───────────┴────────────┘
   │                                   │  Model Router (Bedrock + Gemini + Claude)
   ▼                                   ▼
 S3 (private: images, docs, geojson, reports, advisory)   DynamoDB (runs, trace, parcels, chunks, chats)
`

---

## 4. EXECUTION PHASES

- **PHASE 1: Foundation.** Monorepo, configs, Zod schemas, data adapters & dataset indexing, AWS deployment scripts, GET /health.
- **PHASE 2: Agent core.** Planner, Router, Shared State, Trace recorder, Tool registry, model clients.
- **PHASE 3: Specialized agents + geo.** Geography, Land Record, Weather, Image, Knowledge, Verifier.
- **PHASE 4: Frontend shell + wizard + live run view + results dashboard.**
- **PHASE 5: Voice (ta/en) + integrated classified map.**
- **PHASE 6: Report generator (government format, bilingual, QR).**
- **PHASE 7: Chatbot with RAG, verifier and evaluation harness.**
- **PHASE 8: Fallback demos, cost comparison, admin page, E2E tests, README.**
