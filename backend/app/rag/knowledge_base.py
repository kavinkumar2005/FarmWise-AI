from typing import List, Dict, Any, Optional
import math

AGRICULTURAL_KNOWLEDGE_DOCS = [
    {
        "id": "rice_paddy_tnau_01",
        "crop": "Rice (Paddy)",
        "category": "Fertilizer Schedule",
        "title": "TNAU Nutrient Management for Rice / Paddy",
        "content": """Recommended NPK dose for high yielding varieties: 120:38:38 kg N:P2O5:K2O per hectare (equivalent to 50:15:15 kg/acre).
- Basal: Apply entire P2O5 (single super phosphate 100 kg/acre or DAP 35 kg/acre), 25% Nitrogen (Urea 25 kg/acre), and 50% Potassium (Muriate of Potash 12 kg/acre). Zinc Sulphate 10 kg/acre.
- Tillering Stage (20-25 DAT): Top dress 50% Nitrogen (Urea 50 kg/acre) along with Neem coated urea.
- Panicle Initiation (40-45 DAT): Top dress remaining 25% Nitrogen (Urea 25 kg/acre) and 50% Potash (MOP 12 kg/acre) for grain filling and panicle exertion.
- Spray 1% DAP + 1% KCl at boot leaf stage to boost grain setting."""
    },
    {
        "id": "rice_paddy_pest_02",
        "crop": "Rice (Paddy)",
        "category": "Pest & Disease Management",
        "title": "Rice Blast and Stem Borer Integrated Management",
        "content": """Brown Plant Hopper (BPH) & Stem Borer Management:
- Avoid excessive nitrogen fertilization which aggravates vegetative succulence and pest multiplication.
- For Stem Borer: Apply Chlorantraniliprole 0.4% G @ 4 kg/acre or spray Chlorantraniliprole 18.5% SC @ 60 ml/acre at 25-30 DAT.
- For Rice Blast (Pyricularia oryzae): Spray Tricyclazole 75% WP @ 120 g/acre or Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 200 ml/acre upon first sign of spindle-shaped lesions.
- For Bacterial Leaf Blight: Spray Copper Hydroxide 77% WP @ 300 g/acre along with Streptocycline @ 6 g/acre."""
    },
    {
        "id": "coconut_tnau_01",
        "crop": "Coconut",
        "category": "Fertilizer Schedule",
        "title": "ICAR-CPCRI Fertilizer & Irrigation Advisory for Coconut Palms",
        "content": """Nutrient requirement for adult yielding palm per tree per year:
- Nitrogen: 560g (Urea 1.3 kg/palm)
- Phosphorus: 320g (Single Super Phosphate 2.0 kg/palm)
- Potassium: 1200g (Muriate of Potash 2.0 kg/palm)
- Organic Matter: 50 kg Farmyard Manure (FYM) or composted coir pith per palm annually before monsoon.
- Micronutrients: Apply 1 kg of TNAU Coconut Tonic mixed with 200ml water root feeding twice a year at 6 months intervals.
- Irrigation: Drip irrigation @ 40-50 litres per palm per day during dry periods; basin irrigation every 4-5 days."""
    },
    {
        "id": "coconut_pest_02",
        "crop": "Coconut",
        "category": "Pest & Disease Management",
        "title": "Coconut Rhinoceros Beetle & Red Palm Weevil Management",
        "content": """Rhinoceros Beetle (Oryctes rhinoceros):
- Clean the crown periodically.
- Place Naphthalene balls (3-4 balls per palm) mixed with equal quantity of river sand in innermost leaf axils.
- Set up Rhinolure pheromone traps @ 1 trap per 2 acres.
Red Palm Weevil (Rhynchophorus ferrugineus):
- Swab trunk with chlorpyrifos or inject Imidacloprid 17.8% SL (5 ml in 100 ml water) into bore hole and seal with clay.
Rugose Spiraling Whitefly:
- Release Encarsia guadeloupae parasitoid and spray neem seed kernel extract (NSKE 5%) or starch solution (20g/L)."""
    },
    {
        "id": "maize_tnau_01",
        "crop": "Maize",
        "category": "Fertilizer Schedule",
        "title": "TNAU High Yield Maize Nutrient Guidance",
        "content": """Recommended NPK dosage: 150:75:75 kg/ha (60:30:30 kg/acre).
- Basal: Entire P, 25% N, and 50% K at time of sowing.
- Knee-high stage (20-25 DAS): 50% N top dressing with inter-cultivation weeding.
- Tasseling / Silking stage (40-45 DAS): Remaining 25% N and 50% K to support cob formation and grain weight.
- Micronutrient: Zinc deficiency causes 'white bud'. Apply 10 kg/acre Zinc Sulphate as basal."""
    },
    {
        "id": "maize_faw_02",
        "crop": "Maize",
        "category": "Pest & Disease Management",
        "title": "Fall Armyworm (Spodoptera frugiperda) IPM Protocol",
        "content": """Critical monitoring within 7-30 days of seedling emergence:
- Install FAW pheromone traps @ 5 traps/acre.
- Early whorl stage (7-15 DAS): Spray Bacillus thuringiensis (Bt) @ 2 g/L or Azadirachtin 1500 ppm @ 5 ml/L.
- Mid whorl stage (15-30 DAS) on visual pinhole feeding: Apply Emamectin Benzoate 5% SG @ 0.4 g/L or Spinetoram 11.7% SC @ 0.5 ml/L directly into plant whorls using coarse spray nozzle.
- Avoid repeating the same chemical to prevent insecticide resistance."""
    },
    {
        "id": "banana_tnau_01",
        "crop": "Banana",
        "category": "Fertilizer Schedule",
        "title": "Banana Crop Production & Fertigation Guide",
        "content": """Nutrient requirement per plant: 110g N, 35g P2O5, 330g K2O.
- Vegetative phase (2nd to 4th month): Apply Nitrogen (Urea 50g/plant/month) and Potash (MOP 60g/plant/month).
- Shooting phase (5th to 7th month): Higher potassium requirement (MOP 100g/plant/month) to increase bunch weight and finger length.
- Micronutrient spray: Banana Special (TNAU) @ 5 g/L with sticker at 5th and 7th month.
- Sigatoka leaf spot: Spray Propiconazole 25% EC @ 1 ml/L or Mineral oil + Mancozeb."""
    },
    {
        "id": "cotton_tnau_01",
        "crop": "Cotton",
        "category": "Fertilizer Schedule",
        "title": "Cotton Nutrient and Sucking Pest Management",
        "content": """NPK recommendation: 80:40:40 kg/ha for irrigated hybrid cotton.
- Basal: 50% N, 100% P, 50% K.
- Square formation (45 DAS): Top dress remaining 50% N and 50% K.
- Foliar spray: 1% Potassium Nitrate (13:0:45) during peak flowering and boll development.
- Sucking pests (Aphids, Jassids, Thrips): Spray Flonicamid 50% WG @ 60 g/acre or Dinotefuran 20% SG @ 60 g/acre."""
    }
]

