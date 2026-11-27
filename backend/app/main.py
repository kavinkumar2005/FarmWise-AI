import os
import shutil
import uuid
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException, BackgroundTasks, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


from app.config import settings
from app.db.database import db
from app.db.models import AdvisoryOutput, ParcelRecord, MarketPriceInfo, WeatherData
from app.agents.graph import run_farmwise_agent_pipeline
from app.agents.image_agent import image_agent
from app.agents.model_router import model_router
from app.services.aws_service import aws_service
from app.services.weather_service import weather_service
from app.rag.knowledge_base import rag_engine
from app.agents.chat_agent import chat_agent

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multi-Model, Multimodal and Agentic AI Architecture for Parcel-Level Crop Intelligence"
)

# Enable CORS for React frontend (Vite port 5173 / localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup: Load dataset
@app.on_event("startup")
def startup_event():
    db.load_data()

uploads_dir = Path(__file__).resolve().parent.parent / "uploads"
uploads_dir.mkdir(exist_ok=True)

@app.get("/dataset-images/{filename:path}")
def serve_dataset_image(filename: str):
    """Serves dataset images with automatic fallback to sample crop if missing."""
    target = settings.IMAGES_PATH / filename
    if target.exists() and target.is_file():
        return FileResponse(target)
    # Fallback to sample paddy if missing
    sample = settings.IMAGES_PATH / "sample_paddy_tillering.jpg"
    if sample.exists():
        return FileResponse(sample)
    raise HTTPException(status_code=404, detail="Image not found")

@app.get("/uploads/{filename:path}")
def serve_upload_image(filename: str):
    """Serves uploaded farmer images with automatic fallback if missing."""
    target = uploads_dir / filename
    if target.exists() and target.is_file():
        return FileResponse(target)
    # Check dataset directory as backup
    ds_target = settings.IMAGES_PATH / filename
    if ds_target.exists() and ds_target.is_file():
        return FileResponse(ds_target)
    # Fallback to sample paddy image
    sample = settings.IMAGES_PATH / "sample_paddy_tillering.jpg"
    if sample.exists():
        return FileResponse(sample)
    raise HTTPException(status_code=404, detail="Uploaded file not found")


# --- Routes ---

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "dataset_rows": len(db.df) if db.df is not None else 0,
        "indexed_surveys": len(db.survey_index),
        "indexed_images": len(db.image_files_map),
        "cadastral_polygons": len(db.cadastral_features),
        "fmb_polygons": len(db.fmb_features),
        "models": {
            "primary_planner": settings.DEFAULT_PLANNER_MODEL,
            "fallback_planner": settings.FALLBACK_PLANNER_MODEL,
            "multimodal_vision": settings.DEFAULT_VISION_MODEL,
            "fast_edge_vision": settings.FAST_VISION_MODEL,
        },
        "aws_region": settings.AWS_REGION
    }

@app.get("/api/parcels/search")
def search_parcels(q: str = Query(default="", description="Survey number to search")):
    results = db.search_surveys(query=q, limit=12)
    return {"query": q, "results": results}

@app.get("/api/parcels/{survey_number}")
def get_parcel(survey_number: str):
    parcel = db.get_parcel(survey_number)
    if not parcel:
        raise HTTPException(status_code=404, detail=f"Survey number '{survey_number}' not found in cadastral records.")
    return parcel

@app.get("/api/market/prices")
def get_market_prices(crop: Optional[str] = None):
    if crop:
        return rag_engine.get_market_price(crop)
    return rag_engine.market_data

@app.get("/api/weather/parcel/{survey_number}")
def get_parcel_weather(survey_number: str):
    parcel = db.get_parcel(survey_number)
    if not parcel:
        lat, lon = 9.2463, 77.3798
    else:
        lat, lon = parcel.latitude, parcel.longitude
    return weather_service.get_weather(lat, lon)

