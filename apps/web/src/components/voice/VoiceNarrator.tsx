import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Gauge
} from 'lucide-react';
import { Language } from '../../types/ui.js';

interface VoiceNarratorProps {
  text: string;
  lang: Language;
  title?: string;
}

export const VoiceNarrator: React.FC<VoiceNarratorProps> = ({
  text,
  lang,
  title
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState<number>(1.0);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState<number>(-1);

  // Split text into sentences for synchronized highlighting
  const sentences = text
    .split(/(?<=[.!?।])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlay = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
    utterance.rate = rate;

    // Try to find a matching native voice
    const voices = window.speechSynthesis.getVoices();
    const targetLang = lang === 'ta' ? 'ta' : 'en';
    const matchingVoice = voices.find(v => v.lang.startsWith(targetLang));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onboundary = (event: any) => {
      if (event.name === 'sentence') {
        const charIndex = event.charIndex;
        let cumulative = 0;
        for (let i = 0; i < sentences.length; i++) {
          cumulative += sentences[i].length + 1;
          if (charIndex < cumulative) {
            setCurrentSentenceIdx(i);
            break;
          }
        }
      }
    };

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentSentenceIdx(0);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSentenceIdx(-1);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSentenceIdx(-1);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if ('speechSynthesis' in window && isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSentenceIdx(-1);
    }
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    if (isPlaying) {
      handleStop();
      setTimeout(handlePlay, 100);
    }
  };

  return (
    <div className="bg-[#F3F7F2] p-4 rounded-2xl border border-green-200 space-y-3">
      {/* Player Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-[#2E7D32] text-white">
            <Volume2 className="w-4 h-4 text-[#FFC72C]" />
          </div>
          <div>
            <h5 className="font-bold text-xs text-[#0F3D26]">
              {title || (lang === 'ta' ? 'குரல் வழியே கேட்க' : 'Listen to Agronomic Advisory')}
            </h5>
            <span className="text-[10px] text-gray-500 font-mono">
              Web Speech TTS • {lang === 'ta' ? 'ta-IN' : 'en-IN'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {isPlaying ? (
            <button
              type="button"
              onClick={handlePause}
              className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-sm transition-all"
              title="Pause"
            >
              <Pause className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePlay}
              className="px-3.5 py-1.5 bg-[#2E7D32] hover:bg-[#388E3C] text-white rounded-xl shadow-sm text-xs font-bold transition-all flex items-center space-x-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current text-[#FFC72C]" />
              <span>{isPaused ? 'Resume' : 'Play'}</span>
            </button>
          )}

          {(isPlaying || isPaused) && (
            <button
              type="button"
              onClick={handleStop}
              className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all"
              title="Stop"
            >
              <VolumeX className="w-4 h-4" />
            </button>
          )}

          {/* Speed Selector */}
          <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-lg border border-gray-200 text-[11px] font-mono">
            <Gauge className="w-3 h-3 text-gray-500" />
            {[0.8, 1.0, 1.2].map(r => (
              <button
                key={r}
                onClick={() => handleRateChange(r)}
                className={`px-1.5 py-0.5 rounded ${
                  rate === r ? 'bg-green-100 text-green-900 font-bold' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {r}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sentence Highlight Reader */}
      <div className="p-3 bg-white rounded-xl border border-gray-200 text-xs leading-relaxed text-gray-700 max-h-36 overflow-y-auto font-sans">
        {sentences.map((sentence, idx) => (
          <span
            key={idx}
            className={`transition-all px-1 py-0.5 rounded ${
              currentSentenceIdx === idx
                ? 'bg-yellow-200 text-black font-semibold ring-2 ring-yellow-400'
                : 'hover:bg-gray-50'
            }`}
          >
            {sentence}{' '}
          </span>
        ))}
      </div>
    </div>
  );
};