MARKET_MANDI_PRICES = {
    "Rice (Paddy)": {
        "variety": "Ponni / IR20 / Samba",
        "market": "Tenkasi APMC / Tirunelveli Mandi",
        "modal_price": "₹2,380 / Quintal",
        "min_price": "₹2,220 / Quintal",
        "max_price": "₹2,490 / Quintal",
        "trend": "Upward (+3.2% weekly)"
    },
    "Coconut": {
        "variety": "West Coast Tall / Pollachi Medium",
        "market": "Rajapalayam / Tenkasi Regulated Market",
        "modal_price": "₹32 / Nut (₹3,200 / 100 Nuts)",
        "min_price": "₹28 / Nut",
        "max_price": "₹35 / Nut",
        "trend": "Stable (High festive demand)"
    },
    "Maize": {
        "variety": "Hybrid Yellow Feed Grade",
        "market": "Kovilpatti / Madurai Mandi",
        "modal_price": "₹2,280 / Quintal",
        "min_price": "₹2,140 / Quintal",
        "max_price": "₹2,350 / Quintal",
        "trend": "Upward (+1.8%)"
    },
    "Banana": {
        "variety": "Grand Naine / Poovan",
        "market": "Tirunelveli / Madurai Fruit Market",
        "modal_price": "₹3,400 / Quintal",
        "min_price": "₹3,100 / Quintal",
        "max_price": "₹3,750 / Quintal",
        "trend": "Stable"
    },
    "Sugarcane": {
        "variety": "Co 86032",
        "market": "Dharani Sugars / Cooperative Mills",
        "modal_price": "₹3,150 / Tonne (FRP benchmark)",
        "min_price": "₹3,050 / Tonne",
        "max_price": "₹3,250 / Tonne",
        "trend": "Government benchmark fixed"
    },
    "Cotton": {
        "variety": "MCU-5 / Bunny Medium Staple",
        "market": "Sankarankovil / Rajapalayam Cotton Market",
        "modal_price": "₹7,150 / Quintal",
        "min_price": "₹6,800 / Quintal",
        "max_price": "₹7,450 / Quintal",
        "trend": "Upward"
    },
    "Groundnut": {
        "variety": "TMV-7 / Kadiri Pods",
        "market": "Kovilpatti Regulated Market",
        "modal_price": "₹6,850 / Quintal",
        "min_price": "₹6,400 / Quintal",
        "max_price": "₹7,200 / Quintal",
        "trend": "Stable"
    }
}

class AgriculturalRAG:
    def __init__(self):
        self.documents = AGRICULTURAL_KNOWLEDGE_DOCS
        self.market_data = MARKET_MANDI_PRICES

    def search_documents(self, query: str, crop_name: Optional[str] = None, top_k: int = 3) -> List[Dict[str, Any]]:
        """Lightweight semantic + keyword scoring for instantaneous edge RAG."""
        q_tokens = set(query.lower().split())
        scored_docs = []

        for doc in self.documents:
            score = 0.0
            doc_text = f"{doc['crop']} {doc['category']} {doc['title']} {doc['content']}".lower()

            # Exact crop boost
            if crop_name and crop_name.lower() in doc['crop'].lower():
                score += 5.0
            
            # Token match scoring
            for t in q_tokens:
                if len(t) > 2 and t in doc_text:
                    score += 1.0

            scored_docs.append((score, doc))

        scored_docs.sort(key=lambda x: x[0], reverse=True)
        return [doc for score, doc in scored_docs[:top_k]]

    def get_market_price(self, crop_name: str) -> Dict[str, Any]:
        """Returns realistic mandi pricing for given crop."""
        for key, info in self.market_data.items():
            if key.lower() in crop_name.lower() or crop_name.lower() in key.lower():
                return {
                    "crop": key,
                    **info
                }
        
        # Default fallback
        return {
            "crop": crop_name,
            "variety": "Commercial Grade",
            "market": "Tenkasi / Tirunelveli Mandi",
            "modal_price": "₹2,250 / Quintal",
            "min_price": "₹2,100 / Quintal",
            "max_price": "₹2,400 / Quintal",
            "trend": "Stable"
        }

rag_engine = AgriculturalRAG()
