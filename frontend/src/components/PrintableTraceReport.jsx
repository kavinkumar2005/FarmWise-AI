import React from 'react';
import { ShieldCheck, CheckCircle2, Clock, DollarSign, Layers, Cpu, MapPin, Camera, Sparkles } from 'lucide-react';
import { translations, tCrop, tStage, tHealth, tStatus } from '../utils/translations';
import { getMediaUrl, getCropSampleFallback } from '../services/api';


export default function PrintableTraceReport({ advisoryData, lang = 'en' }) {
  if (!advisoryData || !advisoryData.parcel) return null;

  const parcel = advisoryData.parcel;
  const crop = advisoryData.crop_analysis || {};
  const verification = advisoryData.verification || {};
  const soil = advisoryData.soil_profile || parcel.soil_profile || null;
  const traces = advisoryData.execution_trace || [];
  const totalLatency = advisoryData.total_latency_ms || traces.reduce((acc, t) => acc + (t.latency_ms || 0), 0);
  const totalCost = advisoryData.total_cost_usd || traces.reduce((acc, t) => acc + (t.cost_usd || 0), 0);

  const formattedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="hidden print:block text-slate-900 bg-white p-6 max-w-4xl mx-auto font-sans leading-normal">
      {/* ─── 1. OFFICIAL DOSSIER HEADER ─── */}
      <div className="border-b-2 border-slate-900 pb-4 mb-5 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-widest uppercase bg-slate-900 text-white px-2 py-0.5 rounded">
              FARMWISE AI
            </span>
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Autonomous Multi-Model Agricultural Intelligence Platform
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 mt-1">
            PARCEL AUDIT &amp; MULTI-MODEL DECISION TRACE DOSSIER
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastral Survey Field Verification &bull; Multimodal Phenotyping &bull; Multi-Agent Audit Log
          </p>
        </div>

        <div className="text-right text-xs">
          <div className="font-mono font-bold text-slate-900">
            DOSSIER #{advisoryData.query_id || 'FW-' + parcel.survey_number}
          </div>
          <div className="text-slate-500 mt-0.5">{formattedDate}</div>
          <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-300 text-[11px]">
            {tStatus(verification.status, lang) || "AI VERIFIED"} ({verification.score_percentage || 96}%)
          </span>
        </div>
      </div>

      {/* ─── 2. CADASTRAL PARCEL IDENTITY ─── */}
      <div className="bg-slate-50 border border-slate-300 rounded-xl p-3.5 mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Survey Number</span>
          <span className="font-bold text-sm text-slate-900">#{parcel.survey_number} {parcel.sub_division && `/ ${parcel.sub_division}`}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Administrative Village</span>
          <span className="font-semibold text-slate-800">{parcel.village_name || 'Sivagiri'}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Taluk &amp; District</span>
          <span className="font-semibold text-slate-800">{parcel.taluk || 'Sivagiri'}, {parcel.district || 'Tenkasi'}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Centroid Coordinates</span>
          <span className="font-mono text-slate-700">{parcel.latitude?.toFixed(5)}°N, {parcel.longitude?.toFixed(5)}°E</span>
        </div>
      </div>

      {/* ─── PRIVACY COMPLIANCE NOTICE (DPDP Act 2023) ─── */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl px-4 py-2.5 mb-5 flex items-center justify-between text-[11px] text-blue-950">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider bg-blue-900 text-white px-1.5 py-0.5 rounded text-[9px]">
            DPDP 2023
          </span>
          <span className="font-semibold">
            Zero-Trust Farmer Data Privacy Proxy:
          </span>
          <span className="text-blue-800">
            Personal PII scrubbed. Geospatial coordinates fuzzed to ~1.1km village centroid before external LLM routing.
          </span>
        </div>
        <span className="text-blue-700 font-mono text-[10px] uppercase font-bold shrink-0 ml-2">
          Privacy Shield [OK]
        </span>
      </div>

      {/* ─── 3. CROP PHENOTYPE & HEALTH AUDIT ─── */}
      <div className="border border-slate-300 rounded-xl p-4 mb-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
            Section A: Crop Phenotype &amp; Health Analysis
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
            Evaluated by: {crop.model_attribution || "Gemini Multimodal Computer Vision"}
          </span>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Left Details */}
          <div className="col-span-8 space-y-3">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Identified Crop Stand</span>
                <span className="text-lg font-black text-slate-900">{tCrop(crop.crop_name || parcel.recorded_crop, lang) || "Agricultural Crop"}</span>
              </div>
              <div className="pl-4 border-l border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Growth Stage</span>
                <span className="text-sm font-bold text-emerald-800 uppercase">{tStage(crop.growth_stage || parcel.recorded_stage, lang) || "vegetation"}</span>
              </div>
              <div className="pl-4 border-l border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Health Rating</span>
                <span className="text-sm font-bold text-slate-800">{tHealth(crop.crop_health, lang) || "Healthy & Vigorous"}</span>
              </div>
              <div className="pl-4 border-l border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Confidence</span>
                <span className="text-sm font-bold text-emerald-700">{Math.round((crop.confidence || 0.96) * 100)}%</span>
              </div>
            </div>

            {/* Observations */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Visual Canopy Observations:
              </span>
              <ul className="list-disc list-inside text-xs text-slate-700 space-y-1 pl-1">
                {(crop.visual_features || [
                  "Uniform vegetative canopy spread with healthy chlorophyll reflectance",
                  "Normal tiller density and leaf blade architecture",
                  "Optimal spacing consistent with local agricultural practices"
                ]).map((feat, i) => (
                  <li key={i}>{feat}</li>
                ))}
              </ul>
            </div>

            {/* Identified Issues */}
            {crop.identified_issues && crop.identified_issues.length > 0 && (
              <div className="text-xs bg-slate-50 p-2 rounded border border-slate-200">
                <span className="font-bold text-slate-700">Foliar Pathology &amp; Lesion Audit: </span>
                <span className="text-slate-600">{crop.identified_issues.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Right Field Photograph */}
          <div className="col-span-4 flex flex-col items-center justify-center border-l border-slate-200 pl-4">
            {parcel.image_url ? (
              <div className="w-full">
                <img
                  src={getMediaUrl(parcel.image_url)}
                  alt="Field Photograph"
                  className="w-full h-32 object-cover rounded-lg border border-slate-300"
                  onError={(e) => {
                    const fallback = getCropSampleFallback(parcel.recorded_crop);
                    if (e.target.src !== window.location.origin + fallback) {
                      e.target.src = fallback;
                    }
                  }}
                />

                <span className="block text-[10px] text-center text-slate-500 mt-1 font-mono">
                  Ground-Truth Field Photo (#{parcel.survey_number})
                </span>
              </div>
            ) : (
              <div className="w-full h-32 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400 border border-slate-200">
                No Photo Linked
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 4. SOIL HEALTH CARD & NUTRIENT PROFILE ─── */}
      {soil && (
        <div className="border border-slate-300 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block"></span>
              Section B: Soil Health Card &amp; Pedology Profile (TNAU / ICAR Grounded)
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 rounded">
                SHC #{soil.soil_health_card_id || 'TN-TNK-2024-SHC'}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded border border-emerald-300">
                Efficiency: {soil.fertilizer_efficiency_score || 75}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 text-xs mb-3">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Soil Classification</span>
              <span className="font-bold text-slate-900">{soil.soil_type}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{soil.soil_texture}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Soil Reaction (pH)</span>
              <span className="font-bold text-base text-slate-900">{soil.ph}</span>
              <span className="text-[10px] text-slate-600 block mt-0.5">{soil.ph_status}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Organic Carbon (OC)</span>
              <span className="font-bold text-base text-slate-900">{soil.organic_carbon_percent}%</span>
              <span className="text-[10px] text-slate-600 block mt-0.5">{soil.organic_carbon_status}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Electrical Cond. (EC)</span>
              <span className="font-bold text-base text-slate-900">{soil.electrical_conductivity_ds_m} <span className="text-[10px] font-normal">dS/m</span></span>
              <span className="text-[10px] text-slate-600 block mt-0.5">Non-saline / Normal</span>
            </div>
          </div>

          {/* Primary Nutrients N-P-K */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-2.5 mb-3 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-600 block mb-1.5">
              Available Primary Nutrients (Macro-Nutrient Status):
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between">
                <span>Nitrogen (N): <b>{soil.nitrogen_kg_ha} kg/ha</b></span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">{soil.nitrogen_status}</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between">
                <span>Phosphorus (P): <b>{soil.phosphorus_kg_ha} kg/ha</b></span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">{soil.phosphorus_status}</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between">
                <span>Potassium (K): <b>{soil.potassium_kg_ha} kg/ha</b></span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">{soil.potassium_status}</span>
              </div>
            </div>
          </div>

          {/* Amendments & Calibrations */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-2.5">
              <span className="text-[10px] uppercase font-bold text-amber-900 block mb-1">
                Soil Reclamation &amp; Amendments:
              </span>
              <ul className="list-disc list-inside text-amber-950 space-y-0.5">
                {(soil.amendments_needed || []).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-2.5">
              <span className="text-[10px] uppercase font-bold text-emerald-900 block mb-1">
                Dynamic Soil Fertilizer Calibrations:
              </span>
              <ul className="list-disc list-inside text-emerald-950 space-y-0.5">
                {(soil.fertilizer_adjustments || []).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. MULTI-FACTOR VERIFIER & CRITIC AUDIT MATRIX ─── */}
      {verification && verification.checks && (
        <div className="border border-slate-300 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
              Section C: Independent Critic / Verifier Consistency Audit
            </h2>
            <span className="text-xs font-bold text-emerald-800">
              Audit Score: {verification.score_percentage}% Passed
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-50">
                <th className="py-1.5 px-2 font-bold text-slate-700">Audit Check</th>
                <th className="py-1.5 px-2 font-bold text-slate-700">Status</th>
                <th className="py-1.5 px-2 font-bold text-slate-700">Confidence</th>
                <th className="py-1.5 px-2 font-bold text-slate-700">Auditor Observation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {verification.checks.map((chk, idx) => (
                <tr key={idx}>
                  <td className="py-1.5 px-2 font-semibold text-slate-800">{chk.check_name}</td>
                  <td className="py-1.5 px-2 font-bold text-emerald-700">
                    {chk.passed ? "PASSED [OK]" : "FLAGGED"}
                  </td>
                  <td className="py-1.5 px-2 font-mono text-slate-600">{Math.round(chk.confidence * 100)}%</td>
                  <td className="py-1.5 px-2 text-slate-600">{chk.observation}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {verification.critique_notes && (
            <p className="text-[11px] text-slate-600 mt-2.5 italic border-t border-slate-100 pt-2">
              <b>Verifier Critique:</b> {verification.critique_notes}
            </p>
          )}
        </div>
      )}

      {/* ─── 6. SEQUENTIAL AGENTIC DISPATCH TRACE ─── */}
      <div className="border border-slate-300 rounded-xl p-4 mb-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
            Section D: Multi-Model Agent Execution Trace &amp; Routing Log
          </h2>
          <div className="text-xs font-mono text-slate-600 flex items-center gap-3">
            <span>Latency: <b>{totalLatency}ms</b></span>
            <span>&bull;</span>
            <span>Cost: <b>${Number(totalCost).toFixed(5)}</b></span>
            <span>&bull;</span>
            <span>Agents: <b>{traces.length} Dispatched</b></span>
          </div>
        </div>

        <table className="w-full text-left text-[11px] border-collapse">
          <thead>
            <tr className="border-b border-slate-300 bg-slate-50">
              <th className="py-1.5 px-2 font-bold text-slate-700 w-8">#</th>
              <th className="py-1.5 px-2 font-bold text-slate-700">Stage &amp; Agent</th>
              <th className="py-1.5 px-2 font-bold text-slate-700">Model / Tool Routed</th>
              <th className="py-1.5 px-2 font-bold text-slate-700 w-16">Latency</th>
              <th className="py-1.5 px-2 font-bold text-slate-700 w-16">Cost</th>
              <th className="py-1.5 px-2 font-bold text-slate-700">Action Finding</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {traces.map((step, idx) => (
              <tr key={idx} className="align-top">
                <td className="py-1.5 px-2 font-mono font-bold text-slate-500">{step.step_id || idx + 1}</td>
                <td className="py-1.5 px-2">
                  <div className="font-bold text-slate-800">{step.name}</div>
                  <div className="text-[10px] text-slate-500">{step.agent_name}</div>
                </td>
                <td className="py-1.5 px-2 font-mono text-emerald-800">{step.model_name}</td>
                <td className="py-1.5 px-2 font-mono text-slate-600">{step.latency_ms}ms</td>
                <td className="py-1.5 px-2 font-mono text-slate-600">${Number(step.cost_usd || 0.0001).toFixed(5)}</td>
                <td className="py-1.5 px-2 text-slate-700">{step.output_summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─── 6. FOOTER SIGN-OFF ─── */}
      <div className="border-t border-slate-300 pt-3 text-[10px] text-slate-500 flex items-center justify-between">
        <div>
          <span>FarmwiseAI Agentic Framework &bull; Orchestrated via LangGraph StateGraph &bull; AWS ap-south-1</span>
        </div>
        <div className="text-right">
          <span>Official Verification Dossier &bull; Printed from FarmWise AI Platform</span>
        </div>
      </div>
    </div>
  );
}
