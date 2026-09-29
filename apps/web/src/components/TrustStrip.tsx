import React from 'react';
import { ShieldCheck, Database, Mic, Lock, Cpu } from 'lucide-react';
import { Language } from '../types/ui.js';

interface TrustStripProps {
  lang: Language;
}

export const TrustStrip: React.FC<TrustStripProps> = ({ lang }) => {
  return (
    <section className="bg-[#EAF3EC] border-b border-green-200/80 px-4 sm:px-6 py-2.5 text-xs text-[#0F3D26]">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 font-medium">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
          <span>
            {lang === 'en'
              ? 'Verified Parcel Intelligence (Thoothukudi & Tenkasi Cadastre)'
              : 'சரிபார்க்கப்பட்ட நில ஆய்வு (தூத்துக்குடி & தென்காசி நில வரைபடம்)'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-[#2E7D32]" />
          <span>
            {lang === 'en'
              ? 'TNAU Grounded Agronomy Corpus'
              : 'தமிழ்நாடு வேளாண்மைப் பல்கலைக்கழக சான்றளிக்கப்பட்ட தகவல்'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Mic className="w-4 h-4 text-[#2E7D32]" />
          <span>
            {lang === 'en'
              ? 'Tamil & English Bilingual Voice'
              : 'தமிழ் & ஆங்கில இருமொழி குரல் வழி'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Lock className="w-4 h-4 text-[#2E7D32]" />
          <span>
            {lang === 'en'
              ? 'Farmer PII Masked by Default (R. K****)'
              : 'உழவர் தனிநபர் விவரங்கள் பாதுகாக்கப்படுகின்றன'}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[#2E7D32]">
          <Cpu className="w-4 h-4" />
          <span>ap-south-1 Multi-Model Routing</span>
        </div>
      </div>
    </section>
  );
};
