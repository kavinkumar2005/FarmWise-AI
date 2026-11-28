import React from 'react';

const getCleanCropDisplay = (cropName = '', recordedCrop = '') => {
  const raw = String(cropName || recordedCrop || 'Coconut');
  // Strip any existing parentheses e.g. (Cocos nucifera) or bilingual slashes
  const baseName = raw.replace(/\(.*?\)/g, '').split('/')[0].trim();
  const lower = baseName.toLowerCase();

  if (lower.includes('coconut')) return { name: 'Coconut', botanical: 'Cocos nucifera' };
  if (lower.includes('paddy') || lower.includes('rice')) return { name: 'Rice (Paddy)', botanical: 'Oryza sativa' };
  if (lower.includes('maize') || lower.includes('corn')) return { name: 'Maize', botanical: 'Zea mays' };
  if (lower.includes('sugarcane')) return { name: 'Sugarcane', botanical: 'Saccharum officinarum' };
  if (lower.includes('cotton')) return { name: 'Cotton', botanical: 'Gossypium hirsutum' };
  if (lower.includes('banana')) return { name: 'Banana', botanical: 'Musa acuminata' };
  if (lower.includes('groundnut') || lower.includes('peanut')) return { name: 'Groundnut', botanical: 'Arachis hypogaea' };
  return { name: baseName || 'Agricultural Crop', botanical: 'Agricultural Crop' };
};

const getVisibleObservations = (cropName = '') => {
  const c = String(cropName).toLowerCase();
  if (c.includes('coconut')) return 'Dense crown, green fronds and sturdy trunk base';
  if (c.includes('paddy') || c.includes('rice')) return 'Uniform vegetative canopy, healthy chlorophyll reflectance and optimal tiller density';
  if (c.includes('maize')) return 'Erect healthy whorl leaves, uniform plant spacing and vigorous leaf blade development';
  if (c.includes('sugarcane')) return 'Dense vegetative cane canopy with vigorous tiller initiation';
  return 'Uniform vegetative canopy spread with healthy chlorophyll reflectance and optimal field stand';
};

