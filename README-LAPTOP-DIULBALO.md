# FarmwiseAI Agentic Agriculture Intelligence Platform
> **Campus Product Challenge – Task 1: Multi-Model, Multimodal and Agentic AI System**  
> *Developed for FarmWise AI Hackathon | Team: FAI-TCE-Team06*

FarmwiseAI is a production-quality, parcel-level agricultural intelligence platform engineered for Indian farmers and district agricultural officers. It bridges ground-truth land records, cadastral GIS boundaries, field photography, live micro-climate telemetry, and scientific agronomic practices using a multi-agent LangGraph orchestration pipeline with intelligent model routing.

---

## 🏛️ High-Level System Architecture

```
+----------------------------------------------------------------------------------------------------+
|                                    USER INTERACTION LAYER                                          |
|  - Exact Survey Number Filter (14,643+ ground points)     - Multimodal Field Photo Upload         |
|  - Interactive Leaflet Cadastral / FMB Map               - AI Agricultural Advisor Chatbot        |
|  - Trilingual UI: English / தமிழ் / हिंदी                 - APMC Mandi Commodity Rates             |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+--------------------------------------------------+
|                                    PLANNER AGENT                                                   |
|  Decomposes query into 8 discrete subtasks with fallback triggers                                   |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+--------------------------------------------------+
|                                    MODEL ROUTER                                                    |
|  Dynamic selection based on: Task Type, Modality, Latency, Cost, Confidence & API Health          |
|                                                                                                    |
|  [Planning & Reasoning]    --> Anthropic Claude 3.5 Sonnet (Fallback: Gemini 3.8 Flash)            |
|  [Multimodal Deep Vision]  --> Google Gemini 3.8 Flash (Fallback: Gemini 2.0 / 1.5 Flash)           |
|  [Edge Crop Screening]     --> Open-weight / EdgeNet Backbone (Low latency, zero-cost)             |
|  [Agro-Met Telemetry]      --> Open-Meteo ECMWF High-Resolution Live API (No key needed)          |
|  [Knowledge & Pricing]     --> TNAU / ICAR RAG Knowledge Base + APMC Mandi Index                   |
|  [Critic / Verification]   --> Gemini 3.8 Flash + Agronomic Guardrails                            |
|  [Cloud Storage]           --> AWS S3 (ap-south-1 Mumbai: fai-tce-team06-crop-intel)              |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+--------------------------------------------------+
|                                 SPECIALIZED AGENTS (LANGGRAPH)                                    |
|                                                                                                    |
|  1. Geography Agent       : Resolves Survey No., Centroid Lat/Lon, Cadastral Polygon & FMB Layer    |
|  2. Image Analysis Agent  : 2-stage vision (Fast Edge Screening -> Gemini 3.8 Foliar Inspection)   |
|  3. Weather Agent         : Fetches 7-day forecast, computes spray window and irrigation urgency   |
|  4. Agronomic RAG Agent   : Retrieves TNAU/ICAR nutrient dosage (NPK) & pest management            |
|  5. Verification Agent    : 5-parameter consistency audit (Parcel, Crop, Stage, Weather, Sources)  |
|  6. Synthesis Agent       : Compiles executive farmer advisory with latency & cost audit trace     |
+-------------------------------------------------+--------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+--------------------------------------------------+
|                              FINAL TRACEABLE OUTPUT                                                |
|  - Verified Cadastral Parcel Map                          - Crop Phenotype & Growth Stage Badge    |
|  - Live Micro-Climate & Spray Alert                       - Stage-by-Stage Fertilizer Schedule     |
|  - eNAM Mandi Market Benchmark                            - Full AI Decision Trace Dossier         |
+----------------------------------------------------------------------------------------------------+
```

---

## 🚀 Working Process (Step 1 to Step 7)

1. **Step 1 – User Input**: Farmer provides Survey Number (e.g. `1342`, `1346`, `529`, `584`, `384`), optional field photograph, or queries the AI Advisor.
2. **Step 2 – Planner Agent**: Creates an execution DAG (Resolve Survey → Spatial Centroid → Edge Vision → Multimodal Audit → Weather → RAG Retrieval → Verifier Audit → Response Synthesis).
3. **Step 3 – Model Router**: Selects the optimal model for each step, evaluating latency, token cost, modality, and reliability.
4. **Step 4 – Specialized Agents**: Geography, Land Record, Image Analysis, Weather, and Agricultural Knowledge agents execute concurrently or sequentially.
5. **Step 5 – Result Integration**: Intermediate tensors and structured dictionaries merge into the shared `AgentState`.
6. **Step 6 – Verification (Critic Agent)**: Validates parcel-to-survey integrity, image-to-coordinate correlation, crop-to-season ecological match, and spray safety against upcoming rain/wind.
7. **Step 7 – Final Output**: Returns a verified parcel dossier with confidence scores, source citations, and expandable AI decision trace.

---

## 📂 Project Structure

