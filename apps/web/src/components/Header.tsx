import React from 'react';
import { Globe, UserCheck, ShieldAlert, Sparkles, Activity, FileCheck, Layers } from 'lucide-react';
import { Language, Persona, ViewMode } from '../types/ui.js';

interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
  persona: Persona;
  onTogglePersona: () => void;
  health: any;
  activeView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  hasResults: boolean;
  isRunning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onToggleLang,
  persona,
  onTogglePersona,
  health,
  activeView,
  onSelectView,
  hasResults,
  isRunning
}) => {
  return (
    <header className="bg-[#0F3D26] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Mission */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectView('wizard')}>
          <div className="w-10 h-10 rounded-xl bg-[#2E7D32] flex items-center justify-center font-black text-xl text-[#FFC72C] shadow-inner border border-green-500/30">
            FW
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black tracking-tight text-white">FarmwiseAI</h1>
              <span className="text-[10px] bg-[#2E7D32] text-[#FFC72C] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-green-600">
                Agentic
              </span>
            </div>
            <p className="text-xs text-green-200">
              {lang === 'en'
                ? 'Autonomous Agriculture Intelligence Platform'
                : 'தன்னாட்சி வேளாண் நுண்ணறிவு தளம்'}
            </p>
          </div>
        </div>

        {/* View Navigation */}
        <div className="flex items-center space-x-1.5 bg-[#174D32] p-1 rounded-xl border border-green-700/60">
          <button
            onClick={() => onSelectView('wizard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeView === 'wizard'
                ? 'bg-[#2E7D32] text-white shadow'
                : 'text-green-200 hover:text-white hover:bg-green-800/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#FFC72C]" />
            <span>{lang === 'en' ? 'New Request' : 'புதிய மனு'}</span>
          </button>

          <button
            onClick={() => onSelectView('running')}
            disabled={!isRunning && activeView !== 'running'}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeView === 'running'
                ? 'bg-[#2E7D32] text-white shadow'
                : isRunning
                ? 'text-yellow-300 hover:bg-green-800/40 animate-pulse'
                : 'text-gray-400 opacity-60 cursor-not-allowed'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-[#FFC72C]" />
            <span>{lang === 'en' ? 'Live Execution' : 'நேரலை முகமை'}</span>
            {isRunning && <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />}
          </button>

          <button
            onClick={() => onSelectView('results')}
            disabled={!hasResults}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeView === 'results'
                ? 'bg-[#2E7D32] text-white shadow'
                : hasResults
                ? 'text-green-200 hover:text-white hover:bg-green-800/40'
                : 'text-gray-400 opacity-60 cursor-not-allowed'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-[#FFC72C]" />
            <span>{lang === 'en' ? 'Verified Results' : 'முடிவுகள்'}</span>
          </button>
        </div>

        {/* User Controls: Language, Persona & AWS Region */}
        <div className="flex items-center space-x-3">
          {/* Persona Toggle */}
          <button
            onClick={onTogglePersona}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              persona === 'officer'
                ? 'bg-amber-500/20 text-yellow-300 border-amber-400/60 shadow-inner'
                : 'bg-green-800/60 text-green-100 border-green-600 hover:bg-green-700/60'
            }`}
            title={persona === 'officer' ? 'Officer View (Unmasked PII & Evidence)' : 'Farmer View (Simple, Masked PII)'}
          >
            {persona === 'officer' ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-yellow-300" />
                <span>{lang === 'en' ? 'Officer View' : 'அதிகாரி பார்வை'}</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5 text-green-300" />
                <span>{lang === 'en' ? 'Farmer View' : 'உழவர் பார்வை'}</span>
              </>
            )}
          </button>

          {/* Bilingual Switcher */}
          <button
            onClick={onToggleLang}
            className="flex items-center space-x-1.5 bg-[#2E7D32] hover:bg-[#388E3C] px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors border border-green-600"
            aria-label="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-[#FFC72C]" />
            <span>{lang === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>

          {/* AWS ap-south-1 Compliance Badge */}
          <div className="hidden lg:flex items-center space-x-2 text-[11px] bg-[#174D32] px-3 py-1.5 rounded-lg border border-green-700/60 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#6DB33F] animate-pulse"></span>
            <span className="text-green-200">ap-south-1</span>
            <span className="text-green-500">|</span>
            <span className="text-yellow-300 font-bold">Team {health?.teamId || '01'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
