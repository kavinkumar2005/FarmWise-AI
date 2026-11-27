import React from 'react';
import { 
  AlertTriangle, ShieldAlert, CheckCircle2, Clock, 
  Bug, HeartPulse, Activity, AlertCircle 
} from 'lucide-react';

export default function AdminAlertCards({
  alerts = {},
  selectedFilters = {},
  onSelectAlertFilter = () => {}
}) {
  const {
    pending_verification = 0,
    critical_crops = 0,
    disease_detected = 0,
    high_priority = 0,
    moderate_health = 0,
    healthy_crops = 0
  } = alerts;

  const cards = [
    {
      id: 'high_priority',
      title: 'High Priority Parcels',
      count: high_priority,
      subtitle: 'Critical health or confirmed disease/pest',
      icon: ShieldAlert,
      color: 'bg-rose-50 border-rose-200 text-rose-900',
      badgeColor: 'bg-rose-100 text-rose-800',
      iconColor: 'text-rose-600',
      filterKey: 'priority',
      filterValue: 'HIGH'
    },
    {
      id: 'critical_crops',
      title: 'Critical Health (<50%)',
      count: critical_crops,
      subtitle: 'Severe crop distress & vegetative failure',
      icon: HeartPulse,
      color: 'bg-red-50 border-red-200 text-red-900',
      badgeColor: 'bg-red-100 text-red-800',
      iconColor: 'text-red-600',
      filterKey: 'health',
      filterValue: 'Critical'
    },
    {
      id: 'disease_detected',
      title: 'Disease / Pest Detected',
      count: disease_detected,
      subtitle: 'Active foliar or boring pest infestation',
      icon: Bug,
      color: 'bg-amber-50 border-amber-200 text-amber-900',
      badgeColor: 'bg-amber-100 text-amber-800',
      iconColor: 'text-amber-600',
      filterKey: 'disease',
      filterValue: 'Disease Detected'
    },
    {
      id: 'pending_verification',
      title: 'Pending Verification',
      count: pending_verification,
      subtitle: 'Cadastral registry requiring officer review',
      icon: Clock,
      color: 'bg-orange-50 border-orange-200 text-orange-900',
      badgeColor: 'bg-orange-100 text-orange-800',
      iconColor: 'text-orange-600',
      filterKey: 'verification',
      filterValue: 'Verification Required'
    },
    {
      id: 'moderate_health',
      title: 'Moderate Health (50-79%)',
      count: moderate_health,
      subtitle: 'Nutrient / moisture stress requiring check',
      icon: Activity,
      color: 'bg-yellow-50 border-yellow-200 text-yellow-900',
      badgeColor: 'bg-yellow-100 text-yellow-800',
      iconColor: 'text-yellow-600',
      filterKey: 'health',
      filterValue: 'Moderate'
    },
    {
      id: 'healthy_crops',
      title: 'Healthy Parcels (80-100%)',
      count: healthy_crops,
      subtitle: 'Vigorous crop canopy & verified records',
      icon: CheckCircle2,
      color: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      iconColor: 'text-emerald-600',
      filterKey: 'health',
      filterValue: 'Healthy'
    }
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>Priority Alert &amp; Triage Center</span>
        </h3>
        <span className="text-xs text-slate-500">
          Click any alert card to filter parcels automatically
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          const isActive = selectedFilters[c.filterKey] === c.filterValue;

          return (
            <div
              key={c.id}
              onClick={() => onSelectAlertFilter(c.filterKey, isActive ? 'ALL' : c.filterValue)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                c.color
              } ${
                isActive 
                  ? 'ring-2 ring-slate-900 shadow-md scale-[1.02]' 
                  : 'hover:shadow-sm hover:scale-[1.01]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`p-1.5 rounded-xl ${c.badgeColor}`}>
                    <Icon className={`w-4 h-4 ${c.iconColor}`} />
                  </span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${c.badgeColor}`}>
                    {isActive ? 'ACTIVE' : 'FILTER'}
                  </span>
                </div>
                <h4 className="text-xs font-bold leading-tight">{c.title}</h4>
                <p className="text-[10px] opacity-75 mt-0.5 line-clamp-2 leading-tight">
                  {c.subtitle}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-black/5 flex items-baseline justify-between">
                <span className="text-xl font-black font-mono tracking-tight">
                  {c.count.toLocaleString()}
                </span>
                <span className="text-[10px] font-semibold opacity-60">parcels</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
