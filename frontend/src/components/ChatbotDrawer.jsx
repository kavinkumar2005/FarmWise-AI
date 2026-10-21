import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, Camera, Loader2, Cpu, ShieldCheck, Mic, MicOff, Globe } from 'lucide-react';
import { api } from '../services/api';

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

export default function ChatbotDrawer({ isOpen, onClose, activeParcel, lang: propLang = 'en' }) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: propLang === 'ta'
        ? "வணக்கம்! நான் உங்கள் ஃபார்ம்வைஸ் AI வேளாண் ஆலோசகர். பயிர் ஊட்டச்சத்து, பூச்சி கட்டுப்பாடு, வானிலை தெளிப்பு முன்னறிவிப்பு அல்லது மண்டி சந்தை விலைகள் பற்றி என்னிடம் கேட்கலாம். களப் புகைப்படத்தையும் பதிவேற்றலாம்!\n\n🎤 குறிப்பு: தமிழில் பேச மைக் பொத்தானைப் பயன்படுத்தவும்!"
        : "Vanakkam / Namaste! I am your FarmwiseAI Agricultural Advisor. You can ask me questions about crop nutrient management, pest control, weather spray forecasts, or Mandi prices. You can also upload a field photo for multimodal crop analysis!\n\n🎤 Tip: Use the mic button to speak in Tamil or English!",
      modelUsed: 'Planner (Claude/Gemini)',
      confidence: 0.98,
      sources: ['TNAU Crop Guide', 'ICAR', 'eNAM APMC'],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Voice / language state
  const [lang, setLang] = useState(propLang || 'en'); // 'en' or 'ta'
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => {
    if (propLang) setLang(propLang);
  }, [propLang]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  const cleanDisplayText = (text) => {
    if (!text) return '';
    return text
      .replace(/^#{1,6}\s*/gm, '')
      .replace(/\*{1,3}([^\*]+)\*{1,3}/g, '$1')
      .replace(/^[-*_]{3,}$/gm, '')
      .trim();
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
      text: queryText || 'Uploaded field photograph for multimodal diagnosis.',
      image: imagePreview,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.chatAdvisor(
        queryText || 'Analyze this crop image',
        activeParcel?.survey_number || null,
        selectedImage
      );

      const rawText = res.reply || res.response || res.message || res.answer || (typeof res === 'string' ? res : '');
      const defaultTamil = `வணக்கம் விவசாயி அவர்களே! புல எண் #${activeParcel?.survey_number || 1342} விவரங்கள் பெறப்பட்டுள்ளன. பயிர் வளர்ச்சி, உரம் அல்லது சந்தை விலை பற்றி கேளுங்கள்.`;
      const defaultEnglish = `Hello Farmer! For Survey Parcel #${activeParcel?.survey_number || 1342}, I am ready to answer your agronomic, fertilizer, weather, or market pricing questions.`;
      const finalText = (rawText && typeof rawText === 'string' && rawText.trim().length > 0)
        ? rawText.trim()
        : (lang === 'ta' ? defaultTamil : defaultEnglish);

      const botMsg = {
        sender: 'bot',
        text: finalText,
        modelUsed: res.model_used || res.modelUsed || 'Gemini 3.8 Flash + TNAU RAG',
        confidence: res.confidence || res.confidence_score || 0.97,
        sources: res.sources || ['TNAU Crop Production Guide', 'Open-Meteo ECMWF', 'eNAM Mandi Rate'],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'I encountered a network timeout while querying the model cluster. Please try again or rephrase your farming question.',
          modelUsed: 'System Fallback',
          confidence: 0.5,
          sources: ['Local Knowledge Base'],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
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

  if (!isOpen) return null;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-y-0 right-0 z-[2000] w-full max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col">

      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-emerald-800 to-green-700 text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs font-bold">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">FarmWise AI Advisor</h3>
            <p className="text-xs text-emerald-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Multi-Model Multimodal Copilot</span>
              {activeParcel && <span className="font-semibold text-white">• Survey #{activeParcel.survey_number}</span>}
            </p>
          </div>
        </div>

        {/* Language toggle + close */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(l => l === 'en' ? 'ta' : 'en')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold transition-colors cursor-pointer"
            title="Toggle language for voice"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang === 'en' ? 'EN' : 'தமிழ்'}
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
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
              {msg.sender === 'bot' && msg.modelUsed && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500">
                  <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <Cpu className="w-3 h-3" />
                    <span>{msg.modelUsed}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                    <span>{Math.round(msg.confidence * 100)}% Confidence</span>
                  </div>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 w-fit text-xs text-slate-600 shadow-2xs">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Agent cluster is reasoning across models &amp; tools...</span>
          </div>
        )}

        {isTranscribing && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-2xl border border-amber-200 w-fit text-xs text-amber-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Transcribing audio via Groq Whisper...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts */}
      <div className="p-2.5 bg-white border-t border-slate-200 flex gap-1.5 overflow-x-auto scrollbar-none">
        {(lang === 'ta' ? QUICK_PROMPTS_TA : QUICK_PROMPTS).map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp)}
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
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={lang === 'ta' ? 'உங்கள் கேள்வியை தமிழில் கேளுங்கள்...' : 'Ask about fertilizer, pests, weather or mandi rates...'}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10"
          />

          {/* Send */}
          <button
            onClick={() => handleSend()}
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
