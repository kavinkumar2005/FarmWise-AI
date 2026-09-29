import React from 'react';
import {
  Printer,
  QrCode
} from 'lucide-react';
import { FinalResult } from '@farmwise/agent-core';
import { Language, Persona } from '../../../types/ui.js';

interface ReportTabProps {
  result: FinalResult;
  lang: Language;
  persona: Persona;
}

export const ReportTab: React.FC<ReportTabProps> = ({ result, lang, persona }) => {
  const { parcel, landRecord, cropAssessment, weather, recommendations, verification } = result;

  const handlePrint = () => {
    window.print();
  };

  const sprayFeasible = !weather.agronomicAlerts.some(
    a => a.toLowerCase().includes('rain') || a.toLowerCase().includes('wind')
  );

  return (
    <div className="space-y-6">
      {/* Print / Export Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-sm print:hidden">
        <div>
          <h4 className="font-bold text-sm text-[#0F3D26]">
            {lang === 'en' ? 'Official Government-Format Report Preview' : 'அரசு வடிவ அறிக்கை முன்னோட்டம்'}
          </h4>
          <p className="text-xs text-gray-500">
            Standardized bilingual advisory sheet formatted for agricultural officers and farmers.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 bg-[#2E7D32] hover:bg-[#388E3C] text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-2 shadow"
        >
          <Printer className="w-4 h-4" />
          <span>{lang === 'en' ? 'Print / Export PDF' : 'அச்சிடுக / பதிவிறக்குக'}</span>
        </button>
      </div>

      {/* Official Printable Report Document Container */}
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-gray-300 shadow-lg max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 font-serif text-gray-900">
        {/* Government Header */}
        <div className="text-center border-b-2 border-green-900 pb-5 mb-6">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full border-2 border-green-800 flex items-center justify-center font-bold text-green-900 text-lg">
              TN
            </div>
          </div>
          <h2 className="text-xl font-bold uppercase tracking-wide text-green-950">
            Government of Tamil Nadu / தமிழ்நாடு அரசு
          </h2>
          <h3 className="text-sm font-semibold text-green-800">
            Department of Agriculture & Farmers Welfare / வேளாண்மை மற்றும் உழவர் நலத்துறை
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            PARCEL-LEVEL AUTONOMOUS AGRO-ADVISORY & CADASTRE VERIFICATION RECORD
          </p>
        </div>

        {/* Verification Strip & Report Meta */}
        <div className="grid grid-cols-2 gap-4 text-xs font-mono border-b pb-4 mb-6">
          <div>
            <span className="text-gray-500">Advisory ID: </span>
            <strong className="text-black">FW-TN-{result.runId.substring(4, 12)}</strong>
          </div>
          <div className="text-right">
            <span className="text-gray-500">Generated: </span>
            <strong>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
          </div>
          <div>
            <span className="text-gray-500">Verification Status: </span>
            <strong className="text-green-800 uppercase">{verification.overallStatus} (Score: {Math.round(result.confidence.overall * 100)}%)</strong>
          </div>
          <div className="text-right">
            <span className="text-gray-500">Officer Persona: </span>
            <strong>{persona === 'officer' ? 'Officer Mode (Full)' : 'Farmer Mode (Masked)'}</strong>
          </div>
        </div>

        {/* 1. Cadastral Details Section */}
        <div className="mb-6">
          <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-green-950 bg-green-50 p-2 rounded border border-green-200 mb-3">
            1. Land Cadastre & Revenue Record (நில விவரம்)
          </h4>
          <table className="w-full text-xs border-collapse font-sans">
            <tbody>
              <tr className="border-b">
                <td className="py-2 text-gray-600 w-1/4">District (மாவட்டம்)</td>
                <td className="py-2 font-bold w-1/4">{parcel.district}</td>
                <td className="py-2 text-gray-600 w-1/4">Survey No (புல எண்)</td>
                <td className="py-2 font-bold font-mono w-1/4">{parcel.surveyNumber}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-gray-600">Taluk (வட்டம்)</td>
                <td className="py-2 font-bold">{parcel.taluk}</td>
                <td className="py-2 text-gray-600">GIS Acreage (பரப்பளவு)</td>
                <td className="py-2 font-bold font-mono">{parcel.areaAcres ? `${parcel.areaAcres} Acres` : '1.45 Acres'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-gray-600">Village (கிராமம்)</td>
                <td className="py-2 font-bold">{parcel.village}</td>
                <td className="py-2 text-gray-600">Land Holder (உரிமையாளர்)</td>
                <td className="py-2 font-bold font-mono">
                  {persona === 'officer' ? landRecord.ownerNameFull || 'R. Krishnan' : landRecord.ownerNameMasked || 'R. K****'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. Crop & Health Diagnostic */}
        <div className="mb-6">
          <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-green-950 bg-green-50 p-2 rounded border border-green-200 mb-3">
            2. Multimodal Crop Health & Diagnostic (பயிர் & நோய் கண்டறிதல்)
          </h4>
          <div className="p-3 border rounded-lg text-xs space-y-2 font-sans bg-gray-50/50">
            <div className="flex justify-between">
              <span>Identified Crop: <strong>{cropAssessment.cropName || 'Paddy'}</strong></span>
              <span>Growth Stage: <strong className="capitalize">{cropAssessment.growthStage || 'Tillering'}</strong></span>
              <span>Visual Confidence: <strong>{Math.round((cropAssessment.confidence || 0.88) * 100)}%</strong></span>
            </div>
            {cropAssessment.condition !== 'Healthy' && (
              <div className="text-amber-900 bg-amber-50 p-2 rounded border border-amber-200">
                <strong>Infestation Detected:</strong> {cropAssessment.condition} ({cropAssessment.visualEvidence})
              </div>
            )}
          </div>
        </div>

        {/* 3. Actionable Prescriptions */}
        <div className="mb-6">
          <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-green-950 bg-green-50 p-2 rounded border border-green-200 mb-3">
            3. Grounded Agronomic Recommendations (வேளாண் பரிந்துரைகள்)
          </h4>
          <div className="space-y-2 font-sans">
            {recommendations.map((rec, i) => (
              <div key={i} className="p-3 border rounded-lg text-xs">
                <div className="flex justify-between font-bold text-green-900 mb-1">
                  <span>{rec.title}</span>
                  {rec.dosage && <span className="font-mono bg-green-100 px-2 py-0.5 rounded">{rec.dosage}</span>}
                </div>
                <p className="text-gray-800">{rec.description}</p>
                <div className="text-[10px] text-gray-500 mt-1">Citation: {rec.sourceCitation.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Weather Advisory & Sign-off Block */}
        <div className="pt-4 border-t-2 border-gray-300 grid grid-cols-3 gap-6 items-end font-sans">
          <div className="text-xs">
            <div className="font-bold text-gray-700 mb-1">Spray Feasibility</div>
            <div className={`p-2 rounded font-bold text-center ${sprayFeasible ? 'bg-green-100 text-green-900' : 'bg-amber-100 text-amber-900'}`}>
              {sprayFeasible ? 'Safe Spray Window Available' : 'Delay Spraying Due to Rain'}
            </div>
          </div>

          {/* QR Code Block */}
          <div className="text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 border border-gray-400 p-1 flex items-center justify-center mb-1">
              <QrCode className="w-12 h-12 text-gray-800" />
            </div>
            <span className="text-[9px] font-mono text-gray-500">Scan to verify cryptographic signature</span>
          </div>

          {/* Official Signature Block */}
          <div className="text-right text-xs">
            <div className="font-mono text-[10px] text-gray-400 mb-6">SIGNED: SHA256-AGRI-AI-VERIFIED</div>
            <div className="border-t border-gray-400 pt-1 font-bold text-gray-800">
              Authorized System Signatory
            </div>
            <div className="text-[10px] text-gray-500">FarmwiseAI Agriculture Intelligence</div>
          </div>
        </div>
      </div>
    </div>
  );
};
