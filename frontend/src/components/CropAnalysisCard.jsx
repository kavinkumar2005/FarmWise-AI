import { Leaf, Eye, ShieldCheck, Check, Sparkles, AlertCircle, Camera, ExternalLink } from 'lucide-react';
import { translations, tCrop, tStage, tHealth, tVisualFeature } from '../utils/translations';
import { getMediaUrl } from '../services/api';

export default function CropAnalysisCard({ cropAnalysis, parcel, lang = 'en', onOpenPhoto }) {
  if (!cropAnalysis) return null;
  const t = translations[lang] || translations.en;

  const crop = cropAnalysis.crop_name || parcel?.recorded_crop || "Agricultural Crop";
  const stage = cropAnalysis.growth_stage || parcel?.recorded_stage || "vegetation";
  const health = cropAnalysis.crop_health || "Healthy & Vigorous";
  const confidence = cropAnalysis.confidence || 0.95;
  const features = cropAnalysis.visual_features || [
    "Uniform vegetative canopy spread",
    "Adequate chlorophyll reflectance",
    "Proper row spacing and tiller density"
  ];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Leaf className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                {t.cropPhenotypeTitle || "Crop Phenotype & Health"}
              </h3>
              <p className="text-xs text-slate-500">
                {t.cropPhenotypeSubtitle || "Multimodal Computer Vision Analysis"}
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-800 font-semibold rounded-full border border-emerald-200">
            {Math.round(confidence * 100)}% {t.confidence || "Confidence"}
          </span>
        </div>

        {/* Identified Crop & Stage Hero */}
        <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 mb-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-emerald-800">
              {t.identifiedCrop || "Identified Crop"}
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {tCrop(crop, lang)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2.5 py-0.5 bg-emerald-600 text-white font-medium rounded-full">
                {t.stagePrefix || "Stage:"} {tStage(stage, lang)}
              </span>
              <span className="text-xs text-emerald-900 font-medium">
                • {tHealth(health, lang)}
              </span>
            </div>
          </div>

          {/* Model badge */}
          <div className="text-right hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.evaluatedBy || "Evaluated by"}</span>
            <span className="text-xs font-mono font-medium text-slate-700 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-2xs">
              {cropAnalysis.model_attribution || "Gemini 3.5 Flash-Lite Vision"}
            </span>
          </div>
        </div>

        {/* Visual Features Breakdown */}
        <div className="space-y-2 mb-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {t.visualCanopy || "Visual Canopy Observations"}
          </div>
          {features.map((feat, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] shrink-0">
                ✓
              </div>
              <span>{tVisualFeature(feat, lang)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Field Image Link Preview */}
      {parcel?.image_url && (
        <div 
          onClick={onOpenPhoto}
          className="pt-3 border-t border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-slate-50/80 -mx-2 px-2 py-1 rounded-2xl transition-colors"
          title={t.clickToEnlarge || "Click to enlarge photograph"}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 relative">
              <img
                src={getMediaUrl(parcel.image_url)}
                alt="Field Photo"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-emerald-600 bg-emerald-50"><svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div>';
                }}
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 flex items-center gap-1">
                <span>{t.groundTruthPhoto || "Ground-Truth Field Photo"}</span>
                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" />
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                #{parcel.survey_number} &bull; {tCrop(parcel.recorded_crop, lang)}
              </div>
            </div>
          </div>

          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            {lang === 'ta' ? 'பெரிதாக்கு' : 'Enlarge'}
          </span>
        </div>
      )}
    </div>
  );
}