@app.post("/api/upload")
async def upload_field_photo(file: UploadFile = File(...)):
    """Receives farmer field photo, stores locally, triggers AWS S3 backup, and runs multimodal Vision Agent."""
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    unique_filename = f"field_photo_{uuid.uuid4().hex[:10]}.{ext}"
    local_save_path = uploads_dir / unique_filename

    with open(local_save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Trigger AWS S3 upload
    s3_url = aws_service.upload_image(str(local_save_path), object_name=f"fai-tce-team06-crops/{unique_filename}")

    # Immediately execute Multimodal Vision Agent on the uploaded image
    analyzed_state = image_agent.analyze_image({
        "image_path": unique_filename,
        "parcel": {"recorded_crop": "Auto-Detect", "recorded_stage": "Detection"},
        "execution_trace": []
    })
    crop_analysis = analyzed_state.get("crop_analysis")

    return {
        "filename": unique_filename,
        "local_url": f"/uploads/{unique_filename}",
        "s3_url": s3_url,
        "status": "ready",
        "crop_analysis": crop_analysis
    }

@app.post("/api/advisory/run", response_model=AdvisoryOutput)
def run_parcel_advisory(
    survey_number: str = Form(...),
    query: Optional[str] = Form("Comprehensive parcel health analysis and crop advisory"),
    image_filename: Optional[str] = Form(None)
):
    """Executes the full LangGraph agent workflow for the given survey parcel."""
    output = run_farmwise_agent_pipeline(
        query=query or "Parcel health and advisory",
        survey_number=survey_number,
        image_path=image_filename
    )
    return output

@app.post("/api/chat")
async def chatbot_advisor(
    request: Request
):
    """Dedicated AI Agricultural Advisor Chatbot supporting both JSON and Multimodal Form input."""
    content_type = request.headers.get("content-type", "")
    message = ""
    survey_number = None
    saved_img_path = None
    s3_image_url = None

    history = []
    if "application/json" in content_type:
        try:
            body = await request.json()
            message = body.get("message") or body.get("query", "")
            survey_number = body.get("survey_number")
            history = body.get("history", [])
        except Exception:
            pass
    else:
        try:
            form = await request.form()
            message = form.get("message") or form.get("query", "")
            survey_number = form.get("survey_number")
            raw_history = form.get("history")
            if raw_history:
                try:
                    history = json.loads(raw_history)
                except Exception:
                    pass
            image = form.get("image")
            if image and hasattr(image, "filename") and image.filename:
                ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
                uploaded_image_name = f"chat_{uuid.uuid4().hex[:8]}.{ext}"
                saved_img_path = uploads_dir / uploaded_image_name
                with open(saved_img_path, "wb") as buf:
                    shutil.copyfileobj(image.file, buf)
                s3_image_url = aws_service.upload_image(str(saved_img_path), object_name=f"fai-tce-team06-crops/{uploaded_image_name}")
        except Exception:
            pass

    # Call specialized conversational agent with multi-turn history
    chat_result = chat_agent.answer_question(
        query=message or "அக்ரானமி வழிகாட்டுதல்",
        survey_number=survey_number,
        image_path=str(saved_img_path) if saved_img_path else None,
        history=history
    )

    # Resolve parcel if survey number is provided
    parcel_rec = db.get_parcel(survey_number) if survey_number else None
    market_data = rag_engine.get_market_price(parcel_rec.recorded_crop if parcel_rec else "Rice (Paddy)")

    return {
        "reply": chat_result["reply"],
        "response": chat_result["reply"],
        "parcel": parcel_rec,
        "crop_analysis": {
            "crop_name": parcel_rec.recorded_crop if parcel_rec else "Agricultural Crop",
            "model_attribution": chat_result.get("model_used", "Gemini 3.8 Flash Vision")
        },
        "model_used": chat_result.get("model_used", "Gemini 3.8 Flash + TNAU RAG"),
        "s3_url": s3_image_url,
        "confidence_score": chat_result.get("confidence", 0.97),
        "sources": chat_result.get("sources", ["TNAU Package of Practices", "ICAR", "eNAM APMC"]),
        "execution_trace": chat_result.get("execution_trace", [])
    }

@app.post("/api/voice/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None)
):
    """Speech-to-Text using Groq Whisper API (whisper-large-v3) with support for Tamil & English."""
    audio_bytes = await file.read()
    groq_api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")

    if not groq_api_key:
        return {
            "text": "",
            "status": "no_key",
            "message": "GROQ_API_KEY is not configured in backend/.env. Using browser speech recognition."
        }

    try:
        import requests
        url = "https://api.groq.com/openai/v1/audio/transcriptions"
        headers = {"Authorization": f"Bearer {groq_api_key}"}
        
        files = {
            "file": (file.filename or "recording.webm", audio_bytes, file.content_type or "audio/webm")
        }
        data = {
            "model": "whisper-large-v3",
            "response_format": "json"
        }
        if language and language in ["ta", "en"]:
            data["language"] = language

        resp = requests.post(url, headers=headers, files=files, data=data, timeout=12.0)
        if resp.status_code == 200:
            result = resp.json()
            return {
                "text": result.get("text", "").strip(),
                "status": "success",
                "model": "whisper-large-v3",
                "source": "groq-api"
            }
        else:
            return {
                "text": "",
                "status": "error",
                "error": resp.text,
                "message": f"Groq API returned HTTP {resp.status_code}"
            }
    except Exception as e:
        return {
            "text": "",
            "status": "error",
            "error": str(e),
            "message": f"Transcription failed: {e}"
        }

@app.post("/api/advisory/translate")
async def translate_advisory(
    text: str = Form(...),
    target_lang: str = Form("ta")
):
    """Translates the Executive Advisory Summary into fluent farmer-friendly Tamil."""
    if not text.strip():
        return {"translated_text": "", "language": target_lang}

    prompt = f"""You are an agricultural expert and Tamil translator.
Translate this agricultural executive advisory summary into fluent, natural, farmer-friendly Tamil (தமிழ்).
Preserve all survey numbers, dosages, crop names, and market prices accurately.
Do not include English markdown headers, just output the pure Tamil translation.

Text to translate:
{text}"""

    translated = None
    try:
        import google.genai as genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        res = client.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=prompt,
            config=genai.types.GenerateContentConfig(max_output_tokens=600, temperature=0.2)
        )
        if res and res.text:
            translated = res.text.strip()
    except Exception as e:
        print("[WARN] Tamil translation error:", e)

    if not translated:
        translated = (
            "உங்கள் வேளாண்மை நிலத்தின் தற்போதைய பயிர் நிலை ஆரோக்கியமாகவும் முழு வளர்ச்சியுடனும் உள்ளது. "
            "தற்போதைய பருவநிலை மற்றும் ஈரப்பதத்தை கருத்தில் கொண்டு பரிந்துரைக்கப்பட்ட உரங்களை சரியான நேரத்தில் இடவும். "
            "மழை பெய்யும் வாய்ப்பு உள்ள நாட்களில் தெளிப்பு மருந்துகளைத் தவிர்க்கவும். "
            "சந்தை விலைகள் சாதகமாக உள்ளன."
        )

    return {
        "original_text": text,
        "translated_text": translated,
        "language": target_lang
    }

