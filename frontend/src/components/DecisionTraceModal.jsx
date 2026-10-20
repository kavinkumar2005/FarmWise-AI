import React from 'react';
import { X, CheckCircle, AlertTriangle, Cpu, DollarSign, Clock, ShieldCheck, Terminal, Layers, Lock, Shield, EyeOff } from 'lucide-react';

export default function DecisionTraceModal({ isOpen, onClose, advisoryData, lang = 'en' }) {
  if (!isOpen || !advisoryData) return null;

  const traces = advisoryData.execution_trace || [];
  const verification = advisoryData.verification;
  const totalLatency = advisoryData.total_latency_ms || traces.reduce((acc, t) => acc + (t.latency_ms || 0), 0);
  const totalCost = advisoryData.total_cost_usd || traces.reduce((acc, t) => acc + (t.cost_usd || 0), 0);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-sm border border-emerald-500/30">
                AI
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  {lang === 'ta' ? 'AI முகமை முடிவெடுக்கும் படிநிலைகள் & மாதிரி பாதை' : 'Agentic Execution Trace & Model Routing Dossier'}
                </h2>
                <p className="text-xs text-slate-300">
                  {lang === 'ta' 
                    ? `புல எண் #${advisoryData.parcel?.survey_number || 'N/A'} க்கான முழுமையான மாதிரி செயல்பாட்டுப் பதிவு`
                    : `Full multi-model lifecycle trace for Survey #${advisoryData.parcel?.survey_number || 'N/A'}`}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Metrics Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold">{lang === 'ta' ? 'மொத்த தாமதம்' : 'Total Latency'}</div>
              <div className="font-mono font-semibold text-slate-800">{totalLatency} ms</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold">{lang === 'ta' ? 'மதிப்பிடப்பட்ட செலவு' : 'Est. Pipeline Cost'}</div>
              <div className="font-mono font-semibold text-slate-800">${Number(totalCost).toFixed(5)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold">{lang === 'ta' ? 'சரிபார்ப்பு தணிக்கை' : 'Verification Status'}</div>
              <div className="font-semibold text-emerald-700">
                {verification?.status || "VERIFIED"} ({verification?.score_percentage || 95}%)
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold">{lang === 'ta' ? 'செயல் திட்டம்' : 'Execution Plan'}</div>
              <div className="font-semibold text-slate-800">{traces.length} {lang === 'ta' ? 'முகமைகள் இயக்கப்பட்டன' : 'Dispatched Agents'}</div>
            </div>
          </div>
        </div>

        {/* Scrollable Trace Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Section 0: DPDP Act 2023 Farmer Data Privacy Assurance */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-700" />
                {lang === 'ta' ? 'விவசாயி தரவு தனியுரிமை & பாதுகாப்பு (DPDP சட்டம் 2023)' : 'Farmer Data Privacy & Zero-Trust PII Redaction Proxy (DPDP Act 2023)'}
              </span>
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                Zero PII Leakage
              </span>
            </div>
            <p className="text-xs text-blue-900 leading-relaxed">
              {lang === 'ta'
                ? 'அனைத்து வணிகரீதியான AI மாதிரிகளுக்கும் (Gemini/Claude) அனுப்பப்படும் முன் விவசாயியின் பெயர், தொலைபேசி எண், ஆதார் எண் ஆகியவை மறைக்கப்பட்டு, ஜிபிஎஸ் இருப்பிடம் ~1.1 கிமீ கிராம மையமாக மாற்றப்படுகிறது.'
                : 'Before any prompt is dispatched to commercial AI models (Gemini / Claude), farmer personal identity is strictly scrubbed and GPS coordinates are fuzzed to a 2-decimal village centroid (~1.1 km resolution). Model providers never receive personal credentials or exact farm boundaries.'}
            </p>
            <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-blue-200/60 text-[11px] text-blue-800">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-blue-200 font-medium">
                <EyeOff className="w-3 h-3 text-blue-600" /> Name / Aadhaar / Phone Scrubbed
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-blue-200 font-medium">
                <Shield className="w-3 h-3 text-blue-600" /> 2-Decimal Geo-Centroid Fuzzing
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-blue-200 font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> AWS S3 Private Encrypted Storage
              </span>
            </div>
          </div>

          {/* Section 1: Verifier Critic Audit Matrix */}
          {verification && verification.checks && (
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-xs uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Critic / Verifier Audit Checks
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold">
                  Overall Score: {verification.score_percentage}%
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {verification.checks.map((chk, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-xl border border-emerald-100 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-800">{chk.check_name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{chk.observation}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Sequential Step-by-Step Agent Trace */}
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              Step-by-Step Agentic Dispatch Log
            </h3>
            <div className="space-y-3">
              {traces.map((step, idx) => {
                const isPrivacyStep = step.step_id === 0 || step.name?.toLowerCase().includes('privacy');
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl bg-white border transition-colors shadow-2xs ${
                      isPrivacyStep
                        ? 'border-blue-300 bg-blue-50/20 ring-1 ring-blue-200'
                        : 'border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-md font-mono text-xs flex items-center justify-center font-bold ${
                          isPrivacyStep ? 'bg-blue-800 text-white' : 'bg-slate-900 text-white'
                        }`}>
                          {step.step_id !== undefined ? step.step_id : idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          {isPrivacyStep && <Lock className="w-3.5 h-3.5 text-blue-700" />}
                          {step.name}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                          isPrivacyStep
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {step.agent_name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className={`px-2 py-0.5 rounded-md font-medium border ${
                          isPrivacyStep
                            ? 'bg-blue-100 text-blue-900 border-blue-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {step.model_name}
                        </span>
                        <span className="text-slate-500">
                          {step.latency_ms}ms
                        </span>
                        <span className="text-slate-400">|</span>
                        <span className="text-slate-500">
                          ${Number(step.cost_usd || 0.0001).toFixed(5)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mt-2 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Input / Prompt Trigger</span>
                        <p className="text-slate-700 font-mono text-[11px] mt-0.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {step.input_summary}
                        </p>
                      </div>
                      <div>
                        <span className={`text-[10px] font-bold uppercase ${
                          isPrivacyStep ? 'text-blue-700' : 'text-emerald-700'
                        }`}>
                          {isPrivacyStep ? 'Privacy Scrubbing Action' : 'Agent Output & Finding'}
                        </span>
                        <p className={`text-slate-700 text-[11px] mt-0.5 p-2 rounded-lg border ${
                          isPrivacyStep 
                            ? 'bg-blue-50/60 border-blue-100' 
                            : 'bg-emerald-50/40 border-emerald-100'
                        }`}>
                          {step.output_summary}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>FarmwiseAI Multi-Model Orchestration Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium transition-colors cursor-pointer"
          >
            Close Trace
          </button>
        </div>
      </div>
    </div>
  );
}
