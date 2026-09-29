import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Database
} from 'lucide-react';
import { FinalResult } from '@farmwise/agent-core';
import { Language } from '../../../types/ui.js';

interface EvidenceTabProps {
  result: FinalResult;
  lang: Language;
}

export const EvidenceTab: React.FC<EvidenceTabProps> = ({ result, lang }) => {
  const { verification, parcel, cropAssessment, landRecord, weather } = result;

  const centroid = parcel.centroid || { latitude: 9.3512, longitude: 77.4819 };

  return (
    <div className="space-y-6">
      {/* Evidence & Provenance Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-gray-500 uppercase tracking-wider mb-1">
            <Database className="w-4 h-4 text-[#2E7D32]" />
            <span>Task 1 Data Compliance & Provenance Ledger</span>
          </div>
          <h3 className="text-lg font-bold text-[#0F3D26]">
            {lang === 'en'
              ? 'Multi-Tier Sourced Evidence & Verification Audit'
              : 'சான்றளிக்கப்பட்ட தகவல் ஆதாரம் மற்றும் சரிபார்ப்பு தணிக்கை'}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Every data element carries explicit provenance, model attribution, and deterministic verification pass/fail audit.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono bg-green-100 text-green-900 px-3 py-1.5 rounded-xl font-bold border border-green-300">
            Audit Status: {verification.overallStatus}
          </span>
        </div>
      </div>

      {/* 7 Deterministic Verification Checks Matrix */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#2E7D32]" />
            <h4 className="font-bold text-base text-[#0F3D26]">
              {lang === 'en' ? '7-Point Domain Verification Matrix' : '7 கட்ட கள சரிபார்ப்பு தணிக்கை'}
            </h4>
          </div>
          <span className="text-xs font-mono text-gray-500">
            Critic: Claude 3.5 Sonnet & Deterministic Rules
          </span>
        </div>

        <div className="divide-y divide-gray-100 text-xs">
          {verification.checks.map((chk, i) => {
            const isPass = chk.status === 'pass';
            return (
              <div key={i} className="py-3 flex items-start justify-between gap-4">
                <div className="flex items-start space-x-2.5">
                  <div className="mt-0.5">
                    {isPass ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{chk.name}</div>
                    <p className="text-gray-500 mt-0.5">{chk.explanation || chk.evidence}</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                      isPass
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {chk.status.toUpperCase()}
                  </span>
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                    Type: {chk.type}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Provenance Origin Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h4 className="font-bold text-base text-[#0F3D26]">
          {lang === 'en' ? 'Data Provenance Classification' : 'தரவு மூலங்களின் வகைப்பாடு'}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-green-200 bg-green-50/40">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-green-800 block mb-1">
              Cadastral Boundary
            </span>
            <div className="font-bold text-gray-900">FarmwiseAI-provided</div>
            <div className="text-gray-500 mt-1 font-mono text-[11px]">
              Thoothukudi & Tenkasi Cadastral Map (Park_Cadastral_Map.geojson)
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-800 block mb-1">
              Live Weather
            </span>
            <div className="font-bold text-gray-900">Public source</div>
            <div className="text-gray-500 mt-1 font-mono text-[11px]">
              {weather.source} (Centroid: {centroid.latitude.toFixed(2)}°N)
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-800 block mb-1">
              Vision Crop Assessment
            </span>
            <div className="font-bold text-gray-900">{cropAssessment.provenance}</div>
            <div className="text-gray-500 mt-1 font-mono text-[11px]">
              Titan Multimodal kNN + {cropAssessment.modelUsed}
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 block mb-1">
              Land Document / Patta
            </span>
            <div className="font-bold text-gray-900">{landRecord.provenance}</div>
            <div className="text-gray-500 mt-1 font-mono text-[11px]">
              Record: {landRecord.recordId} (Classification: {landRecord.classification})
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 sm:col-span-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 block mb-1">
              Agronomic Knowledge Corpus
            </span>
            <div className="font-bold text-gray-900">Public source / TNAU Agronomy</div>
            <div className="text-gray-500 mt-1 font-mono text-[11px]">
              Tamil Nadu Agricultural University Crop Production Guide (2024 Edition)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
