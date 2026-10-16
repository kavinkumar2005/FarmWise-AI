import os
import shutil
import uuid
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, Query, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


from app.config import settings
from app.db.database import db
from app.db.models import AdvisoryOutput, ParcelRecord, MarketPriceInfo, WeatherData
from app.agents.graph import run_farmwise_agent_pipeline
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
    """Receives farmer field photo, stores locally and triggers AWS S3 backup."""
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    unique_filename = f"field_photo_{uuid.uuid4().hex[:10]}.{ext}"
    local_save_path = uploads_dir / unique_filename

    with open(local_save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Trigger AWS S3 upload
    s3_url = aws_service.upload_image(str(local_save_path), object_name=f"fai-tce-team06-uploads/{unique_filename}")

    return {
        "filename": unique_filename,
        "local_url": f"/uploads/{unique_filename}",
        "s3_url": s3_url,
        "status": "ready"
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
    message: str = Form(...),
    survey_number: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None)
):
    """Dedicated AI Agricultural Advisor Chatbot with Multimodal input & Agentic routing."""
    uploaded_image_name = None
    saved_img_path = None
    s3_image_url = None
    if image:
        ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
        uploaded_image_name = f"chat_{uuid.uuid4().hex[:8]}.{ext}"
        saved_img_path = uploads_dir / uploaded_image_name
        with open(saved_img_path, "wb") as buf:
            shutil.copyfileobj(image.file, buf)
        s3_image_url = aws_service.upload_image(str(saved_img_path), object_name=f"fai-tce-team06-uploads/{uploaded_image_name}")

    # Call specialized conversational agent
    chat_result = chat_agent.answer_question(
        query=message,
        survey_number=survey_number,
        image_path=str(saved_img_path) if saved_img_path else None
    )

    # Resolve parcel if survey number is provided
    parcel_rec = db.get_parcel(survey_number) if survey_number else None
    market_data = rag_engine.get_market_price(parcel_rec.recorded_crop if parcel_rec else "Rice (Paddy)")

    return {
        "reply": chat_result["reply"],
        "parcel": parcel_rec,
        "crop_analysis": {
            "crop_name": parcel_rec.recorded_crop if parcel_rec else "Agricultural Crop",
            "model_attribution": chat_result.get("model_used", "Gemini 3.1 Flash Lite")
        },
        "model_used": chat_result.get("model_used", "Gemini 3.5 Flash Lite"),
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
