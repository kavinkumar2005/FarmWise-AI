import os
import json
import re
import math
from pathlib import Path
from typing import List, Dict, Any, Optional
import pandas as pd
from app.config import settings
from app.db.models import ParcelRecord

class ParcelDatabase:
    def __init__(self):
        self.df: Optional[pd.DataFrame] = None
        self.survey_index: Dict[str, List[Dict[str, Any]]] = {}
        self.image_files_map: Dict[str, str] = {}
        self.cadastral_features: Dict[str, Any] = {}
        self.fmb_features: Dict[str, Any] = {}
        self._is_loaded = False

    def load_data(self):
        if self._is_loaded:
            return

        print("[INFO] Loading agricultural dataset into memory...")
        
        # 1. Index image files in Datasets/images/images
        if settings.IMAGES_PATH.exists():
            for filename in os.listdir(settings.IMAGES_PATH):
                if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                    self.image_files_map[filename] = filename
                    # Also map the image_path prefix/hash if present
                    parts = filename.split("__")
                    if len(parts) > 1:
                        img_token = parts[1].split("-")[0]
                        self.image_files_map[img_token] = filename
                    # Map full token
                    self.image_files_map[filename.split(".")[0]] = filename
            print(f"[OK] Indexed {len(self.image_files_map)} image file references.")

        # 2. Load Cadastral GeoJSON
        if settings.CADASTRAL_MAP_PATH.exists():
            try:
                with open(settings.CADASTRAL_MAP_PATH, "r", encoding="utf-8") as f:
                    cad_data = json.load(f)
                    for feat in cad_data.get("features", []):
                        props = feat.get("properties", {})
                        s_no = str(props.get("survey_no", "")).strip()
                        if s_no:
                            self.cadastral_features[s_no] = feat
                print(f"[OK] Loaded {len(self.cadastral_features)} Cadastral parcel polygons.")
            except Exception as e:
                print(f"[WARN] Error loading Cadastral GeoJSON: {e}")

        # 3. Load FMB GeoJSON
        if settings.FMB_MAP_PATH.exists():
            try:
                with open(settings.FMB_MAP_PATH, "r", encoding="utf-8") as f:
                    fmb_data = json.load(f)
                    for feat in fmb_data.get("features", []):
                        props = feat.get("properties", {})
                        s_no = str(props.get("survey_no", "")).strip()
                        if s_no:
                            self.fmb_features[s_no] = feat
                print(f"[OK] Loaded {len(self.fmb_features)} FMB parcel polygons.")
            except Exception as e:
                print(f"[WARN] Error loading FMB GeoJSON: {e}")

        # 4. Load Ground Truth CSV
        if settings.CSV_PATH.exists():
            try:
                self.df = pd.read_csv(settings.CSV_PATH, low_memory=False)
                # Clean column types
                self.df['survey_str'] = self.df['survey_n_1'].astype(str).str.strip()
                
                # Build fast survey lookup dictionary
                for idx, row in self.df.iterrows():
                    s_no = row['survey_str']
                    if s_no not in self.survey_index:
                        self.survey_index[s_no] = []
                    
                    self.survey_index[s_no].append(row.to_dict())
                
                print(f"[OK] Indexed {len(self.df)} rows from Ground_truth_Points.csv across {len(self.survey_index)} distinct survey numbers.")
            except Exception as e:
                print(f"[WARN] Error reading Ground_truth_Points.csv: {e}")

        self._is_loaded = True

    def find_matching_image(self, s_no: str, village_id: Any, img_path: Optional[str]) -> Optional[str]:
        """Finds matching image filename on disk."""
        if not img_path and not s_no:
            return None

        # Check direct img_path matches
        if img_path:
            clean_token = str(img_path).strip()
            if clean_token in self.image_files_map:
                return self.image_files_map[clean_token]
            for key, fname in self.image_files_map.items():
                if clean_token in fname:
                    return fname

        # Check survey number in filename: {village}_{survey_no}_
        s_str = str(s_no).strip()
        v_str = str(village_id).strip() if village_id else ""
        for key, fname in self.image_files_map.items():
            if f"_{s_str}_" in fname:
                if not v_str or v_str in fname:
                    return fname

        # Fallback to any survey match
        for key, fname in self.image_files_map.items():
            if f"_{s_str}_" in fname:
                return fname

        return None

    def create_synthetic_polygon(self, lat: float, lon: float, delta: float = 0.0006) -> Dict[str, Any]:
        """Creates a realistic closed polygon around lat/lon for parcel boundary visualization."""
        # Approx 1 acre field shape (slight irregular quadrilateral)
        coords = [
            [lon - delta * 0.9, lat - delta * 0.7],
            [lon + delta * 1.1, lat - delta * 0.8],
            [lon + delta * 0.95, lat + delta * 1.0],
            [lon - delta * 1.05, lat + delta * 0.85],
            [lon - delta * 0.9, lat - delta * 0.7] # Close polygon
        ]
        return {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [coords]
            },
            "properties": {
                "type": "Survey Parcel Boundary",
                "area_acres": round(1.2 + abs(math.sin(lat * 100)), 2)
            }
        }

    def get_parcel(self, survey_number: str) -> Optional[ParcelRecord]:
        self.load_data()
        s_clean = str(survey_number).strip()

        # Check in CSV index first
        if s_clean in self.survey_index and len(self.survey_index[s_clean]) > 0:
            records = self.survey_index[s_clean]
            row = records[0] # primary sub-division or point

            lat = float(row.get('final_lat', 9.246))
            lon = float(row.get('final_long', 77.379))
            
            # Match boundary from Cadastral or FMB if exists, else synthetic
            boundary = None
            if s_clean in self.cadastral_features:
                boundary = self.cadastral_features[s_clean]
            elif s_clean in self.fmb_features:
                boundary = self.fmb_features[s_clean]
            else:
                boundary = self.create_synthetic_polygon(lat, lon)

            # Match image
            matched_img = self.find_matching_image(
                s_clean, 
                row.get('Village LG'), 
                row.get('image_path')
            )
            img_url = f"/dataset-images/{matched_img}" if matched_img else None

            # Village & district naming
            v_code = row.get('Village LG')
            v_name = "Sivagiri" if v_code in [933535, 933536, 933538] else f"Village {v_code or 'Unknown'}"
            taluk = "Sivagiri" if row.get('taluk_co_1') == 5 else f"Taluk {row.get('taluk_co_1', '5')}"
            district = "Tenkasi" if row.get('district_1') == 34 else "Thoothukudi"

            return ParcelRecord(
                survey_number=s_clean,
                sub_division=str(row.get('sub_divi_1', '1')),
                village_code=int(v_code) if pd.notna(v_code) else None,
                village_name=v_name,
                taluk=taluk,
                district=district,
                latitude=lat,
                longitude=lon,
                recorded_crop=str(row.get('final_crop_name', 'Rice (Paddy)')),
                recorded_stage=str(row.get('final_crop_stage', 'vegetation')),
                image_path=matched_img,
                image_url=img_url,
                timestamp=str(row.get('timestamp', '2024-11-09')),
                boundary_geojson=boundary
            )

        # Check Cadastral Map if not in CSV
        if s_clean in self.cadastral_features:
            feat = self.cadastral_features[s_clean]
            props = feat.get("properties", {})
            geom = feat.get("geometry", {})
            coords = geom.get("coordinates", [[]])
            
            # Compute centroid
            flat_pts = []
            if geom.get("type") == "Polygon":
                flat_pts = coords[0]
            elif geom.get("type") == "MultiPolygon":
                flat_pts = coords[0][0]

            if flat_pts:
                avg_lon = sum(p[0] for p in flat_pts) / len(flat_pts)
                avg_lat = sum(p[1] for p in flat_pts) / len(flat_pts)
            else:
                avg_lat, avg_lon = 8.764, 78.134

            return ParcelRecord(
                survey_number=s_clean,
                sub_division="1",
                village_name=props.get("vil_name", "Keelathattaparai"),
                taluk=props.get("taluk_name", "Thoothukudi"),
                district=props.get("dist_name", "Thoothukudi"),
                latitude=avg_lat,
                longitude=avg_lon,
                recorded_crop="Paddy",
                recorded_stage="vegetation",
                boundary_geojson=feat
            )

        return None

    def search_surveys(self, query: str, limit: int = 15) -> List[Dict[str, Any]]:
        self.load_data()
        q = str(query).strip()
        results = []

        if not q:
            # Return popular representative surveys from the dataset
            sample_ids = ["1342", "1346", "1482", "529", "584", "717", "740", "266", "384", "176", "696"]
            for sid in sample_ids:
                p = self.get_parcel(sid)
                if p:
                    results.append({
                        "survey_number": p.survey_number,
                        "crop": p.recorded_crop,
                        "village": p.village_name,
                        "has_image": bool(p.image_path)
                    })
            return results[:limit]

        # Exact or prefix match
        count = 0
        for s_no in self.survey_index.keys():
            if s_no.startswith(q) or s_no == q:
                p = self.get_parcel(s_no)
                if p:
                    results.append({
                        "survey_number": p.survey_number,
                        "crop": p.recorded_crop,
                        "village": p.village_name,
                        "has_image": bool(p.image_path)
                    })
                    count += 1
                    if count >= limit:
                        break

        # Also check cadastral map
        if count < limit:
            for s_no in self.cadastral_features.keys():
                if s_no.startswith(q) and not any(r['survey_number'] == s_no for r in results):
                    results.append({
                        "survey_number": s_no,
                        "crop": "Paddy / Agricultural",
                        "village": self.cadastral_features[s_no].get("properties", {}).get("vil_name", "Thoothukudi"),
                        "has_image": False
                    })
                    count += 1
                    if count >= limit:
                        break

        return results

db = ParcelDatabase()