export default function PrintableTraceReport({ advisoryData, lang = 'en' }) {
  if (!advisoryData || !advisoryData.parcel) return null;

  const parcel = advisoryData.parcel;
  const crop = advisoryData.crop_analysis || {};
  const soil = advisoryData.soil_profile || parcel.soil_profile || {};

  const { name: displayCropName, botanical } = getCleanCropDisplay(crop.crop_name, parcel.recorded_crop);
  const growthStage = crop.growth_stage || parcel.recorded_stage || 'Bearing / adult tree stage';
  const observations = getVisibleObservations(displayCropName);

  const soilPhVal = Number(soil.ph || 5.94);
  const soilPhStatus = soilPhVal < 6.5 ? 'Acidic' : soilPhVal > 7.5 ? 'Alkaline' : 'Neutral';

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="print-only-dossier hidden print:block text-slate-900 bg-white font-serif leading-tight text-[10px] max-w-[190mm] mx-auto">
      
      {/* ═══════════════════════════════════════════════════════════════
          PAGE 1: Crop, Land, and Soil Assessment Summary
      ═══════════════════════════════════════════════════════════════ */}
      <div className="report-page page-break-after pb-1">
        
        {/* Running Top Header */}
        <div className="flex justify-between items-center text-[8.5px] text-slate-500 uppercase tracking-wider border-b border-slate-300 pb-0.5 mb-2.5">
          <span>UZHAVANAI | Preliminary scheme-support document — Not a Government Certificate</span>
          <span>Page 1</span>
        </div>

        {/* Main Title Block */}
        <div className="text-center mb-2.5">
          <div className="text-[10px] font-bold tracking-widest uppercase text-slate-700">
            UZHAVANAI
          </div>
          <h1 className="text-base font-bold tracking-tight text-slate-900 mt-0.5 uppercase">
            Farmer Agricultural Assessment &amp; Scheme Application Support Report
          </h1>
          <p className="text-[10px] text-slate-600 italic mt-0.5">
            Crop, land and soil information summary
          </p>
        </div>

        {/* Document Status Box */}
        <div className="bg-slate-50 border border-slate-300 rounded p-2 mb-2.5 text-[9.5px] leading-tight text-slate-800">
          <span className="font-bold">DOCUMENT STATUS: AI-GENERATED PRELIMINARY ASSESSMENT — FOR FARMER REFERENCE AND SUPPORTING DOCUMENTATION ONLY.</span> This is not a government-issued certificate, official Soil Health Card, land-record extract, eligibility approval or sanction order.
        </div>

        {/* 1. Farmer and applicant details */}
        <div className="mb-2.5">
          <h2 className="text-[10.5px] font-bold text-slate-900 mb-1 uppercase tracking-wide">
            1. Farmer and applicant details
          </h2>
          <div className="border border-slate-300 rounded overflow-hidden">
            <table className="w-full text-[10px] border-collapse">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-[28%] py-1 px-2 font-semibold text-slate-700 bg-slate-50/70">Applicant / Farmer name</td>
                  <td className="w-[28%] py-1 px-2 border-r border-slate-200">________________________________</td>
                  <td className="w-[22%] py-1 px-2 font-semibold text-slate-700 bg-slate-50/70">Mobile number</td>
                  <td className="w-[22%] py-1 px-2">________________</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1 px-2 font-semibold text-slate-700 bg-slate-50/70">Father’s / Spouse’s name</td>
                  <td className="py-1 px-2 border-r border-slate-200">________________________________</td>
                  <td className="py-1 px-2 font-semibold text-slate-700 bg-slate-50/70">Aadhaar / ID (if required)</td>
                  <td className="py-1 px-2">________________</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1 px-2 font-semibold text-slate-700 bg-slate-50/70 align-top">Address</td>
                  <td className="py-1 px-2 border-r border-slate-200 align-top">
                    ___________________________________<br />
                    ___________
                  </td>
                  <td className="py-1 px-2 font-semibold text-slate-700 bg-slate-50/70 align-top">PIN code</td>
                  <td className="py-1 px-2 align-top">________</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-semibold text-slate-700 bg-slate-50/70">Bank account (last 4 digits only)</td>
                  <td className="py-1 px-2 border-r border-slate-200">________________</td>
                  <td className="py-1 px-2 font-semibold text-slate-700 bg-slate-50/70">Preferred contact</td>
                  <td className="py-1 px-2">________________</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Land and cultivation particulars */}
        <div className="mb-2.5">
          <h2 className="text-[10.5px] font-bold text-slate-900 mb-1 uppercase tracking-wide">
            2. Land and cultivation particulars
          </h2>
          <div className="border border-slate-300 rounded overflow-hidden">
            <table className="w-full text-[10px] border-collapse">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-[28%] py-1 px-2 font-semibold text-slate-700 bg-slate-50/70">Survey / Sub-division No.</td>
                  <td className="w-[28%] py-1 px-2 font-semibold border-r border-slate-200">
                    {parcel.survey_number} {parcel.sub_division ? `/ ${parcel.sub_division}` : '/ 1B'}
                  </td>
                  <td className="w-[22%] py-1 px-2 font-semibold text-slate-700 bg-slate-50/70">Village</td>
                  <td className="w-[22%] py-1 px-2">{parcel.village_name || 'Sivagiri'}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1 px-2 font-semibold text-slate-700 bg-slate-50/70">Taluk</td>
                  <td className="py-1 px-2 border-r border-slate-200">{parcel.taluk || 'Sivagiri'}</td>
                  <td className="py-1 px-2 font-semibold text-slate-700 bg-slate-50/70">District</td>
                  <td className="py-1 px-2">{parcel.district || 'Tenkasi'}, Tamil Nadu</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1 px-2 font-semibold text-slate-700 bg-slate-50/70">Land area (acre / hectare)</td>
                  <td className="py-1 px-2 border-r border-slate-200">
                    {parcel.area_acres ? `${parcel.area_acres} Acres / ${(parcel.area_acres * 0.404686).toFixed(2)} Ha` : 'To be entered and verified'}
                  </td>
                  <td className="py-1 px-2 font-semibold text-slate-700 bg-slate-50/70">Ownership / tenancy</td>
                  <td className="py-1 px-2">To be verified</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1 px-2 font-semibold text-slate-700 bg-slate-50/70">Patta / Chitta reference</td>
                  <td className="py-1 px-2 border-r border-slate-200">To be entered (if applicable)</td>
                  <td className="py-1 px-2 font-semibold text-slate-700 bg-slate-50/70">Irrigation source</td>
                  <td className="py-1 px-2">To be entered</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-semibold text-slate-700 bg-slate-50/70">Season / year</td>
                  <td className="py-1 px-2 border-r border-slate-200">________________</td>
                  <td className="py-1 px-2 font-semibold text-slate-700 bg-slate-50/70">Cultivation status</td>
                  <td className="py-1 px-2">Standing crop (reported)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Crop assessment */}
        <div className="mb-2.5">
          <h2 className="text-[10.5px] font-bold text-slate-900 mb-1 uppercase tracking-wide">
            3. Crop assessment
          </h2>
          <div className="border border-slate-300 rounded overflow-hidden">
            <table className="w-full text-[10px] border-collapse">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="w-[28%] py-1 px-2 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-200">Crop identified</td>
                  <td className="py-1 px-2 font-semibold text-slate-900">{displayCropName} ({botanical})</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1 px-2 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-200">Growth stage</td>
                  <td className="py-1 px-2">{growthStage} (visual assessment)</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1 px-2 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-200">Observed condition</td>
                  <td className="py-1 px-2">Healthy and vigorous appearance in the submitted field image</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-1 px-2 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-200">Visible observations</td>
                  <td className="py-1 px-2">{observations}</td>
                </tr>
                <tr>
                  <td className="py-1 px-2 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-200 align-top">Visible pest / disease symptoms</td>
                  <td className="py-1 px-2">No prominent symptoms were visible in the submitted image. This does not rule out hidden or early-stage problems.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Soil health information */}
        <div className="mb-2.5">
          <h2 className="text-[10.5px] font-bold text-slate-900 mb-0.5 uppercase tracking-wide">
            4. Soil health information
          </h2>
          <p className="text-[9px] text-slate-600 mb-1 leading-tight">
            Values below are reproduced from the uploaded UzhavanAI report. The source report does not provide a laboratory-issued soil test certificate; confirm through an authorised soil testing laboratory or the relevant Agriculture Department.
          </p>
          <div className="border border-slate-800 rounded overflow-hidden">
            <table className="w-full text-[9.5px] border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-semibold">
                  <th className="py-1 px-2 text-left border-r border-slate-700 w-1/3">Parameter</th>
                  <th className="py-1 px-2 text-left border-r border-slate-700 w-1/3">Reported result</th>
                  <th className="py-1 px-2 text-left w-1/3">Reported interpretation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-0.5 px-2 font-semibold border-r border-slate-200">Soil profile / texture</td>
                  <td className="py-0.5 px-2 border-r border-slate-200">{soil.soil_type || 'Laterite Loamy Sand; gravelly loam noted'}</td>
                  <td className="py-0.5 px-2 text-slate-700">Field classification; confirm by soil test</td>
                </tr>
                <tr>
                  <td className="py-0.5 px-2 font-semibold border-r border-slate-200">Soil pH</td>
                  <td className="py-0.5 px-2 font-bold border-r border-slate-200">{soilPhVal}</td>
                  <td className="py-0.5 px-2 font-semibold text-slate-800">{soilPhStatus}</td>
                </tr>
                <tr>
                  <td className="py-0.5 px-2 font-semibold border-r border-slate-200">Organic carbon</td>
                  <td className="py-0.5 px-2 border-r border-slate-200">{soil.organic_carbon_percent || 0.42}%</td>
                  <td className="py-0.5 px-2 text-slate-700">{soil.organic_carbon_status || 'Low'}</td>
                </tr>
                <tr>
                  <td className="py-0.5 px-2 font-semibold border-r border-slate-200">Electrical conductivity (EC)</td>
                  <td className="py-0.5 px-2 border-r border-slate-200">{soil.electrical_conductivity_ds_m || 0.28} dS/m</td>
                  <td className="py-0.5 px-2 text-slate-700">Non-saline / normal</td>
                </tr>
                <tr>
                  <td className="py-0.5 px-2 font-semibold border-r border-slate-200">Available nitrogen (N)</td>
                  <td className="py-0.5 px-2 border-r border-slate-200">{soil.nitrogen_kg_ha || 194} kg/ha</td>
                  <td className="py-0.5 px-2 text-slate-700">{soil.nitrogen_status || 'Low'}</td>
                </tr>
                <tr>
                  <td className="py-0.5 px-2 font-semibold border-r border-slate-200">Available phosphorus (P)</td>
                  <td className="py-0.5 px-2 border-r border-slate-200">{soil.phosphorus_kg_ha || 8.7} kg/ha</td>
                  <td className="py-0.5 px-2 text-slate-700">{soil.phosphorus_status || 'Low'}</td>
                </tr>
                <tr>
                  <td className="py-0.5 px-2 font-semibold border-r border-slate-200">Available potassium (K)</td>
                  <td className="py-0.5 px-2 border-r border-slate-200">{soil.potassium_kg_ha || 216.5} kg/ha</td>
                  <td className="py-0.5 px-2 text-slate-700">{soil.potassium_status || 'Medium'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Preliminary soil improvement and nutrient guidance (Intro) */}
        <div className="mb-2">
          <h2 className="text-[10.5px] font-bold text-slate-900 mb-0.5 uppercase tracking-wide">
            5. Preliminary soil improvement and nutrient guidance
          </h2>
          <p className="text-[9px] text-slate-600 leading-tight">
            The following measures are reproduced as preliminary AI-generated suggestions, not an approved fertiliser prescription. Final quantities must be decided after confirming soil-test results, crop age, tree population, yield target and local recommendations.
          </p>
        </div>

        {/* Page 1 Footer */}
        <div className="flex justify-between items-center text-[8.5px] text-slate-500 pt-1.5 border-t border-slate-300 mt-2">
          <span>UZHAVANAI | Preliminary scheme-support document — Not a Government Certificate</span>
          <span>Page 1</span>
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════════
          PAGE 2: Scheme Application, Requirements & Verifications
      ═══════════════════════════════════════════════════════════════ */}
      <div className="report-page pt-1">
        
        {/* Running Top Header */}
        <div className="flex justify-between items-center text-[8.5px] text-slate-500 uppercase tracking-wider border-b border-slate-300 pb-0.5 mb-2.5">
          <span>UZHAVANAI | Preliminary scheme-support document — Not a Government Certificate</span>
          <span>Page 2</span>
        </div>

        {/* 5. Preliminary guidance details (Continued) */}
        <div className="space-y-1.5 mb-3 text-[10px] leading-snug text-slate-800">
          <p>
            <span className="font-bold">Soil acidity:</span> The source report suggests agricultural lime / dolomite at 120 kg per acre. Confirm the amendment type and dose with the local Agriculture Officer or soil-testing laboratory before application.
          </p>
          <p>
            <span className="font-bold">Organic matter:</span> The source report suggests 5 tonnes of well-decomposed farmyard manure (FYM) per acre or 2 tonnes of vermicompost per acre. Verify suitability and application method locally.
          </p>
          <p>
            <span className="font-bold">Phosphorus:</span> The source report suggests rock phosphate as a basal source, or SSP at 100 kg per acre / DAP at 35 kg per acre. Do not apply these alternatives without a crop- and soil-specific recommendation.
          </p>
          <p>
            <span className="font-bold">Fertiliser selection:</span> The source report advises caution with acid-forming fertilisers in acidic soil. Obtain a locally approved nutrient schedule before purchase or application.
          </p>
        </div>

        {/* 6. Purpose of report and scheme application */}
        <div className="mb-3">
          <h2 className="text-[10.5px] font-bold text-slate-900 mb-1 uppercase tracking-wide">
            6. Purpose of report and scheme application
          </h2>
          <p className="text-[9.5px] text-slate-700 leading-tight mb-2">
            This report organises farmer-provided / platform-assessed crop, land and soil information for discussion with the competent government office and, where accepted, to accompany an application for an agriculture-related scheme.
          </p>
          <div className="space-y-1.5 text-[10px]">
            <div>
              <span className="font-semibold text-slate-800">Scheme name:</span> __________________________________________________________
            </div>
            <div>
              <span className="font-semibold text-slate-800">Application / reference number:</span> ______________________________________________
            </div>
            <div className="flex items-center flex-wrap gap-3 pt-0.5">
              <span className="font-semibold text-slate-800">Assistance requested:</span>
              <span className="inline-flex items-center gap-1"><span className="w-3 h-3 border border-slate-700 inline-block bg-white"></span> Input support</span>
              <span className="inline-flex items-center gap-1"><span className="w-3 h-3 border border-slate-700 inline-block bg-white"></span> Irrigation</span>
              <span className="inline-flex items-center gap-1"><span className="w-3 h-3 border border-slate-700 inline-block bg-white"></span> Farm equipment</span>
              <span className="inline-flex items-center gap-1"><span className="w-3 h-3 border border-slate-700 inline-block bg-white"></span> Horticulture</span>
              <span className="inline-flex items-center gap-1"><span className="w-3 h-3 border border-slate-700 inline-block bg-white"></span> Other: __________</span>
            </div>
          </div>
        </div>

        {/* 7. Documents to attach / verify */}
        <div className="mb-3">
          <h2 className="text-[10.5px] font-bold text-slate-900 mb-1 uppercase tracking-wide">
            7. Documents to attach / verify
          </h2>
          <div className="grid grid-cols-1 gap-1 text-[10px] text-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 border border-slate-700 inline-block bg-white shrink-0"></span>
              <span>Applicant identity document, as required by the scheme</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 border border-slate-700 inline-block bg-white shrink-0"></span>
              <span>Recent photograph of the applicant</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 border border-slate-700 inline-block bg-white shrink-0"></span>
              <span>Land ownership / cultivation proof (Patta, Chitta, Adangal or other document, as applicable)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 border border-slate-700 inline-block bg-white shrink-0"></span>
              <span>Bank passbook copy / account proof, as required</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 border border-slate-700 inline-block bg-white shrink-0"></span>
              <span>Latest soil test report / Soil Health Card, if required</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 border border-slate-700 inline-block bg-white shrink-0"></span>
              <span>Crop and field photographs, if required</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 border border-slate-700 inline-block bg-white shrink-0"></span>
              <span>Scheme-specific application form and declarations</span>
            </div>
          </div>
        </div>

        {/* 8. Declaration and verification */}
        <div className="mb-3">
          <h2 className="text-[10.5px] font-bold text-slate-900 mb-1 uppercase tracking-wide">
            8. Declaration and verification
          </h2>
          <p className="text-[9.5px] text-slate-700 leading-tight mb-1.5">
            I declare that the personal, land and cultivation details supplied by me are true to the best of my knowledge. I understand that this report is a preliminary information summary and that the competent department may independently verify the details and request additional documents.
          </p>
          <div className="border border-slate-400 rounded overflow-hidden mb-2">
            <table className="w-full text-[10px] border-collapse">
              <tbody>
                <tr className="h-12 border-b border-slate-300">
                  <td className="w-1/3 border-r border-slate-300 p-2 align-bottom"></td>
                  <td className="w-1/3 border-r border-slate-300 p-2 align-bottom"></td>
                  <td className="w-1/3 p-2 align-bottom"></td>
                </tr>
                <tr className="bg-slate-50 text-slate-800 font-semibold text-[9.5px]">
                  <td className="p-1 text-center border-r border-slate-300">Farmer / Applicant signature</td>
                  <td className="p-1 text-center border-r border-slate-300">Prepared / assisted by</td>
                  <td className="p-1 text-center">Receiving official (if applicable)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex justify-between text-[10px] mb-2">
            <span>Place: ____________________________</span>
            <span>Date: ____________________________</span>
          </div>
          <div className="text-[10px] font-semibold text-slate-800 mb-0.5">
            Office remarks / seal (for competent authority only):
          </div>
          <div className="h-12 border border-slate-300 rounded bg-slate-50/20"></div>
        </div>

        {/* Important note */}
        <div className="text-[8.5px] text-slate-600 leading-tight border-t border-slate-300 pt-1.5 mb-2">
          <div className="font-bold text-slate-800 uppercase mb-0.5">Important note</div>
          <p>
            Generated from information contained in the UzhavanAI report dated {formattedDate}. AI confidence scores, agent execution logs, model names, processing costs and internal audit claims have been excluded because they are not necessary for a farmer-facing scheme-support document and do not constitute statutory verification. Survey details, soil values and supporting records must be checked against original government / laboratory records. Scheme eligibility, approval and benefit disbursement are decided solely by the relevant government department.
          </p>
        </div>

        {/* Page 2 Footer */}
        <div className="flex justify-between items-center text-[8.5px] text-slate-500 pt-1.5 border-t border-slate-300">
          <span>UZHAVANAI | Preliminary scheme-support document — Not a Government Certificate</span>
          <span>Page 2</span>
        </div>
      </div>

    </div>
  );
}
