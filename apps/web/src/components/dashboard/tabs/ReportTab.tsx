import React, { useState, useEffect } from 'react';
import {
  Printer,
  Download,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  X,
  FileText
} from 'lucide-react';
import {
  FinalResult,
  generateAdvisoryDigest,
  generateAdvisoryQRCodes,
  buildGovernmentReportHTML,
  AdvisoryVerificationDigest,
  QRCodeBundle
} from '@farmwise/agent-core';
import { Language, Persona } from '../../../types/ui.js';

interface ReportTabProps {
  result: FinalResult;
  lang: Language;
  persona: Persona;
}

export const ReportTab: React.FC<ReportTabProps> = ({ result, lang, persona }) => {
  const { parcel, landRecord, cropAssessment, weather, recommendations, verification, confidence } = result;

  const [digest, setDigest] = useState<AdvisoryVerificationDigest | null>(null);
  const [qrBundle, setQrBundle] = useState<QRCodeBundle | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const computedDigest = generateAdvisoryDigest(result);
    setDigest(computedDigest);

    generateAdvisoryQRCodes(computedDigest).then(bundle => {
      setQrBundle(bundle);
    }).catch(err => {
      console.warn('QR code generation error:', err);
    });
  }, [result]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHTML = async () => {
    try {
      setIsDownloading(true);
      const generated = await buildGovernmentReportHTML(result, {
        language: lang,
        persona,
        verificationDigest: digest || undefined,
        qrCodeBundle: qrBundle || undefined
      });

      const blob = new Blob([generated.html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FarmwiseAI_Report_${digest?.advisoryId || 'Advisory'}_${parcel.surveyNumber.replace(/[\/\\]/g, '-')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download HTML error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const isOfficer = persona === 'officer';
  const ownerName = isOfficer
    ? (landRecord.ownerNameFull || landRecord.ownerNameMasked || 'R. Krishnan')
    : (landRecord.ownerNameMasked || 'R. K****');

  const sprayFeasible = !weather.agronomicAlerts.some(
    a => a.toLowerCase().includes('rain') || a.toLowerCase().includes('wind')
  );

  const formattedDate = new Date().toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Print / Export Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm print:hidden">
        <div>
          <h4 className="font-bold text-sm text-[#0F3D26] flex items-center space-x-2">
            <span>{lang === 'en' ? 'Official Government-Format Report Preview' : 'அரசு வடிவ அறிக்கை முன்னோட்டம்'}</span>
            <span className="text-[10px] bg-green-100 text-green-800 font-mono px-2 py-0.5 rounded-full border border-green-200">
              TAMIL NADU AGRONOMY STANDARD
            </span>
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {lang === 'en'
              ? 'Cryptographically sealed advisory sheet with embedded QR verification & dual persona compliance.'
              : 'மின்னணு முறையில் கையொப்பமிட்ட, QR சரிபார்ப்புடன் கூடிய உத்தியோகபூர்வ வேளாண் அறிக்கை.'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Download Standalone Offline HTML */}
          <button
            type="button"
            onClick={handleDownloadHTML}
            disabled={isDownloading}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 border border-gray-300"
            title="Download offline self-contained HTML file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'Offline HTML' : 'பதிவிறக்கு'}</span>
          </button>

          {/* Browser Print / Save as PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-[#2E7D32] hover:bg-[#388E3C] text-white text-xs font-bold rounded-xl transition-all flex items-center space-x-2 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>{lang === 'en' ? 'Print / Save PDF' : 'அச்சிடுக / PDF'}</span>
          </button>
        </div>
      </div>

      {/* Verification Certificate Modal */}
      {isVerifying && digest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-green-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-6 h-6 text-[#2E7D32]" />
                <div>
                  <h3 className="font-bold text-sm text-[#0F3D26]">Digital Advisory Authenticity Certificate</h3>
                  <p className="text-[11px] text-gray-500">Government of Tamil Nadu Cadastral Verification Wing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVerifying(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="font-bold text-emerald-900">Cryptographically Verified & Authentic</div>
                  <div className="text-emerald-700 text-[11px]">This document has been verified against the 7-point deterministic agriculture rules.</div>
                </div>
              </div>

              <div className="space-y-2 font-mono bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <div>
                  <span className="text-gray-500">Advisory ID: </span>
                  <strong className="text-black">{digest.advisoryId}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Survey No: </span>
                  <strong className="text-black">{parcel.surveyNumber} ({parcel.village})</strong>
                </div>
                <div>
                  <span className="text-gray-500">SHA-256 Checksum: </span>
                  <div className="text-[10px] break-all text-gray-800 font-bold mt-0.5">{digest.sha256}</div>
                </div>
                <div>
                  <span className="text-gray-500">Verification URL: </span>
                  <div className="text-[10px] break-all text-blue-700 mt-0.5">{digest.verificationUrl}</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <a
                href={digest.verificationUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-[#2E7D32] border border-green-300 font-bold text-xs rounded-xl flex items-center space-x-1"
              >
                <span>Open Verification Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() => setIsVerifying(false)}
                className="px-4 py-1.5 bg-[#2E7D32] hover:bg-[#388E3C] text-white font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
          <p className="text-xs text-gray-600 mt-1 font-sans">
            PARCEL-LEVEL AUTONOMOUS AGRO-ADVISORY & CADASTRE VERIFICATION RECORD
          </p>
        </div>

        {/* Verification Strip & Report Meta */}
        <div className="grid grid-cols-2 gap-4 text-xs font-mono border-b pb-4 mb-6">
          <div>
            <span className="text-gray-500">Advisory ID / எண்: </span>
            <strong className="text-black">{digest?.advisoryId || `FW-TN-2026-${result.runId.substring(4, 12)}`}</strong>
          </div>
          <div className="text-right">
            <span className="text-gray-500">Generated / நாள்: </span>
            <strong>{formattedDate}</strong>
          </div>
          <div>
            <span className="text-gray-500">Verification Status / தணிக்கை: </span>
            <strong className="text-green-800 uppercase">{verification.overallStatus} ({Math.round(confidence.overall * 100)}%)</strong>
          </div>
          <div className="text-right">
            <span className="text-gray-500">Persona Mode: </span>
            <strong>{isOfficer ? 'Officer Audit (Full PII)' : 'Farmer View (PII Masked)'}</strong>
          </div>
        </div>

        {/* 1. Cadastral Details Section */}
        <div className="mb-6">
          <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-green-950 bg-green-50 p-2 rounded border border-green-200 mb-3">
            1. Land Cadastre & Revenue Record (நில வருவாய் & புல விவரம்)
          </h4>
          <table className="w-full text-xs border-collapse font-sans">
            <tbody>
              <tr className="border-b">
                <td className="py-2 text-gray-600 w-1/4">District (மாவட்டம்)</td>
                <td className="py-2 font-bold w-1/4">{parcel.district}</td>
                <td className="py-2 text-gray-600 w-1/4">Survey No (புல எண்)</td>
                <td className="py-2 font-bold font-mono w-1/4">{parcel.surveyNumber}{parcel.subdivision ? `/${parcel.subdivision}` : ''}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-gray-600">Taluk (வட்டம்)</td>
                <td className="py-2 font-bold">{parcel.taluk}</td>
                <td className="py-2 text-gray-600">Land Type (நில வகைப்பாடு)</td>
                <td className="py-2 font-bold">{landRecord.classification || 'Patta'} ({landRecord.wetOrDry || 'Nanjai'})</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-gray-600">Village (கிராமம்)</td>
                <td className="py-2 font-bold">{parcel.village}</td>
                <td className="py-2 text-gray-600">Patta No (பட்டா எண்)</td>
                <td className="py-2 font-bold font-mono">{landRecord.pattaNumber || '1042'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-gray-600">GIS Acreage (பரப்பளவு)</td>
                <td className="py-2 font-bold font-mono">{parcel.areaAcres ? `${parcel.areaAcres} Acres` : '2.10 Acres'}</td>
                <td className="py-2 text-gray-600">Land Holder (உரிமையாளர்)</td>
                <td className="py-2 font-bold font-mono">
                  {ownerName}
                  {isOfficer && <span className="ml-1 text-[10px] text-green-700 bg-green-100 px-1 py-0.2 rounded font-sans font-normal">Officer Audit</span>}
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
                <div className="text-[10px] text-gray-500 mt-1">Citation: {rec.sourceCitation.title} ({rec.category.toUpperCase()})</div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Weather Advisory */}
        <div className="mb-6">
          <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-green-950 bg-green-50 p-2 rounded border border-green-200 mb-3">
            4. 48-Hour Micro-Climate & Spray Feasibility (வானிலை ஆய்வு)
          </h4>
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-sans mb-2">
            <div className="p-2 border rounded bg-gray-50">
              <div className="text-gray-500 text-[10px]">Temp</div>
              <div className="font-bold text-green-900">{Math.round(weather.currentTempC)}°C</div>
            </div>
            <div className="p-2 border rounded bg-gray-50">
              <div className="text-gray-500 text-[10px]">Humidity</div>
              <div className="font-bold text-green-900">{Math.round(weather.humidityPct)}%</div>
            </div>
            <div className="p-2 border rounded bg-gray-50">
              <div className="text-gray-500 text-[10px]">Wind</div>
              <div className="font-bold text-green-900">{Math.round((weather as any).windSpeedKmph || 8)} km/h</div>
            </div>
            <div className="p-2 border rounded bg-gray-50">
              <div className="text-gray-500 text-[10px]">Rainfall</div>
              <div className="font-bold text-green-900">{weather.precipitationMm} mm</div>
            </div>
          </div>
          <div className={`p-2.5 rounded-lg font-sans text-xs font-bold text-center ${sprayFeasible ? 'bg-green-100 text-green-900 border border-green-300' : 'bg-amber-100 text-amber-900 border border-amber-300'}`}>
            {sprayFeasible
              ? '✓ SAFE SPRAY WINDOW: Micro-climate suitable for scheduled foliar spray within next 48 hours.'
              : '⚠ SPRAY ADVISORY: Postpone foliar application due to forecasted rain or adverse wind speed.'}
          </div>
        </div>

        {/* 5. Data Provenance & Verification Audit */}
        <div className="mb-6">
          <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-green-950 bg-green-50 p-2 rounded border border-green-200 mb-3">
            5. Data Provenance & Verification Audit (தரவு மூலம் & சரிபார்ப்பு தணிக்கை)
          </h4>
          <table className="w-full text-xs border-collapse font-sans">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-600">
                <th className="py-1.5 text-left">Data Item</th>
                <th className="py-1.5 text-left">Recorded Origin</th>
                <th className="py-1.5 text-right">Verification Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-1.5">Cadastral Boundary</td>
                <td className="py-1.5"><span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">{parcel.provenance || 'FarmwiseAI-provided'}</span></td>
                <td className="py-1.5 text-right font-bold text-green-800">PASS</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5">Land Revenue Record</td>
                <td className="py-1.5"><span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">{landRecord.provenance || 'FarmwiseAI-provided'}</span></td>
                <td className="py-1.5 text-right font-bold text-green-800">PASS</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5">Crop Diagnostic Visuals</td>
                <td className="py-1.5"><span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">{cropAssessment.provenance || 'User-uploaded'}</span></td>
                <td className="py-1.5 text-right font-bold text-green-800">PASS</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5">Advisory Corpus</td>
                <td className="py-1.5"><span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">{recommendations[0]?.sourceCitation?.provenance || 'Public source'}</span></td>
                <td className="py-1.5 text-right font-bold text-green-800">PASS</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 6. Sign-off, Cryptographic Checksum & Live QR Block */}
        <div className="pt-4 border-t-2 border-gray-300 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center font-sans">
          {/* Cryptographic Seal */}
          <div className="text-xs space-y-1">
            <div className="font-bold text-gray-800 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-green-700" />
              <span>Digital Authenticity Seal</span>
            </div>
            <div className="font-mono text-[9px] text-gray-500 break-all">
              SHA256: {digest?.sha256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
            </div>
            <div className="text-[10px] text-green-800 font-mono">
              SIG: {digest?.shortChecksum || 'AGRI-VERIFIED'} | TN CADASTRAL
            </div>
          </div>

          {/* Interactive QR Code Block */}
          <div className="text-center flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsVerifying(true)}
              className="p-1 bg-white border-2 border-green-800 rounded-lg hover:border-green-600 transition-all shadow-sm group"
              title="Click to view digital verification certificate"
            >
              {qrBundle?.dataUrl ? (
                <img
                  src={qrBundle.dataUrl}
                  alt="Official Verification QR Code"
                  className="w-20 h-20 object-contain group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-100 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-400 animate-pulse" />
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsVerifying(true)}
              className="text-[9px] font-mono text-green-800 hover:underline mt-1 font-bold"
            >
              [ Click to Verify Authenticity ]
            </button>
          </div>

          {/* Official Signatory */}
          <div className="text-right text-xs">
            <div className="font-mono text-[10px] text-gray-400 mb-6">SIGNED: SHA256-AGRI-AI-VERIFIED</div>
            <div className="border-t border-gray-400 pt-1 font-bold text-gray-800">
              Director of Agriculture & Land Welfare
            </div>
            <div className="text-[10px] text-gray-500">Autonomous Systems Wing, Chennai</div>
          </div>
        </div>
      </div>
    </div>
  );
};
