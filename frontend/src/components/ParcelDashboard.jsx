import React, { useState } from 'react';
import { MapPin, Calendar, Layers, ShieldCheck, Share2, Printer, ChevronRight, Camera, Sparkles, X, ExternalLink } from 'lucide-react';
import ParcelMap from './ParcelMap';
import CropAnalysisCard from './CropAnalysisCard';
import WeatherCard from './WeatherCard';
import AdvisoryCard from './AdvisoryCard';
import DecisionTraceModal from './DecisionTraceModal';
import PrintableTraceReport from './PrintableTraceReport';
import { translations, tCrop, tStage, tStatus } from '../utils/translations';
import { getMediaUrl, getCropSampleFallback } from '../services/api';


export default function ParcelDashboard({ lang = 'en', advisoryData, onNewSearch }) {
  const [isTraceOpen, setIsTraceOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const t = translations[lang] || translations.en;

  if (!advisoryData || !advisoryData.parcel) return null;

  const parcel = advisoryData.parcel;
  const crop = advisoryData.crop_analysis;
  const weather = advisoryData.weather;
  const verification = advisoryData.verification;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ─── ON-SCREEN INTERACTIVE DASHBOARD (Hidden on Print) ─── */}
      <div className="screen-only-dashboard space-y-6">
        {/* Top Breadcrumb & Parcel Identity Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5 font-medium">
                <span>{t.landRecordsBreadcrumb || "Tamil Nadu Land Records"}</span>
                <span>/</span>
                <span>{parcel.district || "Tenkasi"}</span>
                <span>/</span>
                <span>{parcel.taluk || "Sivagiri"}</span>
                <span>/</span>
                <span className="text-emerald-700 font-bold">{parcel.village_name || "Sivagiri"}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {t.surveyParcel || "Survey Parcel"} #{parcel.survey_number}
                  {parcel.sub_division && <span className="text-slate-400 text-xl font-medium"> / {parcel.sub_division}</span>}
                </h1>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  {tStatus(verification?.status, lang) || "AI VERIFIED"} ({verification?.score_percentage || 96}%)
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 mt-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{t.centroid || "Centroid"}: {parcel.latitude.toFixed(5)}° N, {parcel.longitude.toFixed(5)}° E</span>
                <span className="text-slate-300">•</span>
                <span>{t.recordedCrop || "Crop"}: <b>{tCrop(parcel.recorded_crop, lang)}</b> ({tStage(parcel.recorded_stage, lang)})</span>
              </p>
            </div>

            {/* Action CTAs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTraceOpen(true)}
                className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>{t.aiTraceBtn || "View AI Decision Trace"}</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold shadow-2xs hover:shadow-xs"
                title="Print Structured Audit & Trace PDF Document"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">{t.printTracePdf || "Print Trace & Crop PDF"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid: Left (Map & Photo) | Right (Phenotype & Weather) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Cadastral Map + Field Photo */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    {t.cadastralTitle || "Cadastral Parcel & FMB Boundary"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t.cadastralSubtitle || "Interactive GIS layer showing survey perimeter and field centroid"}
                  </p>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {t.mapBadge || "Leaflet + GeoJSON"}
                </span>
              </div>
              
              <ParcelMap parcel={parcel} lang={lang} />
            </div>

            {/* Linked Field Photo Card */}
            {parcel.image_url && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-slate-900 text-base">
                      {t.groundTruthPhoto || "Ground-Truth Field Photograph"}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {parcel.timestamp || "2024-11-08"}
                  </span>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-slate-200 group">
                  <img
                    src={getMediaUrl(parcel.image_url)}
                    alt={`Field Photo for Survey ${parcel.survey_number}`}
                    className="w-full h-64 sm:h-80 object-cover group-hover:scale-102 transition-transform duration-300"
                    onError={(e) => {
                      const fallback = getCropSampleFallback(parcel.recorded_crop);
                      if (e.target.src !== window.location.origin + fallback) {
                        e.target.src = fallback;
                      }
                    }}
                  />

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-4 text-white">
                    <div className="font-bold text-sm">
                      {tCrop(parcel.recorded_crop, lang)} ({tStage(parcel.recorded_stage, lang)})
                    </div>
                    <div className="text-xs text-slate-300 font-mono">
                      Image: {parcel.image_path}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column (5 cols): Crop Phenotyping & Micro-Climate */}
          <div className="lg:col-span-5 space-y-6">
            <CropAnalysisCard
              cropAnalysis={crop}
              parcel={parcel}
              lang={lang}
              onOpenPhoto={() => setIsPhotoModalOpen(true)}
            />

            <WeatherCard weather={weather} lang={lang} />
          </div>
        </div>

        {/* Full-width Advisory & Nutrient Schedule Section */}
        <AdvisoryCard
          advisoryData={advisoryData}
          lang={lang}
          onOpenTrace={() => setIsTraceOpen(true)}
        />
      </div>

      {/* ─── DEDICATED STRUCTURED PDF DOCUMENT (Printed on window.print()) ─── */}
      <div className="print-only-dossier">
        <PrintableTraceReport advisoryData={advisoryData} lang={lang} />
      </div>

      {/* Decision Trace Modal */}
      <DecisionTraceModal
        isOpen={isTraceOpen}
        onClose={() => setIsTraceOpen(false)}
        advisoryData={advisoryData}
        lang={lang}
      />

      {/* Field Photo Enlarge Modal / Lightbox */}
      {isPhotoModalOpen && parcel?.image_url && (
        <div 
          className="fixed inset-0 z-[2500] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in no-print"
          onClick={() => setIsPhotoModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col my-auto max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Ground-Truth Field Photograph
                  </h3>
                  <p className="text-xs text-slate-400">
                    Survey #{parcel.survey_number} &bull; {parcel.village_name} &bull; {parcel.recorded_crop} ({parcel.recorded_stage})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={getMediaUrl(parcel.image_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image Container */}
            <div className="p-4 bg-slate-950 flex items-center justify-center overflow-auto max-h-[72vh]">
              <img
                src={getMediaUrl(parcel.image_url)}
                alt={`Survey ${parcel.survey_number} Field Photo`}
                className="max-h-[68vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
                onError={(e) => {
                  const fallback = getCropSampleFallback(parcel.recorded_crop);
                  if (e.target.src !== window.location.origin + fallback) {
                    e.target.src = fallback;
                  }
                }}
              />

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-4">
                <span>Centroid: {parcel.latitude?.toFixed(5)}°N, {parcel.longitude?.toFixed(5)}°E</span>
                <span>Source: {parcel.image_path || 'Field Survey'}</span>
              </div>
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
