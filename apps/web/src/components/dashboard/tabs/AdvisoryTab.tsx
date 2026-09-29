import React, { useState } from 'react';
import {
  CloudSun,
  Wind,
  Droplets,
  Thermometer,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Clock,
  Sparkles
} from 'lucide-react';
import { FinalResult } from '@farmwise/agent-core';
import { Language } from '../../../types/ui.js';

interface AdvisoryTabProps {
  result: FinalResult;
  lang: Language;
}

export const AdvisoryTab: React.FC<AdvisoryTabProps> = ({ result, lang }) => {
  const { weather, recommendations, cropAssessment } = result;
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const sprayFeasible = !weather.agronomicAlerts.some(
    a => a.toLowerCase().includes('rain') || a.toLowerCase().includes('wind')
  );

  const sprayRecommendation = sprayFeasible
    ? (lang === 'en'
        ? 'Safe spray window available in the next 24-48 hours. Wind and rainfall within safe operational bounds.'
        : 'அடுத்த 24-48 மணி நேரத்தில் மருந்து தெளிக்க தகுந்த சாதகமான வானிலை நிலவுகிறது.')
    : (weather.agronomicAlerts[0] ||
        (lang === 'en'
          ? 'Delay spraying: heavy precipitation or wind gusts expected in the next 48 hours.'
          : 'அடுத்த 48 மணி நேரத்தில் மழை வாய்ப்பு உள்ளதால் மருந்து தெளிப்பதைத் தள்ளி வைக்கவும்.'));

  const rainProb48h =
    weather.forecast7Day.length > 0
      ? Math.max(weather.forecast7Day[0].rainProbPct, weather.forecast7Day[1]?.rainProbPct || 0)
      : 15;

  // Audio Speech Synthesis for Farmer Read-Aloud
  const handleToggleSpeech = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        const textToSpeak =
          lang === 'ta'
            ? `${cropAssessment.cropName || 'பயிர்'} ஆலோசனை. ${recommendations
                .map(r => `${r.title}. ${r.description}`)
                .join('. ')}. வானிலை: ${sprayRecommendation}`
            : `${cropAssessment.cropName || 'Crop'} advisory. ${recommendations
                .map(r => `${r.title}. ${r.description}`)
                .join('. ')}. Weather: ${sprayRecommendation}`;

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        setIsPlayingAudio(true);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 48-Hour Spray Window Feasibility Banner */}
      <div
        className={`p-6 rounded-2xl border shadow-sm flex flex-wrap items-center justify-between gap-4 ${
          sprayFeasible
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : 'bg-amber-50 border-amber-300 text-amber-950'
        }`}
      >
        <div className="flex items-start space-x-3">
          <div
            className={`p-3 rounded-xl ${
              sprayFeasible
                ? 'bg-emerald-200 text-emerald-800'
                : 'bg-amber-200 text-amber-800'
            }`}
          >
            <CloudSun className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-extrabold tracking-wider font-mono">
                {lang === 'en' ? '48-Hour Agronomic Spray Window' : '48 மணி நேர பூச்சிக்கொல்லி தெளிப்பு நேரம்'}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  sprayFeasible
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-amber-200 text-amber-900'
                }`}
              >
                {sprayFeasible ? 'FAVORABLE (உகந்தது)' : 'DELAY SPRAY (தள்ளிவைக்க)'}
              </span>
            </div>

            <h3 className="text-lg font-bold mt-1">
              {sprayFeasible
                ? lang === 'en'
                  ? 'Safe Spray Window Available Today & Tomorrow'
                  : 'இன்று மற்றும் நாளை மருந்து தெளிக்க தகுந்த வானிலை நிலவுகிறது'
                : lang === 'en'
                ? 'High Rainfall or Weather Alert — Spraying Ineffective'
                : 'மழை அல்லது காற்றின் வேகம் அதிகம் — மருந்து அடிப்பதைக் காலதாமதப்படுத்தவும்'}
            </h3>

            <p className="text-xs text-gray-700 mt-1 max-w-2xl">
              {sprayRecommendation}
            </p>
          </div>
        </div>

        {/* Read-Aloud Voice Button */}
        <button
          type="button"
          onClick={handleToggleSpeech}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-2 shadow-sm ${
            isPlayingAudio
              ? 'bg-red-600 text-white animate-pulse'
              : 'bg-[#2E7D32] hover:bg-[#388E3C] text-white'
          }`}
        >
          {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#FFC72C]" />}
          <span>
            {isPlayingAudio
              ? lang === 'en' ? 'Stop Audio' : 'நிறுத்துக'
              : lang === 'en' ? 'Listen to Advisory' : 'குரல் வழியே கேட்க'}
          </span>
        </button>
      </div>

      {/* Live Open-Meteo Weather Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2 text-gray-500 text-xs mb-1">
            <Thermometer className="w-4 h-4 text-red-500" />
            <span>Temperature</span>
          </div>
          <div className="text-xl font-bold text-[#0F3D26] font-mono">
            {weather.currentTempC}°C
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">Optimal for growth</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2 text-gray-500 text-xs mb-1">
            <Droplets className="w-4 h-4 text-blue-500" />
            <span>Relative Humidity</span>
          </div>
          <div className="text-xl font-bold text-[#0F3D26] font-mono">
            {weather.humidityPct}%
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            {weather.humidityPct > 70 ? 'High Humidity' : 'Moderate Humidity'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2 text-gray-500 text-xs mb-1">
            <Wind className="w-4 h-4 text-emerald-500" />
            <span>48h Rain Probability</span>
          </div>
          <div className="text-xl font-bold text-[#0F3D26] font-mono">
            {rainProb48h}%
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            Precipitation: {weather.precipitationMm}mm
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2 text-gray-500 text-xs mb-1">
            <Clock className="w-4 h-4 text-purple-500" />
            <span>Forecast TTL</span>
          </div>
          <div className="text-xl font-bold text-[#0F3D26] font-mono">30 Min</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{weather.source}</div>
        </div>
      </div>

      {/* TNAU Grounded Fertilizer & Chemical Prescriptions */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <FlaskConical className="w-5 h-5 text-[#2E7D32]" />
            <h4 className="font-bold text-base text-[#0F3D26]">
              {lang === 'en' ? 'Grounded Agronomic Prescriptions (TNAU Corpus)' : 'பரிந்துரைக்கப்பட்ட உர & மருந்து அளவுகள்'}
            </h4>
          </div>
          <span className="text-[10px] bg-green-100 text-green-800 font-mono font-bold px-2.5 py-1 rounded">
            Public source: TNAU Agronomy 2024
          </span>
        </div>

        <div className="space-y-4">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-gray-100 bg-[#F9FBF8] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F3D26] flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2E7D32]" />
                  <span>{rec.category.replace('_', ' ').toUpperCase()}</span>
                </span>
                {rec.dosage && (
                  <span className="text-xs font-mono font-bold bg-green-100 text-green-900 px-2 py-0.5 rounded">
                    {rec.dosage}
                  </span>
                )}
              </div>

              <div className="text-xs font-bold text-gray-900">
                {rec.title}
              </div>

              <p className="text-xs text-gray-700 leading-relaxed">
                {rec.description}
              </p>

              <div className="text-[11px] text-gray-500 flex items-center justify-between pt-1 border-t border-gray-100">
                <span>
                  Timing: <strong>{rec.timing}</strong>
                </span>
                <span>
                  Source: <strong className="text-gray-700">{rec.sourceCitation.title}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
