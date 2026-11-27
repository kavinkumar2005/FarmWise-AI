import React from 'react';
import { 
  TrendingUp, Award, DollarSign, Sprout, BarChart2, ShieldAlert,
  Calendar, Layers, CheckCircle2, ChevronRight, Landmark
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, Legend, LineChart, Line, CartesianGrid 
} from 'recharts';

export default function AdminRecommendationInsights({ analyticsData }) {
  if (!analyticsData) {
    return null;
  }

  const {
    total_farmers_evaluated = 0,
    most_recommended_crops = [],
    district_distribution = [],
    seasonal_distribution = [],
    sample_farmer_recommendations = []
  } = analyticsData;

  const barColors = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];
  const avgProfit = most_recommended_crops.length > 0 
    ? Math.round(most_recommended_crops.reduce((acc, c) => acc + (c.avg_profit_acre || 0), 0) / most_recommended_crops.length)
    : 38500;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-bold text-slate-800">
              State-wide AI Seasonal Crop Recommendations &amp; Profit Trends
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              Rabi (Navarai / Summer) 2026
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Grounded in TNAU/ICAR crop calendars, Tamil Nadu soil profiles, and live APMC Mandi trends.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Projected Profit</span>
            <span className="text-sm font-black text-emerald-700">₹{avgProfit.toLocaleString('en-IN')}/acre</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Evaluated Parcels</span>
            <span className="text-sm font-black text-slate-800">{total_farmers_evaluated}</span>
          </div>
        </div>
      </div>

      {/* Top 4 KPI metric chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {most_recommended_crops.slice(0, 4).map((crop, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between hover:border-emerald-200 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-lg">🌱</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {crop.count} Parcels
              </span>
            </div>
            <div className="mt-2">
              <h5 className="text-xs font-bold text-slate-800 truncate">{crop.crop}</h5>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                ₹{crop.avg_profit_acre?.toLocaleString('en-IN')}/ac profit
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row: Crop Suitability vs Profit & District Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
        {/* Left: Top Recommended Crops by Frequency */}
        <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
          <h5 className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Most Recommended Crops &amp; Average Profit</span>
          </h5>
          <p className="text-[11px] text-slate-500 mb-3">
            Comparison of recommendation parcel count vs estimated net profit per acre (₹)
          </p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={most_recommended_crops} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="crop" 
                  tick={{ fontSize: 10, fill: '#475569' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#475569' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-md text-xs">
                          <p className="font-bold text-slate-900">
                            {data.crop}
                          </p>
                          <p className="text-emerald-700 font-semibold mt-1">
                            Parcels Recommended: {data.count}
                          </p>
                          <p className="text-slate-600">
                            Avg Net Profit: ₹{data.avg_profit_acre?.toLocaleString('en-IN')}/acre
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar yAxisId="left" dataKey="count" name="Parcels Count" radius={[4, 4, 0, 0]}>
                  {most_recommended_crops.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: District-wise Crop Suitability Distribution */}
        <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
          <h5 className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-blue-600" />
            <span>District-wise Top Recommended Crops</span>
          </h5>
          <p className="text-[11px] text-slate-500 mb-3">
            Primary recommended crop distribution across surveyed districts
          </p>

          <div className="space-y-3">
            {district_distribution.map((dist, idx) => (
              <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200/70">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-800">{dist.district}</span>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    Lead: {dist.top_crop}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                  <span>Parcels Recommended: {dist.recommended_parcels}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Seasonal Calendar Note */}
          <div className="mt-4 p-3 bg-blue-50/80 rounded-xl border border-blue-200/70 flex items-start gap-2.5">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-blue-900 leading-relaxed">
              <span className="font-semibold">Agronomic Advisory Notice:</span> Sowing window for Navarai/Summer crops ends in March. TNAU suggests prioritizing short-duration pulses (Groundnut, Blackgram) in dry zones and high-efficiency drip fertigation for banana plantations.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
