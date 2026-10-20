import React from 'react';
import { FlaskConical, Activity, Sparkles, CheckCircle2, ShieldCheck, Layers, Gauge } from 'lucide-react';
import { 
  translations, 
  tSoilType, 
  tSoilTexture, 
  tPhStatus, 
  tNutrientStatus, 
  tSoilRating, 
  tSoilSentence 
} from '../utils/translations';

export default function SoilHealthCard({ soilProfile, lang = 'en' }) {
  if (!soilProfile) return null;

  const t = translations[lang] || translations.en;
  const isTamil = lang === 'ta';

  const ph = soilProfile.ph || 7.0;
  const phStatus = tPhStatus(soilProfile.ph_status || "Optimal Neutral", lang);
  const efficiency = soilProfile.fertilizer_efficiency_score || 75;
  const soilType = tSoilType(soilProfile.soil_type || "Red Loamy Soil", lang);
  const soilTexture = tSoilTexture(soilProfile.soil_texture || "Sandy Clay Loam", lang);
  const shcId = soilProfile.soil_health_card_id || "TN-TNK-2024-SHC-DEFAULT";
  const oc = soilProfile.organic_carbon_percent || 0.55;
  const ocStatus = tNutrientStatus(soilProfile.organic_carbon_status || "Medium", lang);
  const rating = tSoilRating(soilProfile.soil_quality_rating || "Good Fertility (Grade B+)", lang);

  const nVal = soilProfile.nitrogen_kg_ha || 200.0;
  const nStatus = tNutrientStatus(soilProfile.nitrogen_status || "Low", lang);

  const pVal = soilProfile.phosphorus_kg_ha || 16.0;
  const pStatus = tNutrientStatus(soilProfile.phosphorus_status || "Medium", lang);

  const kVal = soilProfile.potassium_kg_ha || 280.0;
  const kStatus = tNutrientStatus(soilProfile.potassium_status || "High", lang);

  // pH meter color styling
  let phColor = "text-emerald-700 bg-emerald-50 border-emerald-300";
  let phBarColor = "bg-emerald-500";
  if (ph < 6.5) {
    phColor = "text-amber-800 bg-amber-50 border-amber-300";
    phBarColor = "bg-amber-500";
  } else if (ph > 7.8) {
    phColor = "text-purple-800 bg-purple-50 border-purple-300";
    phBarColor = "bg-purple-500";
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
            <FlaskConical className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-lg">
                {isTamil ? "மண்வளம் மற்றும் ஊட்டச்சத்து பகுப்பாய்வு" : "Soil Health & Chemical Profile"}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                {shcId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isTamil ? "தமிழ்நாடு வேளாண் பல்கலைக்கழகம் (TNAU) மற்றும் தேசிய மண் ஆய்வு அட்டை அடிப்படையிலானது" : "Grounded in Tamil Nadu Soil Survey & National Soil Health Card (SHC) Scheme"}
            </p>
          </div>
        </div>

        {/* Efficiency Gauge Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
          <Gauge className="w-4 h-4 text-emerald-600" />
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">
              {isTamil ? "உர பயன்பாட்டுத் திறன்" : "Fertilizer Efficiency"}
            </div>
            <div className="text-sm font-black text-emerald-900">
              {efficiency}% {isTamil ? "உறிஞ்சும் திறன்" : "Uptake Efficiency"}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Key Metrics: Soil Type, pH Gauge, Organic Carbon, Rating */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Soil Classification */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">{isTamil ? "மண் வகை" : "Soil Classification"}</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="font-bold text-slate-900 text-sm">
            {soilType}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {soilTexture}
          </div>
        </div>

        {/* Metric 2: pH Meter */}
        <div className={`p-4 rounded-2xl border ${phColor}`}>
          <div className="flex items-center justify-between text-xs mb-1 font-semibold">
            <span>{isTamil ? "மண் அமில/கார நிலை (pH)" : "Soil Reaction (pH)"}</span>
            <Activity className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black">{ph}</span>
            <span className="text-xs font-semibold">{phStatus}</span>
          </div>
          {/* Visual pH Bar */}
          <div className="w-full bg-slate-200/80 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${phBarColor}`}
              style={{ width: `${Math.min(100, Math.max(10, ((ph - 4) / 6) * 100))}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Organic Carbon */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">{isTamil ? "கரிம கரிம அளவு (OC)" : "Organic Carbon (OC)"}</span>
            <span className="text-xs font-bold text-slate-700">{oc}%</span>
          </div>
          <div className="font-bold text-slate-900 text-sm">
            {ocStatus}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            EC: {soilProfile.electrical_conductivity_ds_m || 0.35} dS/m ({isTamil ? "இயல்பான உப்புத்தன்மை" : "Non-saline"})
          </div>
        </div>

        {/* Metric 4: Soil Quality Index */}
        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80">
          <div className="flex items-center justify-between text-xs text-emerald-800 mb-1 font-semibold">
            <span>{isTamil ? "மண்வள தரம்" : "Productivity Rating"}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-bold text-emerald-950 text-sm">
            {rating}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">
            {isTamil ? "பரிசோதிக்கப்பட்ட மாதிரி" : "Audited against ICAR pedology"}
          </div>
        </div>
      </div>

      {/* Available Primary Nutrients (N - P - K) */}
      <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          {isTamil ? "பயிருக்கு கிடைக்கும் முதன்மை சத்துக்கள் (கி/ஹெக்)" : "Available Primary Nutrients (Soil Health Status)"}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Nitrogen */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 font-medium">
                {isTamil ? "தழைச்சத்து (N)" : "Available Nitrogen (N)"}
              </div>
              <div className="text-base font-bold text-slate-900">
                {nVal} <span className="text-xs font-normal text-slate-500">kg/ha</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              nVal > 280 ? 'bg-emerald-100 text-emerald-800' : (nVal >= 200 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800')
            }`}>
              {nStatus}
            </span>
          </div>

          {/* Phosphorus */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 font-medium">
                {isTamil ? "மணிச்சத்து (P)" : "Available Phosphorus (P)"}
              </div>
              <div className="text-base font-bold text-slate-900">
                {pVal} <span className="text-xs font-normal text-slate-500">kg/ha</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              pVal > 22 ? 'bg-purple-100 text-purple-800' : (pVal >= 12 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800')
            }`}>
              {pStatus}
            </span>
          </div>

          {/* Potassium */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-500 font-medium">
                {isTamil ? "சாம்பல் சத்து (K)" : "Available Potassium (K)"}
              </div>
              <div className="text-base font-bold text-slate-900">
                {kVal} <span className="text-xs font-normal text-slate-500">kg/ha</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              kVal > 280 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {kStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Soil Amendments & Fertilizer Adjustments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Soil Amendments */}
        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
          <div className="flex items-center gap-2 mb-2 font-bold text-amber-900 text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>{isTamil ? "மண்வள மேம்பாட்டு பரிந்துரைகள்" : "Soil Amendments & Reclamation"}</span>
          </div>
          <ul className="space-y-1.5 text-xs text-amber-950">
            {(soilProfile.amendments_needed || []).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5 font-bold">•</span>
                <span>{tSoilSentence(item, lang)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Dynamic Fertilizer Adjustments */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
          <div className="flex items-center gap-2 mb-2 font-bold text-emerald-900 text-xs uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{isTamil ? "மண் சார்ந்த உர அளவு மாற்றங்கள்" : "Dynamic Soil-Based Fertilizer Calibration"}</span>
          </div>
          <ul className="space-y-1.5 text-xs text-emerald-950">
            {(soilProfile.fertilizer_adjustments || []).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5 font-bold">✓</span>
                <span>{tSoilSentence(item, lang)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
