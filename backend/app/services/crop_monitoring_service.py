import os
import json
import hashlib
from collections import defaultdict
from typing import Dict, Any, List, Optional
import pandas as pd
from app.config import settings

VILLAGE_CODE_MAP = {
    933535: {"village": "Sivagiri", "taluk": "Sivagiri", "district": "Tenkasi"},
    933536: {"village": "Sivagiri Town", "taluk": "Sivagiri", "district": "Tenkasi"},
    933538: {"village": "Vasudevanallur", "taluk": "Sivagiri", "district": "Tenkasi"},
    933533: {"village": "Rayagiri", "taluk": "Sivagiri", "district": "Tenkasi"},
    933539: {"village": "Thenmalai", "taluk": "Sivagiri", "district": "Tenkasi"},
    933541: {"village": "Viswanathaperi", "taluk": "Sivagiri", "district": "Tenkasi"},
    933542: {"village": "Thalavaipuram", "taluk": "Sivagiri", "district": "Tenkasi"},
    642619: {"village": "Keelathattaparai", "taluk": "Thoothukudi", "district": "Thoothukudi"},
    642620: {"village": "Melathattaparai", "taluk": "Thoothukudi", "district": "Thoothukudi"},
    642621: {"village": "Peroorani", "taluk": "Thoothukudi", "district": "Thoothukudi"},
    642622: {"village": "Allikulam", "taluk": "Thoothukudi", "district": "Thoothukudi"},
    642623: {"village": "Ramasamypuram", "taluk": "Thoothukudi", "district": "Thoothukudi"},
    642624: {"village": "Umarikottai", "taluk": "Thoothukudi", "district": "Thoothukudi"},
    642625: {"village": "South Silukanpatti", "taluk": "Thoothukudi", "district": "Thoothukudi"},
    642626: {"village": "Mullakadu", "taluk": "Thoothukudi", "district": "Thoothukudi"},
    642627: {"village": "Korampallam", "taluk": "Thoothukudi", "district": "Thoothukudi"},
    642628: {"village": "Maravanmadam", "taluk": "Thoothukudi", "district": "Thoothukudi"},
    642629: {"village": "Kootampuli", "taluk": "Thoothukudi", "district": "Thoothukudi"},
    642630: {"village": "Kulayankarisal", "taluk": "Thoothukudi", "district": "Thoothukudi"},
    642631: {"village": "Mudivaithanendal", "taluk": "Thoothukudi", "district": "Thoothukudi"},
    642632: {"village": "Servaikaranmadam", "taluk": "Thoothukudi", "district": "Thoothukudi"},
}

FARMER_NAMES = [
    "M. Ramanathan", "S. Murugesan", "K. Arumugam", "P. Shanmugavel",
    "T. Muthukumar", "V. Subbiah", "A. Karuppasamy", "R. Palanichamy",
    "N. Chellappa", "G. Sundaram", "D. Selvaraj", "M. Thangavel"
]

CROP_EMOJI_MAP = {
    "Rice (Paddy)": "🌾",
    "Paddy": "🌾",
    "Coconut": "🥥",
    "Maize": "🌽",
    "Banana": "🍌",
    "Sugarcane": "🍬",
    "Groundnut": "🥜",
    "Sorghum": "🌾",
    "Cassava": "🥔",
    "Marigold": "🌼",
    "Diploid Cotton (Paruththi)": "☁️",
    "Mango": "🥭",
    "Fodder Sorghum": "🌿"
}

CROP_COLOR_MAP = {
    "Rice (Paddy)": "#16a34a",
    "Paddy": "#16a34a",
    "Coconut": "#0d9488",
    "Maize": "#eab308",
    "Banana": "#84cc16",
    "Sugarcane": "#06b6d4",
    "Groundnut": "#d97706",
    "Sorghum": "#8b5cf6",
    "Cassava": "#a855f7",
    "Marigold": "#f97316",
    "Diploid Cotton (Paruththi)": "#64748b",
    "Mango": "#f59e0b",
    "Fodder Sorghum": "#10b981"
}


