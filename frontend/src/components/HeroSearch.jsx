import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, ArrowRight, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { translations, tCrop } from '../utils/translations';
import { api } from '../services/api';

const FEATURED_SURVEYS = [
  { no: "1342", crop: "Coconut", village: "Sivagiri", stage: "Full Growth" },
  { no: "1476", crop: "Rice (Paddy)", village: "Sivagiri", stage: "Vegetation" },
  { no: "870", crop: "Rice (Paddy)", village: "Sivagiri", stage: "Vegetation" },
  { no: "584", crop: "Coconut", village: "Sivagiri", stage: "Full Growth" },
  { no: "386", crop: "Maize", village: "Sivagiri", stage: "Full Growth" },
  { no: "876", crop: "Groundnut", village: "Tenkasi", stage: "Vegetation" },
];


export default function HeroSearch({ lang, onSelectSurvey, isLoading }) {
  const t = translations[lang] || translations.en;
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isLoading) {
      setIsSubmitting(false);
    }
  }, [isLoading]);

  // Auto-suggest survey numbers as user types
  useEffect(() => {
    if (searchTerm.trim().length >= 1) {
      const delay = setTimeout(async () => {
        setIsSearching(true);
        try {
          const res = await api.searchSurveys(searchTerm.trim());
          setSuggestions(res.results || []);
          setShowDropdown(true);
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      }, 250);
      return () => clearTimeout(delay);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  }, [searchTerm]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;
    // Only allow numeric survey numbers
    if (!/^\d+$/.test(term)) return;
    setIsSubmitting(true);
    setShowDropdown(false);
    onSelectSurvey(term);
  };

  const handleSelect = (surveyNo) => {
    setSearchTerm(surveyNo);
    setIsSubmitting(true);
    setShowDropdown(false);
    onSelectSurvey(surveyNo);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-emerald-50/80 via-white to-slate-50 pt-8 pb-12 sm:pt-14 sm:pb-16 border-b border-emerald-100/60">
      {/* Subtle organic background patterns */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-40">
        <div className="absolute top-4 left-10 w-72 h-72 rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="absolute top-20 right-10 w-96 h-96 rounded-full bg-green-200/40 blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold mb-4 shadow-2xs border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>{lang === 'ta' ? 'நில அளவிலான பல்-மாதிரி வேளாண் நுண்ணறிவு அமைப்பு' : 'Parcel-Level Multi-Model Agronomic System'}</span>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
          {t.subtitle}
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8">
          {t.tagline}
        </p>

        {/* Search Bar: Exact Survey Number Filter */}
        <div className="relative max-w-2xl mx-auto text-left" ref={dropdownRef}>
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5 text-emerald-600" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => searchTerm && setShowDropdown(true)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-11 pr-36 sm:pr-44 py-4 bg-white rounded-2xl border-2 border-emerald-200/90 shadow-lg shadow-emerald-900/5 text-slate-900 text-base sm:text-lg placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-36 sm:right-44 flex items-center pr-3">
                  <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!searchTerm.trim() || (isSubmitting && isLoading)}
              className="absolute right-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm sm:text-base font-semibold shadow-md shadow-emerald-700/20 flex items-center gap-1.5 transition-all hover:gap-2 active:scale-95 cursor-pointer"
            >
              {isSubmitting && isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'ta' ? 'பகுப்பாய்வு...' : 'Analyzing...'}</span>
                </>
              ) : (
                <>
                  <span>{t.searchButton || 'Search'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100">
              <div className="p-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50">
                {lang === 'ta' ? 'பதிவு செய்யப்பட்ட மாதிரி நிலங்கள் (14,600+ தரவுப் புள்ளிகள்)' : 'Matched Land Parcels in Dataset (14,600+ Ground Truth Points)'}
              </div>
              {suggestions.map((item) => (
                <div
                  key={item.survey_number}
                  onClick={() => handleSelect(item.survey_number)}
                  className="px-4 py-3 hover:bg-emerald-50/70 cursor-pointer flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-bold text-xs group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      #{item.survey_number}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-800 group-hover:text-emerald-800">
                        {lang === 'ta' ? 'புல எண்' : 'Survey No.'} {item.survey_number}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{item.village}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 group-hover:border-emerald-300">
                      {tCrop(item.crop, lang)}
                    </span>
                    {item.has_image && (
                      <span className="block text-[10px] text-emerald-600 font-medium mt-0.5">
                        {lang === 'ta' ? '• களப் படம் உள்ளது' : '• Field photo linked'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular Sample Survey Chips */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600">
          <span className="font-medium text-slate-500">{t.popularSurveys}</span>
          {FEATURED_SURVEYS.map((s) => (
            <button
              key={s.no}
              onClick={() => handleSelect(s.no)}
              className="px-3 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-full font-medium transition-all shadow-2xs hover:shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span className="font-bold text-emerald-700">#{s.no}</span>
              <span>({tCrop(s.crop, lang)} - {s.village})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
