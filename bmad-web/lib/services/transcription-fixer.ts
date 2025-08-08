import openai, { GPT_CONFIG } from '../openai';

/**
 * Story 1A.2.1: Enhanced Irish Construction Transcription Fixer
 * Applies domain-specific corrections with critical error detection
 * Includes hallucination guards and business-critical pattern detection
 */

// Critical error patterns that force manual review (Story 1A.2.1)
export const CRITICAL_ERROR_PATTERNS = {
  // Currency errors - Critical business risk
  currency: [
    { pattern: /£(\d)/g, replacement: '€$1', critical: true, reason: 'Currency error: Ireland uses euros, not pounds' },
    { pattern: /\bpounds?\b/gi, replacement: 'euros', critical: true, reason: 'Currency terminology error' },
    { pattern: /\bpound\b/gi, replacement: 'euro', critical: true, reason: 'Currency terminology error' },
    { pattern: /\bquid\b/gi, replacement: 'euro', critical: true, reason: 'Slang currency term error' },
    { pattern: /\bsterling\b/gi, replacement: 'euro', critical: true, reason: 'Wrong currency system' },
  ],
  
  // Time format errors - High business risk
  timeErrors: [
    { pattern: /\bat 30(?!\d)/gi, replacement: 'at 8:30', critical: true, reason: 'Ambiguous time format - likely morning delivery' },
    { pattern: /\bat (\d{1,2})(?!\d|:|\s*(am|pm|hours?|minutes?|cubic|tonnes?|bags?))/gi, 
      replacement: (match: string, num: string) => {
        const n = parseInt(num);
        if (n >= 6 && n <= 20) return `at ${num}:30`;
        return match;
      },
      critical: true, reason: 'Ambiguous time reference'
    },
  ],
  
  // Suspicious amounts - Force review for high values
  suspiciousAmounts: [
    { pattern: /€\d{4,}/g, critical: true, reason: 'High monetary value requires verification' },
    { pattern: /\b\d{4,}\s*euros?\b/gi, critical: true, reason: 'Large euro amount needs review' },
  ],
  
  // Common hallucination patterns
  hallucinations: [
    { pattern: /\bsafe farming\b/gi, replacement: 'safe working', critical: true, reason: 'Common Whisper hallucination pattern' },
    { pattern: /\btele porter\b/gi, replacement: 'teleporter', critical: false, reason: 'Equipment name error' },
    { pattern: /\b7\s*end\b/gi, replacement: '7N', critical: false, reason: 'Block strength notation error' },
  ]
};

// Standard pattern-based corrections for common transcription errors
export const IRISH_CONSTRUCTION_PATTERNS = {
  // Currency corrections - Ireland uses euros
  currency: [
    { pattern: /£(\d)/g, replacement: '€$1' },
    { pattern: /\bpounds?\b/gi, replacement: 'euros' },
    { pattern: /\bpound\b/gi, replacement: 'euro' },
    { pattern: /\bquid\b/gi, replacement: 'euro' },
    { pattern: /\bsterling\b/gi, replacement: 'euro' },
  ],
  
  // Concrete grade formatting (C25/30, not C2530 or C25-30)
  concreteGrades: [
    { pattern: /\bc(\d{2})(\d{2})\b/gi, replacement: 'C$1/$2' },
    { pattern: /\bc(\d{2})-(\d{2})\b/gi, replacement: 'C$1/$2' },
    { pattern: /\bc(\d{2})\s*slash\s*(\d{2})\b/gi, replacement: 'C$1/$2' }, // Fix "C25 slash 30"
    { pattern: /\bc\s*(\d{2})\s*\/?\s*(\d{2})\b/gi, replacement: 'C$1/$2' },
  ],
  
  // Time corrections (context-aware)
  times: [
    { pattern: /\bat 30(?!\d)/gi, replacement: 'at 8:30' }, // Common morning delivery time
    { pattern: /\bat (\d{1,2})(?!\d|:|\s*(am|pm|hours?|minutes?|cubic|tonnes?|bags?))/gi, 
      replacement: (match: string, num: string) => {
        const n = parseInt(num);
        // Likely time references for construction site
        if (n >= 6 && n <= 20) {
          return `at ${num}:30`; // Common half-hour starts
        }
        return match; // Keep as is if unclear
      }
    },
    { pattern: /\bhalf (\d{1,2})\b/gi, replacement: '$1:30' },
    { pattern: /\bquarter past (\d{1,2})\b/gi, replacement: '$1:15' },
    { pattern: /\bquarter to (\d{1,2})\b/gi, replacement: (m: string, h: string) => `${parseInt(h)-1}:45` },
  ],
  
  // Common misheard construction terms
  constructionTerms: [
    { pattern: /\bsafe farming\b/gi, replacement: 'safe working' },
    { pattern: /\bcrack and\b/gi, replacement: 'crack on' },
    { pattern: /\b7\s*end\b/gi, replacement: '7N' }, // Concrete block strength
    { pattern: /\b7\s*n\b/gi, replacement: '7N' }, // Normalize format
    { pattern: /\btele porter\b/gi, replacement: 'teleporter' },
    { pattern: /\bJC[PB]\b/gi, replacement: 'JCB' },
    { pattern: /\bready mixed?\b/gi, replacement: 'ready-mix' },
    { pattern: /\brebar\b/gi, replacement: 'rebar' }, // Normalize casing
    { pattern: /\bshutter ring\b/gi, replacement: 'shuttering' },
    { pattern: /\bform work\b/gi, replacement: 'formwork' },
  ],
  
  // Material measurements
  measurements: [
    { pattern: /(\d+)\s*mil\b/gi, replacement: '$1mm' }, // millimetres
    { pattern: /(\d+)\s*meter\b/gi, replacement: '$1 metre' },
    { pattern: /(\d+)\s*meters\b/gi, replacement: '$1 metres' },
    { pattern: /\bcubic meters?\b/gi, replacement: 'cubic metres' },
  ],
};