# Threshold configurations
HEALTH_THRESHOLDS = {
    "HEALTHY_MIN": 80,
    "MODERATE_MIN": 50
}

def classify_health(score: Optional[int]) -> str:
    """Classifies crop health score into standard categories without treating None as Healthy."""
    if score is None:
        return "Health Data Unavailable"
    if score >= HEALTH_THRESHOLDS["HEALTHY_MIN"]:
        return "Healthy"
    if score >= HEALTH_THRESHOLDS["MODERATE_MIN"]:
        return "Moderate"
    return "Critical"

def compute_priority(health_status: str, disease_status: str, verification_status: str, health_score: Optional[int]) -> Dict[str, Any]:
    """
    Transparent priority classification:
    HIGH: Critical crop health OR confirmed serious disease/pest detection.
    MEDIUM: Moderate crop health OR pending verification/review OR diagnosis pending.
    LOW: Healthy and verified without unresolved alerts.
    """
    reasons = []
    is_high = False
    is_medium = False

    # Check high priority triggers
    if health_status == "Critical" or (health_score is not None and health_score < HEALTH_THRESHOLDS["MODERATE_MIN"]):
        is_high = True
        reasons.append(f"Critical crop health score ({health_score}%)")

    if disease_status in ["Disease Detected", "Pest Detected"]:
        is_high = True
        reasons.append(f"Active infestation: {disease_status}")
    elif "alert" in disease_status.lower() or "blight" in disease_status.lower() or "pest" in disease_status.lower():
        is_high = True
        reasons.append(f"Urgent agricultural distress: {disease_status}")

    if is_high:
        return {
            "priority": "HIGH",
            "priority_color": "#dc2626", # Red
            "priority_reason": "; ".join(reasons) if reasons else "Critical agricultural condition"
        }

    # Check medium priority triggers
    if health_status == "Moderate":
        is_medium = True
        reasons.append("Moderate crop vigor requiring monitoring")
    elif health_status == "Health Data Unavailable":
        is_medium = True
        reasons.append("Missing crop health telemetry")

    if verification_status in ["Not Verified", "Unverified", "Pending Review", "Verification Required"]:
        is_medium = True
        reasons.append("Cadastral verification pending administrative review")

    if disease_status == "Diagnosis Pending":
        is_medium = True
        reasons.append("Pathogen laboratory diagnosis pending")

    if is_medium:
        return {
            "priority": "MEDIUM",
            "priority_color": "#d97706", # Amber
            "priority_reason": "; ".join(reasons) if reasons else "Condition requiring follow-up"
        }

    # Low priority
    return {
        "priority": "LOW",
        "priority_color": "#16a34a", # Green
        "priority_reason": "Healthy crop with verified cadastral boundaries and no active alerts"
    }


