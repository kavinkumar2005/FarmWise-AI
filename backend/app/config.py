import os
from pathlib import Path
from dotenv import load_dotenv

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATASET_DIR = BASE_DIR / "Datasets"
ENV_PATH = BASE_DIR / "backend" / ".env"

if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    load_dotenv()

class Settings:
    PROJECT_NAME: str = "FarmwiseAI Agentic Agricultural Intelligence Platform"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("textGEMINI_API_KEY", ""))
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    # AWS Configuration
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_SESSION_TOKEN: str = os.getenv("AWS_SESSION_TOKEN", "")
    AWS_REGION: str = os.getenv("AWS_REGION", "ap-south-1")
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "fai-tce-team06-crop-intel")


    # Model Settings
    DEFAULT_PLANNER_MODEL: str = "claude-3-5-sonnet-20241022"
    FALLBACK_PLANNER_MODEL: str = "gemini-3.8-flash"
    DEFAULT_VISION_MODEL: str = "gemini-3.8-flash"
    FAST_VISION_MODEL: str = "open-weight-crop-classifier"
    VERIFIER_MODEL: str = "gemini-3.8-flash"

    # Dataset Paths
    DATASET_PATH: Path = DATASET_DIR
    CSV_PATH: Path = DATASET_DIR / "Ground_truth_Points.csv"
    IMAGES_PATH: Path = DATASET_DIR / "images" / "images"
    CADASTRAL_MAP_PATH: Path = DATASET_DIR / "Park_Cadastral_Map.geojson"
    FMB_MAP_PATH: Path = DATASET_DIR / "Park_fmb_Map.geojson"

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'backend' / 'farmwise.db'}")

settings = Settings()