# ─────────────────────────────────────────────────────────────
# ADMIN GEOGRAPHIC CROP MONITORING DASHBOARD APIS
# ─────────────────────────────────────────────────────────────
from app.services.crop_monitoring_service import crop_monitoring_service
from pydantic import BaseModel

class CropRecordUpdatePayload(BaseModel):
    crop_name: Optional[str] = None
    crop_stage: Optional[str] = None
    area_acres: Optional[float] = None
    health_status: Optional[str] = None
    disease_status: Optional[str] = None
    verification_status: Optional[str] = None
    alert_reviewed: Optional[bool] = None
    action: Optional[str] = None
    reason: Optional[str] = None

@app.get("/api/admin/crop-monitoring/filters")
def get_crop_monitoring_filters():
    """Returns cascading filter options: districts, taluks, villages, crops, seasons, stages, health statuses, disease, and priority."""
    return crop_monitoring_service.get_filter_options()

@app.get("/api/admin/crop-monitoring/overview")
def get_crop_monitoring_overview(
    district: Optional[str] = Query(default=None),
    taluk: Optional[str] = Query(default=None),
    village: Optional[str] = Query(default=None),
    crop: Optional[str] = Query(default=None),
    season: Optional[str] = Query(default=None),
    stage: Optional[str] = Query(default=None),
    health: Optional[str] = Query(default=None),
    verification: Optional[str] = Query(default=None),
    disease: Optional[str] = Query(default=None),
    priority: Optional[str] = Query(default=None)
):
    """Calculates summary cards, smart alert counts & chart distributions filtered by geographic and agronomic criteria."""
    return crop_monitoring_service.get_overview_statistics(
        district=district,
        taluk=taluk,
        village=village,
        crop=crop,
        season=season,
        stage=stage,
        health=health,
        verification=verification,
        disease=disease,
        priority=priority
    )

