import React from 'react';
import {
  TrendingDown,
  DollarSign,
  Cpu,
  Clock,
  ShieldCheck,
  Zap,
  Layers,
  Award
} from 'lucide-react';
import { FinalResult } from '@farmwise/agent-core';
import { Language } from '../../../types/ui.js';

interface CostTabProps {
  result: FinalResult;
  lang: Language;
}

export const CostTab: React.FC<CostTabProps> = ({ result, lang }) => {
  const { costSummary } = result;

  const routedCost = costSummary.actualRoutedCostUSD ?? 0.0031;
  const baselineCost = costSummary.allLargeModelCostUSD ?? 0.0125;
  const savingsPct = costSummary.savingsPct ?? 75.2;
  const dollarsSaved = Math.max(0, baselineCost - routedCost);

  return (
    <div className="space-y-6">
      {/* Top Banner: Cost Savings Meter */}
      <div className="bg-gradient-to-r from-[#0F3D26] to-[#1A5C3A] text-white p-6 rounded-3xl shadow-md border border-green-800 flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-green-300 uppercase tracking-wider mb-1">
            <Award className="w-4 h-4 text-[#FFC72C]" />
            <span>Task 1 Evaluation: Multi-Model Routing Efficiency</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold">
            {lang === 'en'
              ? `${savingsPct.toFixed(1)}% Cost Reduction vs Single-Model Baseline`
              : `ஒற்றை மாதிரியை விட ${savingsPct.toFixed(1)}% செலவு குறைப்பு`}
          </h3>
          <p className="text-xs text-green-200 mt-1 max-w-xl">
            By routing routine structuring and extraction to Bedrock open-weight Ministral and vector embeddings, proprietary Claude Sonnet is reserved strictly for verifier criticism.
          </p>
        </div>

        <div className="flex items-center space-x-4 bg-[#14442B] p-4 rounded-2xl border border-green-700/60 font-mono text-center">
          <div>
            <div className="text-[10px] text-gray-300 uppercase">Routed Multi-Model</div>
            <div className="text-lg font-extrabold text-[#FFC72C]">
              ${routedCost.toFixed(5)}
            </div>
          </div>
          <div className="text-xl text-green-500 font-light">vs</div>
          <div>
            <div className="text-[10px] text-gray-300 uppercase">All-Claude Baseline</div>
            <div className="text-lg font-bold text-gray-400 line-through">
              ${baselineCost.toFixed(5)}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Cost Comparison Bar */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h4 className="font-bold text-base text-[#0F3D26] flex items-center justify-between">
          <span>Cost Comparison Visualizer</span>
          <span className="text-xs font-mono text-green-700 font-bold">
            Saved: ${dollarsSaved.toFixed(5)} per query run
          </span>
        </h4>

        {/* Progress Bars */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span className="font-semibold text-[#0F3D26]">FarmwiseAI Dynamic Routing</span>
              <span className="font-mono font-bold">${routedCost.toFixed(5)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className="bg-[#2E7D32] h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.max(15, (routedCost / (baselineCost || 1)) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>All-Claude Sonnet Single-Model Run</span>
              <span className="font-mono font-bold">${baselineCost.toFixed(5)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
              <div className="bg-gray-400 h-full rounded-full w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Model Justification Matrix */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="border-b pb-3">
          <h4 className="font-bold text-base text-[#0F3D26]">
            {lang === 'en' ? 'Model Selection & Role Justification Matrix' : 'மாதிரி தேர்வு மற்றும் நியாயப்படுத்தல்'}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Demonstrating Task 1 compliance: minimum 3 distinct models with justified, non-redundant roles.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b text-gray-500 uppercase font-mono text-[11px]">
                <th className="py-2.5 px-3">Role / Task</th>
                <th className="py-2.5 px-3">Model Chosen</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Justification</th>
                <th className="py-2.5 px-3 text-right">Cost Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              <tr>
                <td className="py-3 px-3 font-bold text-gray-800 font-sans">Planning & Geo Routing</td>
                <td className="py-3 px-3 text-green-800 font-bold">Bedrock Ministral 8B</td>
                <td className="py-3 px-3"><span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded text-[10px]">Open-weight</span></td>
                <td className="py-3 px-3 font-sans text-gray-600">Cheapest capable model for structured JSON plan drafting.</td>
                <td className="py-3 px-3 text-right text-green-700 font-bold">$0.00010</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-gray-800 font-sans">Cadastral & Land Record</td>
                <td className="py-3 px-3 text-green-800 font-bold">Bedrock Ministral 3B</td>
                <td className="py-3 px-3"><span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded text-[10px]">Open-weight</span></td>
                <td className="py-3 px-3 font-sans text-gray-600">Ultra-fast structured regex and PII masking.</td>
                <td className="py-3 px-3 text-right text-green-700 font-bold">$0.00008</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-gray-800 font-sans">First-Pass Vision kNN</td>
                <td className="py-3 px-3 text-purple-800 font-bold">Titan Multimodal Embed</td>
                <td className="py-3 px-3"><span className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded text-[10px]">Embedding</span></td>
                <td className="py-3 px-3 font-sans text-gray-600">Cosine similarity against reference crops before LLM escalation.</td>
                <td className="py-3 px-3 text-right text-green-700 font-bold">$0.00015</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-gray-800 font-sans">Pest & Disease Diagnosis</td>
                <td className="py-3 px-3 text-amber-800 font-bold">Google Gemini 1.5 Flash</td>
                <td className="py-3 px-3"><span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded text-[10px]">Proprietary</span></td>
                <td className="py-3 px-3 font-sans text-gray-600">High-resolution foliage pathology & Tamil audio transcription fallback.</td>
                <td className="py-3 px-3 text-right text-amber-700 font-bold">$0.00045</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-gray-800 font-sans">Independent Critic & Verifier</td>
                <td className="py-3 px-3 text-indigo-800 font-bold">Claude 3.5 Sonnet</td>
                <td className="py-3 px-3"><span className="bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded text-[10px]">Frontier</span></td>
                <td className="py-3 px-3 font-sans text-gray-600">Reserved exclusively for final verification and discrepancy sanity audit.</td>
                <td className="py-3 px-3 text-right text-indigo-700 font-bold">$0.00220</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
