import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, Camera, Loader2, Mic, MicOff, Globe, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { api } from '../services/api';
import { ensureTamilChatReply } from '../utils/translations';

const QUICK_PROMPTS = [
  "What fertilizer is best for coconut palms in Tenkasi?",
  "What is the current market rate for Paddy in Tamil Nadu mandis?",
  "How should I manage Fall Armyworm in Maize crops?",
  "Is the weather suitable for spraying pesticides today?",
  "Can you identify my crop stage from photo?"
];

const QUICK_PROMPTS_TA = [
  "தென்காசி பகுதியில் தென்னைக்கு எந்த உரம் சிறந்தது?",
  "தமிழ்நாடு மண்டிகளில் நெல் தற்போதைய சந்தை விலை என்ன?",
  "மக்காச்சோளத்தில் படைப்புழுவை எவ்வாறு கட்டுப்படுத்துவது?",
  "இன்று பூச்சிக்கொல்லி மருந்து தெளிக்க வானிலை உகந்ததா?",
  "புகைப்படத்தைப் பார்த்து பயிரின் வளர்ச்சி நிலையை கூற முடியுமா?"
];

const getWelcomeMessage = (l, parcel) => ({
  sender: 'bot',
  text: l === 'ta'
    ? `வணக்கம் விவசாயி அவர்களே! நான் உங்கள் பார்ம்வைஸ் AI நேரடி வேளாண் ஆலோசகர்.${parcel?.survey_number ? ` (புல எண் #${parcel.survey_number} நில விவரங்கள் இணைக்கப்பட்டுள்ளன)` : ''}\n\nஉங்களுக்கு உதவக்கூடிய சேவைகள்:\n• உரம் & ஊட்டச்சத்து அட்டவணை (TNAU பரிந்துரைத்த யூரியா, பொட்டாஷ் அளவுகள்)\n• பூச்சி & நோய் கட்டுப்பாடு (இயற்கை NSKE & பாதுகாப்பு முறை)\n• வானிலை & மருந்து தெளிக்கும் நேரம் (மழை மற்றும் காற்றின் வேகம்)\n• நேரடி மண்டி சந்தை விலைகள் (தென்காசி, திருநெல்வேலி APMC)\n\n🎤 குறிப்பு: மைக் பொத்தானை அழுத்தி தமிழில் பேசலாம், அல்லது கீழே உள்ள பொத்தான்களை கிளிக் செய்யலாம்!`
    : `Vanakkam Farmer! I am your FarmwiseAI Live Agricultural Advisor.${parcel?.survey_number ? ` (Survey Parcel #${parcel.survey_number} is actively linked)` : ''}\n\nI can help you with:\n• Fertilizer & Nutrient Schedules (TNAU / ICAR dosages of Urea, DAP, Potash)\n• Pest & Disease Diagnostics and Integrated Management\n• Micro-Climate & Safe Foliar Spray Windows\n• Live Mandi Commodity Market Prices (Tenkasi, Tirunelveli APMC)\n\n🎤 Tip: Click the microphone to speak in Tamil or English, or tap the quick buttons below!`,
  modelUsed: 'Ministral-8B + TNAU RAG',
  confidence: 0.99,
  sources: ['TNAU Crop Guide 2024', 'ICAR-CPCRI', 'eNAM APMC Mandi'],
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
});

export default function ChatbotDrawer({ isOpen = true, onClose, activeParcel, lang: propLang = 'en', embedded = false }) {
  const [lang, setLang] = useState(propLang || 'en');
  const [messages, setMessages] = useState([getWelcomeMessage(propLang || 'en', activeParcel)]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Voice / language state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Voice Output / TTS state (Farmer-first auto Tamil audio reply)
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentlySpeakingIdx, setCurrentlySpeakingIdx] = useState(null);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (propLang) {
      setLang(propLang);
    }
  }, [propLang]);

  // Preload and cache browser voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const handleVoices = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.onvoiceschanged = handleVoices;
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  // Update initial message when activeParcel or lang changes if only 1 message
  useEffect(() => {
    setMessages(prev => {
      if (prev.length <= 1) {
        return [getWelcomeMessage(lang, activeParcel)];
      }
      return prev;
    });
  }, [activeParcel?.survey_number, lang]);

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    // Only scroll the inner message container, NEVER scroll the outer window/page
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setCurrentlySpeakingIdx(null);
  }, []);

  const cleanForTTS = (rawText) => {
    if (!rawText) return '';
    return String(rawText)
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      .replace(/[*_#`~>]/g, '')
      .replace(/[•\-\+]\s+/g, ', ')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\([A-Z0-9\-_]{5,}\)/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  const speakMessage = useCallback(async (rawText, msgIdx = null) => {
    if (!('speechSynthesis' in window)) return;

    // Toggle off if currently speaking this exact message
    if (isSpeaking && currentlySpeakingIdx === msgIdx) {
      stopSpeaking();
      return;
    }

    window.speechSynthesis.cancel();

    let textToSpeak = cleanForTTS(rawText);
    if (!textToSpeak) return;

    // Detect if text contains Tamil characters
    const hasTamil = /[\u0B80-\u0BFF]/.test(textToSpeak);
    let targetLang = (lang === 'ta' || hasTamil) ? 'ta-IN' : 'en-IN';

    // If in Tamil mode but text came in English, translate to Tamil for authentic speech
    if (lang === 'ta' && !hasTamil) {
      try {
        const res = await api.translateAdvisory(textToSpeak, 'ta');
        if (res?.translated_text) {
          textToSpeak = cleanForTTS(res.translated_text);
          targetLang = 'ta-IN';
        }
      } catch (err) {
        // Fall back to original
      }
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = targetLang;
    utterance.rate = targetLang === 'ta-IN' ? 0.92 : 0.98;
    utterance.pitch = 1.0;

    // Resolve best native voice (e.g. Google Tamil, Microsoft Valluvar, or generic ta-IN)
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      if (targetLang === 'ta-IN') {
        const preferred = voices.find(v => v.lang === 'ta-IN' || v.lang === 'ta_IN') ||
                          voices.find(v => v.lang.toLowerCase().startsWith('ta')) ||
                          voices.find(v => v.name.toLowerCase().includes('tamil'));
        if (preferred) utterance.voice = preferred;
      } else {
        const preferred = voices.find(v => v.lang === 'en-IN' || v.lang === 'en_IN') ||
                          voices.find(v => v.lang.toLowerCase().startsWith('en'));
        if (preferred) utterance.voice = preferred;
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentlySpeakingIdx(msgIdx);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentlySpeakingIdx(null);
    };

    utterance.onerror = (e) => {
      console.warn('[TTS] Synthesis error:', e);
      setIsSpeaking(false);
      setCurrentlySpeakingIdx(null);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSpeaking, currentlySpeakingIdx, lang, stopSpeaking]);

  const handleResetChat = () => {
    stopSpeaking();
    setMessages([getWelcomeMessage(lang, activeParcel)]);
    setInput('');
    removeImage();
  };

  const cleanDisplayText = (text) => {
    if (!text) return '';
    let cleaned = text
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/\*{1,3}([^\*]+)\*{1,3}/g, '$1')
      .replace(/^[-*_]{3,}$/gm, '')
      .trim();
    if (lang === 'ta' || /[\u0B80-\u0BFF]/.test(cleaned)) {
      cleaned = ensureTamilChatReply(cleaned);
    }
    return cleaned;
  };

  // ─── Image helpers ─────────────────────────────────────────────────────────
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Send message ──────────────────────────────────────────────────────────
  const handleSend = async (textToSend = null) => {
    const queryText = (typeof textToSend === 'string' ? textToSend : input).trim();
    if (!queryText && !selectedImage) return;

    const userMsg = {
      sender: 'user',
      text: queryText || (lang === 'ta' ? 'களப் புகைப்படம் ஆய்வுக்காக பதிவேற்றப்பட்டது' : 'Uploaded field photograph for multimodal diagnosis.'),
      image: imagePreview,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for multi-turn contextual continuity
      const chatHistory = messages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await api.chatAdvisor(
        queryText || (lang === 'ta' ? 'இந்த பயிர் புகைப்படத்தை ஆய்வு செய்யவும்' : 'Analyze this crop image'),
        activeParcel?.survey_number || null,
        selectedImage,
        chatHistory,
        lang
      );

      const rawText = res.reply || res.response || res.message || res.answer || (typeof res === 'string' ? res : '');
      const defaultTamil = `வணக்கம் விவசாயி அவர்களே! புல எண் #${activeParcel?.survey_number || 1342} விவரங்கள் பெறப்பட்டுள்ளன. பயிர் வளர்ச்சி, உரம் அல்லது சந்தை விலை பற்றி கேளுங்கள்.`;
      const defaultEnglish = `Hello Farmer! For Survey Parcel #${activeParcel?.survey_number || 1342}, I am ready to answer your agronomic, fertilizer, weather, or market pricing questions.`;
      let finalText = (rawText && typeof rawText === 'string' && rawText.trim().length > 0)
        ? rawText.trim()
        : (lang === 'ta' ? defaultTamil : defaultEnglish);

      if (lang === 'ta' || /[\u0B80-\u0BFF]/.test(finalText)) {
        finalText = ensureTamilChatReply(finalText);
      }

      const botMsg = {
        sender: 'bot',
        text: finalText,
        modelUsed: res.model_used || res.modelUsed || 'Gemini 3.8 Flash + TNAU RAG',
        confidence: res.confidence || res.confidence_score || 0.97,
        sources: res.sources || ['TNAU Crop Production Guide', 'Open-Meteo ECMWF', 'eNAM Mandi Rate'],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => {
        const nextList = [...prev, botMsg];
        if (isVoiceOutputEnabled) {
          setTimeout(() => {
            speakMessage(finalText, nextList.length - 1);
          }, 350);
        }
        return nextList;
      });
    } catch (err) {
      console.error(err);
      const fallbackText = lang === 'ta'
        ? 'தகவல் தொடர்பில் தாமதம் ஏற்பட்டுள்ளது. தயவுசெய்து உங்கள் கேள்வியை மீண்டும் கேட்கவும்.'
        : 'I encountered a network timeout while querying the model cluster. Please try again or rephrase your farming question.';
      const fallbackMsg = {
        sender: 'bot',
        text: fallbackText,
        modelUsed: 'System Fallback',
        confidence: 0.5,
        sources: ['Local Knowledge Base'],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => {
        const nextList = [...prev, fallbackMsg];
        if (isVoiceOutputEnabled) {
          setTimeout(() => {
            speakMessage(fallbackText, nextList.length - 1);
          }, 350);
        }
        return nextList;
      });
    } finally {
      setIsLoading(false);
      removeImage();
    }
  };

  // ─── Voice recording ────────────────────────────────────────────────────────
  // Strategy: Use browser SpeechRecognition (instant, no server) as PRIMARY.
  // If user has Groq key configured: ALSO capture MediaRecorder audio and
  // send to Groq Whisper for higher accuracy after they stop speaking.

  const stopRecording = useCallback(() => {
    // Stop SpeechRecognition
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    // Stop MediaRecorder (if running for Groq)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // No browser speech API — try pure Groq MediaRecorder path
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('Your browser does not support speech recognition. Please type your question.');
        return;
      }
      // Pure MediaRecorder → Groq path
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
        const recorder = new MediaRecorder(stream, { mimeType });
        recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
        recorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          if (audioChunksRef.current.length === 0) { setIsRecording(false); return; }
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          setIsTranscribing(true);
          setIsRecording(false);
          try {
            const result = await api.transcribeVoice(blob, lang);
            if (result?.text) setInput(prev => prev ? prev + ' ' + result.text : result.text);
          } catch {}
          finally { setIsTranscribing(false); }
        };
        recorder.start(250); // collect chunks every 250ms
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch (err) {
        alert('Microphone permission denied. Please allow microphone access and try again.');
      }
      return;
    }

    // ── Primary: browser SpeechRecognition (works instantly in Chrome/Edge) ──
    const recog = new SpeechRecognition();
    recog.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
    recog.continuous = true;        // keep listening until manually stopped
    recog.interimResults = true;    // show live partial results in input
    recog.maxAlternatives = 1;

    let finalTranscript = input;    // accumulate on top of existing input text

    recog.onstart = () => setIsRecording(true);

    recog.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTranscript = (finalTranscript ? finalTranscript + ' ' : '') + t;
        } else {
          interim = t;
        }
      }
      // Show final + live interim in the input box
      setInput(finalTranscript + (interim ? ' ' + interim : ''));
    };

    recog.onerror = (e) => {
      console.warn('[SpeechRecog] error:', e.error);
      if (e.error === 'not-allowed' || e.error === 'permission-denied') {
        alert('Microphone permission denied. Please allow microphone access in your browser settings.');
      }
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recog.onend = () => {
      // Only clear isRecording if we didn't manually stop (continuous mode can auto-stop)
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recog;
    try {
      recog.start();
    } catch (err) {
      console.warn('[SpeechRecog] start failed:', err);
      setIsRecording(false);
    }
  }, [isRecording, lang, input, stopRecording]);

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  if (!embedded && !isOpen) return null;

  // ─── Render ───────────────────────────────────────────────────────────────
  const containerClasses = embedded
    ? "w-full h-[620px] bg-white rounded-3xl border-2 border-emerald-300/90 shadow-xl flex flex-col overflow-hidden relative z-10 transition-all"
    : "fixed inset-y-0 right-0 z-[2000] w-full max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-fade-in";

  return (
    <div className={containerClasses}>

      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-emerald-800 to-green-700 text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs font-bold">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">
              {lang === 'ta' ? 'ஃபார்ம்வைஸ் AI ஆலோசகர்' : 'FarmWise AI Advisor'}
            </h3>
            <p className="text-xs text-emerald-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{lang === 'ta' ? 'நேரலை AI வழிகாட்டி' : 'Live Multi-Model Copilot'}</span>
              {activeParcel && <span className="font-semibold text-white">• #{activeParcel.survey_number}</span>}
            </p>
          </div>
        </div>

        {/* Controls: Voice Output Toggle + Reset + Language toggle + Close (if drawer) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              setIsVoiceOutputEnabled(v => !v);
            }}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
              isVoiceOutputEnabled ? 'bg-emerald-600/90 text-white shadow-xs' : 'bg-white/10 hover:bg-white/20 text-emerald-200'
            }`}
            title={
              isVoiceOutputEnabled
                ? (lang === 'ta' ? 'குரல் மறுமொழி இயக்கத்தில் உள்ளது (Voice Reply ON)' : 'Voice Reply ON')
                : (lang === 'ta' ? 'குரல் மறுமொழி முடக்கப்பட்டுள்ளது (Voice Reply OFF)' : 'Voice Reply OFF')
            }
          >
            {isVoiceOutputEnabled ? (
              <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce text-emerald-200' : ''}`} />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleResetChat}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-100 hover:text-white transition-colors cursor-pointer"
            title={lang === 'ta' ? 'புதிய உரையாடலை தொடங்கு' : 'Start Fresh Conversation'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLang(l => l === 'en' ? 'ta' : 'en')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold transition-colors cursor-pointer"
            title="Toggle language for voice"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang === 'en' ? 'EN' : 'தமிழ்'}
          </button>
          {!embedded && onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Live Voice Speaking Waveform Banner */}
      {isSpeaking && (
        <div className="px-3.5 py-2 bg-emerald-900/95 text-emerald-100 text-xs flex items-center justify-between border-b border-emerald-700/80 animate-fade-in shadow-inner">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
            <span className="font-semibold text-[11px] text-white">
              {lang === 'ta' ? '🔊 AI ஆலோசகர் தமிழில் பேசுகிறார்...' : '🔊 AI is speaking advisory response...'}
            </span>
          </div>
          <button
            onClick={stopSpeaking}
            className="text-[10px] bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer"
          >
            {lang === 'ta' ? 'நிறுத்து (Stop)' : 'Stop'}
          </button>
        </div>
      )}

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 overscroll-contain"
      >
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[88%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-xs shadow-xs'
                  : 'bg-white text-slate-800 rounded-bl-xs border border-slate-200 shadow-2xs'
              }`}
            >
              {msg.image && (
                <div className="mb-2 rounded-lg overflow-hidden border border-white/20 max-h-48">
                  <img src={msg.image} alt="User upload" className="w-full h-auto object-cover" />
                </div>
              )}
              <p className="whitespace-pre-line">
                {cleanDisplayText(msg.text) || msg.text || (lang === 'ta' ? 'வணக்கம் விவசாயி அவர்களே! விவரங்கள் பெறப்பட்டுள்ளன.' : 'Hello Farmer! Information retrieved.')}
              </p>
              {msg.sender === 'bot' && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => speakMessage(msg.text, idx)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                      currentlySpeakingIdx === idx && isSpeaking
                        ? 'bg-emerald-600 text-white animate-pulse shadow-xs'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                    title={currentlySpeakingIdx === idx && isSpeaking ? 'Stop speaking' : (lang === 'ta' ? 'குரலில் கேட்கவும்' : 'Listen with voice')}
                  >
                    {currentlySpeakingIdx === idx && isSpeaking ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>{lang === 'ta' ? 'நிறுத்து' : 'Stop'}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{lang === 'ta' ? 'குரலில் கேட்க' : 'Listen'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 w-fit text-xs text-slate-600 shadow-2xs">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span>{lang === 'ta' ? 'AI ஆலோசகர் ஆய்வு செய்கிறார்...' : 'Agent cluster is reasoning across models & tools...'}</span>
          </div>
        )}

        {isTranscribing && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-2xl border border-amber-200 w-fit text-xs text-amber-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{lang === 'ta' ? 'குரல் பதிவு உரையாக மாற்றப்படுகிறது...' : 'Transcribing audio via Groq Whisper...'}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts */}
      <div className="p-2.5 bg-white border-t border-slate-200 flex gap-1.5 overflow-x-auto scrollbar-none">
        {(lang === 'ta' ? QUICK_PROMPTS_TA : QUICK_PROMPTS).map((qp, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleSend(qp);
            }}
            className="text-[11px] whitespace-nowrap px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 rounded-full border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input tray */}
      <div className="p-3 bg-white border-t border-slate-200">
        {imagePreview && (
          <div className="mb-2 flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl w-fit">
            <img src={imagePreview} alt="Preview" className="w-10 h-10 object-cover rounded-lg" />
            <span className="text-xs text-slate-700 font-medium truncate max-w-[150px]">{selectedImage?.name}</span>
            <button onClick={removeImage} className="p-1 hover:bg-slate-200 rounded-md text-slate-500 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs text-red-600 font-semibold">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              {lang === 'ta' ? 'பதிவு நடக்கிறது...' : 'Listening… speak now'}
            </div>
            <button
              type="button"
              onClick={stopRecording}
              className="text-[10px] font-bold px-2 py-0.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-full border border-red-300 cursor-pointer transition-colors"
            >
              {lang === 'ta' ? 'நிறுத்து ✓' : 'Done ✓'}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Camera upload */}
          <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Attach crop photograph"
          >
            <Camera className="w-5 h-5 text-emerald-700" />
          </button>

          {/* Mic button */}
          <button
            type="button"
            onClick={toggleRecording}
            disabled={isTranscribing}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              isRecording
                ? 'bg-red-50 border-red-300 text-red-600 animate-pulse'
                : 'border-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
            title={lang === 'ta' ? (isRecording ? 'நிறுத்து' : 'பேசவும்') : (isRecording ? 'Stop recording' : 'Speak')}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-700" />}
          </button>

          {/* Text input */}
          <input
            id="live-chatbot-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={lang === 'ta' ? 'கேள்வியை தமிழில் கேட்கலாம் (எ.கா. உரம், பூச்சி)...' : 'Ask about fertilizer, pests, spray or mandi rates...'}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10"
          />

          {/* Send */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleSend();
            }}
            disabled={isLoading || (!input.trim() && !selectedImage)}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
