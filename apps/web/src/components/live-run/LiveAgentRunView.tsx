import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Cpu,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
  FileCheck,
  Zap,
  CornerDownRight
} from 'lucide-react';
import { Plan } from '@farmwise/agent-core';
import { Language, LiveStepStatus } from '../../types/ui.js';

interface LiveAgentRunViewProps {
  lang: Language;
  runId: string;
  plan: Plan | null;
  stepStatuses: LiveStepStatus[];
  isRunning: boolean;
  clarifyingQuestions?: string[];
  onClarify: (answer: { surveyNumber: string; village: string }) => void;
  onViewResults: () => void;
  costComparison?: {
    routedCostUSD: number;
    baselineCostUSD: number;
    savingsPct: number;
  };
}

export const LiveAgentRunView: React.FC<LiveAgentRunViewProps> = ({
  lang,
  runId,
  plan,
  stepStatuses,
  isRunning,
  clarifyingQuestions,
  onClarify,
  onViewResults,
  costComparison
}) => {
  const [clarifySurvey, setClarifySurvey] = useState('202/55');
  const [clarifyVillage, setClarifyVillage] = useState('Sanganaperi');

  const allCompleted =
    stepStatuses.length > 0 &&
    stepStatuses.every(s => s.status === 'completed' || s.status === 'escalated');

  return (
    <div className="w-full space-y-4">
      {/* Run Header / Live Status Bar */}
      <div className="bg-[#0F3D26] text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-green-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-green-300 mb-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span>RUN ID: {runId}</span>
            <span>•</span>
            <span>ap-south-1 (Mumbai)</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            {lang === 'en'
              ? 'Multi-Model Autonomous Agent Pipeline'
              : 'பன்முக மாதிரி தன்னாட்சி முகமை ஓட்டம்'}
          </h2>
          <p className="text-xs text-green-200 mt-0.5 max-w-3xl">
            {plan?.summary ||
              (lang === 'en'
                ? 'Synthesizing dynamic plan, selecting optimal models, and executing specialized verification agents.'
                : 'திட்டம் வகுக்கப்பட்டு, உகந்த மாதிரிகள் தேர்ந்தெடுக்கப்பட்டு, முகமைகள் இயக்கப்படுகின்றன.')}
          </p>
        </div>

        {/* Live Execution Metric */}
        <div className="flex items-center space-x-3 bg-[#174D32] px-3.5 py-2.5 rounded-xl border border-green-700/60 font-mono text-xs">
          <div>
            <div className="text-[10px] text-gray-300 uppercase">Status</div>
            <div className="font-bold text-yellow-300 capitalize">
              {isRunning
                ? lang === 'en' ? 'Executing...' : 'இயங்குகிறது...'
                : allCompleted
                ? lang === 'en' ? 'All Steps Verified' : 'முழுமை பெற்றது'
                : lang === 'en' ? 'Awaiting Input' : 'பதில் தேவை'}
            </div>
          </div>
          <div className="h-6 w-px bg-green-700" />
          <div>
            <div className="text-[10px] text-gray-300 uppercase">Circuit Breakers</div>
            <div className="font-bold text-emerald-400">CLOSED (OK)</div>
          </div>
        </div>
      </div>

      {/* CLARIFICATION LOOP BANNER (If missing info is detected) */}
      {clarifyingQuestions && clarifyingQuestions.length > 0 && !isRunning && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 shadow-sm">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 uppercase tracking-wider mb-1">
                {lang === 'en' ? 'Clarification Required by Planner' : 'திட்டமிடும் முகமையின் கூடுதல் கேள்வி'}
              </div>
              <h3 className="text-base font-bold text-amber-950">
                {lang === 'en'
                  ? 'Additional Information Needed to Resolve Parcel Cadastre'
                  : 'நில வரைபடத்தை சரிபார்க்க கூடுதல் விவரங்கள் தேவை'}
              </h3>
              <p className="text-xs text-amber-800 mt-1">
                {clarifyingQuestions[0]}
              </p>

              {/* Inline interactive input */}
              <div className="mt-4 flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-2xl border border-amber-200">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700">
                    {lang === 'en' ? 'Survey Number' : 'புல எண்'}
                  </label>
                  <input
                    type="text"
                    value={clarifySurvey}
                    onChange={e => setClarifySurvey(e.target.value)}
                    placeholder="e.g. 202/55"
                    className="mt-1 px-3 py-1.5 text-xs font-mono font-bold border border-gray-300 rounded-lg w-28"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700">
                    {lang === 'en' ? 'Village Name' : 'கிராமம்'}
                  </label>
                  <input
                    type="text"
                    value={clarifyVillage}
                    onChange={e => setClarifyVillage(e.target.value)}
                    placeholder="e.g. Sanganaperi"
                    className="mt-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg w-36"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      onClarify({ surveyNumber: clarifySurvey, village: clarifyVillage })
                    }
                    className="px-4 py-2 bg-[#2E7D32] hover:bg-[#388E3C] text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 shadow"
                  >
                    <span>{lang === 'en' ? 'Resume Orchestration' : 'தொடரவும்'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step by Step Execution Timeline */}
      <div className="space-y-4">
        {stepStatuses.map((step, idx) => {
          const isCurrent = step.status === 'running';
          const isDone = step.status === 'completed' || step.status === 'escalated';
          const isQueued = step.status === 'queued';

          return (
            <div
              key={step.stepId}
              className={`rounded-2xl border transition-all p-5 ${
                isCurrent
                  ? 'bg-amber-50/50 border-amber-300 shadow-md ring-2 ring-amber-400/20'
                  : isDone
                  ? 'bg-white border-green-200/80 shadow-sm'
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between flex-wrap gap-3">
                {/* Left: Step Index & Title */}
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs mt-0.5 ${
                      isDone
                        ? 'bg-green-100 text-[#2E7D32]'
                        : isCurrent
                        ? 'bg-amber-200 text-amber-900 animate-spin'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5 text-[#2E7D32]" /> : idx + 1}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="text-xs uppercase font-mono tracking-wider font-bold text-gray-500">
                        {step.agent.toUpperCase()} AGENT
                      </span>
                      {step.status === 'escalated' && (
                        <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                          Frontier Escalated
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-[#0F3D26]">
                      {lang === 'en' ? step.titleEn : step.titleTa}
                    </h3>
                    {step.dataSummary && (
                      <p className="text-xs text-gray-600 mt-1 font-mono">
                        {step.dataSummary}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Model Tag & Telemetry */}
                <div className="text-right">
                  {step.modelUsed ? (
                    <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold bg-[#F0F7F2] text-[#0F3D26] border border-green-300">
                      <Cpu className="w-3.5 h-3.5 text-[#2E7D32]" />
                      <span>{step.modelUsed}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 font-mono">
                      {isQueued ? 'Awaiting route...' : 'Selecting model...'}
                    </span>
                  )}

                  {/* Latency and Cost */}
                  {step.latencyMs !== undefined && (
                    <div className="text-[11px] font-mono text-gray-500 mt-1 flex items-center justify-end space-x-2">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{step.latencyMs}ms</span>
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-green-700">
                        ${(step.costUsd || 0.0003).toFixed(5)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Selection Justification Pill */}
              {step.routingReason && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-600 flex items-center space-x-2">
                  <Zap className="w-3.5 h-3.5 text-[#2E7D32] flex-shrink-0" />
                  <span className="italic">
                    <strong className="font-semibold text-gray-700">Routing Justification:</strong>{' '}
                    {step.routingReason}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion CTA */}
      {allCompleted && (
        <div className="bg-[#EAF3EC] border border-green-300 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-[#2E7D32] uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
              <span>
                {lang === 'en'
                  ? 'All Agents Executed & Independently Verified'
                  : 'அனைத்து முகமைகளும் இயக்கப்பட்டு சரிபார்க்கப்பட்டன'}
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-[#0F3D26]">
              {lang === 'en'
                ? 'Grounded Intelligence Ready for Review'
                : 'சரிபார்க்கப்பட்ட நில அறிக்கை தயாராக உள்ளது'}
            </h4>
            <p className="text-xs text-gray-600 mt-0.5">
              {lang === 'en'
                ? 'Review cadastral boundaries, spray windows, TNAU fertilizer schedules, and cost savings.'
                : 'நில வரைபடம், மருந்து தெளிப்பு நேரம், உரப் பரிந்துரைகள் மற்றும் செலவு சேமிப்பை பார்வையிடவும்.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onViewResults}
            className="px-6 py-3.5 bg-[#2E7D32] hover:bg-[#388E3C] text-white font-bold text-sm rounded-2xl transition-all flex items-center space-x-2 shadow-md hover:scale-105"
          >
            <FileCheck className="w-4 h-4 text-[#FFC72C]" />
            <span>
              {lang === 'en'
                ? 'View Verified Intelligence Dashboard'
                : 'சரிபார்க்கப்பட்ட முடிவுகளைக் காண்க'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
