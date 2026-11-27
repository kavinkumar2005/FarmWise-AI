import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Layers, ZoomIn, ZoomOut, RotateCcw, Eye, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

// Create custom crop symbol icon with emoji, status color badge, and shadow
// Green: Healthy, Yellow: Moderate, Red: Critical, Orange: Not Verified, Dark red: Disease Detected
function createCropMarkerIcon(emoji, statusColor, isSelected) {
  const borderStyle = isSelected ? 'border: 3px solid #facc15; transform: scale(1.3); z-index: 1000;' : 'border: 2px solid white;';
  const displayEmoji = emoji || '🌱';
  const bgColor = statusColor || '#10b981';

  return new L.DivIcon({
    className: 'custom-crop-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.45);
        font-size: 16px;
        line-height: 1;
        transition: all 0.2s ease;
        ${borderStyle}
      ">
        <span style="display:inline-block; user-select:none;">${displayEmoji}</span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32]
  });
}

function MapFlyTo({ center, zoom = 14 }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { duration: 1.0 });
    }
  }, [center, zoom, map]);
  return null;
}

function MapMoveTracker({ onMove }) {
  useMapEvents({
    moveend: (e) => {
      const c = e.target.getCenter();
      if (c && typeof c.lat === 'number' && typeof c.lng === 'number') {
        onMove([c.lat, c.lng]);
      }
    }
  });
  return null;
}

function MapControls({ onResetView, initialCenter, initialZoom = 13 }) {
  const map = useMap();
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/90 p-1 flex flex-col items-center">
        <button
          onClick={() => map.zoomIn()}
          title="Zoom In"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-all"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <div className="w-6 h-px bg-slate-200 my-0.5" />
        <button
          onClick={() => map.zoomOut()}
          title="Zoom Out"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-all"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>

      <button
        onClick={() => {
          map.flyTo(initialCenter, initialZoom, { duration: 0.8 });
          if (onResetView) onResetView();
        }}
        title="Reset Map View"
        className="w-11 h-11 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-all"
      >
        <RotateCcw className="w-5 h-5" />
      </button>
    </div>
  );
}

