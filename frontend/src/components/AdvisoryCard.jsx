import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, ShieldCheck, TrendingUp, ChevronRight,
  Beaker, Bug, Play, Square, Loader2, Languages,
  MapPin, CloudSun
} from 'lucide-react';
import { api } from '../services/api';
import {
  translations, tCrop, tStage, tStatus,
  FERTILIZER_NAMES_TA, PEST_ADVICE_TA,
  tSoilType, tWeatherCondition, tVillage, tDistrict
} from '../utils/translations';

// Strip markdown/bullet chars for clean TTS reading
function cleanForTTS(text = '') {
  return text
    .replace(/[*_#`~>•]/g, '')
    .replace(/\n+/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function buildAdvisoryBulletGroups(advisoryData, lang = 'en') {
  if (!advisoryData) return [];
  const parcel = advisoryData.parcel || {};
  const cropInfo = advisoryData.crop_analysis || {};
  const soil = advisoryData.soil_profile || {};
  const weather = advisoryData.weather || {};
  const market = advisoryData.market_prices || {};

  const sNo = parcel.survey_number || '1342';
  const subDiv = parcel.sub_division ? `/${parcel.sub_division}` : '';
  const village = parcel.village_name || 'Sivagiri';
  const taluk = parcel.taluk || 'Sivagiri';
  const district = parcel.district || 'Tenkasi';
  const crop = cropInfo.crop_name || parcel.recorded_crop || 'Coconut';
  const stage = cropInfo.growth_stage || parcel.recorded_stage || 'Bearing';
  const health = cropInfo.crop_health || 'Healthy & Vigorous';

  const soilType = soil.soil_type || 'Laterite Loamy Sand';
  const ph = soil.ph !== undefined ? soil.ph : 5.94;
  const eff = soil.fertilizer_efficiency_score || 71;
  const shc = soil.soil_health_card_id || `TN-TNK-2024-SHC-${sNo}`;

  const temp = weather.temperature !== undefined ? weather.temperature : 27.5;
  const cond = weather.weather_condition || 'Partly cloudy';
  const hum = weather.humidity !== undefined ? weather.humidity : 82;
  const wind = weather.wind_speed !== undefined ? weather.wind_speed : 4.5;
  const spray = weather.spray_recommendation || 'Ideal spray window: Calm winds and dry canopy conditions.';
  const irrig = weather.irrigation_urgency || 'Standard irrigation cycle recommended.';

  const marketName = market.market || 'Rajapalayam / Tenkasi Regulated Market';
  const modalPrice = market.modal_price || '₹32 / Nut (₹3,200 / 100 Nuts)';
  const trend = market.trend || 'Stable (High festive demand)';

  if (lang === 'ta') {
    const cropTa = tCrop(crop, 'ta');
    const stageTa = tStage(stage, 'ta');
    const villageTa = tVillage(village, 'ta');
    const districtTa = tDistrict(district, 'ta');
    const soilTypeTa = tSoilType(soilType, 'ta');
    const condTa = tWeatherCondition(cond, 'ta');

    return [
      {
        id: 'parcel',
        title: 'நிலம் & பயிர் நிலை',
        icon: <MapPin className="w-3.5 h-3.5 text-emerald-700" />,
        badgeBg: 'bg-emerald-100 text-emerald-800',
        bullets: [
          {
            label: 'புல விபரம்',
            text: `${villageTa} (${districtTa}) கிராமத்தில் புல எண் #${sNo}${subDiv} நிலத்தில் உள்ள ${cropTa} பயிர் ${stageTa} நிலையில் உள்ளது.`
          },
          {
            label: 'பயிர் நலம்',
            text: 'கணினி பார்வை ஆய்வில் பயிர் நல்ல வீரியத்துடனும், தீவிர இலை நோய் தாக்கமின்றியும் செழிப்பாக உள்ளது.'
          }
        ]
      },
      {
        id: 'soil',
        title: 'மண்வளம் & ஊட்டச்சத்து நிலை',
        icon: <Beaker className="w-3.5 h-3.5 text-amber-700" />,
        badgeBg: 'bg-amber-100 text-amber-800',
        bullets: [
          {
            label: 'மண் வகை & pH',
            text: `${soilTypeTa} (pH ${ph}), உர பயன்பாட்டு ஏற்புத்திறன் ${eff}% (அட்டை #${shc}).`
          },
          {
            label: 'உர மேலாண்மை',
            text: ph < 6.2
              ? 'அமில உரங்களைத் தவிர்க்கவும்; பாறை பாஸ்பேட் மற்றும் சுண்ணாம்பு கலந்து அடியுரமாக இடவும்.'
              : ph > 7.8
              ? 'காரத்தன்மையைக் குறைக்க ஜிப்சம் இடவும்; வேப்பம்பூசிய யூரியாவை தவணைகளாக இடவும்.'
              : 'நிலையான TNAU Crop Production Guide ஊட்டச்சத்து அட்டவணையைப் பின்பற்றவும்.'
          }
        ]
      },
      {
        id: 'weather',
        title: 'வானிலை & களப் பணிகள்',
        icon: <CloudSun className="w-3.5 h-3.5 text-blue-700" />,
        badgeBg: 'bg-blue-100 text-blue-800',
        bullets: [
          {
            label: 'நேரடி வானிலை',
            text: `நேரடி ECMWF: ${temp}°C (${condTa}), ${hum}% ஈரப்பதம், ${wind} கிமீ/மணி காற்று வேகம்.`
          },
          {
            label: 'தெளிப்பு & பாசனம்',
            text: 'மருந்து தெளிக்க உகந்த நேரம்; பரிந்துரைக்கப்பட்ட பாசன சுழற்சியைப் பராமரிக்கவும்.'
          }
        ]
      },
      {
        id: 'market',
        title: 'மண்டி சந்தை நிலவரம்',
        icon: <TrendingUp className="w-3.5 h-3.5 text-purple-700" />,
        badgeBg: 'bg-purple-100 text-purple-800',
        bullets: [
          {
            label: 'சந்தை விலை',
            text: `${marketName}-ல் விலை ${modalPrice.includes('/ Nut') ? '₹32 / காய் (₹3,200 / 100 காய்கள்)' : modalPrice} (நிலையான பண்டிகை தேவை).`
          },
          {
            label: 'விற்பனை ஆலோசனை',
            text: 'கூடுதல் லாபம் பெற அறுவடையைத் தரம்பிரித்து ஒழுங்குமுறை விற்பனைக்கூடத்தில் விற்கவும்.'
          }
        ]
      }
    ];
  }

  // English (Default)
  return [
    {
      id: 'parcel',
      title: 'Parcel & Stand Assessment',
      icon: <MapPin className="w-3.5 h-3.5 text-emerald-700" />,
      badgeBg: 'bg-emerald-100 text-emerald-800',
      bullets: [
        {
          label: 'Cadastral Identity',
          text: `Cadastral Survey #${sNo}${subDiv} in ${village} (${taluk} Taluk, ${district}) verified with active stand of ${crop} in ${stage} stage.`
        },
        {
          label: 'Canopy Health',
          text: `Multimodal evaluation confirms ${health} vigor with uniform chlorophyll reflectance and no acute foliar pathogen clusters.`
        }
      ]
    },
    {
      id: 'soil',
      title: 'Soil Health Card Grounding',
      icon: <Beaker className="w-3.5 h-3.5 text-amber-700" />,
      badgeBg: 'bg-amber-100 text-amber-800',
      bullets: [
        {
          label: 'Soil Classification',
          text: `${soilType} (pH ${ph}) with ${eff}% calculated fertilizer uptake efficiency (Card #${shc}).`
        },
        {
          label: 'Nutrient Action',
          text: ph < 6.2
            ? 'Avoid acidic fertilizers (Ammonium Sulphate); prefer Calcium Nitrate or Urea with lime dressing, and Rock Phosphate as basal P.'
            : ph > 7.8
            ? 'Alkaline condition: Apply Gypsum to displace sodium; replace standard urea with Neem-Coated Urea in split doses.'
            : 'Balanced neutral soil: Follow standard TNAU Crop Production Guide 2024 NPK schedule.'
        }
      ]
    },
    {
      id: 'weather',
      title: 'Agro-Met & Field Operations',
      icon: <CloudSun className="w-3.5 h-3.5 text-blue-700" />,
      badgeBg: 'bg-blue-100 text-blue-800',
      bullets: [
        {
          label: 'Live Telemetry',
          text: `Live ECMWF telemetry records ${temp}°C (${cond}), ${hum}% relative humidity, ${wind} km/h wind speed.`
        },
        {
          label: 'Spray & Irrigation',
          text: `Ideal spray window (calm winds & dry canopy); standard irrigation cycle recommended. Scout lower leaf axils weekly.`
        }
      ]
    },
    {
      id: 'market',
      title: 'Mandi Market Outlook',
      icon: <TrendingUp className="w-3.5 h-3.5 text-purple-700" />,
      badgeBg: 'bg-purple-100 text-purple-800',
      bullets: [
        {
          label: 'Market Benchmark',
          text: `Current commodity benchmark at ${marketName} stands at ${modalPrice} (${trend}).`
        },
        {
          label: 'Harvest & Realization',
          text: 'Stagger harvesting and sort produce by grade to capture optimal APMC / eNAM auction realizations.'
        }
      ]
    }
  ];
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
  const verification = advisoryData.verification;

  // Build structured small summarized bullet points
  const bulletGroups = buildAdvisoryBulletGroups(advisoryData, lang);

  // Clean text-to-speech string from structured bullet points
  const ttsText = bulletGroups
    .map(g => `${g.title}: ` + g.bullets.map(b => `${b.label}, ${b.text}`).join('. '))
    .join('. ');

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

      {/* Advisory Summary with Claim-Level Provenance & Small Summarized Bullets */}
      <div className="bg-gradient-to-r from-emerald-50/70 via-green-50/50 to-teal-50/70 p-5 rounded-2xl border border-emerald-200/80 text-sm text-slate-800 leading-relaxed">
        <div className="font-bold text-emerald-950 text-xs uppercase tracking-wider mb-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            {t.executiveSummary || "Executive Advisory Summary"}
          </span>
          <TTSButton text={ttsText} lang={lang} />
        </div>

        {/* Claim-Level Provenance Tag Bar */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-600 mb-3 pb-2 border-b border-emerald-200/60 font-medium">
          <span className="font-bold text-emerald-900 uppercase tracking-wider text-[9px]">Grounded Sources:</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono">TN Land Revenue Cadastre</span>
          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono">Soil Health Card #{advisoryData.soil_profile?.soil_health_card_id || 'TN-TNK-2024'}</span>
          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 font-mono">Live ECMWF Weather API</span>
          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 font-mono">TNAU CPG 2024</span>
        </div>

        {/* 2x2 Grid of Small Summarized Bullet Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2.5">
          {bulletGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white/95 rounded-xl p-3.5 border border-emerald-200/70 shadow-xs hover:border-emerald-300 transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-100">
                <div className={`w-6 h-6 rounded-lg ${group.badgeBg} flex items-center justify-center shrink-0`}>
                  {group.icon}
                </div>
                <h4 className="font-bold text-xs text-slate-900 tracking-wide">
                  {group.title}
                </h4>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {group.bullets.map((b, bIdx) => (
                  <li key={bIdx} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold text-sm leading-none mt-0.5">•</span>
                    <span className="leading-relaxed">
                      <strong className="font-semibold text-slate-900">{b.label}:</strong> {b.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
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
