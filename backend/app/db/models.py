from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class SoilProfile(BaseModel):
    soil_type: str = "Red Loam (செம்மண்)"
    soil_texture: str = "Fine Loamy"
    ph: float = 7.2
    ph_status: str = "Optimal (6.5 - 7.5)"
    organic_carbon_percent: float = 0.58
    organic_carbon_status: str = "Medium"
    nitrogen_kg_ha: float = 195.0
    nitrogen_status: str = "Low"
    phosphorus_kg_ha: float = 16.4
    phosphorus_status: str = "Medium"
    potassium_kg_ha: float = 285.0
    potassium_status: str = "High"
    electrical_conductivity_ds_m: float = 0.32
    soil_quality_rating: str = "Good Fertility Index (B+)"
    fertilizer_efficiency_score: int = 78
    soil_health_card_id: str = "TN-TNK-2024-SHC-1342"
    amendments_needed: List[str] = []
    fertilizer_adjustments: List[str] = []

class ParcelRecord(BaseModel):
    survey_number: str
    sub_division: Optional[str] = "1"
    village_code: Optional[int] = None
    village_name: Optional[str] = "Sivagiri / Keelathattaparai"
    taluk: Optional[str] = "Sivagiri / Thoothukudi"
    district: Optional[str] = "Tenkasi / Thoothukudi"
    latitude: float
    longitude: float
    recorded_crop: Optional[str] = None
    recorded_stage: Optional[str] = None
    image_path: Optional[str] = None
    image_url: Optional[str] = None
    timestamp: Optional[str] = None
    boundary_geojson: Optional[Dict[str, Any]] = None
    soil_profile: Optional[SoilProfile] = None

class ExecutionStep(BaseModel):
    step_id: int
    name: str
    agent_name: str
    model_name: str
    task_type: str
    input_summary: str
    output_summary: str
    confidence: float = Field(default=0.9, ge=0.0, le=1.0)
    latency_ms: int = 120
    cost_usd: float = 0.0001
    status: str = "completed"
    details: Optional[Dict[str, Any]] = None

class VerificationCheck(BaseModel):
    check_name: str
    passed: bool
    confidence: float
    observation: str

class VerificationResult(BaseModel):
    status: str  # "VERIFIED", "VERIFIED_WITH_CAUTION", "NEEDS_REVIEW"
    overall_confidence: float
    score_percentage: int
    checks: List[VerificationCheck]
    critique_notes: str

class MarketPriceInfo(BaseModel):
    crop: str
    variety: str
    market: str
    modal_price: str
    min_price: str
    max_price: str
    trend: str  # "Upward", "Stable", "Declining"

class WeatherForecastDay(BaseModel):
    date: str
    max_temp: float
    min_temp: float
    rain_prob: int
    rain_mm: float
    condition: str

class WeatherData(BaseModel):
    temperature: float
    feels_like: float
    humidity: int
    wind_speed: float
    weather_condition: str
    precipitation_mm: float
    spray_recommendation: str
    irrigation_urgency: str
    forecast_7d: List[WeatherForecastDay] = []

class FertilizerScheduleItem(BaseModel):
    stage: str
    fertilizer: str
    dosage_per_acre: str
    timing: str
    notes: str

class CropAnalysisResult(BaseModel):
    crop_name: str
    growth_stage: str
    crop_health: str
    confidence: float
    visual_features: List[str]
    identified_issues: List[str]
    model_attribution: str

class AdvisoryOutput(BaseModel):
    query_id: str
    timestamp: str
    parcel: Optional[ParcelRecord] = None
    crop_analysis: Optional[CropAnalysisResult] = None
    weather: Optional[WeatherData] = None
    soil_profile: Optional[SoilProfile] = None
    fertilizer_schedule: List[FertilizerScheduleItem] = []
    pest_disease_advice: List[str] = []
    irrigation_advice: str = ""
    market_prices: Optional[MarketPriceInfo] = None
    verification: Optional[VerificationResult] = None
    summary_advisory: str
    execution_trace: List[ExecutionStep] = []
    total_latency_ms: int = 0
    total_cost_usd: float = 0.0
