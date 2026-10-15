import React from 'react';
import { CloudRain, Wind, Droplets, Thermometer, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import { translations, tWeatherCondition } from '../utils/translations';

export default function WeatherCard({ weather, lang = 'en' }) {
  if (!weather) return null;
  const t = translations[lang] || translations.en;

  const isDelaySpray = weather.spray_recommendation?.toLowerCase().includes("avoid") || 
                       weather.spray_recommendation?.toLowerCase().includes("delay") ||
                       weather.spray_recommendation?.toLowerCase().includes("rain");

  // Localized spray text
  const sprayText = lang === 'ta'
    ? (isDelaySpray 
        ? "அடுத்த 24 மணிநேரத்தில் மழை வாய்ப்பு உள்ளதால் மருந்து அடித்துச் செல்லப்படலாம். தெளிப்பை 24 முதல் 48 மணிநேரத்திற்கு தள்ளிப்போடவும்." 
        : "காற்றின் வேகம் குறைவாக உள்ளதால் இலைவழி உரம் மற்றும் பாதுகாப்பு தெளிப்புகளுக்கு உகந்த சூழல் நிலவுகிறது.")
    : weather.spray_recommendation;

  // Localized irrigation text
  const irrigationText = lang === 'ta'
    ? (weather.irrigation_urgency?.toLowerCase().includes("low") || weather.precipitation_mm > 0
        ? "மழையால் மண்ணில் போதிய இயற்கை ஈரப்பதம் உள்ளது. உடனடி நீர்ப்பாசனம் தேவையில்லை."
        : "மண் ஈரப்பதத்தை கவனித்து அடுத்த 2 நாட்களில் பாசனம் செய்யவும்.")
    : weather.irrigation_urgency;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
      {/* Aligned Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            <CloudRain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-tight">
              {t.microClimateTitle || "Micro-Climate & Agro-Met"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.microClimateSubtitle || "Live ECMWF telemetry for parcel coordinates"}
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 shrink-0">
          {t.liveMeteoBadge || "Live Open-Meteo"}
        </span>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Thermometer className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t.temperature || "Temperature"}</div>
            <div className="font-bold text-slate-800 text-base leading-tight mt-0.5">{weather.temperature}°C</div>
            <div className="text-[11px] text-slate-500 truncate mt-0.5">{t.feels || "Feels"} {weather.feels_like}°C</div>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Droplets className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t.humidity || "Humidity"}</div>
            <div className="font-bold text-slate-800 text-base leading-tight mt-0.5">{weather.humidity}%</div>
            <div className="text-[11px] text-slate-500 truncate mt-0.5">{tWeatherCondition(weather.weather_condition, lang)}</div>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
            <Wind className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t.windSpeed || "Wind Speed"}</div>
            <div className="font-bold text-slate-800 text-base leading-tight mt-0.5">{weather.wind_speed} km/h</div>
            <div className="text-[11px] text-slate-500 truncate mt-0.5">{t.driftSafe || "Drift Safe"}</div>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <CloudRain className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t.precipitation || "Precipitation"}</div>
            <div className="font-bold text-slate-800 text-base leading-tight mt-0.5">{weather.precipitation_mm} mm</div>
            <div className="text-[11px] text-slate-500 truncate mt-0.5">{t.last24h || "Last 24h"}</div>
          </div>
        </div>
      </div>

      {/* Operational Agro-Met Advisories: Stacked Clean Layout */}
      <div className="space-y-3 mb-5">
        {/* Spray Window Advisory */}
        <div className={`p-4 rounded-2xl border ${
          isDelaySpray 
            ? 'bg-amber-50/80 border-amber-200/90' 
            : 'bg-emerald-50/80 border-emerald-200/90'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-white ${
              isDelaySpray ? 'bg-amber-600' : 'bg-emerald-600'
            }`}>
              {isDelaySpray ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={`font-bold text-xs sm:text-sm ${
                  isDelaySpray ? 'text-amber-950' : 'text-emerald-950'
                }`}>
                  {t.foliarSprayAdvisory || "Foliar Spray Advisory"}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shrink-0 ${
                  isDelaySpray 
                    ? 'bg-amber-100 text-amber-800 border-amber-300' 
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  {isDelaySpray 
                    ? (lang === 'ta' ? 'எச்சரிக்கை / தள்ளிப்போடுக' : 'Caution / Delay') 
                    : (lang === 'ta' ? 'உகந்த நேரம்' : 'Favorable Window')}
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${
                isDelaySpray ? 'text-amber-900' : 'text-emerald-800'
              }`}>
                {sprayText}
              </p>
            </div>
          </div>
        </div>

        {/* Irrigation Urgency Card */}
        <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Droplets className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-bold text-xs text-blue-950">
                {t.soilMoistureTitle || "Soil Moisture & Irrigation"}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300 shrink-0">
                {lang === 'ta' ? 'ஈரப்பத நிலை' : 'Moisture Status'}
              </span>
            </div>
            <p className="text-xs text-blue-900 leading-relaxed">
              {irrigationText}
            </p>
          </div>
        </div>
      </div>

      {/* 7-Day Forecast Strip */}
      {weather.forecast_7d && weather.forecast_7d.length > 0 && (
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {lang === 'ta' ? '7-நாள் வேளாண் முன்னறிவிப்பு' : '7-Day Agronomic Outlook'}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {weather.forecast_7d.map((day, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-slate-50 hover:bg-emerald-50/60 rounded-xl border border-slate-200/70 text-center transition-colors text-xs"
              >
                <div className="font-bold text-slate-700 text-[11px]">
                  {day.date.includes('-') ? day.date.slice(5) : day.date}
                </div>
                <div className="text-[11px] text-slate-500 my-1 truncate">
                  {tWeatherCondition(day.condition, lang)}
                </div>
                <div className="font-bold text-slate-900 text-xs">
                  {Math.round(day.max_temp)}° / <span className="text-slate-400 font-normal">{Math.round(day.min_temp)}°</span>
                </div>
                <div className="text-[10px] text-blue-600 font-medium mt-1">
                  🌧 {day.rain_prob}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