```
FarmWise AI/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── graph.py               # LangGraph StateGraph orchestration
│   │   │   ├── state.py               # AgentState TypedDict schema
│   │   │   ├── planner.py             # Planner Agent
│   │   │   ├── model_router.py        # Model Router (Claude, Gemini, Edge)
│   │   │   ├── geo_agent.py           # Geography & Cadastral Agent
│   │   │   ├── image_agent.py         # 2-Stage Multimodal Vision Agent
│   │   │   ├── weather_agent.py       # Micro-Climate Agro-Met Agent
│   │   │   ├── knowledge_agent.py     # RAG Agronomic Guidance Agent
│   │   │   └── verifier_agent.py      # Independent Critic & Verification Agent
│   │   ├── db/
│   │   │   ├── database.py            # In-memory indexer for 14,643 CSV rows & GeoJSON
│   │   │   └── models.py              # Pydantic schema models
│   │   ├── rag/
│   │   │   └── knowledge_base.py      # TNAU/ICAR agronomic guides & Mandi prices
│   │   ├── services/
│   │   │   ├── aws_service.py         # AWS S3 & Bedrock integration (ap-south-1)
│   │   │   └── weather_service.py     # Open-Meteo live weather client
│   │   ├── config.py                  # Environment settings & credentials
│   │   └── main.py                    # FastAPI application routes
│   ├── uploads/                       # Farmer-uploaded field images
│   ├── requirements.txt               # Backend Python dependencies
│   ├── .env                           # Active environment variables
│   └── .env.example                   # Environment template
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx             # Branding, model status, language switch
│   │   │   ├── HeroSearch.jsx         # Exact Survey Number filter & autocomplete
│   │   │   ├── QuickActionCards.jsx   # 4 core agricultural service cards
│   │   │   ├── ParcelDashboard.jsx    # Central dashboard view
│   │   │   ├── ParcelMap.jsx          # Interactive Leaflet cadastral polygon map
│   │   │   ├── CropAnalysisCard.jsx   # Multimodal crop phenotype & health card
│   │   │   ├── WeatherCard.jsx        # Micro-climate, 7-day forecast & spray alert
│   │   │   ├── AdvisoryCard.jsx       # TNAU fertilizer schedule & pest advice
│   │   │   ├── DecisionTraceModal.jsx # Full 8-step AI execution trace
│   │   │   ├── ChatbotDrawer.jsx      # Multimodal AI Agricultural Advisor
│   │   │   ├── ImageUploadModal.jsx   # Field photo uploader with S3 backup
│   │   │   └── MarketPricesModal.jsx  # Tamil Nadu APMC Mandi rates table
│   │   ├── services/
│   │   │   └── api.js                 # Axios API client
│   │   ├── utils/
│   │   │   └── translations.js        # English / தமிழ் / हिंदी translations
│   │   ├── App.jsx                    # Root React component
│   │   └── index.css                  # Tailwind CSS configuration
│   ├── package.json
│   └── vite.config.js
│
├── Datasets/
│   ├── Ground_truth_Points.csv        # 14,643 ground-truth field records
│   ├── Park_Cadastral_Map.geojson     # Cadastral parcel polygons
│   ├── Park_fmb_Map.geojson           # FMB field measurement book layers
│   └── images/images/                 # 3,426 ground-truth crop photographs
│
├── start_all.bat                      # 1-Click launcher for both servers
├── start_backend.bat                  # Starts FastAPI backend (port 8000)
├── start_frontend.bat                 # Starts Vite React frontend (port 5173)
└── README.md
```

---

## ⚡ Quick Start Instructions

### Prerequisites
- Python 3.10+ (tested with Python 3.13)
- Node.js 18+ and npm

### Option 1: 1-Click Launch (Windows)
Double-click `start_all.bat` or run:
```powershell
.\start_all.bat
```

### Option 2: Run Backend and Frontend Separately

**1. Start FastAPI Backend:**
```powershell
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend Swagger Docs:* `http://localhost:8000/docs`  
*Full Application (Pre-built SPA):* `http://localhost:8000`

**2. Start React Frontend (Development Mode):**
```powershell
cd frontend
npm run dev
```
*Frontend Dev Server:* `http://localhost:5173`

---

## 🔑 AI & Cloud Configuration

Create or modify `backend/.env`:
```ini
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# AWS ap-south-1 (Mumbai)
AWS_ACCESS_KEY_ID=ASIAROVZ...
AWS_SECRET_ACCESS_KEY=...
AWS_SESSION_TOKEN=IQoJb3JpZ2lu...
AWS_REGION=ap-south-1
S3_BUCKET_NAME=fai-tce-team06-crop-intel
```

---

## 🎯 Sample Survey Numbers to Test
Try searching any of the following exact survey numbers from the ground-truth dataset:
- `1342` - Coconut stand in Sivagiri (Full growth stage with linked ground-truth photo)
- `1346` - Coconut stand in Sivagiri (Vegetation stage with linked ground-truth photo)
- `1482` - Coconut stand in Sivagiri (Full growth)
- `529`  - Coconut stand in Sivagiri (Vegetation stage)
- `584`  - Rice (Paddy) in Sivagiri (Active vegetation)
- `384`  - Cadastral Parcel in Keelathattaparai, Thoothukudi
- `176`  - Cadastral Parcel in Thoothukudi
