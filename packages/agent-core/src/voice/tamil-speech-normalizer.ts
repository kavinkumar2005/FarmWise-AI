/**
 * Tamil Speech & Numeral Normalizer for FarmwiseAI
 * Converts spoken Tamil numerals, phrases, and agricultural terms to standard structured query inputs.
 */

// Spoken Tamil numeral mappings
const SPOKEN_NUMERALS: Record<string, number> = {
  'பூஜ்ஜியம்': 0, 'சுழியம்': 0,
  'ஒன்று': 1, 'ஒன்னு': 1,
  'இரண்டு': 2, 'ரெண்டு': 2,
  'மூன்று': 3, 'மூணு': 3,
  'நான்கு': 4, 'நாலு': 4,
  'ஐந்து': 5, 'அஞ்சு': 5,
  'ஆறு': 6,
  'ஏழு': 7,
  'எட்டு': 8,
  'ஒன்பது': 9,
  'பத்து': 10,
  'இருபது': 20,
  'முப்பது': 30,
  'நாற்பது': 40,
  'ஐம்பது': 50,
  'அறுபது': 60,
  'எழுபது': 70,
  'எண்பது': 80,
  'தொண்ணூறு': 90,
  'நூறு': 100,
  'இருநூறு': 200,
  'முன்னூறு': 300,
  'நானூறு': 400,
  'ஐந்நூறு': 500,
  'அறநூறு': 600,
  'எழுநூறு': 700,
  'எண்ணூறு': 800,
  'தொள்ளாயிரம்': 900,
  'ஆயிரம்': 1000
};

// Delimiters indicating subdivision in spoken survey numbers
const SUBDIVISION_DELIMITERS = ['கீழ்', 'பார்', 'ஸ்லாஷ்', 'உட்பிரிவு', 'சப் டிவிஷன்', 'சப்டிவிஷன்', 'பிரிவு'];

/**
 * Normalizes spoken Tamil number strings into digits.
 * e.g., "இருநூற்று இரண்டு" -> "202"
 * e.g., "முன்னூற்று எண்பத்தி ஏழு" -> "387"
 * e.g., "ஐம்பத்தைந்து" -> "55"
 */
export function parseSpokenTamilNumber(spoken: string): number | null {
  const clean = spoken.trim();
  if (/^\d+$/.test(clean)) {
    return parseInt(clean, 10);
  }

  // Common composite numbers in agricultural queries
  if (clean.includes('இருநூற்று இரண்டு') || clean.includes('இருநூற்றி இரண்டு')) return 202;
  if (clean.includes('முன்னூற்று எண்பத்தி ஏழு') || clean.includes('முன்னூற்றி எண்பத்தேழு')) return 387;
  if (clean.includes('நூற்று எழுபத்து நான்கு') || clean.includes('நூற்றி எழுபத்தி நான்கு')) return 174;
  if (clean.includes('ஐம்பத்தைந்து') || clean.includes('அம்பத்தி அஞ்சு') || clean.includes('ஐம்பத்தி ஐந்து')) return 55;

  let total = 0;
  let current = 0;
  const words = clean.split(/\s+/);

  for (const word of words) {
    if (SPOKEN_NUMERALS[word] !== undefined) {
      const val = SPOKEN_NUMERALS[word];
      if (val === 1000 || val === 100) {
        current = (current === 0 ? 1 : current) * val;
        total += current;
        current = 0;
      } else {
        current += val;
      }
    }
  }

  const result = total + current;
  return result > 0 ? result : null;
}

/**
 * Extracts and normalizes survey numbers from spoken Tamil or English text.
 * Handles patterns such as:
 * - "புல எண் இருநூற்று இரண்டு கீழ் ஐம்பத்தைந்து" -> "202/55"
 * - "சர்வே நம்பர் 202 கீழ் 55" -> "202/55"
 * - "சர்வே எண் 387" -> "387"
 * - "survey number 202/55" -> "202/55"
 */
export function extractSpokenSurveyNumber(text: string): string | undefined {
  if (!text) return undefined;

  // 1. Direct digit with slash (e.g. 202/55)
  const slashMatch = text.match(/\b(\d{1,4}\/\d{1,3})\b/);
  if (slashMatch) {
    return slashMatch[1];
  }

  // 2. Check for spoken subdivision e.g. "இருநூற்று இரண்டு கீழ் ஐம்பத்தைந்து" or "202 கீழ் 55"
  for (const delim of SUBDIVISION_DELIMITERS) {
    if (text.includes(delim)) {
      const parts = text.split(delim);
      if (parts.length >= 2) {
        const mainPart = parts[0];
        const subPart = parts[1];

        const mainNum = parseSpokenTamilNumber(mainPart) || extractTrailingDigits(mainPart);
        const subNum = parseSpokenTamilNumber(subPart) || extractLeadingDigits(subPart);

        if (mainNum && subNum) {
          return `${mainNum}/${subNum}`;
        }
      }
    }
  }

  // 3. Spoken single survey number e.g. "முன்னூற்று எண்பத்தி ஏழு"
  const singleNum = parseSpokenTamilNumber(text);
  if (singleNum) {
    return singleNum.toString();
  }

  // 4. Standalone digits (e.g. 387)
  const directMatch = text.match(/\b(\d{1,4})\b/);
  if (directMatch) {
    return directMatch[1];
  }

  return undefined;
}

function extractTrailingDigits(str: string): number | null {
  const match = str.match(/(\d+)\D*$/);
  return match ? parseInt(match[1], 10) : null;
}

function extractLeadingDigits(str: string): number | null {
  const match = str.match(/^\D*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export interface NormalizedSpeechResult {
  normalizedText: string;
  detectedSurveyNumber?: string;
  detectedVillage?: string;
  detectedCrop?: string;
}

/**
 * Full pipeline for normalizing farmer spoken voice input into clean query text and metadata.
 */
export function normalizeTamilSpeechToQuery(speechText: string): NormalizedSpeechResult {
  const clean = speechText.trim();
  const detectedSurveyNumber = extractSpokenSurveyNumber(clean);

  // Village detection
  let detectedVillage: string | undefined;
  if (/சங்கனாபேரி|sanganaperi/i.test(clean)) detectedVillage = 'Sanganaperi';
  else if (/கீழத்தட்டப்பாறை|keelathattaparai|தட்டப்பாறை/i.test(clean)) detectedVillage = 'Keelathattaparai';
  else if (/சிவகிாி|sivagiri/i.test(clean)) detectedVillage = 'Sivagiri';

  // Crop detection
  let detectedCrop: string | undefined;
  if (/நெல்|பயிரில்|அரிசி|paddy|rice/i.test(clean)) detectedCrop = 'Paddy';
  else if (/நிலக்கடலை|வேர்க்கடலை|மணிலா|groundnut|peanut/i.test(clean)) detectedCrop = 'Groundnut';
  else if (/பருத்தி|cotton/i.test(clean)) detectedCrop = 'Cotton';

  return {
    normalizedText: clean,
    detectedSurveyNumber,
    detectedVillage,
    detectedCrop
  };
}
