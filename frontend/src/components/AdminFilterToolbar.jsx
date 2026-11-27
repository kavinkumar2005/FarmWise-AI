import React from 'react';
import { Filter, RotateCcw, Search, Sparkles, MapPin, Layers } from 'lucide-react';

export default function AdminFilterToolbar({
  filterOptions = {},
  selectedFilters = {},
  onFilterChange = () => {},
  onResetFilters = () => {},
  searchQuery = '',
  onSearchChange = () => {},
  totalMatches = 0
}) {
  const {
    districts = [],
    taluks_by_district = {},
    villages_by_taluk = {},
    crops = [],
    seasons = [],
    stages = [],
    health_statuses = [],
    verification_statuses = [],
    disease_statuses = [],
    priority_levels = [],
    crop_metadata = {}
  } = filterOptions;

  // Compute available taluks based on selected district
  const availableTaluks = selectedFilters.district && selectedFilters.district !== 'ALL'
    ? (taluks_by_district[selectedFilters.district] || [])
    : Object.values(taluks_by_district).flat();

  // Compute available villages based on selected taluk
  const availableVillages = selectedFilters.taluk && selectedFilters.taluk !== 'ALL'
    ? (villages_by_taluk[selectedFilters.taluk] || [])
    : Object.values(villages_by_taluk).flat();

  const handleDistrictSelect = (e) => {
    const dist = e.target.value;
    onFilterChange({
      district: dist,
      taluk: 'ALL',
      village: 'ALL'
    });
  };

  const handleTalukSelect = (e) => {
    const taluk = e.target.value;
    onFilterChange({
      taluk: taluk,
      village: 'ALL'
    });
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
      {/* Header and Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Filter className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Geographic & Agronomic Filtering</h3>
          </div>
        </div>

        {/* Search bar and Reset */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search Survey / Farmer / Village..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={onResetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Reset All Filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Cascading Filter Controls Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-3">
        {/* 1. District */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            District
          </label>
          <select
            value={selectedFilters.district || 'ALL'}
            onChange={handleDistrictSelect}
            className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* 2. Taluk */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Taluk
          </label>
          <select
            value={selectedFilters.taluk || 'ALL'}
            onChange={handleTalukSelect}
            className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Taluks</option>
            {availableTaluks.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* 3. Village */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Village
          </label>
          <select
            value={selectedFilters.village || 'ALL'}
            onChange={(e) => onFilterChange({ village: e.target.value })}
            className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Villages</option>
            {availableVillages.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        {/* 4. Crop Type */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Cultivated Crop
          </label>
          <select
            value={selectedFilters.crop || 'ALL'}
            onChange={(e) => onFilterChange({ crop: e.target.value })}
            className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Crops (🌾, 🥥, 🌽...)</option>
            {crops.map((c) => {
              const meta = crop_metadata[c] || {};
              return (
                <option key={c} value={c}>
                  {meta.emoji || '🌱'} {c}
                </option>
              );
            })}
          </select>
        </div>

        {/* 5. Health Status */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Health Condition
          </label>
          <select
            value={selectedFilters.health || 'ALL'}
            onChange={(e) => onFilterChange({ health: e.target.value })}
            className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Health Ratings</option>
            {health_statuses.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        {/* 6. Disease & Pest Filter */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Disease / Pest
          </label>
          <select
            value={selectedFilters.disease || 'ALL'}
            onChange={(e) => onFilterChange({ disease: e.target.value })}
            className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Pathogen Status</option>
            {disease_statuses.filter(d => d !== 'All').map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* 7. Verification Status */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Verification
          </label>
          <select
            value={selectedFilters.verification || 'ALL'}
            onChange={(e) => onFilterChange({ verification: e.target.value })}
            className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Verification</option>
            {['Verified', 'Verification Required', 'Rejected', 'Not Verified'].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        {/* 8. Priority Level */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Alert Priority
          </label>
          <select
            value={selectedFilters.priority || 'ALL'}
            onChange={(e) => onFilterChange({ priority: e.target.value })}
            className={`w-full py-1.5 px-2.5 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
              selectedFilters.priority === 'HIGH'
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : selectedFilters.priority === 'MEDIUM'
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">🔴 HIGH Priority</option>
            <option value="MEDIUM">🟡 MEDIUM Priority</option>
            <option value="LOW">🟢 LOW Priority</option>
          </select>
        </div>

        {/* 9. Season */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Season
          </label>
          <select
            value={selectedFilters.season || 'ALL'}
            onChange={(e) => onFilterChange({ season: e.target.value })}
            className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Seasons</option>
            {seasons.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Crop Legend Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Crop Legend:</span>
        {crops.slice(0, 8).map((crop) => {
          const meta = crop_metadata[crop] || {};
          const isSelected = selectedFilters.crop === crop;
          return (
            <button
              key={crop}
              onClick={() => onFilterChange({ crop: isSelected ? 'ALL' : crop })}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-700 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{meta.emoji || '🌱'}</span>
              <span>{crop}</span>
            </button>
          );
        })}
        {crops.length > 8 && (
          <span className="text-[11px] text-slate-400 font-medium">+{crops.length - 8} more</span>
        )}
      </div>
    </div>
  );
}