/**
 * Apply pattern-based fixes to transcription with critical error detection
 * Story 1A.2.1: Enhanced with hallucination guards and critical pattern detection
 */
export function applyPatternFixes(text: string): {
  fixed: string;
  criticalErrors: string[];
  standardFixes: string[];
  hallucinationDetected: boolean;
} {
  let fixed = text;
  const criticalErrors: string[] = [];
  const standardFixes: string[] = [];
  let hallucinationDetected = false;
  
  // First, detect and fix critical error patterns
  Object.entries(CRITICAL_ERROR_PATTERNS).forEach(([category, patterns]) => {
    patterns.forEach(({ pattern, replacement, critical, reason }) => {
      const matches = fixed.match(pattern);
      if (matches) {
        if (critical) {
          criticalErrors.push(`${reason}: ${matches.join(', ')}`);
          if (category === 'hallucinations') {
            hallucinationDetected = true;
          }
        }
        
        // Apply the fix
        if (typeof replacement === 'string') {
          fixed = fixed.replace(pattern, replacement);
        } else {
          fixed = fixed.replace(pattern, replacement as any);
        }
      }
    });
  });
  
  // Then apply standard pattern fixes
  Object.values(IRISH_CONSTRUCTION_PATTERNS).forEach(patterns => {
    patterns.forEach(({ pattern, replacement }) => {
      const originalFixed = fixed;
      if (typeof replacement === 'string') {
        fixed = fixed.replace(pattern, replacement);
      } else {
        fixed = fixed.replace(pattern, replacement as any);
      }
      
      if (fixed !== originalFixed) {
        standardFixes.push('Applied standard construction terminology fixes');
      }
    });
  });
  
  return {
    fixed,
    criticalErrors,
    standardFixes,
    hallucinationDetected
  };
}

/**
 * Story 1A.2.1: Enhanced GPT-4 validation with hallucination guards
 * Includes token expansion detection and critical error validation
 */
