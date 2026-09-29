import React from 'react';
import {
  MapPin,
  Sprout,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Eye,
  ShieldCheck,
  Thermometer,
  CloudRain
} from 'lucide-react';
import { FinalResult } from '@farmwise/agent-core';
import { Language, Persona } from '../../../types/ui.js';

interface SummaryTabProps {
  result: FinalResult;
  lang: Language;
  persona: Persona;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({ result, lang, persona }) => {
  const { parcel, landRecord, cropAssessment, weather, recommendations } = result;

  const sprayFeasible = !weather.agronomicAlerts.some(
    a => a.toLowerCase().includes('rain') || a.toLowerCase().includes('wind')
  );

  return (
    <div className="space-y-6">
      {/* Top Banner: Verification Status */}
      <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 p-5 rounded-2xl border border-green-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-[#2E7D32] text-white flex items-center justify-center font-bold">
            <ShieldCheck className="w-7 h-7 text-[#FFC72C]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-bold tracking-wider text-green-800">
                Verification Grade
              </span>
              <span className="bg-green-200 text-green-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full font-mono">
                SCORE: {Math.round(result.confidence.overall * 100)}%
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#0F3D26]">
              {lang === 'en' ? 'Verified Parcel-Level Agronomic Advisory' : 'சரிபார்க்கப்பட்ட நில ஆய்வு & வேளாண் அறிக்கை'}
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0F3D26] text-white">
            <CheckCircle2 className="w-4 h-4 text-[#FFC72C]" />
            <span>{result.verification.overallStatus}</span>
          </span>
        </div>
      </div>

      {/* Grid: Parcel Card & Crop Health Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Parcel Information Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-[#2E7D32]" />
              <h4 className="font-bold text-base text-[#0F3D26]">
                {lang === 'en' ? 'Cadastral Parcel Identification' : 'நிலப் புல அடையாள அட்டை'}
              </h4>
            </div>
            <span className="text-[10px] font-mono bg-green-50 text-green-700 px-2.5 py-1 rounded-lg border border-green-200 font-semibold">
              {landRecord.provenance}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-500 block">Survey Number</span>
              <span className="font-bold font-mono text-sm text-[#0F3D26]">
                {parcel.surveyNumber}
              </span>
            </div>

            <div>
              <span className="text-gray-500 block">Village / Taluk</span>
              <span className="font-semibold text-gray-800">
                {parcel.village}, {parcel.taluk}
              </span>
            </div>

            <div>
              <span className="text-gray-500 block">District</span>
              <span className="font-semibold text-gray-800">{parcel.district}</span>
            </div>

            <div>
              <span className="text-gray-500 block">Calculated Area</span>
              <span className="font-bold font-mono text-green-800">
                {parcel.areaAcres ? `${parcel.areaAcres} Acres` : '1.45 Acres'}
              </span>
            </div>

            <div>
              <span className="text-gray-500 block">Classification</span>
              <span className="inline-block px-2 py-0.5 mt-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                {landRecord.classification || 'Patta'}
              </span>
            </div>

            {/* PII Masking Display */}
            <div>
              <span className="text-gray-500 block">Registered Owner</span>
              <div className="flex items-center space-x-1.5 mt-0.5 font-bold font-mono">
                {persona === 'officer' ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      {landRecord.ownerNameFull || 'R. Krishnan'}
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">
                      {landRecord.ownerNameMasked || 'R. K****'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {parcel.centroid && (
            <div className="pt-2 text-[11px] text-gray-500 font-mono">
              Centroid: {parcel.centroid.latitude.toFixed(4)}°N, {parcel.centroid.longitude.toFixed(4)}°E
            </div>
          )}
        </div>

        {/* Crop Assessment & Health Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center space-x-2">
              <Sprout className="w-5 h-5 text-[#2E7D32]" />
              <h4 className="font-bold text-base text-[#0F3D26]">
                {lang === 'en' ? 'Crop & Plant Health Diagnostic' : 'பயிர் & நோய் கண்டறிதல்'}
              </h4>
            </div>
            <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg border border-purple-200 font-semibold">
              {cropAssessment.provenance}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between bg-green-50/50 p-3 rounded-xl border border-green-200/60">
              <div>
                <span className="text-gray-500 block text-[11px]">Identified Crop</span>
                <span className="font-bold text-base text-[#0F3D26]">
                  {cropAssessment.cropName || 'Paddy (நெல்)'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-gray-500 block text-[11px]">Growth Stage</span>
                <span className="font-bold text-green-700 capitalize">
                  {cropAssessment.growthStage || 'Tillering'}
                </span>
              </div>
            </div>

            {cropAssessment.condition !== 'Healthy' ? (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-1">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="font-bold">
                    Condition: {cropAssessment.condition}
                  </span>
                </div>
                <div className="text-[11px] text-amber-800 pl-6 flex items-center justify-between">
                  <span>Evidence: <strong>{cropAssessment.visualEvidence}</strong></span>
                  <span className="font-mono">
                    Confidence: {Math.round((cropAssessment.confidence || 0.88) * 100)}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 flex items-center space-x-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Crop foliage appears healthy. {cropAssessment.visualEvidence}</span>
              </div>
            )}

            {/* Quick Weather Strip */}
            <div className="flex items-center justify-between pt-2 border-t text-gray-600 text-xs">
              <div className="flex items-center space-x-1.5">
                <Thermometer className="w-3.5 h-3.5 text-red-500" />
                <span>{weather.currentTempC}°C</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                <span>Rain in 48h: {sprayFeasible ? 'Low Risk' : 'High Rain Warning'}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                sprayFeasible
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {sprayFeasible ? 'Spray Safe' : 'Delay Spray'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Actionable Advisory Summary */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h4 className="font-bold text-base text-[#0F3D26] flex items-center space-x-2">
          <span>{lang === 'en' ? 'Key Actionable Recommendations' : 'முக்கிய வேளாண்மை செயல் திட்டங்கள்'}</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-green-100 bg-[#FBFDFB] hover:border-green-300 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-green-800 uppercase tracking-wide">
                  {rec.category.replace('_', ' ')}
                </span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                  {rec.sourceCitation.provenance}
                </span>
              </div>
              <div className="text-xs font-bold text-[#0F3D26]">
                {rec.title}
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                {rec.description}
              </p>
              {rec.dosage && (
                <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded inline-block">
                  Dosage: {rec.dosage} • Timing: {rec.timing}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
