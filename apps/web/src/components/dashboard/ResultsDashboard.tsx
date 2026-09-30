import React, { useState } from 'react';
import {
  FileText,
  Map,
  CloudSun,
  ShieldCheck,
  TrendingDown,
  FileCheck,
  RotateCcw,
  Sparkles,
  Layers,
  Award
} from 'lucide-react';
import { FinalResult } from '@farmwise/agent-core';
import { Language, Persona, DashboardTab } from '../../types/ui.js';
import { SummaryTab } from './tabs/SummaryTab.js';
import { MapTab } from './tabs/MapTab.js';
import { AdvisoryTab } from './tabs/AdvisoryTab.js';
import { EvidenceTab } from './tabs/EvidenceTab.js';
import { CostTab } from './tabs/CostTab.js';
import { ReportTab } from './tabs/ReportTab.js';

interface ResultsDashboardProps {
  result: FinalResult;
  lang: Language;
  persona: Persona;
  onNewAnalysis: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  result,
  lang,
  persona,
  onNewAnalysis
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('summary');

  const tabs: { id: DashboardTab; labelEn: string; labelTa: string; icon: React.ReactNode }[] = [
    {
      id: 'summary',
      labelEn: 'Overview',
      labelTa: 'சுருக்கம்',
      icon: <Layers className="w-4 h-4 text-[#2E7D32]" />
    },
    {
      id: 'map',
      labelEn: 'Cadastral Map',
      labelTa: 'நில வரைபடம்',
      icon: <Map className="w-4 h-4 text-[#2E7D32]" />
    },
    {
      id: 'advisory',
      labelEn: 'Agronomy & Spray',
      labelTa: 'ஆலோசனை & வானிலை',
      icon: <CloudSun className="w-4 h-4 text-[#2E7D32]" />
    },
    {
      id: 'evidence',
      labelEn: 'Evidence & Audit',
      labelTa: 'சான்றுகள் & தணிக்கை',
      icon: <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
    },
    {
      id: 'costs',
      labelEn: 'Model Route & Cost',
      labelTa: 'செலவு & மாதிரிகள்',
      icon: <TrendingDown className="w-4 h-4 text-[#2E7D32]" />
    },
    {
      id: 'report',
      labelEn: 'Government Report',
      labelTa: 'அரசு அறிக்கை',
      icon: <FileCheck className="w-4 h-4 text-[#2E7D32]" />
    }
  ];

  return (
    <div className="w-full space-y-4">
      {/* Top Controls: Return to Wizard & Executive Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-sm print:hidden">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onNewAnalysis}
            className="px-3.5 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'New Submission' : 'புதிய மனு'}</span>
          </button>

          <div>
            <span className="text-[11px] font-mono text-gray-400 block">PARCEL ID</span>
            <span className="font-bold text-sm text-[#0F3D26]">
              {result.parcel.village} — {result.parcel.surveyNumber}
            </span>
          </div>
        </div>

        {/* Cost & Verification Pills */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] text-gray-500 uppercase block">Cost Savings</span>
            <span className="font-bold text-green-800">
              +{result.costSummary.savingsPct.toFixed(1)}% Saved
            </span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] text-gray-500 uppercase block">Overall Grade</span>
            <span className="font-bold text-emerald-900">
              {result.verification.overallStatus} ({Math.round(result.confidence.overall * 100)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation Strip */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none border-b border-gray-200 print:hidden">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#0F3D26] text-white shadow-sm'
                : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.icon}
            <span>{lang === 'en' ? tab.labelEn : tab.labelTa}</span>
          </button>
        ))}
      </div>

      {/* Tab Content Display */}
      <div>
        {activeTab === 'summary' && (
          <SummaryTab result={result} lang={lang} persona={persona} />
        )}
        {activeTab === 'map' && (
          <MapTab result={result} lang={lang} />
        )}
        {activeTab === 'advisory' && (
          <AdvisoryTab result={result} lang={lang} />
        )}
        {activeTab === 'evidence' && (
          <EvidenceTab result={result} lang={lang} />
        )}
        {activeTab === 'costs' && (
          <CostTab result={result} lang={lang} />
        )}
        {activeTab === 'report' && (
          <ReportTab result={result} lang={lang} persona={persona} />
        )}
      </div>
    </div>
  );
};
