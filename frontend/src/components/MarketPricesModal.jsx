import React from 'react';
import { X, TrendingUp, ArrowUpRight, ShieldCheck, MapPin } from 'lucide-react';
import { tCrop } from '../utils/translations';

const MANDI_DATA = [
  { crop: "Rice (Paddy)", variety: "Ponni / IR20 / Samba", market: "Tenkasi APMC", modal: "₹2,380 / Qtl", min: "₹2,220", max: "₹2,490", trend: "+3.2% Weekly" },
  { crop: "Coconut", variety: "West Coast Tall / Pollachi", market: "Rajapalayam Regulated", modal: "₹32 / Nut", min: "₹28", max: "₹35", trend: "High Demand" },
  { crop: "Maize", variety: "Yellow Feed Grade", market: "Kovilpatti Mandi", modal: "₹2,280 / Qtl", min: "₹2,140", max: "₹2,350", trend: "+1.8% Weekly" },
  { crop: "Banana", variety: "Grand Naine / Poovan", market: "Tirunelveli Fruit Mandi", modal: "₹3,400 / Qtl", min: "₹3,100", max: "₹3,750", trend: "Stable" },
  { crop: "Sugarcane", variety: "Co 86032", market: "Dharani Sugar Mills", modal: "₹3,150 / Tonne", min: "₹3,050", max: "₹3,250", trend: "FRP Benchmark" },
  { crop: "Cotton", variety: "MCU-5 Medium Staple", market: "Sankarankovil Market", modal: "₹7,150 / Qtl", min: "₹6,800", max: "₹7,450", trend: "+2.5% Weekly" },
];

export default function MarketPricesModal({ isOpen, onClose, lang = 'en' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-base">
                {lang === 'ta' ? 'தமிழ்நாடு APMC ஒழுங்குமுறை சந்தை விலைகள்' : 'Tamil Nadu APMC Mandi Market Prices'}
              </h3>
              <p className="text-xs text-emerald-200">
                {lang === 'ta' ? 'நேரடி eNAM / ஒழுங்குமுறை சந்தை விலை நிலவரம்' : 'Live eNAM / Regulated Market price indicators'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="px-4 py-3">{lang === 'ta' ? 'வேளாண் பொருள்' : 'Commodity'}</th>
                  <th className="px-4 py-3">{lang === 'ta' ? 'சந்தை மையம்' : 'Market Center'}</th>
                  <th className="px-4 py-3">{lang === 'ta' ? 'சராசரி விலை' : 'Modal Rate'}</th>
                  <th className="px-4 py-3">{lang === 'ta' ? 'குறைந்த - அதிகபட்ச' : 'Min - Max'}</th>
                  <th className="px-4 py-3">{lang === 'ta' ? 'போக்கு' : 'Weekly Trend'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MANDI_DATA.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{tCrop(item.crop, lang)}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{item.variety}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span>{item.market}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-black text-emerald-700 font-mono text-sm">
                      {lang === 'ta' && item.modal.includes('/ Nut') ? '₹32 / காய்' : item.modal}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{item.min} – {item.max}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <ArrowUpRight className="w-3 h-3" />
                        {item.trend}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-[11px] text-slate-400 text-right">
            {lang === 'ta' 
              ? 'ஆதாரம்: தமிழ்நாடு ஒழுங்குமுறை விற்பனைக்கூடம் & eNAM போர்டல்' 
              : 'Source: Tamil Nadu Agricultural Marketing Board & eNAM Portal'}
          </div>
        </div>
      </div>
    </div>
  );
}