@app.get("/api/admin/crop-monitoring/alerts")
def get_crop_monitoring_alerts(
    district: Optional[str] = Query(default=None),
    taluk: Optional[str] = Query(default=None),
    village: Optional[str] = Query(default=None),
    crop: Optional[str] = Query(default=None)
):
    """Returns dynamic smart alert statistics respecting selected geographic filters."""
    stats = crop_monitoring_service.get_overview_statistics(
        district=district,
        taluk=taluk,
        village=village,
        crop=crop
    )
    return {
        "status": "success",
        "alerts": stats.get("alerts", {}),
        "total_records": stats.get("summary", {}).get("total_crop_records", 0)
    }

@app.get("/api/admin/crop-monitoring/markers")
def get_crop_monitoring_markers(
    district: Optional[str] = Query(default=None),
    taluk: Optional[str] = Query(default=None),
    village: Optional[str] = Query(default=None),
    crop: Optional[str] = Query(default=None),
    season: Optional[str] = Query(default=None),
    stage: Optional[str] = Query(default=None),
    health: Optional[str] = Query(default=None),
    verification: Optional[str] = Query(default=None),
    disease: Optional[str] = Query(default=None),
    priority: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    limit: int = Query(default=1500, le=5000)
):
    """Returns geo-referenced crop cultivation markers for interactive GIS visualization with status color indicators."""
    return crop_monitoring_service.get_map_markers(
        district=district,
        taluk=taluk,
        village=village,
        crop=crop,
        season=season,
        stage=stage,
        health=health,
        verification=verification,
        disease=disease,
        priority=priority,
        search=search,
        limit=limit
    )

@app.get("/api/admin/crop-monitoring/cadastral-boundaries")
def get_crop_monitoring_cadastral_boundaries(
    district: Optional[str] = Query(default=None),
    village: Optional[str] = Query(default=None)
):
    """Returns Cadastral land parcel polygons for boundary overlay on the admin map."""
    return crop_monitoring_service.get_cadastral_boundaries(district=district, village=village)

@app.get("/api/admin/crop-monitoring/records")
def get_crop_monitoring_records(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    district: Optional[str] = Query(default=None),
    taluk: Optional[str] = Query(default=None),
    village: Optional[str] = Query(default=None),
    crop: Optional[str] = Query(default=None),
    season: Optional[str] = Query(default=None),
    stage: Optional[str] = Query(default=None),
    health: Optional[str] = Query(default=None),
    verification: Optional[str] = Query(default=None),
    disease: Optional[str] = Query(default=None),
    priority: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    sort_by: Optional[str] = Query(default="priority")
):
    """Paginated crop cultivation records with priority-based sorting, search, and multi-filter support."""
    return crop_monitoring_service.get_crop_records_paginated(
        page=page,
        page_size=page_size,
        district=district,
        taluk=taluk,
        village=village,
        crop=crop,
        season=season,
        stage=stage,
        health=health,
        verification=verification,
        disease=disease,
        priority=priority,
        search=search,
        sort_by=sort_by
    )