class CropMonitoringService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CropMonitoringService, cls).__new__(cls)
            cls._instance.is_initialized = False
        return cls._instance

    def initialize(self):
        if self.is_initialized:
            return

        print("[INFO] Initializing Crop Monitoring GIS dataset...")
        self.crop_records: List[Dict[str, Any]] = []
        self.crop_records_by_id: Dict[str, Dict[str, Any]] = []
        self.audit_log: List[Dict[str, Any]] = []
        self.cadastral_geojson_features: List[Dict[str, Any]] = []
        self.fmb_geojson_features: List[Dict[str, Any]] = []
        self.crop_records_by_id: Dict[str, Dict[str, Any]] = {}

        # 1. Load Cadastral GeoJSON
        if settings.CADASTRAL_MAP_PATH.exists():
            try:
                with open(settings.CADASTRAL_MAP_PATH, "r", encoding="utf-8") as f:
                    cad = json.load(f)
                    self.cadastral_geojson_features = cad.get("features", [])
            except Exception as e:
                print(f"[WARN] Failed loading Cadastral Map for Crop Monitoring: {e}")

        # 2. Load FMB GeoJSON
        if settings.FMB_MAP_PATH.exists():
            try:
                with open(settings.FMB_MAP_PATH, "r", encoding="utf-8") as f:
                    fmb = json.load(f)
                    self.fmb_geojson_features = fmb.get("features", [])
            except Exception as e:
                print(f"[WARN] Failed loading FMB Map for Crop Monitoring: {e}")

        # 3. Load Ground Truth CSV and construct unified cultivation records
        if settings.CSV_PATH.exists():
            try:
                df = pd.read_csv(settings.CSV_PATH, low_memory=False)
                
                # Parse records
                records = []
                for idx, row in df.iterrows():
                    s_no = str(row.get("survey_n_1", "")).strip()
                    sub_div = str(row.get("sub_divi_1", "")).strip() if pd.notna(row.get("sub_divi_1")) else "1"
                    v_lg = row.get("Village LG")
                    v_lg = int(v_lg) if pd.notna(v_lg) else None
                    
                    geo_info = VILLAGE_CODE_MAP.get(v_lg, {
                        "village": f"Village {v_lg or 'Unknown'}",
                        "taluk": "Sivagiri" if row.get("taluk_co_1") == 5 else "Thoothukudi",
                        "district": "Tenkasi" if row.get("district_1") == 34 else "Thoothukudi"
                    })
                    
                    # Generate deterministic Record / Parcel ID
                    parcel_id = f"TN-{geo_info['district'][:3].upper()}-{s_no}-{sub_div}"
                    rec_id = f"CR-{idx+1:05d}"
                    
                    # Determine Farmer Name & ID
                    hash_int = int(hashlib.md5(f"{s_no}-{sub_div}-{v_lg}".encode()).hexdigest(), 16)
                    farmer_name = FARMER_NAMES[hash_int % len(FARMER_NAMES)]
                    farmer_id = f"FARMER-{(hash_int % 9000) + 1000}"

                    # Cultivated Area (Acres) - realistic deterministic based on parcel
                    area_acres = round(0.5 + (hash_int % 50) * 0.1, 2)

                    # Health score & status - using configurable thresholds & realistic variations
                    # Some records have missing health data, critical health, or moderate health
                    health_mod = hash_int % 100
                    if health_mod < 4:
                        health_score = None # Missing health data test case
                        health_status = "Health Data Unavailable"
                    elif health_mod < 18:
                        health_score = int(32 + (hash_int % 17)) # 32 to 48: Critical
                        health_status = "Critical"
                    elif health_mod < 55:
                        health_score = int(52 + (hash_int % 27)) # 52 to 78: Moderate
                        health_status = "Moderate"
                    else:
                        health_score = int(80 + (hash_int % 19)) # 80 to 98: Healthy
                        health_status = "Healthy"

                    # Disease / Pest status
                    disease_mod = hash_int % 50
                    if disease_mod < 5:
                        disease_status = "Disease Detected"
                    elif disease_mod < 10:
                        disease_status = "Pest Detected"
                    elif disease_mod < 14:
                        disease_status = "Diagnosis Pending"
                    else:
                        disease_status = "No Disease Detected"

                    # Season determination based on rabi classification
                    rabi_cls = str(row.get("rabi_crop_classification", "Cereals"))
                    season = "Rabi (Navarai / Winter)" if "rabi" in rabi_cls.lower() or "cereals" in rabi_cls.lower() else "Kharif (Kuruvai / Samba)"

                    crop_name = str(row.get("final_crop_name", "Rice (Paddy)")).strip()
                    if crop_name == "nan" or not crop_name:
                        crop_name = "Rice (Paddy)"

                    crop_stage = str(row.get("final_crop_stage", "vegetation")).strip()
                    if crop_stage == "nan" or not crop_stage:
                        crop_stage = "vegetation"

                    # Sowing and Harvest dates
                    timestamp_str = str(row.get("timestamp", "11-08-2024"))
                    sowing_date = "2024-09-15"
                    expected_harvest = "2025-01-20" if "rice" in crop_name.lower() else ("2025-02-15" if "maize" in crop_name.lower() else "Perennial / Year-Round")

                    # Verification status: Verified, Not Verified, Rejected, Verification Required
                    v_mod = idx % 20
                    if v_mod == 0:
                        verification_status = "Rejected"
                    elif v_mod < 5:
                        verification_status = "Verification Required"
                    elif v_mod < 8:
                        verification_status = "Not Verified"
                    else:
                        verification_status = "Verified"

                    # Priority classification
                    prio_info = compute_priority(
                        health_status=health_status,
                        disease_status=disease_status,
                        verification_status=verification_status,
                        health_score=health_score
                    )

                    # Marker color indicator based on status rules
                    # Green: Healthy, Yellow: Moderate, Red: Critical, Orange: Not Verified / Verification Required, Dark red: Disease / Pest Detected
                    if disease_status in ["Disease Detected", "Pest Detected"]:
                        marker_color = "#991b1b" # Dark Red
                    elif health_status == "Critical":
                        marker_color = "#ef4444" # Red
                    elif verification_status in ["Not Verified", "Verification Required"]:
                        marker_color = "#f97316" # Orange
                    elif health_status == "Moderate":
                        marker_color = "#eab308" # Yellow
                    else:
                        marker_color = "#16a34a" # Green

                    rec = {
                        "id": rec_id,
                        "parcel_id": parcel_id,
                        "survey_number": s_no,
                        "sub_division": sub_div,
                        "village_code": v_lg,
                        "village_name": geo_info["village"],
                        "taluk": geo_info["taluk"],
                        "district": geo_info["district"],
                        "latitude": float(row.get("final_lat", 9.246)),
                        "longitude": float(row.get("final_long", 77.379)),
                        "farmer_id": farmer_id,
                        "farmer_name": farmer_name,
                        "farmer_name_masked": f"{farmer_name[0]}. " + "*" * 5 + farmer_name[-3:],
                        "crop_name": crop_name,
                        "crop_category": rabi_cls.split(";")[0],
                        "crop_stage": crop_stage,
                        "crop_emoji": CROP_EMOJI_MAP.get(crop_name, "🌱"),
                        "crop_color": CROP_COLOR_MAP.get(crop_name, "#10b981"),
                        "marker_color": marker_color,
                        "area_acres": area_acres,
                        "season": season,
                        "planting_date": sowing_date,
                        "expected_harvest_date": expected_harvest,
                        "health_score": health_score,
                        "health_status": health_status,
                        "disease_status": disease_status,
                        "last_updated": timestamp_str,
                        "verification_status": verification_status,
                        "priority": prio_info["priority"],
                        "priority_color": prio_info["priority_color"],
                        "priority_reason": prio_info["priority_reason"],
                        "alert_reviewed": False,
                        "image_path": str(row.get("image_path")) if pd.notna(row.get("image_path")) else None
                    }
                    records.append(rec)
                    self.crop_records_by_id[rec_id] = rec

                self.crop_records = records
                print(f"[OK] CropMonitoringService initialized with {len(self.crop_records)} registered cultivation records.")

            except Exception as e:
                print(f"[ERROR] Failed initializing Crop Monitoring CSV records: {e}")

        self.is_initialized = True

    def get_filter_options(self) -> Dict[str, Any]:
        self.initialize()
        districts = sorted(list(set(r["district"] for r in self.crop_records if r.get("district"))))
        
        taluks_by_district: Dict[str, List[str]] = {}
        villages_by_taluk: Dict[str, List[str]] = {}
        for r in self.crop_records:
            d = r.get("district")
            t = r.get("taluk")
            v = r.get("village_name")
            if d and t:
                taluks_by_district.setdefault(d, set()).add(t)
            if t and v:
                villages_by_taluk.setdefault(t, set()).add(v)

        crops = sorted(list(set(r["crop_name"] for r in self.crop_records if r.get("crop_name"))))
        seasons = sorted(list(set(r["season"] for r in self.crop_records if r.get("season"))))
        stages = sorted(list(set(r["crop_stage"] for r in self.crop_records if r.get("crop_stage"))))
        
        # Feature 3 Standardized Options
        health_statuses = ["Healthy", "Moderate", "Critical", "Health Data Unavailable"]
        verification_statuses = ["All Records", "Not Verified", "Verified", "Rejected", "Verification Required"]
        disease_statuses = ["All", "Disease Detected", "Pest Detected", "No Disease Detected", "Diagnosis Pending"]
        priority_levels = ["All", "HIGH", "MEDIUM", "LOW"]

        return {
            "districts": districts,
            "taluks_by_district": {k: sorted(list(v)) for k, v in taluks_by_district.items()},
            "villages_by_taluk": {k: sorted(list(v)) for k, v in villages_by_taluk.items()},
            "crops": crops,
            "seasons": seasons,
            "stages": stages,
            "health_statuses": health_statuses,
            "verification_statuses": verification_statuses,
            "disease_statuses": disease_statuses,
            "priority_levels": priority_levels,
            "crop_metadata": {
                crop: {
                    "emoji": CROP_EMOJI_MAP.get(crop, "🌱"),
                    "color": CROP_COLOR_MAP.get(crop, "#10b981")
                }
                for crop in crops
            }
        }

    def filter_records(
        self,
        district: Optional[str] = None,
        taluk: Optional[str] = None,
        village: Optional[str] = None,
        crop: Optional[str] = None,
        season: Optional[str] = None,
        stage: Optional[str] = None,
        health: Optional[str] = None,
        verification: Optional[str] = None,
        disease: Optional[str] = None,
        priority: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        self.initialize()
        results = self.crop_records

        if district and district != "ALL":
            results = [r for r in results if r["district"].lower() == district.lower()]
        if taluk and taluk != "ALL":
            results = [r for r in results if r["taluk"].lower() == taluk.lower()]
        if village and village != "ALL":
            results = [r for r in results if r["village_name"].lower() == village.lower()]
        if crop and crop != "ALL":
            results = [r for r in results if r["crop_name"].lower() == crop.lower()]
        if season and season != "ALL":
            results = [r for r in results if r["season"].lower() == season.lower()]
        if stage and stage != "ALL":
            results = [r for r in results if r["crop_stage"].lower() == stage.lower()]
        if health and health != "ALL":
            results = [r for r in results if r["health_status"].lower() == health.lower()]
        if verification and verification != "ALL" and verification != "All Records":
            results = [r for r in results if r["verification_status"].lower() == verification.lower()]
        if disease and disease != "ALL" and disease != "All":
            results = [r for r in results if r["disease_status"].lower() == disease.lower()]
        if priority and priority != "ALL" and priority != "All":
            results = [r for r in results if r["priority"].lower() == priority.lower()]
        if search and search.strip():
            q = search.strip().lower()
            results = [
                r for r in results
                if q in r["survey_number"].lower()
                or q in r["parcel_id"].lower()
                or q in r["farmer_id"].lower()
                or q in r["village_name"].lower()
                or q in r["crop_name"].lower()
            ]

        return results

    def get_overview_statistics(
        self,
        district: Optional[str] = None,
        taluk: Optional[str] = None,
        village: Optional[str] = None,
        crop: Optional[str] = None,
        season: Optional[str] = None,
        stage: Optional[str] = None,
        health: Optional[str] = None,
        verification: Optional[str] = None,
        disease: Optional[str] = None,
        priority: Optional[str] = None
    ) -> Dict[str, Any]:
        records = self.filter_records(
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

        total_records = len(records)
        unique_parcels = len(set(r["parcel_id"] for r in records))
        unique_farmers = len(set(r["farmer_id"] for r in records))
        total_area = round(sum(r["area_acres"] for r in records), 1)
        districts_covered = len(set(r["district"] for r in records if r["district"]))
        villages_covered = len(set(r["village_name"] for r in records if r["village_name"]))
        verified_count = sum(1 for r in records if r["verification_status"] == "Verified")
        unverified_count = sum(1 for r in records if r["verification_status"] != "Verified")

        # Smart Alert KPI Card Calculations (respecting active filters)
        pending_verification = sum(1 for r in records if r["verification_status"] in ["Not Verified", "Verification Required", "Pending Review"])
        critical_crops = sum(1 for r in records if r["health_status"] == "Critical")
        disease_detected_parcels = sum(1 for r in records if r["disease_status"] in ["Disease Detected", "Pest Detected"])
        high_priority_parcels = sum(1 for r in records if r["priority"] == "HIGH")
        moderate_health_parcels = sum(1 for r in records if r["health_status"] == "Moderate")
        healthy_parcels = sum(1 for r in records if r["health_status"] == "Healthy")
        health_unavailable = sum(1 for r in records if r["health_status"] == "Health Data Unavailable")

        # Distributions for charts
        crop_area: Dict[str, float] = {}
        crop_counts: Dict[str, int] = {}
        for r in records:
            c = r["crop_name"]
            crop_area[c] = round(crop_area.get(c, 0.0) + r["area_acres"], 1)
            crop_counts[c] = crop_counts.get(c, 0) + 1

        district_distribution: Dict[str, int] = {}
        for r in records:
            d = r["district"]
            district_distribution[d] = district_distribution.get(d, 0) + 1

        village_distribution: Dict[str, int] = {}
        for r in records:
            v = r["village_name"]
            village_distribution[v] = village_distribution.get(v, 0) + 1

        season_distribution: Dict[str, int] = {}
        for r in records:
            s = r["season"]
            season_distribution[s] = season_distribution.get(s, 0) + 1

        health_distribution: Dict[str, int] = {}
        for r in records:
            h = r["health_status"]
            health_distribution[h] = health_distribution.get(h, 0) + 1

        stage_distribution: Dict[str, int] = {}
        for r in records:
            st = r["crop_stage"]
            stage_distribution[st] = stage_distribution.get(st, 0) + 1

        # Priority distribution
        priority_distribution: Dict[str, int] = {}
        for r in records:
            p = r["priority"]
            priority_distribution[p] = priority_distribution.get(p, 0) + 1

        # Disease distribution
        disease_distribution: Dict[str, int] = {}
        for r in records:
            dis = r["disease_status"]
            disease_distribution[dis] = disease_distribution.get(dis, 0) + 1

        return {
            "summary": {
                "total_crop_records": total_records,
                "total_agricultural_parcels": unique_parcels,
                "total_registered_farmers": unique_farmers,
                "total_cultivated_area_acres": total_area,
                "districts_covered": districts_covered,
                "villages_covered": villages_covered,
                "verified_records": verified_count,
                "unverified_records": unverified_count,
                "verification_rate_pct": round((verified_count / total_records * 100), 1) if total_records > 0 else 0,
                # Smart Alerts KPI statistics
                "total_pending_verification": pending_verification,
                "total_critical_crops": critical_crops,
                "total_disease_detected": disease_detected_parcels,
                "total_high_priority": high_priority_parcels,
                "total_moderate_health": moderate_health_parcels,
                "total_healthy": healthy_parcels,
                "total_health_unavailable": health_unavailable
            },
            "alerts": {
                "pending_verification": pending_verification,
                "critical_crops": critical_crops,
                "disease_detected": disease_detected_parcels,
                "high_priority": high_priority_parcels,
                "moderate_health": moderate_health_parcels,
                "healthy_crops": healthy_parcels,
                "health_unavailable": health_unavailable
            },
            "charts": {
                "crop_cultivated_area": [
                    {"crop": k, "area_acres": v, "records_count": crop_counts.get(k, 0), "emoji": CROP_EMOJI_MAP.get(k, "🌱"), "color": CROP_COLOR_MAP.get(k, "#10b981")}
                    for k, v in sorted(crop_area.items(), key=lambda x: x[1], reverse=True)
                ],
                "district_crop_distribution": [
                    {"district": k, "count": v}
                    for k, v in sorted(district_distribution.items(), key=lambda x: x[1], reverse=True)
                ],
                "village_crop_distribution": [
                    {"village": k, "count": v}
                    for k, v in sorted(village_distribution.items(), key=lambda x: x[1], reverse=True)[:10]
                ],
                "season_distribution": [
                    {"season": k, "count": v}
                    for k, v in season_distribution.items()
                ],
                "health_status_distribution": [
                    {"status": k, "count": v, "color": "#16a34a" if k == "Healthy" else ("#eab308" if k == "Moderate" else "#ef4444")}
                    for k, v in health_distribution.items()
                ],
                "stage_distribution": [
                    {"stage": k, "count": v}
                    for k, v in stage_distribution.items()
                ]
            }
        }

    def get_map_markers(
        self,
        district: Optional[str] = None,
        taluk: Optional[str] = None,
        village: Optional[str] = None,
        crop: Optional[str] = None,
        season: Optional[str] = None,
        stage: Optional[str] = None,
        health: Optional[str] = None,
        verification: Optional[str] = None,
        disease: Optional[str] = None,
        priority: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 1500
    ) -> Dict[str, Any]:
        records = self.filter_records(
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
            search=search
        )

        # Sample records up to limit with stratified crop coverage so that
        # every cultivated crop type and acre parcel is guaranteed visible on the GIS map
        if len(records) <= limit:
            sliced_records = records
        else:
            by_crop: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
            for r in records:
                by_crop[r["crop_name"]].append(r)

            min_per_crop = 10
            reserved = sum(min(len(recs), min_per_crop) for recs in by_crop.values())
            remaining_limit = max(0, limit - reserved)
            total_records = len(records)
            sampled: List[Dict[str, Any]] = []

            for crop_name, recs in by_crop.items():
                base_take = min(len(recs), min_per_crop)
                prop_take = int((len(recs) / total_records) * remaining_limit) if total_records > 0 else 0
                take_count = min(len(recs), base_take + prop_take)

                # Evenly distribute samples across records to cover geographic villages/acres
                if len(recs) <= take_count:
                    sampled.extend(recs)
                else:
                    step = len(recs) / take_count
                    for i in range(take_count):
                        sampled.append(recs[int(i * step)])

            # Backfill any remaining quota up to limit
            if len(sampled) < limit:
                sampled_ids = set(r["id"] for r in sampled)
                for r in records:
                    if r["id"] not in sampled_ids:
                        sampled.append(r)
                        if len(sampled) >= limit:
                            break
            sliced_records = sampled[:limit]

        markers = []
        for r in sliced_records:
            markers.append({
                "id": r["id"],
                "parcel_id": r["parcel_id"],
                "survey_number": r["survey_number"],
                "sub_division": r["sub_division"],
                "village": r["village_name"],
                "taluk": r["taluk"],
                "district": r["district"],
                "lat": r["latitude"],
                "lng": r["longitude"],
                "crop": r["crop_name"],
                "crop_emoji": r["crop_emoji"],
                "crop_color": r["crop_color"],
                "marker_color": r.get("marker_color", "#10b981"),
                "crop_stage": r["crop_stage"],
                "health_status": r["health_status"],
                "health_score": r["health_score"],
                "disease_status": r.get("disease_status", "No Disease Detected"),
                "area_acres": r["area_acres"],
                "verification_status": r["verification_status"],
                "priority": r.get("priority", "LOW"),
                "priority_color": r.get("priority_color", "#16a34a"),
                "priority_reason": r.get("priority_reason", ""),
                "farmer_name_masked": r["farmer_name_masked"]
            })

        # Calculate map center and bounds
        if markers:
            avg_lat = sum(m["lat"] for m in markers) / len(markers)
            avg_lng = sum(m["lng"] for m in markers) / len(markers)
            center = [round(avg_lat, 5), round(avg_lng, 5)]
        else:
            center = [9.2463, 77.3798]

        return {
            "total_matches": len(records),
            "rendered_count": len(markers),
            "center": center,
            "markers": markers
        }

    def get_cadastral_boundaries(
        self,
        district: Optional[str] = None,
        village: Optional[str] = None
    ) -> Dict[str, Any]:
        """Returns filtered Cadastral GeoJSON feature collection."""
        features = self.cadastral_geojson_features
        if village and village != "ALL":
            features = [f for f in features if f.get("properties", {}).get("vil_name", "").lower() == village.lower()]
        return {
            "type": "FeatureCollection",
            "features": features
        }

    def get_crop_records_paginated(
        self,
        page: int = 1,
        page_size: int = 25,
        district: Optional[str] = None,
        taluk: Optional[str] = None,
        village: Optional[str] = None,
        crop: Optional[str] = None,
        season: Optional[str] = None,
        stage: Optional[str] = None,
        health: Optional[str] = None,
        verification: Optional[str] = None,
        disease: Optional[str] = None,
        priority: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: Optional[str] = "priority"
    ) -> Dict[str, Any]:
        records = self.filter_records(
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
            search=search
        )

        # Priority-based sorting (HIGH -> MEDIUM -> LOW) or requested sort
        if sort_by == "priority":
            prio_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
            records = sorted(records, key=lambda x: (prio_order.get(x.get("priority", "LOW"), 3), -(x.get("health_score") or 0)))
        elif sort_by == "health_asc":
            records = sorted(records, key=lambda x: (x.get("health_score") is None, x.get("health_score") or 0))
        elif sort_by == "area_desc":
            records = sorted(records, key=lambda x: -x.get("area_acres", 0))

        total_count = len(records)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paged_records = records[start_idx:end_idx]

        return {
            "total_count": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": (total_count + page_size - 1) // page_size if total_count > 0 else 1,
            "records": paged_records
        }

    def get_record_detail(self, record_id: str) -> Optional[Dict[str, Any]]:
        self.initialize()
        return self.crop_records_by_id.get(record_id)

    def update_crop_record(
        self,
        record_id: str,
        update_data: Dict[str, Any],
        admin_user: str = "Admin Officer"
    ) -> Optional[Dict[str, Any]]:
        self.initialize()
        rec = self.crop_records_by_id.get(record_id)
        if not rec:
            return None

        # Record changes in audit log
        changes = {}
        for key in ["crop_name", "crop_stage", "area_acres", "health_status", "verification_status", "disease_status", "alert_reviewed"]:
            if key in update_data and update_data[key] is not None:
                old_val = rec.get(key)
                new_val = update_data[key]
                if old_val != new_val:
                    changes[key] = {"old": old_val, "new": new_val}
                    rec[key] = new_val

        # Recalculate priority dynamically if health, disease or verification status changed
        prio_info = compute_priority(
            health_status=rec.get("health_status", "Healthy"),
            disease_status=rec.get("disease_status", "No Disease Detected"),
            verification_status=rec.get("verification_status", "Verified"),
            health_score=rec.get("health_score")
        )
        rec["priority"] = prio_info["priority"]
        rec["priority_color"] = prio_info["priority_color"]
        rec["priority_reason"] = prio_info["priority_reason"]

        # Re-evaluate marker color
        if rec["disease_status"] in ["Disease Detected", "Pest Detected"]:
            rec["marker_color"] = "#991b1b" # Dark Red
        elif rec["health_status"] == "Critical":
            rec["marker_color"] = "#ef4444" # Red
        elif rec["verification_status"] in ["Not Verified", "Verification Required"]:
            rec["marker_color"] = "#f97316" # Orange
        elif rec["health_status"] == "Moderate":
            rec["marker_color"] = "#eab308" # Yellow
        else:
            rec["marker_color"] = "#16a34a" # Green

        # Update metadata if crop changed
        if "crop_name" in changes:
            new_crop = rec["crop_name"]
            rec["crop_emoji"] = CROP_EMOJI_MAP.get(new_crop, "🌱")
            rec["crop_color"] = CROP_COLOR_MAP.get(new_crop, "#10b981")

        rec["last_updated"] = pd.Timestamp.now().strftime("%Y-%m-%d %H:%M")

        reason = update_data.get("reason", "Administrative verification update")

        # Append to audit history
        audit_entry = {
            "id": f"AUDIT-{len(self.audit_log)+1:04d}",
            "record_id": record_id,
            "parcel_id": rec["parcel_id"],
            "admin_user": admin_user,
            "action": update_data.get("action", "UPDATE_RECORD"),
            "reason": reason,
            "timestamp": pd.Timestamp.now().isoformat(),
            "changes": changes
        }
        self.audit_log.append(audit_entry)

        return rec

    def get_audit_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.audit_log[-limit:][::-1]


crop_monitoring_service = CropMonitoringService()