export async function validateWithGPT4(
  transcription: string,
  confidence?: number,
  options?: {
    checkHallucination?: boolean;
    maxTokenExpansion?: number;
  }
): Promise<{
  corrected: string;
  changes: string[];
  confidence: number;
  hallucinationRisk: boolean;
  tokenExpansion: number;
}> {
  const { checkHallucination = true, maxTokenExpansion = 15 } = options || {};
  console.log('🤖 GPT-4 validation input:', {
    inputText: transcription.substring(0, 200) + '...',
    inputLength: transcription.length,
    confidence
  });
  
  const prompt = `Fix this Irish construction site transcription with STRICT hallucination detection. Apply these rules:

CRITICAL RULES (Story 1A.2.1):
1. Currency is ALWAYS euros (€), NEVER pounds (£) - Ireland uses euros
2. Concrete grades: C25/30, C30/37, C20/25 (forward slash format)
3. Times: Convert "at 30" to "at 8:30" if context suggests morning delivery
4. Block strength: "7N" not "7 end" or "seven end"
5. Common Irish construction terms: "crack on", "safe working", "lads"
6. Measurements: metres, tonnes, millimetres (not yards/feet)
7. DETECT HALLUCINATIONS: "safe farming", "tele porter", repetitive patterns
8. REJECT if output is >15% longer than input (token expansion)

TRANSCRIPTION:
${transcription}

Return a JSON object with:
{
  "corrected": "the fixed transcription",
  "changes": ["list of changes made"],
  "confidence": 0-100 score,
  "hallucination_detected": false,
  "token_expansion_percent": 0
}

Fix ONLY clear errors. Preserve Irish colloquialisms and natural speech patterns.
IF you detect hallucination patterns, set hallucination_detected to true.
IF the corrected text is significantly longer than input, indicate token expansion.`;

  try {
    const response = await openai.chat.completions.create({
      model: GPT_CONFIG.model,
      temperature: 0.1, // Very low for consistency
      messages: [
        {
          role: 'system',
          content: 'You are an expert in Irish construction terminology and site communications.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Calculate token expansion percentage
    const originalLength = transcription.length;
    const correctedLength = (result.corrected || transcription).length;
    const tokenExpansion = ((correctedLength - originalLength) / originalLength) * 100;
    
    // Hallucination guard: reject if token expansion exceeds threshold
    const hallucinationRisk = result.hallucination_detected || tokenExpansion > maxTokenExpansion;
    
    console.log('🤖 GPT-4 validation output:', {
      correctedText: result.corrected?.substring(0, 200) + '...' || 'NO CORRECTION',
      changes: result.changes || [],
      confidence: result.confidence,
      outputLength: correctedLength,
      tokenExpansion: tokenExpansion.toFixed(1) + '%',
      hallucinationRisk
    });
    
    // If hallucination detected, return original with warning
    if (hallucinationRisk && checkHallucination) {
      console.warn('🚨 Hallucination detected - returning original transcription');
      return {
        corrected: transcription,
        changes: ['WARNING: Potential hallucination detected - no changes applied'],
        confidence: Math.max(30, (confidence || 70) - 20),
        hallucinationRisk: true,
        tokenExpansion
      };
    }
    
    return {
      corrected: result.corrected || transcription,
      changes: result.changes || [],
      confidence: result.confidence || confidence || 70,
      hallucinationRisk,
      tokenExpansion
    };
  } catch (error) {
    console.error('GPT-4 validation failed:', error);
    // Return pattern-fixed version as fallback
    return {
      corrected: transcription,
      changes: [],
      confidence: confidence || 60,
      hallucinationRisk: false,
      tokenExpansion: 0
    };
  }
}

/**
 * Story 1A.2.1: Enhanced transcription fixing pipeline with critical error detection
 * Includes hallucination guards and business risk assessment
 */
export async function fixTranscription(
  rawTranscription: string,
  options: {
    useGPT4?: boolean;
    initialConfidence?: number;
    enableHallucinationGuards?: boolean;
    maxTokenExpansion?: number;
  } = {}
): Promise<{
  original: string;
  fixed: string;
  confidence: number;
  changes: string[];
  criticalErrors: string[];
  hallucinationDetected: boolean;
  requiresManualReview: boolean;
}> {
  const { 
    useGPT4 = true, 
    initialConfidence = 70, 
    enableHallucinationGuards = true,
    maxTokenExpansion = 15 
  } = options;
  
  console.log('🔧 Starting enhanced transcription fix (Story 1A.2.1):', {
    length: rawTranscription.length,
    useGPT4,
    initialConfidence,
    enableHallucinationGuards
  });
  
  // Step 1: Apply pattern-based fixes with critical error detection
  const patternResult = applyPatternFixes(rawTranscription);
  
  // Track changes from patterns
  const allChanges: string[] = [];
  if (patternResult.criticalErrors.length > 0) {
    allChanges.push(...patternResult.criticalErrors.map(e => `CRITICAL: ${e}`));
  }
  if (patternResult.standardFixes.length > 0) {
    allChanges.push(...patternResult.standardFixes);
  }
  
  let requiresManualReview = patternResult.criticalErrors.length > 0;
  let hallucinationDetected = patternResult.hallucinationDetected;
  
  // Step 2: GPT-4 validation if enabled and conditions met
  const shouldUseGPT4 = useGPT4 && (
    initialConfidence < 85 || 
    patternResult.fixed.includes('£') || 
    patternResult.fixed.includes('pound') ||
    patternResult.criticalErrors.length > 0
  );
  
  if (shouldUseGPT4) {
    console.log('🤖 Using GPT-4 validation due to critical errors or low confidence');
    
    const gptResult = await validateWithGPT4(
      patternResult.fixed, 
      initialConfidence,
      { 
        checkHallucination: enableHallucinationGuards, 
        maxTokenExpansion 
      }
    );
    
    // Update hallucination detection
    if (gptResult.hallucinationRisk) {
      hallucinationDetected = true;
      requiresManualReview = true;
      allChanges.push('WARNING: Potential hallucination detected');
    }
    
    return {
      original: rawTranscription,
      fixed: gptResult.corrected,
      confidence: gptResult.confidence,
      changes: [...allChanges, ...gptResult.changes],
      criticalErrors: patternResult.criticalErrors,
      hallucinationDetected,
      requiresManualReview
    };
  }
  
  // Return pattern-fixed version
  return {
    original: rawTranscription,
    fixed: patternResult.fixed,
    confidence: initialConfidence,
    changes: allChanges,
    criticalErrors: patternResult.criticalErrors,
    hallucinationDetected,
    requiresManualReview
  };
}

/**
 * Confidence scoring based on transcription quality indicators
 */
export function calculateConfidence(
  transcription: string,
  audioQuality?: number,
  hasCommonErrors?: boolean
): number {
  let confidence = audioQuality || 75;
  
  // Boost confidence if critical terms are correct
  if (transcription.includes('€') && !transcription.includes('£')) confidence += 5;
  if (/C\d{2}\/\d{2}/.test(transcription)) confidence += 5;
  if (transcription.includes('7N')) confidence += 3;
  
  // Reduce confidence for suspicious patterns
  if (transcription.includes('£') || transcription.includes('pound')) confidence -= 15;
  if (/\bat \d{1,2}\b/.test(transcription)) confidence -= 5; // Ambiguous time
  if (transcription.includes('safe farming')) confidence -= 10;
  
  // Reduce if common errors detected
  if (hasCommonErrors) confidence -= 10;
  
  // Clamp between 0-100
  return Math.max(0, Math.min(100, confidence));
}

/**
 * Test the fixer with the Ballymun example
 */
export async function testBallymunTranscription(): Promise<void> {
  const ballymunOriginal = `Morning lads, quick update from the Ballymun site. Concrete delivery arrived today at 30. 45 cubic metres of C25-30 ready mix. Cost came to £2,850 including delivery. Driver said they'll need the pump truck positioned by 10am for the foundation pour. Steel fixers finished the rebar installation yesterday evening. Used 3.2 tonnes of 12mm and 16mm reinforcement bar. Everything's looking good for today's pour. Weather forecast shows rain starting around 2pm. So we need to get this done before then. Foundation cover 180 square metres. Should take about 4 hours to complete. Safe to check this morning. Found one issue. Temporary edge protection on the north side needs reinforcing before we start. Jimmy's sorting that now. Materials for next week. 200 concrete blocks, 7N. 15 bags of cement. 50 tonnes sand and aggregate waterproofing membrane for the basement. Structural engineer is coming Friday morning to inspect before we move to the next phase. All going well. We'll have the ground floor slab ready by the end of the month. Let me know if you need anything else. Weather permitting, this should be a good day for the pour. JP McCarty. Safe farming.`;
  
  console.log('Testing Ballymun transcription fix...\n');
  console.log('ORIGINAL:', ballymunOriginal.substring(0, 100) + '...\n');
  
  const result = await fixTranscription(ballymunOriginal, { useGPT4: true });
  
  console.log('FIXED:', result.fixed.substring(0, 100) + '...\n');
  console.log('CONFIDENCE:', result.confidence + '%');
  console.log('CHANGES:', result.changes);
  
  // Check critical fixes
  const criticalChecks = {
    'Currency (€ not £)': result.fixed.includes('€2,850') && !result.fixed.includes('£'),
    'Time (8:30 not 30)': result.fixed.includes('8:30') || result.fixed.includes('08:30'),
    'Concrete grade (C25/30)': result.fixed.includes('C25/30'),
    'Block strength (7N)': result.fixed.includes('7N'),
    'Safe working (not farming)': result.fixed.includes('safe working') && !result.fixed.includes('safe farming')
  };
  
  console.log('\nCRITICAL CHECKS:');
  Object.entries(criticalChecks).forEach(([check, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${check}`);
  });
}