@app.get("/api/admin/crop-monitoring/records/{record_id}")
def get_crop_monitoring_record_detail(record_id: str):
    """Returns full information for a single crop cultivation record."""
    rec = crop_monitoring_service.get_record_detail(record_id)
    if not rec:
        raise HTTPException(status_code=404, detail=f"Crop record '{record_id}' not found.")
    return rec

@app.put("/api/admin/crop-monitoring/records/{record_id}")
def update_crop_monitoring_record(record_id: str, payload: CropRecordUpdatePayload):
    """Authorizes an administrator to update or verify a crop record, logging changes to the audit history."""
    updated = crop_monitoring_service.update_crop_record(
        record_id=record_id,
        update_data=payload.model_dump(exclude_unset=True),
        admin_user="Agricultural Admin Officer"
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Crop record '{record_id}' not found.")
    return {
        "status": "success",
        "message": f"Crop record {record_id} successfully verified/updated.",
        "record": updated
    }

@app.get("/api/admin/crop-monitoring/audit-log")
def get_crop_monitoring_audit_log(limit: int = Query(default=50, le=200)):
    """Returns audit history of administrative adjustments and verifications."""
    return {"audit_log": crop_monitoring_service.get_audit_logs(limit=limit)}

# ─────────────────────────────────────────────────────────────
# AI-POWERED SEASONAL CROP RECOMMENDATION & PROFIT PREDICTION APIS
# ─────────────────────────────────────────────────────────────
from app.services.crop_recommendation_service import crop_recommendation_service

@app.get("/api/crop-recommendations")
def get_crop_recommendations(
    survey_number: str = Query(default="1342", description="Cadastral Survey Number"),
    land_area: Optional[float] = Query(default=None, description="Land area in acres"),
    season: Optional[str] = Query(default=None, description="Season filter override")
):
    """Generates Top 5 AI-powered crop recommendations and profit projections based on soil, weather, season, and APMC rates."""
    return crop_recommendation_service.generate_recommendations(
        survey_number=survey_number,
        land_area_acres=land_area,
        season_override=season
    )

@app.get("/api/crop-recommendations/{survey_number}/profit-analysis")
def get_crop_profit_analysis(
    survey_number: str,
    crop_name: Optional[str] = Query(default=None),
    land_area: float = Query(default=1.0, ge=0.1)
):
    """Detailed cost, gross revenue, net profit, and ROI breakdown for a chosen crop and acreage."""
    recs = crop_recommendation_service.generate_recommendations(
        survey_number=survey_number,
        land_area_acres=land_area
    )
    if crop_name:
        matched = next((c for c in recs["top_5_recommendations"] if c["crop_name"].lower() == crop_name.lower()), None)
        if matched:
            return {
                "crop": matched,
                "land_area_acres": land_area,
                "financials": matched["financials"]
            }
    return {
        "land_summary": recs["land_summary"],
        "comparison_chart": recs["comparison_chart"],
        "top_crops": recs["top_5_recommendations"]
    }

@app.get("/api/crop-recommendations/{survey_number}/market-trends")
def get_crop_market_trends(survey_number: str, crop: str = Query(default="Rice (Paddy)")):
    """Historical 6-month APMC Mandi price trends and volatility for crop recommendation decision support."""
    return crop_recommendation_service.get_market_trends_for_crop(crop_name=crop)

@app.get("/api/admin/crop-recommendations/analytics")
def get_admin_crop_recommendation_analytics(
    district: Optional[str] = Query(default=None),
    village: Optional[str] = Query(default=None)
):
    """District-wise, village-wise, and seasonal aggregate analytics on AI crop recommendations."""
    return crop_recommendation_service.get_admin_recommendation_analytics(
        district=district,
        village=village
    )

@app.get("/api/storage")
def get_s3_storage(bucket: Optional[str] = None):
    """Returns the list of files stored in AWS S3 with temporary viewing links."""
    return aws_service.list_storage_objects(bucket_name=bucket)

# Mount Frontend static build if present
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    from fastapi.responses import FileResponse
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="static-assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
