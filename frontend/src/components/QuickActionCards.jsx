import React from 'react';
import { Camera, TrendingUp } from 'lucide-react';
import { translations } from '../utils/translations';

export default function QuickActionCards({ lang, onOpenUpload, onOpenMarket, inline = false }) {
  const t = translations[lang] || translations.en;

  const actions = [
    {
      title: t.actionUpload,
      desc: t.actionUploadDesc,
      icon: Camera,
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-50/60 hover:bg-amber-50",
      borderColor: "border-amber-200/80",
      textColor: "text-amber-950",
      accentText: "text-amber-800 group-hover:text-amber-900",
      onClick: onOpenUpload
    },
    {
      title: t.actionMarket || "Mandi Market Rates",
      desc: t.actionMarketDesc || "Live APMC prices for Tenkasi, Kovilpatti & Tirunelveli",
      icon: TrendingUp,
      color: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-50/60 hover:bg-purple-50",
      borderColor: "border-purple-200/80",
      textColor: "text-purple-950",
      accentText: "text-purple-700 group-hover:text-purple-900",
      onClick: onOpenMarket
    }
  ];

  const gridClass = "grid grid-cols-1 sm:grid-cols-2 gap-4";

  const containerClass = inline
    ? "w-full pt-2"
    : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 mb-10 relative z-20";

  return (
    <div className={containerClass}>
      <div className={gridClass}>
        {actions.map((act, idx) => {
          const Icon = act.icon;
          return (
            <div
              key={idx}
              onClick={act.onClick}
              className={`p-4 sm:p-5 rounded-2xl border ${act.borderColor} ${act.bgColor} bg-white shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group active:scale-[0.98]`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${act.color} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className={`font-bold text-sm sm:text-base ${act.textColor} group-hover:text-slate-900 transition-colors`}>
                  {act.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {act.desc}
                </p>
              </div>

              <div className={`mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold ${act.accentText}`}>
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
