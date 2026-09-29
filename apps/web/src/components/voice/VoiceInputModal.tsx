import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  X,
  Volume2,
  Sparkles,
  CheckCircle2,
  Globe,
  CornerDownRight,
  Radio
} from 'lucide-react';
import { normalizeTamilSpeechToQuery, NormalizedSpeechResult } from '@farmwise/agent-core';
import { Language } from '../../types/ui.js';

interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onApplyTranscription: (result: NormalizedSpeechResult) => void;
}

export const VoiceInputModal: React.FC<VoiceInputModalProps> = ({
  isOpen,
  onClose,
  lang: initialLang,
  onApplyTranscription
}) => {
  const [activeVoiceLang, setActiveVoiceLang] = useState<'ta-IN' | 'en-IN'>(
    initialLang === 'ta' ? 'ta-IN' : 'en-IN'
  );
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [normalizedResult, setNormalizedResult] = useState<NormalizedSpeechResult | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = activeVoiceLang;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let finalStr = '';
      let interimStr = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalStr += event.results[i][0].transcript;
        } else {
          interimStr += event.results[i][0].transcript;
        }
      }

      if (finalStr) {
        const newTranscript = transcript ? `${transcript} ${finalStr}` : finalStr;
        setTranscript(newTranscript);
        const norm = normalizeTamilSpeechToQuery(newTranscript);
        setNormalizedResult(norm);
      }
      setInterimTranscript(interimStr);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) {
        // cleanup
      }
    };
  }, [activeVoiceLang, transcript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInterimTranscript('');
      try {
        recognitionRef.current.lang = activeVoiceLang;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Could not start recognition:', e);
      }
    }
  };

  // Preset audio simulations for testing/judges without requiring microphone access
  const handleSimulatePreset = (text: string) => {
    setTranscript(text);
    setInterimTranscript('');
    const norm = normalizeTamilSpeechToQuery(text);
    setNormalizedResult(norm);
  };

  const handleApply = () => {
    if (normalizedResult) {
      onApplyTranscription(normalizedResult);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-green-200 relative overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-green-100 text-[#2E7D32]">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F3D26]">
                {activeVoiceLang === 'ta-IN' ? 'தமிழ் குரல் பதிவு' : 'Bilingual Voice Input'}
              </h3>
              <p className="text-[11px] text-gray-500">
                Web Speech API • ta-IN (Tamil, India) & en-IN
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Selector Pill */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          <button
            onClick={() => setActiveVoiceLang('ta-IN')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeVoiceLang === 'ta-IN'
                ? 'bg-[#2E7D32] text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            தமிழ் (Tamil India)
          </button>
          <button
            onClick={() => setActiveVoiceLang('en-IN')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeVoiceLang === 'en-IN'
                ? 'bg-[#2E7D32] text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            English (India)
          </button>
        </div>

        {/* Central Animated Mic Sphere */}
        <div className="flex flex-col items-center justify-center my-6">
          <div className="relative">
            {isListening && (
              <>
                <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
                <span className="absolute -inset-4 rounded-full bg-red-200 animate-pulse opacity-40" />
              </>
            )}

            <button
              onClick={toggleListening}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 scale-105'
                  : 'bg-[#2E7D32] hover:bg-[#388E3C] hover:scale-105'
              }`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8 animate-pulse" />
              ) : (
                <Mic className="w-8 h-8 text-[#FFC72C]" />
              )}
            </button>
          </div>

          {/* Sound Wave Bars Simulation */}
          <div className="flex items-center justify-center space-x-1.5 mt-5 h-8">
            {[4, 8, 14, 20, 26, 18, 12, 6, 16, 24, 10, 5].map((h, i) => (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isListening
                    ? 'bg-[#2E7D32] animate-bounce'
                    : 'bg-gray-200'
                }`}
                style={{
                  height: isListening ? `${h}px` : '4px',
                  animationDelay: `${i * 0.08}s`
                }}
              />
            ))}
          </div>

          <div className="text-xs text-gray-500 font-medium mt-2">
            {isListening
              ? activeVoiceLang === 'ta-IN'
                ? 'பேசுங்கள்... கேட்கிறது (Listening...)'
                : 'Listening... Speak your question now'
              : activeVoiceLang === 'ta-IN'
              ? 'பதிவைத் தொடங்க மைக் பொத்தானை அழுத்தவும்'
              : 'Click mic button to start speaking'}
          </div>
        </div>

        {/* Transcript Box */}
        <div className="p-4 rounded-2xl bg-[#F7F9F4] border border-green-200 min-h-[90px] mb-4 text-xs font-sans">
          <div className="text-[10px] uppercase font-bold text-gray-400 mb-1 font-mono">
            Live Speech Transcript
          </div>
          <div className="text-gray-900 leading-relaxed font-medium">
            {transcript || interimTranscript ? (
              <>
                <span>{transcript} </span>
                <span className="text-green-600 italic">{interimTranscript}</span>
              </>
            ) : (
              <span className="text-gray-400 italic">
                {activeVoiceLang === 'ta-IN'
                  ? 'உதாரணம்: "புல எண் இருநூற்று இரண்டு கீழ் ஐம்பத்தைந்து நெல் இலை சுருட்டு புழு மருந்து ஆலோசனை"'
                  : 'Example: "What should I spray on Survey 202/55 in Sanganaperi for leaf folder?"'}
              </span>
            )}
          </div>
        </div>

        {/* Normalized Survey & Entity Detection Badge */}
        {normalizedResult?.detectedSurveyNumber && (
          <div className="p-3 bg-green-50 border border-green-300 rounded-xl mb-4 text-xs flex items-center justify-between text-[#0F3D26]">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
              <span>
                Normalized Survey No:{' '}
                <strong className="font-mono text-sm">{normalizedResult.detectedSurveyNumber}</strong>
              </span>
            </div>
            {normalizedResult.detectedVillage && (
              <span className="text-[11px] font-semibold text-green-700 bg-white px-2 py-0.5 rounded border border-green-200">
                {normalizedResult.detectedVillage}
              </span>
            )}
          </div>
        )}

        {/* One-Click Presets for Simulator / Mic blocked */}
        <div className="mb-6">
          <div className="text-[11px] font-bold text-gray-600 mb-2">
            Sample Spoken Inputs (Click to test):
          </div>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() =>
                handleSimulatePreset(
                  'புல எண் இருநூற்று இரண்டு கீழ் ஐம்பத்தைந்து சங்கனாபேரி கிராமம் நெல் பயிரில் இலை சுருட்டு புழு தாக்குதல் உள்ளது மருந்து ஆலோசனை வழங்கவும்'
                )
              }
              className="w-full text-left p-2 rounded-lg bg-gray-50 hover:bg-green-50 border border-gray-200 text-[11px] text-gray-700 hover:text-[#0F3D26] transition-colors"
            >
              🌾 "புல எண் இருநூற்று இரண்டு கீழ் ஐம்பத்தைந்து நெல் இலை சுருட்டு புழு..."
            </button>
            <button
              type="button"
              onClick={() =>
                handleSimulatePreset(
                  'கீழத்தட்டப்பாறை சர்வே எண் முன்னூற்று எண்பத்தி ஏழு நிலக்கடலை காய் துளைப்பான் மருந்து தெளிக்க மழை பெய்யுமா'
                )
              }
              className="w-full text-left p-2 rounded-lg bg-gray-50 hover:bg-green-50 border border-gray-200 text-[11px] text-gray-700 hover:text-[#0F3D26] transition-colors"
            >
              🥜 "கீழத்தட்டப்பாறை சர்வே 387 நிலக்கடலை காய் துளைப்பான்..."
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <button
            type="button"
            onClick={() => {
              setTranscript('');
              setInterimTranscript('');
              setNormalizedResult(null);
            }}
            className="text-xs text-gray-500 hover:text-gray-700 font-medium"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={!transcript && !interimTranscript}
            className="px-6 py-2.5 bg-[#2E7D32] hover:bg-[#388E3C] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center space-x-1.5"
          >
            <span>Insert into Request</span>
            <CornerDownRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
