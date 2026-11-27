import React, { useState, useEffect } from 'react';
import { 
  MapPin, ShieldCheck, Filter, Layers, BarChart3, Database, 
  RotateCcw, Sparkles, RefreshCw, FileText, ArrowLeft, TrendingUp, AlertTriangle 
} from 'lucide-react';
import { api } from '../services/api';
import AdminFilterToolbar from './AdminFilterToolbar';
import AdminAlertCards from './AdminAlertCards';
import AdminCropMap from './AdminCropMap';
import AdminStatsOverview from './AdminStatsOverview';
import AdminRecordTable from './AdminRecordTable';
import AdminRecordDetailModal from './AdminRecordDetailModal';
import AdminRecommendationInsights from './AdminRecommendationInsights';

export default function AdminDashboard({ onBackToFarmerView = () => {} }) {
  // State for Filters
  const [filterOptions, setFilterOptions] = useState({});
  const [selectedFilters, setSelectedFilters] = useState({
    district: 'ALL',
    taluk: 'ALL',
    village: 'ALL',
    crop: 'ALL',
    season: 'ALL',
    stage: 'ALL',
    health: 'ALL',
    verification: 'ALL',
    disease: 'ALL',
    priority: 'ALL'
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Map & Data states
  const [markersData, setMarkersData] = useState({ markers: [], center: [9.2463, 77.3798] });
  const [overviewData, setOverviewData] = useState({ summary: {}, charts: {} });
  const [cadastralGeojson, setCadastralGeojson] = useState(null);
  const [mapLayer, setMapLayer] = useState('satellite');

  // Paginated records table
  const [recordsData, setRecordsData] = useState({ records: [], total_count: 0, page: 1, page_size: 25 });
  const [currentPage, setCurrentPage] = useState(1);

  // Selected Record & Modal
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailModalRecord, setDetailModalRecord] = useState(null);

  // Recommendation Analytics State
  const [recommendationAnalytics, setRecommendationAnalytics] = useState(null);

  // Loading indicator
  const [isLoading, setIsLoading] = useState(true);

  // 1. Initial Load of Filter Options & Cadastral Boundaries
  useEffect(() => {
    async function loadInitials() {
      try {
        const [filtersRes, cadRes] = await Promise.all([
          api.getCropMonitoringFilters(),
          api.getCropMonitoringBoundaries()
        ]);
        setFilterOptions(filtersRes);
        setCadastralGeojson(cadRes);
      } catch (err) {
        console.error("Error loading initial admin metadata:", err);
      }
    }
    loadInitials();
  }, []);

  // 2. Fetch Map Markers, Overview Stats & Table records when filters or page changes
  useEffect(() => {
    let isMounted = true;

    async function fetchFilteredData() {
      setIsLoading(true);
      try {
        const currentParams = {
          ...selectedFilters,
          search: searchQuery
        };

        const [markersRes, overviewRes, tableRes, recoAnalyticsRes] = await Promise.all([
          api.getCropMonitoringMarkers(currentParams, 1500),
          api.getCropMonitoringOverview(currentParams),
          api.getCropMonitoringRecords(currentPage, 25, currentParams),
          api.getAdminRecommendationAnalytics(selectedFilters.district, selectedFilters.village)
        ]);

        if (isMounted) {
          setMarkersData(markersRes);
          setOverviewData(overviewRes);
          setRecordsData(tableRes);
          setRecommendationAnalytics(recoAnalyticsRes);
        }
      } catch (err) {
        console.error("Failed fetching crop monitoring data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchFilteredData();

    return () => {
      isMounted = false;
    };
  }, [selectedFilters, searchQuery, currentPage]);

  // Handle cascading filter changes
  const handleFilterChange = (newFilters) => {
    setSelectedFilters((prev) => ({
      ...prev,
      ...newFilters
    }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSelectedFilters({
      district: 'ALL',
      taluk: 'ALL',
      village: 'ALL',
      crop: 'ALL',
      season: 'ALL',
      stage: 'ALL',
      health: 'ALL',
      verification: 'ALL',
      disease: 'ALL',
      priority: 'ALL'
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleViewRecordDetail = async (recordId) => {
    try {
      const detail = await api.getCropRecordDetail(recordId);
      if (detail) {
        setDetailModalRecord(detail);
      }
    } catch (e) {
      console.error("Error opening record detail:", e);
    }
  };

  const handleSelectAndLocateRecord = (record) => {
    setSelectedRecord(record);
    // If the record exists in current markers, highlight it; if not, add it so the map displays its crop icon immediately
    if (record && record.latitude && record.longitude) {
      setMarkersData((prev) => {
        const exists = prev.markers.some((m) => m.id === record.id);
        const lat = Number(record.latitude);
        const lng = Number(record.longitude);
        if (exists) {
          return { ...prev, center: [lat, lng] };
        }
        const newMarker = {
          id: record.id,
          parcel_id: record.parcel_id,
          survey_number: record.survey_number,
          sub_division: record.sub_division,
          village: record.village_name || record.village,
          taluk: record.taluk,
          district: record.district,
          lat: lat,
          lng: lng,
          crop: record.crop_name || record.crop,
          crop_emoji: record.crop_emoji || '🌱',
          crop_color: record.crop_color || '#10b981',
          marker_color: record.marker_color || '#10b981',
          crop_stage: record.crop_stage,
          health_status: record.health_status,
          health_score: record.health_score,
          disease_status: record.disease_status,
          area_acres: record.area_acres,
          verification_status: record.verification_status,
          priority: record.priority || 'LOW',
          priority_color: record.priority_color || '#16a34a',
          priority_reason: record.priority_reason || '',
          farmer_name_masked: record.farmer_name_masked
        };
        return {
          ...prev,
          center: [lat, lng],
          markers: [newMarker, ...prev.markers]
        };
      });

      // Smooth scroll up to the map so the user immediately sees the crop parcel icon
      const mapElement = document.getElementById('admin-crop-gis-map');
      if (mapElement) {
        mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleRecordUpdated = (updatedRecord) => {
    // Update local state in table and markers
    setRecordsData((prev) => ({
      ...prev,
      records: prev.records.map((r) => (r.id === updatedRecord.id ? updatedRecord : r))
    }));
    setMarkersData((prev) => ({
      ...prev,
      markers: prev.markers.map((m) => (m.id === updatedRecord.id ? { ...m, ...updatedRecord } : m))
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-16 space-y-6">
      {/* Top Admin Header Bar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-16 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToFarmerView}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Return to Farmer Advisory View"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Farmer Advisory View</span>
            </button>

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Admin Geographic Crop Monitoring Dashboard
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Tamil Nadu GIS
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Live cadastral monitoring of crop distribution, growth stages, and verification audits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLoading && (
              <span className="text-xs text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Syncing GIS Data...</span>
              </span>
            )}

            <button
              onClick={handleResetFilters}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* 1. Cascading Geographic & Agronomic Filters */}
        <AdminFilterToolbar
          filterOptions={filterOptions}
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setCurrentPage(1);
          }}
          totalMatches={markersData.total_matches}
        />

        {/* 2. Interactive GIS Cadastral Map with Crop Symbols & Status Colors */}
        <div id="admin-crop-gis-map" className="space-y-2 scroll-mt-24">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Geospatial Crop Distribution Map</span>
            </h3>
            <span className="text-xs text-slate-500">
              Showing actual crop markers with verified cadastral boundaries
            </span>
          </div>

          <AdminCropMap
            markers={markersData.markers}
            center={markersData.center}
            selectedRecord={selectedRecord}
            onSelectRecord={(m) => setSelectedRecord(m)}
            onViewRecordDetail={handleViewRecordDetail}
            cadastralGeojson={cadastralGeojson}
            showCadastral={true}
            mapLayer={mapLayer}
            onToggleMapLayer={() => setMapLayer((prev) => (prev === 'satellite' ? 'street' : 'satellite'))}
          />
        </div>

        {/* 3. Summary Statistics & Analytical Charts */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span>State-wide Cultivation Analytics &amp; KPIs</span>
          </h3>

          <AdminStatsOverview overviewData={overviewData} />
        </div>

        {/* 4. AI Crop Recommendation & Profit Insights (Feature 2) */}
        {recommendationAnalytics && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>AI Seasonal Crop Recommendations &amp; Profit Projections</span>
            </h3>

            <AdminRecommendationInsights analyticsData={recommendationAnalytics} />
          </div>
        )}

        {/* 5. Crop Record Management Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Crop Cultivation Verification &amp; Registry</span>
          </h3>

          <AdminRecordTable
            records={recordsData.records}
            totalCount={recordsData.total_count}
            page={currentPage}
            pageSize={recordsData.page_size}
            onPageChange={(p) => setCurrentPage(p)}
            onSelectRecord={(r) => {
              handleSelectAndLocateRecord(r);
              handleViewRecordDetail(r.id);
            }}
            onLocateOnMap={(r) => handleSelectAndLocateRecord(r)}
            onViewRecordDetail={handleViewRecordDetail}
          />
        </div>
      </div>

      {/* Record Detail & Edit Verification Modal */}
      {detailModalRecord && (
        <AdminRecordDetailModal
          record={detailModalRecord}
          onClose={() => setDetailModalRecord(null)}
          onRecordUpdated={handleRecordUpdated}
        />
      )}
    </div>
  );
}
