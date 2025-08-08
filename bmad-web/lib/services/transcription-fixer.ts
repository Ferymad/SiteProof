import openai, { GPT_CONFIG } from '../openai';

/**
 * Irish Construction Transcription Fixer
 * Applies domain-specific corrections to transcriptions
 */

// Pattern-based corrections for common transcription errors
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
 * Apply pattern-based fixes to transcription
 */
export function applyPatternFixes(text: string): string {
  let fixed = text;
  
  // Apply all pattern categories
  Object.values(IRISH_CONSTRUCTION_PATTERNS).forEach(patterns => {
    patterns.forEach(({ pattern, replacement }) => {
      if (typeof replacement === 'string') {
        fixed = fixed.replace(pattern, replacement);
      } else {
        fixed = fixed.replace(pattern, replacement as any);
      }
    });
  });
  
  return fixed;
}

/**
 * Use GPT-4 to validate and fix remaining context-dependent errors
 */
export async function validateWithGPT4(
  transcription: string,
  confidence?: number
): Promise<{
  corrected: string;
  changes: string[];
  confidence: number;
}> {
  console.log('🤖 GPT-4 validation input:', {
    inputText: transcription.substring(0, 200) + '...',
    inputLength: transcription.length,
    confidence
  });
  
  const prompt = `Fix this Irish construction site transcription. Apply these rules:

CRITICAL RULES:
1. Currency is ALWAYS euros (€), NEVER pounds (£) - Ireland uses euros
2. Concrete grades: C25/30, C30/37, C20/25 (forward slash format)
3. Times: Convert "at 30" to "at 8:30" if context suggests morning delivery
4. Block strength: "7N" not "7 end" or "seven end"
5. Common Irish construction terms: "crack on", "safe working", "lads"
6. Measurements: metres, tonnes, millimetres (not yards/feet)

TRANSCRIPTION:
${transcription}

Return a JSON object with:
{
  "corrected": "the fixed transcription",
  "changes": ["list of changes made"],
  "confidence": 0-100 score
}

Fix ONLY clear errors. Preserve Irish colloquialisms and natural speech patterns.`;

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
    
    console.log('🤖 GPT-4 validation output:', {
      correctedText: result.corrected?.substring(0, 200) + '...' || 'NO CORRECTION',
      changes: result.changes || [],
      confidence: result.confidence,
      outputLength: result.corrected?.length || 0
    });
    
    return {
      corrected: result.corrected || transcription,
      changes: result.changes || [],
      confidence: result.confidence || confidence || 70
    };
  } catch (error) {
    console.error('GPT-4 validation failed:', error);
    // Return pattern-fixed version as fallback
    return {
      corrected: transcription,
      changes: [],
      confidence: confidence || 60
    };
  }
}

/**
 * Main transcription fixing pipeline
 */
export async function fixTranscription(
  rawTranscription: string,
  options: {
    useGPT4?: boolean;
    initialConfidence?: number;
  } = {}
): Promise<{
  original: string;
  fixed: string;
  confidence: number;
  changes: string[];
}> {
  const { useGPT4 = true, initialConfidence = 70 } = options;
  
  // Step 1: Apply pattern-based fixes
  const patternFixed = applyPatternFixes(rawTranscription);
  
  // Track changes from patterns
  const patternChanges: string[] = [];
  if (patternFixed !== rawTranscription) {
    patternChanges.push('Applied pattern-based corrections');
  }
  
  // Step 2: GPT-4 validation if enabled and confidence is low
  if (useGPT4 && (initialConfidence < 85 || patternFixed.includes('£') || patternFixed.includes('pound'))) {
    const gptResult = await validateWithGPT4(patternFixed, initialConfidence);
    
    return {
      original: rawTranscription,
      fixed: gptResult.corrected,
      confidence: gptResult.confidence,
      changes: [...patternChanges, ...gptResult.changes]
    };
  }
  
  // Return pattern-fixed version
  return {
    original: rawTranscription,
    fixed: patternFixed,
    confidence: initialConfidence,
    changes: patternChanges
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