export default function AdminCropMap({
  markers = [],
  center = [9.2463, 77.3798],
  selectedRecord = null,
  onSelectRecord = () => {},
  onViewRecordDetail = () => {},
  cadastralGeojson = null,
  showCadastral = true,
  mapLayer = 'satellite',
  onToggleMapLayer = () => {}
}) {
  const [mapCenter, setMapCenter] = useState(center);
  const [liveFocus, setLiveFocus] = useState(center);
  const [zoomLevel, setZoomLevel] = useState(13);

  useEffect(() => {
    if (center && center[0] && center[1]) {
      setMapCenter(center);
      setLiveFocus(center);
    }
  }, [center]);

  // Handle marker selection
  const handleMarkerClick = (marker) => {
    onSelectRecord(marker);
    if (marker.lat && marker.lng) {
      setMapCenter([marker.lat, marker.lng]);
      setLiveFocus([marker.lat, marker.lng]);
      setZoomLevel(16);
    }
  };

  return (
    <div className="relative w-full h-[620px] rounded-3xl overflow-hidden shadow-sm border border-slate-200 bg-slate-900">
      <MapContainer
        center={mapCenter}
        zoom={zoomLevel}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ background: '#0f172a' }}
      >
        <MapFlyTo center={mapCenter} zoom={zoomLevel} />
        <MapMoveTracker onMove={setLiveFocus} />

        {/* Base Tile Layer */}
        {mapLayer === 'satellite' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        {/* Optional Cadastral FMB Land Parcel Polygons */}
        {showCadastral && cadastralGeojson && cadastralGeojson.features && (
          <GeoJSON
            key={JSON.stringify(cadastralGeojson.features.length)}
            data={cadastralGeojson}
            style={() => ({
              color: '#38bdf8',
              weight: 1.5,
              opacity: 0.8,
              fillColor: '#0284c7',
              fillOpacity: 0.12,
              dashArray: '3, 4'
            })}
            onEachFeature={(feature, layer) => {
              const p = feature.properties || {};
              layer.bindTooltip(`Survey #${p.survey_no || 'N/A'} (${p.vil_name || ''})`, {
                permanent: false,
                direction: 'top',
                className: 'bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-md font-mono'
              });
            }}
          />
        )}

        {/* Interactive Crop Markers */}
        {markers.filter(m => m && m.lat && m.lng && !isNaN(m.lat) && !isNaN(m.lng)).map((m) => {
          const isSelected = selectedRecord?.id === m.id;
          return (
            <Marker
              key={m.id || `marker-${m.lat}-${m.lng}`}
              position={[Number(m.lat), Number(m.lng)]}
              icon={createCropMarkerIcon(m.crop_emoji, m.marker_color || m.crop_color, isSelected)}
              eventHandlers={{
                click: () => handleMarkerClick(m)
              }}
            >
              <Popup className="custom-popup" minWidth={300}>
                <div className="p-3 text-slate-800 space-y-2.5">
                  {/* Top Badge: Crop, Priority, Verification */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                      <span className="text-xl">{m.crop_emoji}</span>
                      <span>{m.crop}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        m.priority === 'HIGH'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : m.priority === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}>
                        {m.priority || 'LOW'}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        m.verification_status === 'Verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.verification_status === 'Rejected'
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {m.verification_status}
                      </span>
                    </div>
                  </div>

                  {/* Priority Trigger Banner */}
                  {m.priority_reason && (
                    <div className={`p-2 rounded-xl text-[11px] leading-tight font-medium ${
                      m.priority === 'HIGH' 
                        ? 'bg-rose-50 text-rose-900 border border-rose-200'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}>
                      <span className="font-bold">Alert Trigger:</span> {m.priority_reason}
                    </div>
                  )}

                  {/* Parcel Details Grid */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Survey No</span>
                      <span className="font-mono font-semibold text-slate-900">#{m.survey_number} / {m.sub_division}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Parcel ID</span>
                      <span className="font-mono text-[11px] text-slate-800">{m.parcel_id}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Village</span>
                      <span className="font-medium text-slate-900">{m.village}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Taluk / District</span>
                      <span className="font-medium text-slate-900">{m.taluk}, {m.district}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Health Condition</span>
                      <span className={`font-black ${
                        m.health_score === null 
                          ? 'text-slate-600'
                          : m.health_score >= 80 
                          ? 'text-emerald-700' 
                          : m.health_score >= 50 
                          ? 'text-amber-700' 
                          : 'text-rose-700'
                      }`}>
                        {m.health_score !== null ? `${m.health_score}% (${m.health_status})` : 'Data Unavailable'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Disease / Pest</span>
                      <span className={`font-semibold ${
                        m.disease_status === 'No Disease Detected' ? 'text-slate-700' : 'text-rose-700 font-bold'
                      }`}>
                        {m.disease_status || 'None'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Cultivated Area</span>
                      <span className="font-bold text-emerald-700">{m.area_acres} Acres</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Farmer (Masked)</span>
                      <span className="text-slate-700 font-mono text-[11px]">{m.farmer_name_masked}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => onViewRecordDetail(m.id)}
                    className="w-full mt-2 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Full Parcel Record</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Custom Map Zoom Controls */}
        <MapControls
          initialCenter={center}
          initialZoom={13}
          onResetView={() => {
            setMapCenter(center);
            setZoomLevel(13);
          }}
        />
      </MapContainer>

      {/* Status Color Legend (Top Left) */}
      <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2">
        <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/90 px-3 py-1.5 text-[11px] font-bold text-slate-700">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />Healthy</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />Moderate</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" />Critical</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" />Unverified</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-800" />Disease</span>
        </div>
      </div>

      {/* Bottom Map Stats Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur-md text-white text-xs px-4 py-2.5 rounded-2xl border border-slate-700/80 shadow-xl flex items-center gap-4">
        <div>
          <span className="text-slate-400 text-[10px] uppercase font-bold block">Rendered Crop Markers</span>
          <span className="font-bold text-emerald-400 font-mono text-sm">{markers.length.toLocaleString()} Parcels</span>
        </div>
        <div className="w-px h-6 bg-slate-700" />
        <div>
          <span className="text-slate-400 text-[10px] uppercase font-bold block">Current Focus</span>
          <span className="font-medium text-slate-200 text-xs font-mono">
            {liveFocus[0] && liveFocus[1] ? `${liveFocus[0].toFixed(3)}°N, ${liveFocus[1].toFixed(3)}°E` : 'Tamil Nadu'}
          </span>
        </div>
      </div>
    </div>
  );
}
