import { PresetScenario } from '../types/ui.js';

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'paddy-sanganaperi',
    titleEn: '🌾 Paddy Leaf Folder & Spray Advisory',
    titleTa: '🌾 நெல் இலை சுருட்டு புழு & மருந்து தெளிப்பு',
    badge: 'Survey 202/55 (Tenkasi)',
    descriptionEn: 'Field diagnosis of paddy tillering stage with rice leaf folder, safe spray window, and fertilizer schedule.',
    descriptionTa: 'சங்கனாபேரி புல எண் 202/55 நெல் பயிர் ஆய்வு, இலை சுருட்டு புழு மேலாண்மை மற்றும் வானிலை ஆலோசனை.',
    request: {
      requestId: 'REQ-PRESET-01',
      farmerName: 'R. Krishnan',
      rawQuery: 'What crop is planted in Survey Number 202/55 in Sanganaperi village? Identify the parcel and owner, retrieve the field photograph, predict crop and growth stage, and recommend fertilizer and spray window.',
      language: 'ta',
      district: 'Tenkasi',
      taluk: 'Sivagiri',
      village: 'Sanganaperi',
      surveyNumber: '202/55',
      subdivision: '55',
      coordinates: {
        latitude: 9.3512,
        longitude: 77.4819
      },
      attachments: {
        fieldPhotoUrl: 'Datasets/images/images/sample_paddy_tillering.jpg',
        soilType: 'Clay Loam'
      },
      consentGiven: true
    }
  },
  {
    id: 'groundnut-keelathattaparai',
    titleEn: '🥜 Groundnut Pod Borer & Weather Sync',
    titleTa: '🥜 நிலக்கடலை காய் துளைப்பான் & வானிலை ஆய்வு',
    badge: 'Survey 387 (Thoothukudi)',
    descriptionEn: 'Cadastral analysis for survey 387, pod borer pest recommendations, and 48-hour spray window forecast.',
    descriptionTa: 'கீழத்தட்டப்பாறை புல எண் 387 நிலக்கடலை பயிர் ஆய்வு, காய் துளைப்பான் கட்டுப்பாடு மற்றும் மழை முன்னறிவிப்பு.',
    request: {
      requestId: 'REQ-PRESET-02',
      farmerName: 'M. Subbiah',
      rawQuery: 'நிலக்கடலை பயிரில் காய் துளைப்பான் தாக்குதல் தெரிகிறது. என்ன மருந்து தெளிக்கலாம்? வானிலை பூச்சிக்கொல்லி அடிக்க சாதகமாக உள்ளதா?',
      language: 'ta',
      district: 'Thoothukudi',
      taluk: 'Thoothukudi',
      village: 'Keelathattaparai',
      surveyNumber: '387',
      coordinates: {
        latitude: 8.7915,
        longitude: 78.1342
      },
      attachments: {
        soilType: 'Red Sandy Loam'
      },
      consentGiven: true
    }
  },
  {
    id: 'boundary-sivagiri',
    titleEn: '🗺️ Cadastral Boundary & Patta Cross-Check',
    titleTa: '🗺️ நில எல்லை & பட்டா சரிபார்ப்பு',
    badge: 'Survey 174 (Sivagiri)',
    descriptionEn: 'Verification of cadastral polygon coordinates, GPS boundary containment, and land registry records.',
    descriptionTa: 'சிவகிாி புல எண் 174 நில எல்லைகள், வரைபட பரப்பளவு மற்றும் வருவாய்த்துறை ஆவணங்கள் சரிபார்ப்பு.',
    request: {
      requestId: 'REQ-PRESET-03',
      farmerName: 'K. Ramasamy',
      rawQuery: 'Check parcel boundaries and verify whether land document extent matches official cadastral map geometry for Survey 174 in Sivagiri.',
      language: 'en',
      district: 'Tenkasi',
      taluk: 'Sivagiri',
      village: 'Sivagiri',
      surveyNumber: '174',
      coordinates: {
        latitude: 9.345,
        longitude: 77.432
      },
      attachments: {
        landDocUrl: 'Datasets/documents/patta_sample_174.pdf'
      },
      consentGiven: true
    }
  },
  {
    id: 'missing-survey-clarification',
    titleEn: '❓ Missing Info (Planner Clarification Loop)',
    titleTa: '❓ விடுபட்ட தகவல் (முகமை விளக்கம் கேட்பு)',
    badge: 'Planner Clarification',
    descriptionEn: 'Demonstrates autonomous planner detecting missing survey details and asking the farmer for clarification.',
    descriptionTa: 'சர்வே எண் குறிப்பிடப்படாத கேள்விகளைத் திட்டமிடும் முகமை அடையாளம் கண்டு உழவரிடம் விளக்கம் கேட்கும் செயல்முறை.',
    request: {
      requestId: 'REQ-PRESET-04',
      farmerName: 'S. Murugan',
      rawQuery: 'My crop leaves are turning yellow, what should I spray on my field?',
      language: 'ta',
      district: '',
      taluk: '',
      village: '',
      surveyNumber: '',
      attachments: {},
      consentGiven: true
    }
  }
];
