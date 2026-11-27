import React from 'react';
import { 
  Users, MapPin, Layers, Sprout, ShieldCheck, 
  PieChart as PieIcon, BarChart3, TrendingUp, AlertTriangle, CheckCircle2 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

export default function AdminStatsOverview({ overviewData = {} }) {
  const { summary = {}, charts = {} } = overviewData;

  const statCards = [
    {
      title: "Registered Farmers",
      value: summary.total_registered_farmers?.toLocaleString() || "0",
      subtext: "Tamil Nadu Registry",
      icon: Users,
      color: "from-blue-600 to-indigo-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700"
    },
    {
      title: "Agricultural Parcels",
      value: summary.total_agricultural_parcels?.toLocaleString() || "0",
      subtext: "Cadastral Survey Records",
      icon: Layers,
      color: "from-emerald-600 to-teal-600",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700"
    },
    {
      title: "Total Cultivated Area",
      value: `${summary.total_cultivated_area_acres?.toLocaleString() || "0"} ac`,
      subtext: "Active Standing Crops",
      icon: Sprout,
      color: "from-amber-500 to-yellow-600",
      bgColor: "bg-amber-50",
      textColor: "text-amber-800"
    },
    {
      title: "Active Crop Records",
      value: summary.total_crop_records?.toLocaleString() || "0",
      subtext: `${summary.verification_rate_pct || 0}% Field Verified`,
      icon: ShieldCheck,
      color: "from-emerald-700 to-green-700",
      bgColor: "bg-green-50",
      textColor: "text-green-800"
    },
    {
      title: "Districts Covered",
      value: summary.districts_covered?.toLocaleString() || "0",
      subtext: "Tenkasi & Thoothukudi",
      icon: MapPin,
      color: "from-purple-600 to-pink-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700"
    },
    {
      title: "Villages Covered",
      value: summary.villages_covered?.toLocaleString() || "0",
      subtext: "Revenue Villages (LG)",
      icon: MapPin,
      color: "from-sky-600 to-cyan-600",
      bgColor: "bg-sky-50",
      textColor: "text-sky-700"
    }
  ];

  const cropAreaData = charts.crop_cultivated_area || [];
  const districtData = charts.district_crop_distribution || [];
  const healthData = charts.health_status_distribution || [];
  const seasonData = charts.season_distribution || [];

  return (
    <div className="space-y-6">
      {/* 1. Summary KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-2 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {card.title}
                </span>
                <div className={`w-8 h-8 rounded-xl ${card.bgColor} ${card.textColor} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {card.value}
              </div>
              <div className="text-[11px] font-medium text-slate-500">
                {card.subtext}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Interactive Analytical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Crop-wise Cultivated Area (Acres) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <BarChart3 className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Crop-wise Cultivated Area (Acres)</h4>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cropAreaData.slice(0, 7)} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <XAxis 
                  dataKey="crop" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  interval={0} 
                  angle={-25} 
                  textAnchor="end" 
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-lg border border-slate-700">
                          <p className="font-bold flex items-center gap-1.5">
                            <span>{data.emoji}</span>
                            <span>{data.crop}</span>
                          </p>
                          <p className="text-emerald-400 mt-1 font-mono font-bold">
                            Area: {data.area_acres?.toLocaleString()} Acres
                          </p>
                          <p className="text-slate-300 text-[10px]">
                            Parcels: {data.records_count?.toLocaleString()} records
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="area_acres" radius={[8, 8, 0, 0]}>
                  {cropAreaData.slice(0, 7).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Crop Health Condition Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <PieIcon className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Crop Health Status</h4>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={healthData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="status"
                >
                  {healthData.map((entry, index) => (
                    <Cell key={`health-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-2 rounded-xl shadow-lg border border-slate-700">
                          <p className="font-bold">{data.status}</p>
                          <p className="text-emerald-400 font-mono mt-0.5">{data.count.toLocaleString()} parcels</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(val) => <span className="text-xs font-medium text-slate-700">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
