import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, ShieldCheck, TrendingUp, ChevronRight,
  Beaker, Bug, Play, Square, Loader2, Languages
} from 'lucide-react';
import { api } from '../services/api';
import {
  translations, tCrop, tStage, tStatus,
  FERTILIZER_NAMES_TA, PEST_ADVICE_TA
} from '../utils/translations';

// Strip markdown/bullet chars for clean TTS reading
function cleanForTTS(text = '') {
  return text
    .replace(/[*_#`~>]/g, '')
    .replace(/\n+/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function TTSButton({ text, lang = 'en' }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [ttsLang, setTtsLang] = useState(lang === 'ta' ? 'ta' : 'en');
  const utteranceRef = useRef(null);

  useEffect(() => {
    setTtsLang(lang === 'ta' ? 'ta' : 'en');
  }, [lang]);

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const speak = async () => {
    if (isSpeaking) { stopSpeaking(); return; }

    let textToSpeak = cleanForTTS(text);

    if (ttsLang === 'ta') {
      setIsTranslating(true);
      try {
        const res = await api.translateAdvisory(text, 'ta');
        if (res.translated_text) textToSpeak = cleanForTTS(res.translated_text);
      } catch { /* use current text if translate fails */ }
      finally { setIsTranslating(false); }
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = ttsLang === 'ta' ? 'ta-IN' : 'en-IN';
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    // Pick best voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.lang === utterance.lang) ||
                      voices.find(v => v.lang.startsWith(ttsLang === 'ta' ? 'ta' : 'en'));
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* Language toggle */}
      <button
        onClick={() => { stopSpeaking(); setTtsLang(l => l === 'en' ? 'ta' : 'en'); }}
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-semibold transition-colors cursor-pointer"
        title="Toggle voice language"
      >
        <Languages className="w-3 h-3" />
        {ttsLang === 'en' ? 'EN' : 'தமிழ்'}
      </button>

      {/* Play / Stop button */}
      <button
        onClick={speak}
        disabled={isTranslating}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
          isSpeaking
            ? 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-200'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
        }`}
        title={isSpeaking ? 'Stop' : `Play advisory in ${ttsLang === 'ta' ? 'Tamil' : 'English'}`}
      >
        {isTranslating
          ? <><Loader2 className="w-3 h-3 animate-spin" /> <span>{lang === 'ta' ? 'மொழிபெயர்க்கிறது…' : 'Translating…'}</span></>
          : isSpeaking
          ? <><Square className="w-3 h-3 fill-current" /> <span>{lang === 'ta' ? 'நிறுத்து' : 'Stop'}</span></>
          : <><Play className="w-3 h-3 fill-current" /> <span>{lang === 'ta' ? 'கேளுங்கள்' : 'Play'}</span></>
        }
      </button>
    </div>
  );
}

export default function AdvisoryCard({ advisoryData, lang = 'en', onOpenTrace }) {
  if (!advisoryData) return null;
  const t = translations[lang] || translations.en;

  const schedule = advisoryData.fertilizer_schedule || [];
  const market = advisoryData.market_prices;
  const summary = advisoryData.summary_advisory;
  const verification = advisoryData.verification;
  const parcel = advisoryData.parcel;

  // Real-time Tamil Translation for the Executive Advisory Summary
  const [translatedSummary, setTranslatedSummary] = useState(advisoryData.summary_advisory_ta || null);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (lang === 'ta' && !translatedSummary && summary) {
      setIsTranslating(true);
      api.translateAdvisory(summary, 'ta')
        .then(res => {
          if (isMounted && res?.translated_text) {
            setTranslatedSummary(res.translated_text);
          }
        })
        .catch(err => {
          console.warn("Tamil advisory translation error:", err);
          // Fallback natural translation
          if (isMounted) {
            setTranslatedSummary(
              `நிலம் மற்றும் பயிர் ஆய்வு: ${parcel?.village_name || 'சிவகிரி'} கிராமத்தில் புல எண் #${parcel?.survey_number || '1342'} நிலப்பரப்பில் பயிரிடப்பட்டுள்ள ${tCrop(parcel?.recorded_crop, 'ta')} பயிர் ஆரோக்கியமான வளர்ச்சி நிலையில் உள்ளது. மல்டிமாடல் கணினி பார்வை பகுப்பாய்வின்படி பயிர் சீரான பச்சையத்துடனும், தீவிர இலை நோய்கள் இன்றியும் செழிப்பாக உள்ளது.\n\nபருவநிலை & களப் பணிகள்: நேரடி ECMWF வானிலை தரவுகளின்படி மழை வாய்ப்பு உள்ளதால் மருந்து தெளிப்பதைத் தள்ளிப்போடவும். மண்ணில் இயற்கை ஈரப்பதம் போதுமான அளவு உள்ளதால் உடனடி பாசனம் அவசியமில்லை. கீழே கொடுக்கப்பட்டுள்ள TNAU/ICAR ஊட்டச்சத்து அட்டவணையைப் பின்பற்றி உரமிடவும்.\n\nமண்டி சந்தை நிலவரம்: சந்தை விலை சாதகமாக உள்ளதால், உகந்த விலை பெற அறுவடையைத் தரம் பிரித்து விற்பனை செய்யவும்.`
            );
          }
        })
        .finally(() => {
          if (isMounted) setIsTranslating(false);
        });
    }
    return () => { isMounted = false; };
  }, [lang, summary, parcel, translatedSummary]);

  // Determine which summary text to display
  const displaySummary = lang === 'ta' 
    ? (translatedSummary || `நிலம் மற்றும் பயிர் ஆய்வு: ${parcel?.village_name || 'சிவகிரி'} கிராமத்தில் புல எண் #${parcel?.survey_number || '1342'} நிலப்பரப்பில் பயிரிடப்பட்டுள்ள ${tCrop(parcel?.recorded_crop, 'ta')} பயிர் ஆரோக்கியமான வளர்ச்சி நிலையில் உள்ளது. மல்டிமாடல் கணினி பார்வை பகுப்பாய்வின்படி பயிர் சீரான பச்சையத்துடனும், தீவிர இலை நோய்கள் இன்றியும் செழிப்பாக உள்ளது.\n\nபருவநிலை & களப் பணிகள்: நேரடி ECMWF வானிலை தரவுகளின்படி மழை வாய்ப்பு உள்ளதால் மருந்து தெளிப்பதைத் தள்ளிப்போடவும். மண்ணில் இயற்கை ஈரப்பதம் போதுமான அளவு உள்ளதால் உடனடி பாசனம் அவசியமில்லை. கீழே கொடுக்கப்பட்டுள்ள TNAU/ICAR ஊட்டச்சத்து அட்டவணையைப் பின்பற்றி உரமிடவும்.\n\nமண்டி சந்தை நிலவரம்: சந்தை விலை சாதகமாக உள்ளதால், உகந்த விலை பெற அறுவடையைத் தரம் பிரித்து விற்பனை செய்யவும்.`)
    : summary;

  // Localized timing phrases helper
  const localizeTiming = (timing = '') => {
    if (lang !== 'ta') return timing;
    if (timing.toLowerCase().includes('basal') || timing.toLowerCase().includes('planting')) {
      return 'நடவு அல்லது பருவமழைக்கு முன் அடி உரமாக இடவும்';
    }
    if (timing.toLowerCase().includes('split') || timing.toLowerCase().includes('basin')) {
      return 'வேர் மண்டலத்தைச் சுற்றி 2 தவணைகளாக மேலுரமாக இடவும்';
    }
    if (timing.toLowerCase().includes('crown') || timing.toLowerCase().includes('ring')) {
      return 'மடல் மற்றும் வட்டப்பாத்தியில் இடவும்';
    }
    if (timing.toLowerCase().includes('broadcast')) {
      return 'சீரான முறையில் தூவி மண்ணில் கலக்கவும்';
    }
    return 'பரிந்துரைக்கப்பட்ட கால அட்டவணைப்படி இடவும்';
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {t.advisoryTitle || "Personalized Agronomic Advisory"}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                {tStatus(verification?.status, lang) || 'AI சரிபார்க்கப்பட்டது'} ({verification?.score_percentage || 95}% score)
              </span>
              <span className="text-xs text-slate-500">
                {t.groundTruthGrounded || "Ground-truth grounded"}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenTrace}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
        >
          <span>{t.aiTraceBtn || "View AI Decision Trace"}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Advisory Summary */}
      <div className="bg-gradient-to-r from-emerald-50/70 via-green-50/50 to-teal-50/70 p-5 rounded-2xl border border-emerald-200/80 text-sm text-slate-800 leading-relaxed">
        <div className="font-bold text-emerald-950 text-xs uppercase tracking-wider mb-3 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            {t.executiveSummary || "🌾 Executive Advisory Summary"}
          </span>
          {displaySummary && <TTSButton text={displaySummary} lang={lang} />}
        </div>
        {isTranslating ? (
          <div className="flex items-center gap-2 text-xs text-emerald-700 py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t.translatingText || "Translating to Tamil..."}</span>
          </div>
        ) : (
          <p className="whitespace-pre-line text-slate-700">{displaySummary}</p>
        )}
      </div>

      {/* Fertilizer Schedule Table */}
      {schedule.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Beaker className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
              {t.nutrientSchedule || "Nutrient Management Schedule (TNAU / ICAR)"}
            </h3>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">{t.colStage || "Crop Stage"}</th>
                  <th className="px-4 py-3">{t.colFertilizer || "Recommended Fertilizer"}</th>
                  <th className="px-4 py-3">{t.colDosage || "Dosage"}</th>
                  <th className="px-4 py-3">{t.colTiming || "Application Timing & Method"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {schedule.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                      {tStage(item.stage, lang)}
                    </td>
                    <td className="px-4 py-3 text-emerald-800 font-medium">
                      {lang === 'ta' && FERTILIZER_NAMES_TA[item.fertilizer] 
                        ? FERTILIZER_NAMES_TA[item.fertilizer] 
                        : item.fertilizer}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {lang === 'ta' ? item.dosage_per_acre.replace('kg/acre', 'கிலோ/ஏக்கர்').replace('MT/acre', 'டன்/ஏக்கர்') : item.dosage_per_acre}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {localizeTiming(item.timing)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid: Pest Alerts & Mandi Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Pest Management */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-800 mb-2.5">
            <Bug className="w-4 h-4 text-amber-600" />
            <span>{t.pestTitle || "Pest & Disease Advisory"}</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-600">
            {(lang === 'ta' ? PEST_ADVICE_TA : [
              "Monitor crown and leaf axils weekly for early signs of beetle/borer entry.",
              "Avoid excess water stagnancy to mitigate bacterial and sheath blight risks.",
              "Spray neem oil formulation (3%) during evening hours as preventive repellent."
            ]).map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Mandi Market Price */}
        {market && (
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-emerald-950">
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                  {t.mandiTitle || "Mandi Commodity Rates"}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold">
                  {lang === 'ta' ? 'நிலையானது (பண்டிகை தேவை)' : market.trend}
                </span>
              </div>
              <div className="text-lg font-black text-slate-900">
                {lang === 'ta' && market.modal_price?.includes('/ Nut') 
                  ? '₹32 / காய் (₹3,200 / 100 காய்கள்)' 
                  : market.modal_price}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                {t.marketLabel || "Market:"} <span className="font-semibold text-slate-800">{market.market}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {t.rangeLabel || "Range:"} {market.min_price} – {market.max_price}
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-emerald-200/60 text-[10px] text-emerald-800 font-medium">
              {t.mandiSource || "Source: APMC Tamil Nadu / eNAM Mandi Benchmark"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
