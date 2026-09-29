import React, { useState } from 'react';
import {
  MapPin,
  Camera,
  FileText,
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  CheckSquare,
  Square,
  Shield,
  Compass
} from 'lucide-react';
import { FarmerRequest, normalizeTamilNumerals, NormalizedSpeechResult } from '@farmwise/agent-core';
import { Language, PresetScenario } from '../../types/ui.js';
import { PRESET_SCENARIOS } from '../../data/presets.js';
import { VoiceInputModal } from '../voice/VoiceInputModal.js';

interface SubmissionWizardProps {
  lang: Language;
  onSubmit: (request: FarmerRequest) => void;
  isSubmitting: boolean;
}

export const SubmissionWizard: React.FC<SubmissionWizardProps> = ({
  lang,
  onSubmit,
  isSubmitting
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Form State
  const [farmerName, setFarmerName] = useState('R. Krishnan');
  const [district, setDistrict] = useState('Tenkasi');
  const [taluk, setTaluk] = useState('Sivagiri');
  const [village, setVillage] = useState('Sanganaperi');
  const [surveyNumber, setSurveyNumber] = useState('202/55');
  const [subdivision, setSubdivision] = useState('55');
  const [latitude, setLatitude] = useState<number | string>(9.3512);
  const [longitude, setLongitude] = useState<number | string>(77.4819);

  // Media & Documents
  const [photoUrl, setPhotoUrl] = useState<string>('Datasets/images/images/sample_paddy_tillering.jpg');
  const [photoPreview, setPhotoPreview] = useState<string>('Datasets/images/images/sample_paddy_tillering.jpg');
  const [docUrl, setDocUrl] = useState<string>('');
  const [soilType, setSoilType] = useState('Clay Loam');
  const [consentGiven, setConsentGiven] = useState(true);

  // Ask & Voice
  const [rawQuery, setRawQuery] = useState(
    'What crop is planted in Survey Number 202/55 in Sanganaperi village? Identify the parcel and owner, retrieve field photograph, predict crop and growth stage, and recommend fertilizer and spray window.'
  );
  const [isRecording, setIsRecording] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load a preset
  const handleSelectPreset = (preset: PresetScenario) => {
    setActivePreset(preset.id);
    setFarmerName(preset.request.farmerName || '');
    setDistrict(preset.request.district || '');
    setTaluk(preset.request.taluk || '');
    setVillage(preset.request.village || '');
    setSurveyNumber(preset.request.surveyNumber || '');
    setSubdivision(preset.request.subdivision || '');
    setLatitude(preset.request.coordinates?.latitude || '');
    setLongitude(preset.request.coordinates?.longitude || '');
    setPhotoUrl(preset.request.attachments?.fieldPhotoUrl || '');
    setPhotoPreview(preset.request.attachments?.fieldPhotoUrl || '');
    setDocUrl(preset.request.attachments?.landDocUrl || '');
    setSoilType(preset.request.attachments?.soilType || 'Clay Loam');
    setRawQuery(preset.request.rawQuery);
    setConsentGiven(preset.request.consentGiven);
    setValidationError(null);
  };

  // Handle Tamil Numeral Conversion in Survey Number
  const handleSurveyChange = (val: string) => {
    const normalized = normalizeTamilNumerals(val);
    setSurveyNumber(normalized);
    if (normalized.includes('/')) {
      const parts = normalized.split('/');
      if (parts[1]) setSubdivision(parts[1]);
    }
  };

  // Detect GPS
  const handleDetectGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLatitude(Number(pos.coords.latitude.toFixed(5)));
          setLongitude(Number(pos.coords.longitude.toFixed(5)));
        },
        () => {
          // Fallback to Sanganaperi coordinates if blocked
          setLatitude(9.3512);
          setLongitude(77.4819);
        }
      );
    }
  };

  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Toggle Voice Input Modal
  const handleToggleVoice = () => {
    setIsVoiceModalOpen(true);
  };

  const handleApplyTranscription = (result: NormalizedSpeechResult) => {
    setRawQuery(result.normalizedText);
    if (result.detectedSurveyNumber) {
      handleSurveyChange(result.detectedSurveyNumber);
    }
    if (result.detectedVillage) {
      setVillage(result.detectedVillage);
    }
  };

  // Submission handler
  const handleFinalSubmit = () => {
    if (!consentGiven) {
      setValidationError(
        lang === 'en'
          ? 'Please check the consent box to proceed with parcel analysis.'
          : 'தயவுசெய்து நில ஆய்வுக்கான ஒப்புதலைத் தேர்ந்தெடுக்கவும்.'
      );
      return;
    }

    const payload: FarmerRequest = {
      requestId: `REQ-${Date.now().toString(36).toUpperCase()}`,
      farmerName: farmerName.trim() || 'R. Krishnan',
      rawQuery: rawQuery.trim(),
      language: lang,
      district: district.trim(),
      taluk: taluk.trim(),
      village: village.trim(),
      surveyNumber: surveyNumber.trim(),
      subdivision: subdivision.trim() || undefined,
      coordinates:
        latitude && longitude
          ? { latitude: Number(latitude), longitude: Number(longitude) }
          : undefined,
      attachments: {
        fieldPhotoUrl: photoUrl || undefined,
        landDocUrl: docUrl || undefined,
        soilType: soilType || undefined
      },
      consentGiven
    };

    onSubmit(payload);
  };

  return (
    <div className="max-w-4xl mx-auto my-6 px-4">
      {/* Preset Scenarios Header */}
      <div className="bg-white rounded-2xl p-5 border border-green-200/80 shadow-sm mb-6">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#2E7D32]" />
            <h2 className="text-sm font-bold text-[#0F3D26] uppercase tracking-wider">
              {lang === 'en' ? 'Quick Test Scenarios' : 'விரைவு சோதனை மாதிரிகள்'}
            </h2>
          </div>
          <span className="text-xs text-gray-500">
            {lang === 'en' ? 'Click any preset to auto-fill' : 'தானாக நிரப்ப ஏதேனும் ஒன்றைத் தேர்ந்தெடுக்கவும்'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {PRESET_SCENARIOS.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p)}
              className={`text-left p-3 rounded-xl border text-xs transition-all ${
                activePreset === p.id
                  ? 'bg-green-50 border-[#2E7D32] ring-2 ring-green-600/20 shadow-sm'
                  : 'bg-[#F9FBF8] border-gray-200 hover:border-green-400 hover:bg-green-50/50'
              }`}
            >
              <div className="font-bold text-[#0F3D26] truncate">
                {lang === 'en' ? p.titleEn : p.titleTa}
              </div>
              <div className="text-[10px] text-green-700 font-mono mt-0.5 font-semibold">
                {p.badge}
              </div>
              <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                {lang === 'en' ? p.descriptionEn : p.descriptionTa}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Wizard Form Container */}
      <div className="bg-white rounded-3xl border border-green-100 shadow-md overflow-hidden">
        {/* Wizard Steps Header */}
        <div className="bg-[#0F3D26] text-white px-6 py-4 flex items-center justify-between border-b border-green-800">
          <div className="flex items-center space-x-6">
            <div
              className={`flex items-center space-x-2 cursor-pointer ${
                currentStep === 1 ? 'text-[#FFC72C] font-bold' : 'text-gray-300'
              }`}
              onClick={() => setCurrentStep(1)}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep === 1 ? 'bg-[#FFC72C] text-[#0F3D26] font-black' : 'bg-green-800 text-gray-200'
              }`}>
                1
              </span>
              <span className="text-xs sm:text-sm">
                {lang === 'en' ? 'Field & Cadastre' : 'நிலம் & வரைபடம்'}
              </span>
            </div>

            <div
              className={`flex items-center space-x-2 cursor-pointer ${
                currentStep === 2 ? 'text-[#FFC72C] font-bold' : 'text-gray-300'
              }`}
              onClick={() => setCurrentStep(2)}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep === 2 ? 'bg-[#FFC72C] text-[#0F3D26] font-black' : 'bg-green-800 text-gray-200'
              }`}>
                2
              </span>
              <span className="text-xs sm:text-sm">
                {lang === 'en' ? 'Media & Documents' : 'படம் & ஆவணம்'}
              </span>
            </div>

            <div
              className={`flex items-center space-x-2 cursor-pointer ${
                currentStep === 3 ? 'text-[#FFC72C] font-bold' : 'text-gray-300'
              }`}
              onClick={() => setCurrentStep(3)}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep === 3 ? 'bg-[#FFC72C] text-[#0F3D26] font-black' : 'bg-green-800 text-gray-200'
              }`}>
                3
              </span>
              <span className="text-xs sm:text-sm">
                {lang === 'en' ? 'Farmer Ask & Voice' : 'கேள்வி & குரல்'}
              </span>
            </div>
          </div>

          <div className="text-xs text-green-200 hidden sm:block">
            Step {currentStep} of 3
          </div>
        </div>

        {/* Wizard Step Content */}
        <div className="p-6 md:p-8">
          {validationError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* STEP 1: FIELD & CADASTRE */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-[#0F3D26]">
                  {lang === 'en' ? 'Field & Cadastral Information' : 'நிலப் புல விவரங்கள்'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {lang === 'en'
                    ? 'Enter your revenue district, taluk, village, and survey number. Tamil numerals (e.g. ௨௦௨/௫௫) are automatically normalized.'
                    : 'உங்கள் மாவட்டம், வட்டம், கிராமம் மற்றும் புல எண்ணை குறிப்பிடவும். தமிழ் எண்கள் தானாக மாற்றப்படும்.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {lang === 'en' ? 'District' : 'மாவட்டம்'}
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    placeholder="e.g. Tenkasi"
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {lang === 'en' ? 'Taluk' : 'வட்டம்'}
                  </label>
                  <input
                    type="text"
                    value={taluk}
                    onChange={e => setTaluk(e.target.value)}
                    placeholder="e.g. Sivagiri"
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {lang === 'en' ? 'Village' : 'கிராமம்'}
                  </label>
                  <input
                    type="text"
                    value={village}
                    onChange={e => setVillage(e.target.value)}
                    placeholder="e.g. Sanganaperi"
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                    <span>{lang === 'en' ? 'Survey / Subdivision No.' : 'புல எண் / உட்பிரிவு'}</span>
                    <span className="text-[10px] text-green-700 font-mono">Tamil: ௨௦௨/௫௫</span>
                  </label>
                  <input
                    type="text"
                    value={surveyNumber}
                    onChange={e => handleSurveyChange(e.target.value)}
                    placeholder="e.g. 202/55 or 387"
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-bold text-[#0F3D26] border border-green-300 rounded-xl bg-green-50/20 focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {lang === 'en' ? 'Farmer / Claimant Name' : 'உழவர் பெயர்'}
                  </label>
                  <input
                    type="text"
                    value={farmerName}
                    onChange={e => setFarmerName(e.target.value)}
                    placeholder="e.g. R. Krishnan"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* GPS Coordinates & Mini-Map Card */}
              <div className="bg-[#F7F9F4] p-4 rounded-2xl border border-green-200">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-[#2E7D32]" />
                    <span className="text-xs font-bold text-[#0F3D26]">
                      {lang === 'en' ? 'Field GPS Coordinates' : 'புலத்தின் GPS ஆயத்தொலைவுகள்'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    className="px-3 py-1 bg-[#2E7D32] hover:bg-[#388E3C] text-white text-xs font-medium rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Use Current GPS' : 'தற்போதைய இடம்'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={e => setLatitude(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 text-xs font-mono border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 font-medium">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={e => setLongitude(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 text-xs font-mono border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-gray-500 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Cadastral Index: Sanganaperi (202/55), Keelathattaparai (387), Sivagiri (174)</span>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2.5 bg-[#2E7D32] hover:bg-[#388E3C] text-white font-semibold text-sm rounded-xl transition-all flex items-center space-x-2 shadow-sm"
                >
                  <span>{lang === 'en' ? 'Next: Media & Records' : 'அடுத்து: படங்கள்'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: MEDIA & DOCUMENTS */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-[#0F3D26]">
                  {lang === 'en' ? 'Field Photograph & Land Records' : 'புலப் புகைப்படம் & நில ஆவணங்கள்'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {lang === 'en'
                    ? 'Upload crop photographs for multimodal vision assessment and optional Patta / Chitta document for registry verification.'
                    : 'பயிரின் புகைப்படத்தை பதிவேற்றி நோய் கண்டறிதல் மற்றும் பட்டா ஆவண சரிபார்ப்பு மேற்கொள்ளவும்.'}
                </p>
              </div>

              {/* Photo Upload & Quality Inspector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                    <Camera className="w-4 h-4 text-[#2E7D32]" />
                    <span>{lang === 'en' ? 'Field Photograph' : 'பயிர் புகைப்படம்'}</span>
                  </label>

                  <div className="border-2 border-dashed border-green-200 rounded-2xl p-4 text-center bg-[#F9FBF8]">
                    <UploadCloud className="w-8 h-8 text-[#2E7D32] mx-auto mb-2" />
                    <p className="text-xs font-medium text-gray-700 mb-1">
                      {lang === 'en' ? 'Drag & drop image or choose sample' : 'படத்தை இழுத்து விடவும் அல்லது மாதிரி எடுக்கவும்'}
                    </p>
                    <p className="text-[10px] text-gray-400 mb-3">JPG, PNG up to 10MB</p>

                    <div className="flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoUrl('Datasets/images/images/sample_paddy_tillering.jpg');
                          setPhotoPreview('Datasets/images/images/sample_paddy_tillering.jpg');
                        }}
                        className="px-2.5 py-1 text-[11px] bg-white border border-green-300 rounded-lg text-[#0F3D26] hover:bg-green-50 font-medium"
                      >
                        Sample Paddy (Tillering)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoUrl('Datasets/images/images/sample_groundnut_pod.jpg');
                          setPhotoPreview('Datasets/images/images/sample_groundnut_pod.jpg');
                        }}
                        className="px-2.5 py-1 text-[11px] bg-white border border-green-300 rounded-lg text-[#0F3D26] hover:bg-green-50 font-medium"
                      >
                        Sample Groundnut
                      </button>
                    </div>
                  </div>

                  {photoUrl && (
                    <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-200 text-xs">
                      <div className="font-semibold text-[#0F3D26] flex items-center space-x-1.5 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                        <span>{lang === 'en' ? 'Image Quality Passed' : 'படத்தின் தரம் ஏற்கப்பட்டது'}</span>
                      </div>
                      <div className="text-[11px] text-gray-600 space-y-0.5 font-mono">
                        <div>• Daylight Exposure: Optimal</div>
                        <div>• Blur Metric: Sharp (Laplacian score 142)</div>
                        <div>• Foliage Visibility: 88% Canopy</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Land Document & Soil */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-[#2E7D32]" />
                      <span>{lang === 'en' ? 'Land Document / Patta (Optional)' : 'பட்டா ஆவணம் (விருப்பத்தேர்வு)'}</span>
                    </label>

                    <div className="border border-gray-300 rounded-2xl p-4 bg-white">
                      <input
                        type="text"
                        value={docUrl}
                        onChange={e => setDocUrl(e.target.value)}
                        placeholder="e.g. Datasets/documents/patta_sample_174.pdf"
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg mb-2"
                      />
                      <button
                        type="button"
                        onClick={() => setDocUrl('Datasets/documents/patta_sample_174.pdf')}
                        className="text-[11px] text-[#2E7D32] hover:underline font-semibold"
                      >
                        + Use Sample Patta Document (Survey 174)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {lang === 'en' ? 'Soil Type' : 'மண் வகை'}
                    </label>
                    <select
                      value={soilType}
                      onChange={e => setSoilType(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Clay Loam">Clay Loam (களிமண் படிவு)</option>
                      <option value="Red Sandy Loam">Red Sandy Loam (செம்மண் வண்டல்)</option>
                      <option value="Black Cotton">Black Cotton Soil (கரிசல் மண்)</option>
                      <option value="Alluvial">Alluvial (வண்டல் மண்)</option>
                    </select>
                  </div>

                  {/* Mandatory Farmer Consent Checkbox */}
                  <div
                    onClick={() => setConsentGiven(!consentGiven)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
                      consentGiven
                        ? 'bg-green-50/80 border-green-300 text-[#0F3D26]'
                        : 'bg-amber-50/50 border-amber-300 text-amber-900'
                    }`}
                  >
                    <div className="mt-0.5">
                      {consentGiven ? (
                        <CheckSquare className="w-5 h-5 text-[#2E7D32]" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="text-xs">
                      <div className="font-bold">
                        {lang === 'en'
                          ? 'Personal Data & Crop Image Consent'
                          : 'தனிநபர் தரவு & நில ஆய்வு ஒப்புதல்'}
                      </div>
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        {lang === 'en'
                          ? 'I authorize FarmwiseAI to process cadastral survey records and field imagery for agronomic advisory. PII is masked by default.'
                          : 'வேளாண் ஆலோசனை பெறுவதற்காக நில ஆவணம் மற்றும் பயிர் படத்தை ஆய்வு செய்ய ஒப்புதல் அளிக்கிறேன்.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold text-sm rounded-xl transition-all flex items-center space-x-2 hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Back' : 'முந்தையது'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-2.5 bg-[#2E7D32] hover:bg-[#388E3C] text-white font-semibold text-sm rounded-xl transition-all flex items-center space-x-2 shadow-sm"
                >
                  <span>{lang === 'en' ? 'Next: Farmer Ask & Voice' : 'அடுத்து: கேள்வி'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: FARMER ASK & VOICE */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-[#0F3D26]">
                  {lang === 'en' ? 'Farmer Query & Voice Input' : 'உழவர் கேள்வி & குரல் பதிவு'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {lang === 'en'
                    ? 'Speak or type your question in Tamil or English. The multi-model agent system will plan and execute the necessary steps.'
                    : 'உங்கள் கேள்வியை தமிழில் அல்லது ஆங்கிலத்தில் பேசலாம் அல்லது தட்டச்சு செய்யலாம்.'}
                </p>
              </div>

              {/* Mic & Text Input Area */}
              <div className="relative">
                <textarea
                  rows={4}
                  value={rawQuery}
                  onChange={e => setRawQuery(e.target.value)}
                  placeholder={
                    lang === 'en'
                      ? 'e.g. My paddy leaves are yellowing with leaf folder, what should I spray and is the weather safe?'
                      : 'எ.கா. நெல் பயிரில் இலை சுருட்டு புழு தாக்குதல் உள்ளது, என்ன மருந்து அடிக்கலாம்?'
                  }
                  className="w-full p-4 pr-16 text-sm border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:outline-none resize-none leading-relaxed"
                />

                {/* Voice Mic Button */}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`absolute right-3.5 bottom-4 p-3 rounded-full shadow-md transition-all ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200'
                      : 'bg-[#2E7D32] hover:bg-[#388E3C] text-white'
                  }`}
                  title={isRecording ? 'Listening...' : 'Speak in Tamil or English'}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-[#FFC72C]" />}
                </button>
              </div>

              {isRecording && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3 text-red-700 text-xs animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                  <span>
                    {lang === 'en'
                      ? 'Listening in Tamil & English... Speak your question now'
                      : 'குரல் பதிவு செய்யப்படுகிறது... தமிழில் அல்லது ஆங்கிலத்தில் பேசவும்'}
                  </span>
                </div>
              )}

              {/* Quick Sample Questions */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  {lang === 'en' ? 'Common Farmer Queries:' : 'மாதிரி உழவர் கேள்விகள்:'}
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setRawQuery(
                        lang === 'en'
                          ? 'Check paddy crop for leaf folder pest and calculate safe 48-hour spray window.'
                          : 'நெல் பயிரில் இலை சுருட்டு புழு தாக்குதல் உள்ளதா? அடுத்த 48 மணி நேர வானிலை தெளிக்க உகந்ததா?'
                      )
                    }
                    className="px-3 py-1.5 bg-[#F7F9F4] hover:bg-green-100/70 border border-green-200 rounded-xl text-xs text-[#0F3D26] text-left transition-colors"
                  >
                    🌾 {lang === 'en' ? 'Pest Diagnosis & Spray Window' : 'பூச்சி தாக்குதல் & மருந்து தெளிப்பு'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setRawQuery(
                        lang === 'en'
                          ? 'What fertilizer dosage should be applied for tillering stage based on soil type?'
                          : 'மண் வகை மற்றும் தூர்கட்டும் பருவத்திற்கு ஏற்ப உர அளவு என்ன?'
                      )
                    }
                    className="px-3 py-1.5 bg-[#F7F9F4] hover:bg-green-100/70 border border-green-200 rounded-xl text-xs text-[#0F3D26] text-left transition-colors"
                  >
                    🧪 {lang === 'en' ? 'Fertilizer Recommendation' : 'உர பரிந்துரை'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setRawQuery(
                        lang === 'en'
                          ? 'Verify cadastral boundaries and check whether land extent matches registry records.'
                          : 'நில வரைபட எல்லைகள் மற்றும் பட்டா ஆவண பரப்பளவு சரியாக உள்ளதா?'
                      )
                    }
                    className="px-3 py-1.5 bg-[#F7F9F4] hover:bg-green-100/70 border border-green-200 rounded-xl text-xs text-[#0F3D26] text-left transition-colors"
                  >
                    📋 {lang === 'en' ? 'Cadastral Boundary Cross-Check' : 'நில எல்லை சரிபார்ப்பு'}
                  </button>
                </div>
              </div>

              {/* Submission CTA */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold text-sm rounded-xl transition-all flex items-center space-x-2 hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Back' : 'முந்தையது'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className={`px-8 py-3.5 bg-[#0F3D26] hover:bg-[#174D32] text-white font-bold text-sm sm:text-base rounded-2xl transition-all flex items-center space-x-3 shadow-lg ${
                    isSubmitting ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02]'
                  }`}
                >
                  <Sparkles className="w-5 h-5 text-[#FFC72C] animate-spin" />
                  <span>
                    {isSubmitting
                      ? lang === 'en'
                        ? 'Orchestrating Multi-Model Pipeline...'
                        : 'முகமைகள் திட்டமிடுகின்றன...'
                      : lang === 'en'
                      ? 'Submit to Multi-Model Agent Pipeline'
                      : 'முகமை அமைப்பிடம் ஒப்படைக்கவும்'}
                  </span>
                  <ArrowRight className="w-5 h-5 text-[#FFC72C]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Bilingual Voice Input Modal */}
      <VoiceInputModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        lang={lang}
        onApplyTranscription={handleApplyTranscription}
      />
    </div>
  );
};
