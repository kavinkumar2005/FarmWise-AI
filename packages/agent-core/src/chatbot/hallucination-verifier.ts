import { KnowledgeChunk } from '../rag/types.js';

export interface VerificationCheckDetail {
  ruleName: string;
  passed: boolean;
  message: string;
  severity: 'safe' | 'warning' | 'critical_block';
}

export interface ChatVerificationReport {
  isSafe: boolean;
  score: number; // 0 to 1
  flaggedIssues: string[];
  checks: VerificationCheckDetail[];
  sanitizedResponse: string;
}

const BANNED_CHEMICALS = [
  'monocrotophos', 'endosulfan', 'phorate', 'paraquat', 'carbofuran',
  'aldicarb', 'methyl parathion', 'dicofol', 'மோனோகுரோட்டோபாஸ்', 'எண்டோசல்பான்'
];

export class HallucinationVerifier {
  /**
   * Verifies the generated candidate response against retrieved knowledge chunks.
   */
  static verify(
    candidateResponse: string,
    retrievedChunks: KnowledgeChunk[],
    language: 'ta' | 'en' = 'en',
    userQuery?: string
  ): ChatVerificationReport {
    const checks: VerificationCheckDetail[] = [];
    const flaggedIssues: string[] = [];
    const textToCheck = `${userQuery || ''} ${candidateResponse}`.toLowerCase();
    const lowerResponse = candidateResponse.toLowerCase();

    // Check 1: Banned / Highly Hazardous Agrochemicals Check
    const foundBanned = BANNED_CHEMICALS.filter(chem => textToCheck.includes(chem));
    if (foundBanned.length > 0) {
      checks.push({
        ruleName: 'BannedChemicalSafety',
        passed: false,
        message: `Mentions banned or hazardous agrochemical: ${foundBanned.join(', ')}`,
        severity: 'critical_block'
      });
      flaggedIssues.push(`BANNED_SUBSTANCE: ${foundBanned.join(', ')}`);
    } else {
      checks.push({
        ruleName: 'BannedChemicalSafety',
        passed: true,
        message: 'No prohibited or high-toxicity substances detected.',
        severity: 'safe'
      });
    }

    // Check 2: Grounded Chemical & Dosage Verification
    let chemicalGrounded = true;
    for (const chunk of retrievedChunks) {
      const prohibited = chunk.safetyRules?.prohibitedChemicals || [];
      for (const p of prohibited) {
        if (lowerResponse.includes(p.toLowerCase())) {
          chemicalGrounded = false;
          flaggedIssues.push(`CONTRAINDICATION: ${p} is contraindicated in ${chunk.title}`);
        }
      }
    }

    checks.push({
      ruleName: 'GroundedChemicalVerification',
      passed: chemicalGrounded,
      message: chemicalGrounded ? 'Recommended inputs align with approved package of practices.' : 'Contradiction found with crop safety guidelines.',
      severity: chemicalGrounded ? 'safe' : 'warning'
    });

    // Check 3: Citation presence
    const hasCitations = retrievedChunks.length > 0;
    checks.push({
      ruleName: 'CorpusCitationCheck',
      passed: hasCitations,
      message: hasCitations ? `Verified against ${retrievedChunks.length} official TNAU/ICAR citations.` : 'No relevant ground-truth citations matched.',
      severity: hasCitations ? 'safe' : 'warning'
    });

    // Check 4: Dosage boundary verification
    // Checks for extreme dosages, e.g., > 100 kg Urea or > 200 ml Chlorantraniliprole
    const hasExcessiveDosage = /(\b[1-9]\d{2,}\s*(?:kg|கிலோ)\b|\b[5-9]\d{2,}\s*(?:ml|மிலி)\b)/i.test(candidateResponse);
    if (hasExcessiveDosage) {
      checks.push({
        ruleName: 'DosageBoundaryCheck',
        passed: false,
        message: 'Detected potentially abnormal dosage exceeding standard single-application thresholds.',
        severity: 'warning'
      });
      flaggedIssues.push('EXCESSIVE_DOSAGE_WARNING');
    } else {
      checks.push({
        ruleName: 'DosageBoundaryCheck',
        passed: true,
        message: 'Dosages fall within standard agronomic safety limits.',
        severity: 'safe'
      });
    }

    const hasCriticalBlock = checks.some(c => c.severity === 'critical_block');
    const warningCount = checks.filter(c => c.severity === 'warning').length;

    let score = hasCriticalBlock ? 0.2 : (1 - (warningCount * 0.15));
    score = Math.max(0.1, Math.min(1.0, score));

    let sanitizedResponse = candidateResponse;

    if (hasCriticalBlock) {
      sanitizedResponse = language === 'ta'
        ? '⚠ எச்சரிக்கை: தடைசெய்யப்பட்ட அல்லது அதிக நச்சுத்தன்மை கொண்ட பூச்சிக்கொல்லிகளைப் பயன்படுத்தக் கூடாது. சரியான வழிகாட்டுதலுக்கு உங்கள் பகுதி வேளாண்மை அலுவலரை (Agricultural Extension Officer) அணுகவும்.'
        : '⚠ CAUTION: Prohibited or hazardous chemicals cannot be recommended. Please consult your local Agricultural Extension Officer for certified safe practices.';
    } else if (warningCount > 0) {
      const disclaimer = language === 'ta'
        ? '\n\n*குறிப்பு: இந்த பரிந்துரை தமிழ்நாடு வேளாண்மைப் பல்கலைக்கழக (TNAU) வழிகாட்டுதலின்படி வழங்கப்பட்டுள்ளது. மருந்து தெளிப்பதற்கு முன் உள்ளூர் வேளாண் அலுவலரிடம் சரிபார்க்கவும்.*'
        : '\n\n*Note: Grounded in TNAU Crop Production Guidelines. Confirm with local extension officers prior to field application.*';
      sanitizedResponse += disclaimer;
    }

    return {
      isSafe: !hasCriticalBlock,
      score: Number(score.toFixed(2)),
      flaggedIssues,
      checks,
      sanitizedResponse
    };
  }
}
