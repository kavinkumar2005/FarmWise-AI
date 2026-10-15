import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation, Layers, Plus, Minus, RotateCcw, Maximize2 } from 'lucide-react';
import { translations, tCrop } from '../utils/translations';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom farmer icon
const farmMarkerIcon = new L.DivIcon({
  className: 'custom-farm-marker',
  html: `<div style="background-color: #15803d; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-weight: bold; font-size: 14px;">🌱</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
});

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 16, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

// Dedicated Interactive Zoom & View Controls inside Leaflet map context
function MapControls({ center, polygonPositions }) {
  const map = useMap();
  const [zoomLevel, setZoomLevel] = useState(map.getZoom());

  useEffect(() => {
    const onZoom = () => setZoomLevel(map.getZoom());
    map.on('zoomend', onZoom);
    return () => {
      map.off('zoomend', onZoom);
    };
  }, [map]);

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  const handleRecenter = () => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, 16, { duration: 0.8 });
    }
  };

  const handleFitBounds = () => {
    if (polygonPositions && polygonPositions.length > 0) {
      map.fitBounds(polygonPositions, { padding: [40, 40], maxZoom: 18, animate: true });
    } else if (center) {
      map.flyTo(center, 17, { duration: 0.8 });
    }
  };

  return (
    <div className="absolute bottom-5 right-4 z-[1000] flex flex-col gap-2">
      {/* Zoom In & Zoom Out Controls */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/90 p-1 flex flex-col items-center">
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In (+)"
          aria-label="Zoom In"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-all focus:outline-none"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="w-6 h-[1px] bg-slate-200 my-0.5" />

        <div className="text-[10px] font-bold font-mono text-slate-500 py-0.5 select-none" title={`Current Zoom: ${zoomLevel}`}>
          {zoomLevel}x
        </div>

        <div className="w-6 h-[1px] bg-slate-200 my-0.5" />

        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out (-)"
          aria-label="Zoom Out"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-all focus:outline-none"
        >
          <Minus className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Recenter & Fit Boundary Actions */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/90 p-1 flex flex-col items-center">
        <button
          type="button"
          onClick={handleFitBounds}
          title="Fit Entire Parcel Boundary"
          aria-label="Fit Entire Parcel Boundary"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-all focus:outline-none"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="w-6 h-[1px] bg-slate-200 my-0.5" />

        <button
          type="button"
          onClick={handleRecenter}
          title="Recenter Pin"
          aria-label="Recenter Pin"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-all focus:outline-none"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function ParcelMap({ parcel, lang = 'en' }) {
  // Default to 'hybrid' so village & district names are always visible on satellite
  const [mapType, setMapType] = useState('hybrid');
  const t = translations[lang] || translations.en;

  if (!parcel || !parcel.latitude || !parcel.longitude) {
    return (
      <div className="h-96 w-full rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
        No parcel coordinates available
      </div>
    );
  }

  const center = [parcel.latitude, parcel.longitude];

  // Extract coordinates for polygon
  let polygonPositions = [];
  if (parcel.boundary_geojson && parcel.boundary_geojson.geometry) {
    const geom = parcel.boundary_geojson.geometry;
    if (geom.type === "Polygon" && geom.coordinates && geom.coordinates[0]) {
      polygonPositions = geom.coordinates[0].map(pt => [pt[1], pt[0]]);
    } else if (geom.type === "MultiPolygon" && geom.coordinates && geom.coordinates[0] && geom.coordinates[0][0]) {
      polygonPositions = geom.coordinates[0][0].map(pt => [pt[1], pt[0]]);
    }
  }

  // Fallback polygon if none
  if (polygonPositions.length === 0) {
    const delta = 0.0006;
    polygonPositions = [
      [center[0] - delta * 0.7, center[1] - delta * 0.9],
      [center[0] - delta * 0.8, center[1] + delta * 1.1],
      [center[0] + delta * 1.0, center[1] + delta * 0.95],
      [center[0] + delta * 0.85, center[1] - delta * 1.05],
    ];
  }

  // Create permanent Village & District on-map badge
  const villageLabelIcon = new L.DivIcon({
    className: 'custom-village-badge',
    html: `<div style="background: rgba(15, 23, 42, 0.92); color: white; border: 2px solid #22c55e; border-radius: 9999px; padding: 4px 10px; font-size: 11px; font-weight: 700; white-space: nowrap; box-shadow: 0 4px 14px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 6px; transform: translate(-50%, 12px);">
      <span style="width: 7px; height: 7px; background: #4ade80; border-radius: 50%; display: inline-block;"></span>
      <span>${parcel.village_name || (lang === 'ta' ? 'கிராமம்' : 'Village')}, ${parcel.district || (lang === 'ta' ? 'மாவட்டம்' : 'District')}</span>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

  return (
    <div className="relative w-full h-[400px] sm:h-[480px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Map Header Floating Info: Prominent Survey, Village, Taluk & District */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200 shadow-md text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-slate-900 text-sm">{lang === 'ta' ? 'புல எண்' : 'Survey'} #{parcel.survey_number}</span>
          <span className="text-slate-300">|</span>
          <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
            {parcel.village_name} {lang === 'ta' ? 'கிராமம்' : 'Village'}
          </span>
        </div>
        <div className="text-[11px] text-slate-600 font-medium mt-1 flex items-center gap-2">
          <span>{lang === 'ta' ? 'வட்டம்' : 'Taluk'}: <b className="text-slate-800">{parcel.taluk || parcel.village_name}</b></span>
          <span className="text-slate-300">•</span>
          <span>{lang === 'ta' ? 'மாவட்டம்' : 'District'}: <b className="text-slate-900">{parcel.district || 'Tenkasi'}</b></span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
          GPS: {parcel.latitude.toFixed(5)}°N, {parcel.longitude.toFixed(5)}°E
        </div>
      </div>

      {/* Layer Switcher (Hybrid vs Streets vs Satellite) */}
      <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-md rounded-xl p-1 border border-slate-200 shadow-md flex items-center gap-1 text-xs">
        <button
          type="button"
          onClick={() => setMapType('hybrid')}
          title={lang === 'ta' ? 'பெயர்களுடன் கூடிய செயற்கைக்கோள் வரைபடம்' : 'Satellite Imagery with Village, District & Place Names'}
          className={`px-2.5 py-1 rounded-lg font-medium transition ${
            mapType === 'hybrid'
              ? 'bg-emerald-700 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t.mapHybrid || 'Hybrid (Names)'}
        </button>
        <button
          type="button"
          onClick={() => setMapType('streets')}
          title={lang === 'ta' ? 'நில அளவை மற்றும் தெரு வரைபடம்' : 'Standard Street & Village Map'}
          className={`px-2.5 py-1 rounded-lg font-medium transition ${
            mapType === 'streets'
              ? 'bg-emerald-700 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t.mapStreets || 'Streets'}
        </button>
        <button
          type="button"
          onClick={() => setMapType('satellite')}
          title={lang === 'ta' ? 'செயற்கைக்கோள் பார்வை' : 'Raw Satellite Imagery without labels'}
          className={`px-2.5 py-1 rounded-lg font-medium transition ${
            mapType === 'satellite'
              ? 'bg-emerald-700 text-white shadow-xs font-semibold'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t.mapSatellite || 'Satellite'}
        </button>
      </div>

      <MapContainer
        center={center}
        zoom={16}
        zoomControl={false}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        className="w-full h-full"
      >
        <MapRecenter center={center} />
        <MapControls center={center} polygonPositions={polygonPositions} />
        
        {/* HYBRID: Satellite Imagery + ESRI Places/Boundaries/Villages Overlay */}
        {mapType === 'hybrid' && (
          <>
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
            {/* High-visibility Village, District, Town and Boundaries Overlay */}
            <TileLayer
              url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
              zIndex={500}
            />
            {/* Roads & Transportation Overlay */}
            <TileLayer
              url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
              zIndex={450}
            />
          </>
        )}

        {/* STREETS: OpenStreetMap with detailed regional towns, villages, and roads */}
        {mapType === 'streets' && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        {/* SATELLITE: Raw high-resolution satellite imagery */}
        {mapType === 'satellite' && (
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        )}

        {/* Parcel Boundary Polygon */}
        <Polygon
          positions={polygonPositions}
          pathOptions={{
            color: mapType === 'streets' ? '#15803d' : '#4ade80',
            fillColor: '#22c55e',
            fillOpacity: mapType === 'streets' ? 0.28 : 0.35,
            weight: 3,
            dashArray: '5, 5'
          }}
        >
          <Popup>
            <div className="p-1 text-xs">
              <div className="font-bold text-emerald-800 text-sm">
                Survey Parcel Boundary #{parcel.survey_number}
              </div>
              <div className="text-slate-600 mt-1">
                Sub-division: <b>{parcel.sub_division || '1'}</b>
              </div>
              <div className="text-slate-600">
                Village: <b>{parcel.village_name}</b>
              </div>
              <div className="text-slate-600">
                Taluk: <b>{parcel.taluk || parcel.village_name}</b>
              </div>
              <div className="text-slate-600">
                District: <b>{parcel.district || 'Tenkasi'}</b>
              </div>
              <div className="text-slate-600">
                Recorded Crop: <b>{parcel.recorded_crop}</b>
              </div>
            </div>
          </Popup>
        </Polygon>

        {/* Centroid Field Marker (Sprout pin) */}
        <Marker position={center} icon={farmMarkerIcon}>
          <Popup>
            <div className="p-1 text-xs">
              <div className="font-bold text-slate-900">Field Sampling Point</div>
              <div className="text-slate-600 mt-0.5">Crop: {parcel.recorded_crop}</div>
              <div className="text-slate-600">Stage: {parcel.recorded_stage}</div>
              <div className="text-slate-600 mt-1 font-semibold text-emerald-800">
                📍 {parcel.village_name}, {parcel.district}
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Permanent on-map Village & District Badge directly below the pin */}
        <Marker position={center} icon={villageLabelIcon} interactive={false} />
      </MapContainer>
    </div>
  );
}
