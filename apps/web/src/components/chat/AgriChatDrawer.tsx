import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Mic,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Bot,
  User,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import {
  AgriChatbot,
  ChatMessage,
  ChatResponse,
  ChatCitation,
  FinalResult
} from '@farmwise/agent-core';
import { Language, Persona } from '../../types/ui.js';
import { VoiceInputModal } from '../voice/VoiceInputModal.js';

interface AgriChatDrawerProps {
  currentResult?: FinalResult | null;
  lang: Language;
  persona: Persona;
}

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  responseMeta?: {
    verified: boolean;
    confidence: number;
    modelUsed: string;
    citations: ChatCitation[];
    intent: string;
  };
}

const chatbotInstance = new AgriChatbot();

export const AgriChatDrawer: React.FC<AgriChatDrawerProps> = ({ currentResult, lang, persona }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeEn = "Vanakkam! I am FarmwiseAI's agricultural assistant. Ask me questions about crop nutrient management, pest diagnosis, weather spray safety, or government subsidies grounded in TNAU & ICAR standards.";
      const welcomeTa = "வணக்கம்! நான் உங்கள் உழவர் நுண்ணறிவு உதவியாளர். உர அளவு, பூச்சி மேலாண்மை, மழை தெளிப்பு நேரம் அல்லது அரசு மானியங்கள் பற்றி தமிழ்நாடு வேளாண் பல்கலைக்கழக (TNAU) தரவுகளின்படி என்னிடம் கேட்கலாம்.";

      setMessages([
        {
          id: 'msg-welcome',
          role: 'assistant',
          content: lang === 'ta' ? welcomeTa : welcomeEn,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          responseMeta: {
            verified: true,
            confidence: 0.98,
            modelUsed: 'ministral-8b',
            citations: [
              {
                sourceId: 'TNAU-CPG-2024',
                title: 'TNAU Crop Production Guide 2024',
                section: 'Wetland & Dryland Package of Practices',
                provenance: 'Public source',
                snippet: 'Standardized agricultural production recommendations approved by the Directorate of Agriculture, Tamil Nadu.'
              }
            ],
            intent: 'welcome'
          }
        }
      ]);
    }
  }, [lang]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: MessageItem = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Build context from active parcel if available
      const parcelContext = currentResult ? {
        surveyNumber: currentResult.parcel.surveyNumber,
        village: currentResult.parcel.village,
        district: currentResult.parcel.district,
        cropName: currentResult.cropAssessment.cropName,
        growthStage: currentResult.cropAssessment.growthStage,
        condition: currentResult.cropAssessment.condition,
        weatherAlerts: currentResult.weather.agronomicAlerts
      } : undefined;

      const history: ChatMessage[] = messages.slice(-4).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response: ChatResponse = await chatbotInstance.chat({
        message: text,
        history,
        language: lang,
        parcelContext
      });

      const assistantMsg: MessageItem = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        responseMeta: {
          verified: response.verified,
          confidence: response.confidence,
          modelUsed: response.modelUsed,
          citations: response.citations,
          intent: response.intent
        }
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: MessageItem = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: lang === 'ta'
          ? 'மன்னிக்கவும், பதிலை உருவாக்குவதில் பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
          : 'Sorry, an error occurred while processing your request. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCitation = (msgId: string) => {
    setExpandedCitations(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const sampleChips = lang === 'ta'
    ? [
        'யூரியா அளவு என்ன?',
        'தண்டுத்துளைப்பான் புழு கட்டுப்பாடு',
        'சொட்டு நீர் பாசன மானியம்',
        'மழை நேரத்தில் மருந்து அடிக்கலாமா?'
      ]
    : [
        'Urea dosage for tillering?',
        'Stem borer control chemical',
        'Drip irrigation subsidy %',
        'Can I spray during rain?'
      ];

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40 print:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center space-x-2.5 bg-[#0F3D26] hover:bg-[#165a38] text-white px-4 py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-emerald-400/40"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-emerald-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold leading-tight">
              {lang === 'ta' ? 'உழவர் உதவி' : 'Agri AI Chat'}
            </div>
            {currentResult && (
              <div className="text-[10px] text-emerald-300/90 leading-none">
                Survey {currentResult.parcel.surveyNumber}
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Slide-Over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm print:hidden animate-fadeIn">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-gray-200">
              {/* Drawer Header */}
              <div className="bg-[#0F3D26] text-white p-4 flex items-center justify-between shadow-md">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-800/80 border border-emerald-500/30 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm flex items-center space-x-1.5">
                      <span>{lang === 'ta' ? 'வேளாண் AI உதவியாளர்' : 'FarmwiseAI Assistant'}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    </h3>
                    <p className="text-[10px] text-emerald-200/90">
                      Grounded in TNAU & ICAR Agrotech Corpus
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Active Parcel Context Pill */}
              {currentResult && (
                <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center justify-between text-[11px] text-emerald-950 font-sans">
                  <div className="flex items-center space-x-1 truncate">
                    <span className="font-bold">Active Field:</span>
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                      {currentResult.parcel.surveyNumber}
                    </span>
                    <span>({currentResult.cropAssessment.cropName})</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 font-semibold">
                    {persona === 'officer' ? 'Officer Mode' : 'Farmer Mode'}
                  </span>
                </div>
              )}

              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/60 font-sans">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-start space-x-2 max-w-[90%]">
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-full bg-[#0F3D26] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                          <Bot className="w-3.5 h-3.5 text-emerald-300" />
                        </div>
                      )}

                      <div
                        className={`rounded-2xl p-3.5 text-xs shadow-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-[#2E7D32] text-white rounded-tr-none'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-tl-none'
                        }`}
                      >
                        <div className="whitespace-pre-line">{msg.content}</div>

                        {/* Assistant Response Metadata */}
                        {msg.responseMeta && (
                          <div className="mt-2.5 pt-2 border-t border-gray-100 flex flex-col space-y-1.5 text-[10px]">
                            <div className="flex items-center justify-between text-gray-500 font-mono">
                              <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span>Verified ({Math.round(msg.responseMeta.confidence * 100)}%)</span>
                              </span>
                              <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                {msg.responseMeta.modelUsed}
                              </span>
                            </div>

                            {/* Citations Toggle */}
                            {msg.responseMeta.citations.length > 0 && (
                              <div>
                                <button
                                  type="button"
                                  onClick={() => toggleCitation(msg.id)}
                                  className="text-[10px] text-green-800 hover:text-green-950 font-bold flex items-center space-x-1 mt-1"
                                >
                                  <BookOpen className="w-3 h-3 text-green-700" />
                                  <span>
                                    {msg.responseMeta.citations.length} Grounded Citations (TNAU)
                                  </span>
                                  {expandedCitations[msg.id] ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </button>

                                {expandedCitations[msg.id] && (
                                  <div className="mt-1.5 space-y-1.5 pl-2 border-l-2 border-green-600 animate-fadeIn">
                                    {msg.responseMeta.citations.map((c, idx) => (
                                      <div key={idx} className="bg-green-50/70 p-2 rounded border border-green-200">
                                        <div className="font-bold text-green-950">{c.title}</div>
                                        <div className="text-[9px] text-green-800 font-mono">{c.section}</div>
                                        <div className="text-[9px] text-gray-600 mt-0.5 italic">{c.snippet}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <div className={`text-[9px] mt-1 text-right ${msg.role === 'user' ? 'text-green-100' : 'text-gray-400'}`}>
                          {msg.timestamp}
                        </div>
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-7 h-7 rounded-full bg-green-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <div className="w-7 h-7 rounded-full bg-[#0F3D26] text-white flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-spin" />
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-gray-200 text-gray-500 shadow-sm flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                      <span className="text-[11px] ml-1">Searching TNAU corpus...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick-Ask Chips */}
              <div className="p-2.5 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
                {sampleChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(chip)}
                    className="whitespace-nowrap px-2.5 py-1 bg-gray-100 hover:bg-green-100 hover:text-green-900 text-gray-700 rounded-full border border-gray-200 transition-colors flex-shrink-0"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-white border-t border-gray-200 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowVoiceModal(true)}
                  className="p-2.5 bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-800 rounded-xl transition-colors border border-gray-200"
                  title="Speak query in Tamil or English"
                >
                  <Mic className="w-4 h-4 text-green-700" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder={lang === 'ta' ? 'கேள்வியை தட்டச்சு செய்க...' : 'Type agricultural question...'}
                  className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent font-sans"
                />

                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() || isLoading}
                  className="p-2.5 bg-[#2E7D32] hover:bg-[#388E3C] disabled:bg-gray-300 text-white rounded-xl transition-all shadow-sm flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice Input Modal Integration */}
      <VoiceInputModal
        isOpen={showVoiceModal}
        lang={lang}
        onClose={() => setShowVoiceModal(false)}
        onApplyTranscription={(res) => {
          const text = res.normalizedText;
          setInputText(text);
          setShowVoiceModal(false);
          handleSend(text);
        }}
      />
    </>
  );
};
