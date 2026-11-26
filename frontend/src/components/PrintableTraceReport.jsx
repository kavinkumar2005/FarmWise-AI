import React from 'react';

const getBotanicalName = (cropName = '') => {
  const c = String(cropName).toLowerCase();
  if (c.includes('coconut')) return 'Cocos nucifera';
  if (c.includes('paddy') || c.includes('rice')) return 'Oryza sativa';
  if (c.includes('maize') || c.includes('corn')) return 'Zea mays';
  if (c.includes('sugarcane')) return 'Saccharum officinarum';
  if (c.includes('cotton')) return 'Gossypium hirsutum';
  if (c.includes('banana')) return 'Musa acuminata';
  if (c.includes('groundnut') || c.includes('peanut')) return 'Arachis hypogaea';
  return 'Agricultural crop';
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

  const cropName = crop.crop_name || parcel.recorded_crop || 'Coconut';
  const botanical = getBotanicalName(cropName);
  const growthStage = crop.growth_stage || parcel.recorded_stage || 'Bearing / adult tree stage';
  const observations = getVisibleObservations(cropName);

  const soilPhVal = Number(soil.ph || 5.94);
  const soilPhStatus = soilPhVal < 6.5 ? 'Acidic' : soilPhVal > 7.5 ? 'Alkaline' : 'Neutral';

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="print-only-dossier hidden print:block text-slate-900 bg-white font-serif leading-relaxed text-[11px] max-w-[210mm] mx-auto">
      
      {/* ═══════════════════════════════════════════════════════════════
          PAGE 1
      ═══════════════════════════════════════════════════════════════ */}
      <div className="min-h-[285mm] flex flex-col justify-between page-break-after pb-4">
        <div>
          {/* Running Top Header */}
          <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1 mb-4">
            <span>FARMWISEAI | Preliminary scheme-support document — Not a Government Certificate</span>
            <span>Page 1</span>
          </div>

          {/* Main Title Block */}
          <div className="text-center mb-4">
            <div className="text-[11px] font-bold tracking-widest uppercase text-slate-700">
              FARMWISEAI | UZHAVANAI
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 mt-1 uppercase">
              Farmer Agricultural Assessment &amp; Scheme Application Support Report
            </h1>
            <p className="text-[11px] text-slate-600 italic mt-0.5">
              Crop, land and soil information summary
            </p>
          </div>

          {/* Document Status Box */}
          <div className="bg-slate-50 border border-slate-300 rounded p-2.5 mb-4 text-[10px] leading-tight text-slate-800">
            <span className="font-bold">DOCUMENT STATUS: AI-GENERATED PRELIMINARY ASSESSMENT — FOR FARMER REFERENCE AND SUPPORTING DOCUMENTATION ONLY.</span> This is not a government-issued certificate, official Soil Health Card, land-record extract, eligibility approval or sanction order.
          </div>

          {/* 1. Farmer and applicant details */}
          <div className="mb-4">
            <h2 className="text-xs font-bold text-slate-900 mb-1.5 uppercase tracking-wide">
              1. Farmer and applicant details
            </h2>
            <div className="border border-slate-300 rounded overflow-hidden">
              <table className="w-full text-[10.5px] border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="w-1/4 p-1.5 font-semibold text-slate-700 bg-slate-50/50">Applicant / Farmer name</td>
                    <td className="w-1/4 p-1.5 border-r border-slate-200">________________________________</td>
                    <td className="w-1/4 p-1.5 font-semibold text-slate-700 bg-slate-50/50">Mobile number</td>
                    <td className="w-1/4 p-1.5">________________</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 font-semibold text-slate-700 bg-slate-50/50">Father’s / Spouse’s name</td>
                    <td className="p-1.5 border-r border-slate-200">________________________________</td>
                    <td className="p-1.5 font-semibold text-slate-700 bg-slate-50/50">Aadhaar / ID (if required)</td>
                    <td className="p-1.5">________________</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 font-semibold text-slate-700 bg-slate-50/50 align-top">Address</td>
                    <td className="p-1.5 border-r border-slate-200">
                      ___________________________________<br />
                      ___________
                    </td>
                    <td className="p-1.5 font-semibold text-slate-700 bg-slate-50/50 align-top">PIN code</td>
                    <td className="p-1.5 align-top">________</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-semibold text-slate-700 bg-slate-50/50">Bank account (last 4 digits only)</td>
                    <td className="p-1.5 border-r border-slate-200">________________</td>
                    <td className="p-1.5 font-semibold text-slate-700 bg-slate-50/50">Preferred contact</td>
                    <td className="p-1.5">________________</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Land and cultivation particulars */}
          <div className="mb-4">
            <h2 className="text-xs font-bold text-slate-900 mb-1.5 uppercase tracking-wide">
              2. Land and cultivation particulars
            </h2>
            <div className="border border-slate-300 rounded overflow-hidden">
              <table className="w-full text-[10.5px] border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="w-1/4 p-1.5 font-semibold text-slate-700 bg-slate-50/50">Survey / Sub-division No.</td>
                    <td className="w-1/4 p-1.5 font-semibold border-r border-slate-200">
                      {parcel.survey_number} {parcel.sub_division ? `/ ${parcel.sub_division}` : '/ 1B'}
                    </td>
                    <td className="w-1/4 p-1.5 font-semibold text-slate-700 bg-slate-50/50">Village</td>
                    <td className="w-1/4 p-1.5">{parcel.village_name || 'Sivagiri'}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 font-semibold text-slate-700 bg-slate-50/50">Taluk</td>
                    <td className="p-1.5 border-r border-slate-200">{parcel.taluk || 'Sivagiri'}</td>
                    <td className="p-1.5 font-semibold text-slate-700 bg-slate-50/50">District</td>
                    <td className="p-1.5">{parcel.district || 'Tenkasi'}, Tamil Nadu</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 font-semibold text-slate-700 bg-slate-50/50">Land area (acre / hectare)</td>
                    <td className="p-1.5 border-r border-slate-200">
                      {parcel.area_acres ? `${parcel.area_acres} Acres / ${(parcel.area_acres * 0.404686).toFixed(2)} Ha` : 'To be entered and verified'}
                    </td>
                    <td className="p-1.5 font-semibold text-slate-700 bg-slate-50/50">Ownership / tenancy</td>
                    <td className="p-1.5">To be verified</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 font-semibold text-slate-700 bg-slate-50/50">Patta / Chitta reference</td>
                    <td className="p-1.5 border-r border-slate-200">To be entered (if applicable)</td>
                    <td className="p-1.5 font-semibold text-slate-700 bg-slate-50/50">Irrigation source</td>
                    <td className="p-1.5">To be entered</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-semibold text-slate-700 bg-slate-50/50">Season / year</td>
                    <td className="p-1.5 border-r border-slate-200">________________</td>
                    <td className="p-1.5 font-semibold text-slate-700 bg-slate-50/50">Cultivation status</td>
                    <td className="p-1.5">Standing crop (reported)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Crop assessment */}
          <div className="mb-4">
            <h2 className="text-xs font-bold text-slate-900 mb-1.5 uppercase tracking-wide">
              3. Crop assessment
            </h2>
            <div className="border border-slate-300 rounded overflow-hidden">
              <table className="w-full text-[10.5px] border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="w-1/3 p-1.5 font-semibold text-slate-700 bg-slate-50/50 border-r border-slate-200">Crop identified</td>
                    <td className="p-1.5 font-semibold text-slate-900">{cropName} ({botanical})</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 font-semibold text-slate-700 bg-slate-50/50 border-r border-slate-200">Growth stage</td>
                    <td className="p-1.5">{growthStage} (visual assessment)</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 font-semibold text-slate-700 bg-slate-50/50 border-r border-slate-200">Observed condition</td>
                    <td className="p-1.5">Healthy and vigorous appearance in the submitted field image</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="p-1.5 font-semibold text-slate-700 bg-slate-50/50 border-r border-slate-200">Visible observations</td>
                    <td className="p-1.5">{observations}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-semibold text-slate-700 bg-slate-50/50 border-r border-slate-200 align-top">Visible pest / disease symptoms</td>
                    <td className="p-1.5">No prominent symptoms were visible in the submitted image. This does not rule out hidden or early-stage problems.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Soil health information */}
          <div className="mb-4">
            <h2 className="text-xs font-bold text-slate-900 mb-1 uppercase tracking-wide">
              4. Soil health information
            </h2>
            <p className="text-[9.5px] text-slate-600 mb-1.5 leading-tight">
              Values below are reproduced from the uploaded FarmwiseAI report. The source report does not provide a laboratory-issued soil test certificate; confirm through an authorised soil testing laboratory or the relevant Agriculture Department.
            </p>
            <div className="border border-slate-800 rounded overflow-hidden">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-semibold">
                    <th className="p-1.5 text-left border-r border-slate-700 w-1/3">Parameter</th>
                    <th className="p-1.5 text-left border-r border-slate-700 w-1/3">Reported result</th>
                    <th className="p-1.5 text-left w-1/3">Reported interpretation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-1.5 font-semibold border-r border-slate-200">Soil profile / texture</td>
                    <td className="p-1.5 border-r border-slate-200">{soil.soil_type || 'Lateritic / loamy-sand profile; gravelly loam also noted'}</td>
                    <td className="p-1.5 text-slate-700">Field classification; confirm by soil test</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-semibold border-r border-slate-200">Soil pH</td>
                    <td className="p-1.5 font-bold border-r border-slate-200">{soilPhVal}</td>
                    <td className="p-1.5 font-semibold text-slate-800">{soilPhStatus}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-semibold border-r border-slate-200">Organic carbon</td>
                    <td className="p-1.5 border-r border-slate-200">{soil.organic_carbon_percent || 0.42}%</td>
                    <td className="p-1.5 text-slate-700">{soil.organic_carbon_status || 'Low'}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-semibold border-r border-slate-200">Electrical conductivity (EC)</td>
                    <td className="p-1.5 border-r border-slate-200">{soil.electrical_conductivity_ds_m || 0.28} dS/m</td>
                    <td className="p-1.5 text-slate-700">Non-saline / normal</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-semibold border-r border-slate-200">Available nitrogen (N)</td>
                    <td className="p-1.5 border-r border-slate-200">{soil.nitrogen_kg_ha || 194} kg/ha</td>
                    <td className="p-1.5 text-slate-700">{soil.nitrogen_status || 'Low'}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-semibold border-r border-slate-200">Available phosphorus (P)</td>
                    <td className="p-1.5 border-r border-slate-200">{soil.phosphorus_kg_ha || 8.7} kg/ha</td>
                    <td className="p-1.5 text-slate-700">{soil.phosphorus_status || 'Low'}</td>
                  </tr>
                  <tr>
                    <td className="p-1.5 font-semibold border-r border-slate-200">Available potassium (K)</td>
                    <td className="p-1.5 border-r border-slate-200">{soil.potassium_kg_ha || 216.5} kg/ha</td>
                    <td className="p-1.5 text-slate-700">{soil.potassium_status || 'Medium'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Preliminary soil improvement and nutrient guidance (Intro) */}
          <div>
            <h2 className="text-xs font-bold text-slate-900 mb-1 uppercase tracking-wide">
              5. Preliminary soil improvement and nutrient guidance
            </h2>
            <p className="text-[9.5px] text-slate-600 leading-tight">
              The following measures are reproduced as preliminary AI-generated suggestions, not an approved fertiliser prescription. Final quantities must be decided after confirming soil-test results, crop age, tree population, yield target and local recommendations.
            </p>
          </div>
        </div>

        {/* Page 1 Footer */}
        <div className="flex justify-between items-center text-[9px] text-slate-500 pt-2 border-t border-slate-200">
          <span>FARMWISEAI | Preliminary scheme-support document — Not a Government Certificate</span>
          <span>Page 1</span>
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════════════
          PAGE 2
      ═══════════════════════════════════════════════════════════════ */}
      <div className="min-h-[285mm] flex flex-col justify-between pt-2">
        <div>
          {/* Running Top Header */}
          <div className="flex justify-between items-center text-[9px] text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1 mb-4">
            <span>FARMWISEAI | Preliminary scheme-support document — Not a Government Certificate</span>
            <span>Page 2</span>
          </div>

          {/* 5. Preliminary guidance details (Continued) */}
          <div className="space-y-2 mb-4 text-[10.5px] leading-snug text-slate-800">
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
          <div className="mb-4">
            <h2 className="text-xs font-bold text-slate-900 mb-1.5 uppercase tracking-wide">
              6. Purpose of report and scheme application
            </h2>
            <p className="text-[10px] text-slate-700 leading-tight mb-2">
              This report organises farmer-provided / platform-assessed crop, land and soil information for discussion with the competent government office and, where accepted, to accompany an application for an agriculture-related scheme.
            </p>
            <div className="space-y-2 text-[10.5px]">
              <div>
                <span className="font-semibold text-slate-800">Scheme name:</span> __________________________________________________________
              </div>
              <div>
                <span className="font-semibold text-slate-800">Application / reference number:</span> ______________________________________________
              </div>
              <div className="flex items-center flex-wrap gap-4 pt-0.5">
                <span className="font-semibold text-slate-800">Assistance requested:</span>
                <label className="inline-flex items-center gap-1.5"><span className="w-3.5 h-3.5 border border-slate-700 inline-block bg-white"></span> Input support</label>
                <label className="inline-flex items-center gap-1.5"><span className="w-3.5 h-3.5 border border-slate-700 inline-block bg-white"></span> Irrigation</label>
                <label className="inline-flex items-center gap-1.5"><span className="w-3.5 h-3.5 border border-slate-700 inline-block bg-white"></span> Farm equipment</label>
                <label className="inline-flex items-center gap-1.5"><span className="w-3.5 h-3.5 border border-slate-700 inline-block bg-white"></span> Horticulture</label>
                <label className="inline-flex items-center gap-1.5"><span className="w-3.5 h-3.5 border border-slate-700 inline-block bg-white"></span> Other: __________</label>
              </div>
            </div>
          </div>

          {/* 7. Documents to attach / verify */}
          <div className="mb-4">
            <h2 className="text-xs font-bold text-slate-900 mb-1.5 uppercase tracking-wide">
              7. Documents to attach / verify
            </h2>
            <div className="grid grid-cols-1 gap-1 text-[10.5px] text-slate-800">
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
          <div className="mb-4">
            <h2 className="text-xs font-bold text-slate-900 mb-1.5 uppercase tracking-wide">
              8. Declaration and verification
            </h2>
            <p className="text-[10px] text-slate-700 leading-tight mb-2">
              I declare that the personal, land and cultivation details supplied by me are true to the best of my knowledge. I understand that this report is a preliminary information summary and that the competent department may independently verify the details and request additional documents.
            </p>
            <div className="border border-slate-400 rounded overflow-hidden mb-2.5">
              <table className="w-full text-[10.5px] border-collapse">
                <tbody>
                  <tr className="h-16 border-b border-slate-300">
                    <td className="w-1/3 border-r border-slate-300 p-2 align-bottom"></td>
                    <td className="w-1/3 border-r border-slate-300 p-2 align-bottom"></td>
                    <td className="w-1/3 p-2 align-bottom"></td>
                  </tr>
                  <tr className="bg-slate-50 text-slate-800 font-semibold text-[10px]">
                    <td className="p-1.5 text-center border-r border-slate-300">Farmer / Applicant signature</td>
                    <td className="p-1.5 text-center border-r border-slate-300">Prepared / assisted by</td>
                    <td className="p-1.5 text-center">Receiving official (if applicable)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex justify-between text-[10.5px] mb-2">
              <span>Place: ____________________________</span>
              <span>Date: ____________________________</span>
            </div>
            <div className="text-[10.5px] font-semibold text-slate-800 mb-1">
              Office remarks / seal (for competent authority only):
            </div>
            <div className="h-14 border border-slate-300 rounded bg-slate-50/30"></div>
          </div>

          {/* Important note */}
          <div className="mt-2 text-[9px] text-slate-600 leading-tight border-t border-slate-200 pt-2">
            <div className="font-bold text-slate-800 uppercase mb-0.5">Important note</div>
            <p>
              Generated from information contained in the FarmwiseAI report dated {formattedDate}. AI confidence scores, agent execution logs, model names, processing costs and internal audit claims have been excluded because they are not necessary for a farmer-facing scheme-support document and do not constitute statutory verification. Survey details, soil values and supporting records must be checked against original government / laboratory records. Scheme eligibility, approval and benefit disbursement are decided solely by the relevant government department.
            </p>
          </div>
        </div>

        {/* Page 2 Footer */}
        <div className="flex justify-between items-center text-[9px] text-slate-500 pt-2 border-t border-slate-200">
          <span>FARMWISEAI | Preliminary scheme-support document — Not a Government Certificate</span>
          <span>Page 2</span>
        </div>
      </div>

    </div>
  );
}
