import React, { useState, useRef } from 'react';
import { X, UploadCloud, Camera, CheckCircle2, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export default function ImageUploadModal({ isOpen, onClose, onUploadComplete, lang = 'en' }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [surveyNo, setSurveyNo] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFiles = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      // 1. Upload photo to backend / S3
      const uploadRes = await api.uploadPhoto(selectedFile);
      
      // 2. Clean survey number (remove # or spaces)
      const cleanSurvey = surveyNo.replace(/[^a-zA-Z0-9]/g, '').trim();
      const sNo = cleanSurvey || "1342";

      // 3. Trigger advisory pipeline
      const advisoryRes = await api.runAdvisory(sNo, "Analyze uploaded crop photo", uploadRes.filename);

      onUploadComplete(advisoryRes, uploadRes, previewUrl);
      onClose();

    } catch (err) {
      console.error("Upload & Analysis Error:", err.response?.data || err);
      const msg = err.response?.data?.detail || err.message || "Failed to analyze image. Please try again.";
      alert(`Notice: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-base">
              {lang === 'ta' ? 'களப் பயிர் புகைப்படத்தைப் பதிவேற்றவும்' : 'Upload Field Photograph'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragActive ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-300 hover:border-emerald-500 bg-slate-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFiles(e.target.files[0])}
              accept="image/*"
              className="hidden"
            />

            {previewUrl ? (
              <div className="space-y-3">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-52 mx-auto rounded-xl shadow-xs object-cover border border-slate-200"
                />
                <p className="text-xs text-slate-500">
                  {selectedFile?.name} ({lang === 'ta' ? 'மாற்ற கிளிக் செய்யவும்' : 'Click to change photo'})
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  {lang === 'ta' ? 'புகைப்படத்தை இங்கே இழுத்து விடவும் அல்லது தேர்ந்தெடுக்கவும்' : 'Drop field photograph here or click to browse'}
                </div>
                <p className="text-xs text-slate-500">
                  {lang === 'ta' ? 'மொபைல் கேமரா அல்லது களப் புகைப்படங்கள் (JPG, PNG)' : 'Supports JPG, PNG from mobile cameras or field surveys'}
                </p>
              </div>
            )}
          </div>

          {/* Survey Number Input (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {lang === 'ta' ? 'புல எண் (விருப்பத்தேர்வு)' : 'Survey Number (Optional)'}
            </label>
            <input
              type="text"
              value={surveyNo}
              onChange={(e) => setSurveyNo(e.target.value)}
              placeholder={lang === 'ta' ? 'எ.கா. 1342 (அல்லது தானியங்கி)' : 'e.g. 1342 (or auto-match)'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-600 font-medium"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {lang === 'ta' ? 'புல எண் தராவிடில் நில ஆயத்தொலைவுகள் மூலம் தானாக கண்டறியப்படும்.' : 'If omitted, system uses parcel coordinates or default sample parcel #1342.'}
            </p>
          </div>

          {/* Cloud & Model Tag */}
          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 text-xs text-emerald-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {lang === 'ta' 
                ? <>படம் <b>AWS S3 (ap-south-1)</b> இல் சேமிக்கப்பட்டு <b>Gemini 3.8 Flash Vision</b> மூலம் பகுப்பாய்வு செய்யப்படும்.</>
                : <>Image is backed up to <b>AWS S3 (ap-south-1)</b> and analyzed by <b>Gemini 3.8 Flash Multimodal Vision</b>.</>}
            </span>
          </div>

          {/* Submit CTA */}
          <button
            onClick={handleUploadAndAnalyze}
            disabled={!selectedFile || isUploading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{lang === 'ta' ? 'பகுப்பாய்வு செய்யப்படுகிறது...' : 'Running Multi-Model Multimodal Pipeline...'}</span>
              </>
            ) : (
              <>
                <span>{lang === 'ta' ? 'பயிர் ஆய்வு மற்றும் ஆலோசனை பெறுக' : 'Run Crop Phenotyping & Advisory'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
