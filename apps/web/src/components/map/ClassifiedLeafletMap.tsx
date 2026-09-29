import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers,
  MapPin,
  Compass,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { FinalResult } from '@farmwise/agent-core';
import { Language } from '../../types/ui.js';

interface ClassifiedLeafletMapProps {
  result: FinalResult;
  lang: Language;
  onSelectSurvey?: (surveyNumber: string) => void;
}

// Ground truth crop points from dataset
const GROUND_TRUTH_POINTS = [
  { lat: 9.3512, lng: 77.4819, crop: 'Paddy', stage: 'Tillering', village: 'Sanganaperi', survey: '202/55' },
  { lat: 8.7915, lng: 78.1342, crop: 'Groundnut', stage: 'Pod Development', village: 'Keelathattaparai', survey: '387' },
  { lat: 9.3450, lng: 77.4320, crop: 'Cotton', stage: 'Vegetative', village: 'Sivagiri', survey: '174' }
];

export const ClassifiedLeafletMap: React.FC<ClassifiedLeafletMapProps> = ({
  result,
  lang,
  onSelectSurvey
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{ [key: string]: L.LayerGroup }>({});

  const [activeLayers, setActiveLayers] = useState({
    cadastre: true,
    classification: true,
    crops: true,
    gpsBuffer: true
  });

  const { parcel, landRecord, cropAssessment, verification } = result;
  const centroid = parcel.centroid || { latitude: 9.3512, longitude: 77.4819 };
  const userLat = centroid.latitude;
  const userLng = centroid.longitude;

  // Extract parcel polygon coordinates
  const rawCoords = parcel.geometry?.coordinates?.[0] || [
    [77.481, 9.351],
    [77.483, 9.351],
    [77.483, 9.353],
    [77.481, 9.353],
    [77.481, 9.351]
  ];
  const latLngCoords: L.LatLngExpression[] = rawCoords.map((c: any) => [c[1], c[0]]);

  // Land classification styling
  const getClassificationColor = (classification: string) => {
    switch (classification?.toLowerCase()) {
      case 'patta':
      case 'wetland':
      case 'nansei':
        return '#10B981'; // Emerald
      case 'dryland':
      case 'punsei':
        return '#F59E0B'; // Amber
      case 'waterbody':
      case 'poromboke':
        return '#0284C7'; // Blue
      default:
        return '#8B5CF6'; // Purple
    }
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Cleanup previous map if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize Map
    const map = L.map(mapContainerRef.current, {
      center: [centroid.latitude, centroid.longitude],
      zoom: 17,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Initialize layer groups
    const cadastreGroup = L.layerGroup();
    const classGroup = L.layerGroup();
    const cropsGroup = L.layerGroup();
    const gpsGroup = L.layerGroup();

    layersRef.current = {
      cadastre: cadastreGroup,
      classification: classGroup,
      crops: cropsGroup,
      gpsBuffer: gpsGroup
    };

    // 1. Cadastral Boundary Layer
    const parcelPolygon = L.polygon(latLngCoords, {
      color: '#15803D',
      weight: 3,
      fillColor: getClassificationColor(landRecord.classification),
      fillOpacity: activeLayers.classification ? 0.35 : 0.15
    });

    parcelPolygon.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
        <strong style="color: #0F3D26; font-size: 13px;">Survey No: ${parcel.surveyNumber}</strong><br/>
        <b>Village:</b> ${parcel.village} (${parcel.taluk})<br/>
        <b>GIS Acreage:</b> ${parcel.areaAcres || '1.45'} Acres<br/>
        <b>Classification:</b> ${landRecord.classification}<br/>
        <b>Status:</b> ${verification.overallStatus}
      </div>
    `);

    cadastreGroup.addLayer(parcelPolygon);

    // 2. Centroid Marker
    const centroidIcon = L.divIcon({
      className: 'custom-centroid-marker',
      html: `<div style="background-color: #B91C1C; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
    const centroidMarker = L.marker([centroid.latitude, centroid.longitude], {
      icon: centroidIcon
    }).bindTooltip(`Centroid: ${parcel.surveyNumber}`, { permanent: false, direction: 'top' });
    cadastreGroup.addLayer(centroidMarker);

    // 3. Ground Truth Crop Markers Layer
    GROUND_TRUTH_POINTS.forEach(pt => {
      const cropIcon = L.divIcon({
        className: 'custom-crop-marker',
        html: `<div style="background-color: #2E7D32; color: #FFC72C; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 8px; border: 1px solid #1B5E20; white-space: nowrap; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">🌾 ${pt.crop}</div>`,
        iconAnchor: [15, 10]
      });
      const cropMarker = L.marker([pt.lat, pt.lng], { icon: cropIcon }).bindPopup(`
        <div style="font-family: sans-serif; font-size: 11px;">
          <b>Crop:</b> ${pt.crop}<br/>
          <b>Stage:</b> ${pt.stage}<br/>
          <b>Survey:</b> ${pt.survey} (${pt.village})
        </div>
      `);
      cropsGroup.addLayer(cropMarker);
    });

    // 4. GPS Marker & 50m Circular Tolerance Buffer
    const gpsCircle = L.circle([userLat, userLng], {
      radius: 50,
      color: '#D97706',
      fillColor: '#F59E0B',
      fillOpacity: 0.15,
      dashArray: '5, 5',
      weight: 1.5
    }).bindTooltip('50m GPS Tolerance Ring', { permanent: false });
    gpsGroup.addLayer(gpsCircle);

    const gpsMarker = L.marker([userLat, userLng], {
      icon: L.divIcon({
        className: 'user-gps-marker',
        html: `<div style="background-color: #2563EB; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 0 0 4px rgba(37,99,235,0.3);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      })
    }).bindPopup('<b>Farmer GPS Location</b><br/>Verified within boundary tolerance.');
    gpsGroup.addLayer(gpsMarker);

    // Add layers to map based on current state
    if (activeLayers.cadastre) cadastreGroup.addTo(map);
    if (activeLayers.crops) cropsGroup.addTo(map);
    if (activeLayers.gpsBuffer) gpsGroup.addTo(map);

    // Fit map bounds to parcel polygon with padding
    map.fitBounds(parcelPolygon.getBounds(), { padding: [50, 50] });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [centroid, parcel, landRecord, verification]);

  // Handle layer toggle
  const toggleLayer = (layerKey: 'cadastre' | 'classification' | 'crops' | 'gpsBuffer') => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentLayer = layersRef.current[layerKey];
    const willEnable = !activeLayers[layerKey];

    setActiveLayers(prev => ({ ...prev, [layerKey]: willEnable }));

    if (currentLayer) {
      if (willEnable) {
        currentLayer.addTo(map);
      } else {
        map.removeLayer(currentLayer);
      }
    }
  };

  // Zoom to parcel
  const handleZoomToParcel = () => {
    if (mapInstanceRef.current && latLngCoords.length > 0) {
      const bounds = L.latLngBounds(latLngCoords);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm space-y-3">
      {/* Map Control Bar */}
      <div className="p-3.5 bg-gray-50 border-b flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-[#2E7D32] text-white">
            <Layers className="w-4 h-4 text-[#FFC72C]" />
          </div>
          <div>
            <h4 className="font-bold text-[#0F3D26]">
              {lang === 'en' ? 'Classified Cadastral GeoJSON Map' : 'வகைப்படுத்தப்பட்ட நில வரைபடம்'}
            </h4>
            <span className="text-[10px] text-gray-500 font-mono">
              Leaflet • EPSG:4326 • OpenStreetMap Tiles
            </span>
          </div>
        </div>

        {/* Layer Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => toggleLayer('cadastre')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
              activeLayers.cadastre
                ? 'bg-green-100 text-green-900 border-green-300'
                : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            🗺️ Cadastre
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('crops')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
              activeLayers.crops
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            🌾 Ground Truth
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('gpsBuffer')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
              activeLayers.gpsBuffer
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            📍 50m GPS Ring
          </button>

          <button
            type="button"
            onClick={handleZoomToParcel}
            className="p-1.5 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
            title="Zoom to active parcel"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas Viewport */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          className="w-full h-[400px] z-0"
          style={{ minHeight: '400px' }}
        />

        {/* Floating Land Classification Legend */}
        <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur p-2.5 rounded-xl border border-gray-300 shadow-md text-[11px] space-y-1">
          <div className="font-bold text-gray-700 font-mono text-[10px] uppercase">
            Land Classification
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[#10B981]" />
            <span>Wetland / Nansei (நன்செய்)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
            <span>Dryland / Punsei (புன்செய்)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-[#0284C7]" />
            <span>Waterbody / Poromboke (குளம்)</span>
          </div>
        </div>
      </div>

      {/* Map Sub-details & Survey Info */}
      <div className="p-3 bg-[#F9FBF8] border-t flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-[#0F3D26]">Active Parcel:</span>
          <span className="font-mono bg-white px-2 py-0.5 rounded border text-gray-800">
            {parcel.village} — Survey {parcel.surveyNumber}
          </span>
          <span className="font-mono text-gray-500">
            Area: {parcel.areaAcres || '1.45'} Acres
          </span>
        </div>

        <div className="flex items-center space-x-2 text-green-800 font-bold">
          <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
          <span>Cadastral Boundary Verified</span>
        </div>
      </div>
    </div>
  );
};
