import React from 'react';
import { Camera, Bot, Map, TrendingUp } from 'lucide-react';
import { translations } from '../utils/translations';

export default function QuickActionCards({ lang, onOpenUpload, onOpenChat, onSelectDefaultSurvey, onOpenMarket }) {
  const t = translations[lang] || translations.en;

  const actions = [
    {
      title: t.actionUpload,
      desc: t.actionUploadDesc,
      icon: Camera,
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-50/60 hover:bg-emerald-50",
      borderColor: "border-emerald-200/80",
      textColor: "text-emerald-900",
      onClick: onOpenUpload,
      tag: t.tagVision || "Multimodal Vision"
    },
    {
      title: t.actionAdvisor,
      desc: t.actionAdvisorDesc,
      icon: Bot,
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-50/60 hover:bg-blue-50",
      borderColor: "border-blue-200/80",
      textColor: "text-blue-900",
      onClick: onOpenChat,
      tag: t.tagAdvisor || "Agentic Chatbot"
    },
    {
      title: t.actionMap,
      desc: t.actionMapDesc,
      icon: Map,
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-50/60 hover:bg-amber-50",
      borderColor: "border-amber-200/80",
      textColor: "text-amber-900",
      onClick: () => onSelectDefaultSurvey("1342"),
      tag: t.tagMap || "Cadastral & FMB"
    },
    {
      title: t.actionMarket || "Mandi Market Rates",
      desc: t.actionMarketDesc || "Live APMC prices for Tenkasi, Kovilpatti & Tirunelveli",
      icon: TrendingUp,
      color: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-50/60 hover:bg-purple-50",
      borderColor: "border-purple-200/80",
      textColor: "text-purple-900",
      onClick: onOpenMarket,
      tag: t.tagMarket || "eNAM Benchmarks"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 mb-10 relative z-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((act, idx) => {
          const Icon = act.icon;
          return (
            <div
              key={idx}
              onClick={act.onClick}
              className={`p-5 rounded-2xl border ${act.borderColor} ${act.bgColor} bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group active:scale-[0.98]`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${act.color} text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/80 border border-slate-200 text-slate-600 shadow-2xs">
                    {act.tag}
                  </span>
                </div>
                <h3 className={`font-bold text-base ${act.textColor} group-hover:text-emerald-700 transition-colors`}>
                  {act.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {act.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
                <span>{t.launchAction || "Launch Action"}</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
