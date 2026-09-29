import { KnowledgeChunk } from './types.js';

export const AGRONOMIC_KNOWLEDGE_CORPUS: KnowledgeChunk[] = [
  // PADDY: Tillering Nutrition
  {
    chunkId: 'TNAU-PAD-NUT-001',
    crop: 'Paddy',
    growthStage: 'Tillering',
    category: 'fertilizer',
    title: 'Top Dressing Nitrogen Management at Active Tillering',
    titleTa: 'செயலில் உள்ள தூர்கட்டும் பருவத்தில் தழைச்சத்து மேலாண்மை',
    contentEn: 'Apply Neem Coated Urea at 30 kg/acre along with Muriate of Potash (MOP) 10 kg/acre at 20-25 days after transplanting. Drain standing water completely before broadcasting fertilizers and re-irrigate after 24 hours to prevent leaching losses.',
    contentTa: 'நடவு செய்த 20-25 நாட்களில் (தூர்கட்டும் பருவம்) ஏக்கருக்கு 30 கிலோ வேப்பம்பூசப்பட்ட யூரியா மற்றும் 10 கிலோ பொட்டாஷ் உரத்தை இடவும். உரமிடுவதற்கு முன் வயலில் உள்ள தண்ணீரை முழுமையாக வடித்துவிட்டு, 24 மணி நேரம் கழித்து நீர் பாய்ச்சவும்.',
    keywords: ['urea', 'mop', 'potash', 'nitrogen', 'tillering', 'paddy', 'fertilizer', 'schedule', 'உரம்', 'யூரியா', 'பொட்டாஷ்', 'தூர்கட்டும்', 'நெல்'],
    sourceCitation: {
      sourceId: 'TNAU-CPG-2024-PADDY-4.3',
      title: 'TNAU Crop Production Guide - Wetland Rice',
      section: 'Section 4.3 Nutrient Management in Vegetative Phase',
      provenance: 'Public source'
    },
    safetyRules: {
      approvedChemicals: ['Neem Coated Urea', 'Muriate of Potash'],
      maxDosagePerAcre: '35 kg Urea, 12 kg MOP',
      prohibitedChemicals: ['Direct Ammonium Chloride in acid soils']
    }
  },

  // PADDY: Stem Borer & Leaf Folder Control
  {
    chunkId: 'TNAU-PAD-PEST-002',
    crop: 'Paddy',
    growthStage: 'Tillering',
    category: 'pest_control',
    title: 'Stem Borer and Leaf Folder Management in Rice',
    titleTa: 'நெல் பயிரில் தண்டுத்துளைப்பான் மற்றும் இலைச்சுருட்டுப்புழு கட்டுப்பாடு',
    contentEn: 'Install pheromone traps @ 5 traps/acre for adult monitoring. If dead hearts exceed 5% or damaged leaves exceed 10%, apply Chlorantraniliprole 18.5% SC @ 60 ml/acre in 200 liters of water during late afternoon hours. Alternatively, spray Cartap Hydrochloride 50% SP @ 400 g/acre.',
    contentTa: 'ஏக்கருக்கு 5 இனக்கவர்ச்சி பொறிகளை அமைக்கவும். தண்டுத்துளைப்பான் தாக்குதல் 5% அல்லது இலைச்சுருட்டுப்புழு சேதம் 10% தாண்டினால், ஏக்கருக்கு 60 மிலி குளோரான்ட்ரானிலிப்ரோல் 18.5% SC மருந்தை 200 லிட்டர் தண்ணீரில் கலந்து மாலை வேளையில் தெளிக்கவும்.',
    keywords: ['stem borer', 'leaf folder', 'chlorantraniliprole', 'coragen', 'dead heart', 'தண்டுத்துளைப்பான்', 'இலைச்சுருட்டுப்புழு', 'குளோரான்ட்ரானிலிப்ரோல்'],
    sourceCitation: {
      sourceId: 'TNAU-IPM-2024-PADDY-7.1',
      title: 'TNAU Integrated Pest Management Portal',
      section: 'Section 7.1 Lepidopteran Pests in Rice',
      provenance: 'Public source'
    },
    safetyRules: {
      approvedChemicals: ['Chlorantraniliprole 18.5% SC', 'Cartap Hydrochloride 50% SP', 'Flubendiamide 39.35% SC'],
      maxDosagePerAcre: '60 ml Chlorantraniliprole, 400 g Cartap Hydrochloride',
      prohibitedChemicals: ['Monocrotophos', 'Phorate', 'Endosulfan', 'Paraquat'],
      precautions: 'Do not spray during mid-day heat or when honey bees are active.'
    }
  },

  // PADDY: Blast Disease
  {
    chunkId: 'TNAU-PAD-PATH-003',
    crop: 'Paddy',
    growthStage: 'Tillering',
    category: 'pest_control',
    title: 'Rice Blast Disease (Magnaporthe oryzae) Management',
    titleTa: 'நெல் குலைநோய் (பிளாஸ்ட்) ஒருங்கிணைந்த மேலாண்மை',
    contentEn: 'Spindle-shaped spots with grey centers and brownish margins indicate blast. Avoid excess nitrogenous fertilizer. Spray Tricyclazole 75% WP @ 120 g/acre or Isoprothiolane 40% EC @ 300 ml/acre at initial appearance of symptoms.',
    contentTa: 'இலைகளில் கண் வடிவ புள்ளிகள் சாம்பல் நிற மையத்துடன் காணப்பட்டால் அது குலைநோய். தழைச்சத்து உரங்களை அதிகமாக இடுவதைத் தவிர்க்கவும். ட்ரைசைக்ளசோல் 75% WP மருந்தை ஏக்கருக்கு 120 கிராம் அல்லது ஐசோபுரோதியோலேன் 40% EC மருந்தை 300 மிலி என்ற அளவில் தெளிக்கவும்.',
    keywords: ['blast', 'tricyclazole', 'fungicide', 'leaf blast', 'குலைநோய்', 'பிளாஸ்ட்', 'ட்ரைசைக்ளசோல்'],
    sourceCitation: {
      sourceId: 'TNAU-DIS-2024-PADDY-5.2',
      title: 'TNAU Plant Pathology Handouts',
      section: 'Section 5.2 Fungal Diseases of Rice',
      provenance: 'Public source'
    },
    safetyRules: {
      approvedChemicals: ['Tricyclazole 75% WP', 'Isoprothiolane 40% EC', 'Azoxystrobin 25% SC'],
      maxDosagePerAcre: '150 g Tricyclazole, 350 ml Isoprothiolane'
    }
  },

  // PADDY: Water Management
  {
    chunkId: 'TNAU-PAD-IRR-004',
    crop: 'Paddy',
    growthStage: 'Tillering',
    category: 'irrigation',
    title: 'Alternate Wetting and Drying (AWD) Water Saving Practice',
    titleTa: 'காய்ச்சிப் பாய்ச்சும் முறை (AWD) மூலம் நீர் சேமிப்பு',
    contentEn: 'Maintain 2-3 cm shallow water level during tillering phase. Do not keep continuous deep submergence. Practice alternate wetting and drying by irrigating when field surface shows hairline cracks, saving up to 30% irrigation water without yield reduction.',
    contentTa: 'தூர்கட்டும் பருவத்தில் வயலில் 2-3 செ.மீ அளவு குறைந்த நீர் மட்டத்தை பராமரிக்கவும். தொடர்ந்து ஆழமாக தண்ணீர் தேங்குவதைத் தவிர்க்கவும். நிலத்தின் மேற்பரப்பில் மெல்லிய கீறல்கள் தோன்றும் போது மீண்டும் நீர் பாய்ச்சவும்.',
    keywords: ['irrigation', 'irrigate', 'irrigating', 'water saving', 'alternate wetting and drying', 'AWD', 'நீர் மேலாண்மை', 'பாசனம்', 'காய்ச்சிப் பாய்ச்சுதல்'],
    sourceCitation: {
      sourceId: 'TNAU-WTC-2024-PADDY-3.1',
      title: 'TNAU Water Technology Centre Guidelines',
      section: 'Section 3.1 Water Saving Technologies in Lowland Rice',
      provenance: 'Public source'
    }
  },

  // GROUNDNUT: Pegging Stage Gypsum & Pod Development
  {
    chunkId: 'TNAU-GND-NUT-005',
    crop: 'Groundnut',
    growthStage: 'Flowering',
    category: 'fertilizer',
    title: 'Gypsum Application at Flowering and Pegging Stage in Groundnut',
    titleTa: 'நிலக்கடலையில் பூக்கும் மற்றும் விழுது இறங்கும் தருணத்தில் ஜிப்சம் இடுதல்',
    contentEn: 'Apply agricultural gypsum @ 160-200 kg/acre around 40-45 days after sowing (flowering to pegging stage). Hoe and incorporate gypsum near root zone followed by light irrigation. Calcium promotes sound pod filling and prevents blind nuts (pops).',
    contentTa: 'விதைத்த 40-45 நாட்களில் ஏக்கருக்கு 160-200 கிலோ ஜிப்சம் இடவும். வேர் பகுதியில் ஜிப்சத்தை கலந்து லேசான பாசனம் செய்யவும். கால்சியம் சத்து காய்கள் திரட்சியாக உருவாகவும், சொத்தைக்காய் உருவாவதைத் தடுக்கவும் அவசியமாகும்.',
    keywords: ['groundnut', 'gypsum', 'calcium', 'pod filling', 'pegging', 'நிலக்கடலை', 'வேர்க்கடலை', 'ஜிப்சம்'],
    sourceCitation: {
      sourceId: 'TNAU-OIL-2024-GND-4.2',
      title: 'TNAU Oilseeds Production Guide',
      section: 'Section 4.2 Secondary Nutrient Management in Groundnut',
      provenance: 'Public source'
    },
    safetyRules: {
      approvedChemicals: ['Agricultural Gypsum', 'Zinc Sulphate', 'Borax'],
      maxDosagePerAcre: '200 kg Gypsum'
    }
  },

  // GROUNDNUT: Tikka Leaf Spot Disease
  {
    chunkId: 'TNAU-GND-PEST-006',
    crop: 'Groundnut',
    growthStage: 'Flowering',
    category: 'pest_control',
    title: 'Tikka Leaf Spot (Cercospora) Control in Groundnut',
    titleTa: 'நிலக்கடலை டிக்கா இலைப்புள்ளி நோய் கட்டுப்பாடு',
    contentEn: 'Circular dark brown leaf spots surrounded by a yellow halo indicate Tikka leaf spot. Spray Mancozeb 75% WP @ 400 g/acre or Carbendazim 12% + Mancozeb 63% WP (Saaf) @ 250 g/acre in 200 L water at early symptom onset.',
    contentTa: 'இலைகளில் மஞ்சள் நிற வளையத்துடன் கூடிய அடர் பழுப்பு நிற வட்டப் புள்ளிகள் டிக்கா இலைப்புள்ளி நோயின் அறிகுறி. கார்பென்டசிம் + மான்கோசெப் (Saaf) 250 கிராம்/ஏக்கர் அல்லது மான்கோசெப் 75% WP 400 கிராம்/ஏக்கர் 200 லிட்டர் தண்ணீரில் கலந்து தெளிக்கவும்.',
    keywords: ['tikka', 'leaf spot', 'groundnut', 'mancozeb', 'carbendazim', 'டிக்கா', 'இலைப்புள்ளி', 'நிலக்கடலை'],
    sourceCitation: {
      sourceId: 'TNAU-OIL-2024-GND-7.2',
      title: 'TNAU Integrated Disease Management in Oilseeds',
      section: 'Section 7.2 Foliar Fungal Diseases of Groundnut',
      provenance: 'Public source'
    },
    safetyRules: {
      approvedChemicals: ['Carbendazim 12% + Mancozeb 63% WP', 'Tebuconazole 25.9% EC'],
      maxDosagePerAcre: '300 g Saaf, 200 ml Tebuconazole'
    }
  },

  // COTTON: Bollworm & Sucking Pests
  {
    chunkId: 'TNAU-COT-PEST-007',
    crop: 'Cotton',
    growthStage: 'Flowering',
    category: 'pest_control',
    title: 'Cotton Sucking Pests and Bollworm Management',
    titleTa: 'பருத்தியில் சாறு உறிஞ்சும் பூச்சிகள் மற்றும் காய் புழு மேலாண்மை',
    contentEn: 'For whitefly and jassids, install yellow sticky traps (10/acre) and spray Flonicamid 50% WG @ 60 g/acre. For American bollworm, spray Emamectin Benzoate 5% SG @ 88 g/acre or Chlorantraniliprole 18.5% SC @ 60 ml/acre.',
    contentTa: 'சாறு உறிஞ்சும் பூச்சிகளுக்கு மஞ்சள் வண்ண ஒட்டும் பொறிகள் (10/ஏக்கர்) வைக்கவும். தேவைப்பட்டால் புளோனிகமிட் 50% WG மருந்தை ஏக்கருக்கு 60 கிராம் தெளிக்கவும். காய் புழுக்களுக்கு எமாமெக்டின் பென்சோயேட் 5% SG மருந்தை 88 கிராம்/ஏக்கர் தெளிக்கவும்.',
    keywords: ['cotton', 'bollworm', 'whitefly', 'flonicamid', 'emamectin', 'பருத்தி', 'காய்ப்புழு', 'சாறு உறிஞ்சும் பூச்சி'],
    sourceCitation: {
      sourceId: 'TNAU-COT-2024-SEC-6.1',
      title: 'TNAU Commercial Crops Guide - Cotton',
      section: 'Section 6.1 Integrated Pest Management in Cotton',
      provenance: 'Public source'
    },
    safetyRules: {
      approvedChemicals: ['Flonicamid 50% WG', 'Emamectin Benzoate 5% SG', 'Chlorantraniliprole 18.5% SC'],
      maxDosagePerAcre: '70 g Flonicamid, 100 g Emamectin Benzoate',
      prohibitedChemicals: ['Monocrotophos', 'Dimethoate at bloom']
    }
  },

  // COCONUT: Adult Palm Nutrition & Rhinoceros Beetle
  {
    chunkId: 'ICAR-COC-MGT-008',
    crop: 'Coconut',
    growthStage: 'Maturity',
    category: 'fertilizer',
    title: 'Adult Coconut Palm Balanced Nutrient Application',
    titleTa: 'தென்னை மரங்களுக்கு சரிவிகித உர மேலாண்மை',
    contentEn: 'For bearing adult palms (above 5 years), apply Urea 1.3 kg, Single Super Phosphate 2.0 kg, Muriate of Potash 2.0 kg, and Neem cake 5 kg per palm per year in two equal splits (May-June and September-October) in a 1.8 m circular basin.',
    contentTa: '5 வயதுக்கு மேற்பட்ட காய்க்கும் தென்னை மரங்களுக்கு மரம் ஒன்றுக்கு ஆண்டுக்கு 1.3 கிலோ யூரியா, 2 கிலோ சூப்பர் பாஸ்பேட், 2 கிலோ பொட்டாஷ் மற்றும் 5 கிலோ வேப்பம்பிண்ணாக்கை மே-ஜூன் மற்றும் செப்டம்பர்-அக்டோபர் என இரு தவணைகளாக 1.8 மீட்டர் வட்டப்பாத்தியில் இடவும்.',
    keywords: ['coconut', 'palm', 'urea', 'potash', 'manure', 'தென்னை', 'உரமிடல்', 'பொட்டாஷ்'],
    sourceCitation: {
      sourceId: 'ICAR-CPCRI-COCO-2023-CH5',
      title: 'ICAR-CPCRI Coconut Production Manual',
      section: 'Chapter 5 Nutrient Management for Adult Palms',
      provenance: 'Public source'
    }
  },

  // GOVERNMENT SCHEMES: Micro-Irrigation & Tamil Nadu Subsidies
  {
    chunkId: 'GOV-TN-SCHEME-009',
    crop: 'General',
    growthStage: 'All',
    category: 'scheme',
    title: 'Tamil Nadu Micro-Irrigation Scheme (PMKSY) Subsidies',
    titleTa: 'தமிழ்நாடு நுண்நீர்ப்பாசனத் திட்டம் (PMKSY) மானிய விவரங்கள்',
    contentEn: 'Under the Pradhan Mantri Krishi Sinchayee Yojana (PMKSY), small and marginal farmers (< 5 acres) in Tamil Nadu are eligible for 100% subsidy on drip and sprinkler irrigation installations. Other farmers receive 75% subsidy through the Horticulture & Agriculture Departments.',
    contentTa: 'பிரதான் மந்திரி கிரிஷி சிஞ்சாயி யோஜனா (PMKSY) திட்டத்தின் கீழ் சிறு மற்றும் குறு விவசாயிகளுக்கு (5 ஏக்கருக்குள்) சொட்டு நீர் மற்றும் தெளிப்பு நீர் பாசனம் அமைக்க 100% அரசு மானியம் வழங்கப்படுகிறது. மற்ற விவசாயிகளுக்கு 75% மானியம் வழங்கப்படுகிறது.',
    keywords: ['subsidy', 'drip', 'sprinkler', 'micro irrigation', 'pmksy', 'scheme', 'மானியம்', 'சொட்டு நீர் பாசனம்', 'திட்டம்', 'சொட்டு', 'நீர்', 'பாசனம்', 'பாசனத்திற்கு'],
    sourceCitation: {
      sourceId: 'GOV-TN-AGRI-SCHEMES-2024',
      title: 'Government of Tamil Nadu Department of Agriculture Guidelines',
      section: 'Micro Irrigation Subsidy Operational Guidelines 2024-25',
      provenance: 'Public source'
    }
  },

  // WEATHER ACTIONS: Heavy Rainfall & Drainage
  {
    chunkId: 'TNAU-WTH-ACT-010',
    crop: 'General',
    growthStage: 'All',
    category: 'weather_action',
    title: 'Pre-Monsoon and Heavy Rainfall Field Contingency Actions',
    titleTa: 'கனமழை முன்னெச்சரிக்கை மற்றும் வடிகால் மேலாண்மை',
    contentEn: 'If rainfall exceeds 30 mm within 24-48 hours, immediately clear drainage channels to prevent water stagnation in pulses, groundnut, and cotton. Suspend all pesticide foliar spraying and top-dress urea applications until weather clears.',
    contentTa: '24-48 மணி நேரத்திற்குள் 30 மி.மீ-க்கு மேல் கனமழை பெய்ய வாய்ப்பிருந்தால், நிலக்கடலை, பருத்தி போன்ற பயிர்களில் நீர் தேங்காமல் இருக்க உடனே வடிகால்களைச் சீரமைக்கவும். பூச்சிக்கொல்லி மருந்து தெளிப்பதையும் மேலுரமிடுவதையும் தற்காலிகமாக நிறுத்தி வைக்கவும்.',
    keywords: ['rain', 'drainage', 'monsoon', 'contingency', 'weather action', 'spray', 'spraying', 'medicine', 'மருந்து', 'மழை', 'வடிகால்', 'முன்னெச்சரிக்கை', 'தெளிக்க'],
    sourceCitation: {
      sourceId: 'TNAU-ACRC-2024-AGROMET',
      title: 'TNAU Agro Climate Research Centre Bulletins',
      section: 'Advisory Bulletin on Extreme Weather Events',
      provenance: 'Public source'
    }
  }
];
