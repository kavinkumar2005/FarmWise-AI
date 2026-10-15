import React from 'react';
import { Sprout, ShieldCheck, Cpu, CloudSun, MessageSquare, Globe2 } from 'lucide-react';
import { translations } from '../utils/translations';

export default function Navbar({ lang, setLang, onOpenChat, onResetHome }) {
  const t = translations[lang] || translations.en;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div 
            onClick={onResetHome}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 to-green-500 flex items-center justify-center shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Farmwise<span className="text-emerald-600">AI</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  {lang === 'ta' ? 'பணி 1 முகமை' : 'Task 1 Agentic'}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                {lang === 'ta' ? 'பல்-மாதிரி வேளாண்மை நுண்ணறிவு தளம்' : 'Multi-Model Agricultural Intelligence Platform'}
              </p>
            </div>
          </div>

          {/* Center info: Model badges */}
          <div className="hidden lg:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-full text-slate-700 border border-slate-200">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'ta' ? 'திட்டமிடுதல்: கிளாட் / ஜெமினி' : 'Planner: Claude 3.5 / Gemini 3.8'}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-full text-slate-700 border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>{lang === 'ta' ? 'சரிபார்ப்பாளர்: இயங்குகிறது' : 'Verifier Critic: Active'}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-full text-amber-800 border border-amber-200">
              <CloudSun className="w-3.5 h-3.5 text-amber-600" />
              <span>AWS ap-south-1</span>
            </div>
          </div>

          {/* Right actions: Language toggle & Chat CTA */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs font-medium">
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  lang === 'en' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('ta')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  lang === 'ta' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                தமிழ்
              </button>
              <button
                onClick={() => setLang('hi')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  lang === 'hi' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिंदी
              </button>
            </div>

            {/* AI Advisor Button */}
            <button
              onClick={onOpenChat}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-medium shadow-sm hover:shadow transition-all active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">{t.actionAdvisor}</span>
              <span className="sm:hidden">Advisor</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
