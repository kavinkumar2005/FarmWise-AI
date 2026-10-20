from typing import TypedDict, List, Dict, Any, Optional
from app.db.models import ParcelRecord, WeatherData, CropAnalysisResult, VerificationResult, ExecutionStep, MarketPriceInfo

class AgentState(TypedDict, total=False):
    # Inputs
    query: str
    survey_number: Optional[str]
    image_path: Optional[str]
    user_location: Optional[Dict[str, float]]
    crop_input: Optional[str]

    # Execution Plan
    plan: List[str]
    current_step_index: int

    # Agent intermediate outputs
    parcel: Optional[Dict[str, Any]]
    crop_analysis: Optional[Dict[str, Any]]
    weather: Optional[Dict[str, Any]]
    rag_docs: List[Dict[str, Any]]
    market_prices: Optional[Dict[str, Any]]
    fertilizer_schedule: List[Dict[str, Any]]
    verification: Optional[Dict[str, Any]]
    final_advisory: str

    # Observability & Trace
    execution_trace: List[Dict[str, Any]]
    model_router_decisions: List[Dict[str, Any]]
    errors: List[str]
