// EMERGENCY SECURITY CHECK: Ensure this service runs server-side ONLY
if (typeof window !== 'undefined') {
  throw new Error(
    'SECURITY VIOLATION: transcription-fixer contains OpenAI dependencies and must run server-side only. ' +
    'Components should use fetch() calls to API endpoints instead of importing this service directly.'
  );
}

import openai, { GPT_CONFIG } from '../openai';

/**
 * EMERGENCY FIX: Server-Side Transcription Fixer with OpenAI Guards
 * 
 * Story 1A.2.1 Refactored: Generalizable Irish Construction Transcription Fixer
 * 
 * CRITICAL SECURITY ARCHITECTURE:
 * - This service contains OpenAI client and MUST run server-side only
 * - Components should NEVER import this service directly
 * - Use fetch() calls to /api/processing/* endpoints instead
 * - Browser execution will throw security violation error
 * 
 * Applies tiered pattern corrections with pattern effectiveness tracking
 * Reduces over-fitting to specific test cases while maintaining accuracy
 */

// Pattern effectiveness tracking interface
export interface PatternMetrics {
  pattern: string;
  timesApplied: number;
  successfulApplications: number;
  falsePositives: number;
  accuracy: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface PatternApplication {
  pattern: RegExp | ((match: string, ...groups: string[]) => string);
  replacement: string | ((match: string, ...groups: string[]) => string);
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  contextRequired?: string[];
  description: string;
}

// Tier 1: High-confidence universal patterns (always apply)
export const UNIVERSAL_PATTERNS = {
  // Currency corrections - Ireland uses euros (100% applicable across all Irish construction)
  currency: [
    { 
      pattern: /£(\d)/g, 
      replacement: '€$1', 
      confidence: 'HIGH' as const,
      description: 'Pound symbol to euro conversion' 
    },
    { 
      pattern: /\bpounds?\b/gi, 
      replacement: 'euros', 
      confidence: 'HIGH' as const,
      description: 'Pounds terminology to euros' 
    },
    { 
      pattern: /\bpound\b/gi, 
      replacement: 'euro', 
      confidence: 'HIGH' as const,
      description: 'Pound to euro conversion' 
    },
    { 
      pattern: /\bquid\b/gi, 
      replacement: 'euro', 
      confidence: 'HIGH' as const,
      description: 'British slang currency to euro' 
    },
    { 
      pattern: /\bsterling\b/gi, 
      replacement: 'euro', 
      confidence: 'HIGH' as const,
      description: 'Sterling currency system to euro' 
    },
  ],
  
  // Concrete grade formatting - Universal construction standard
  concreteGrades: [
    { 
      pattern: /\bc(\d{2})(\d{2})\b/gi, 
      replacement: 'C$1/$2', 
      confidence: 'HIGH' as const,
      description: 'Concrete grade formatting (C2530 → C25/30)' 
    },
    { 
      pattern: /\bc(\d{2})-(\d{2})\b/gi, 
      replacement: 'C$1/$2', 
      confidence: 'HIGH' as const,
      description: 'Concrete grade dash to slash format' 
    },
    { 
      pattern: /\bc(\d{2})\s*slash\s*(\d{2})\b/gi, 
      replacement: 'C$1/$2', 
      confidence: 'HIGH' as const,
      description: 'Spoken "slash" to proper concrete notation' 
    },
    { 
      pattern: /\bc\s*(\d{2})\s*\/?\s*(\d{2})\b/gi, 
      replacement: 'C$1/$2', 
      confidence: 'HIGH' as const,
      description: 'Concrete grade spacing normalization' 
    },
  ],
  
  // Material measurements - Universal metric system
  measurements: [
    { 
      pattern: /(\d+)\s*mil\b/gi, 
      replacement: '$1mm', 
      confidence: 'HIGH' as const,
      description: 'Millimetre abbreviation standardization' 
    },
    { 
      pattern: /(\d+)\s*meter\b/gi, 
      replacement: '$1 metre', 
      confidence: 'HIGH' as const,
      description: 'Singular metre spelling' 
    },
    { 
      pattern: /(\d+)\s*meters\b/gi, 
      replacement: '$1 metres', 
      confidence: 'HIGH' as const,
      description: 'Plural metres spelling' 
    },
    { 
      pattern: /\bcubic meters?\b/gi, 
      replacement: 'cubic metres', 
      confidence: 'HIGH' as const,
      description: 'Cubic metres standardization' 
    },
  ],
};

// Tier 2: Context-dependent patterns (apply with conditions)
export const CONTEXTUAL_PATTERNS = {
  // Time corrections - Only with delivery/scheduling context
  times: [
    { 
      pattern: /\bat (\d{1,2})(?!\d|:|\s*(am|pm|hours?|minutes?|cubic|tonnes?|bags?))/gi,
      replacement: (fullText: string) => (match: string, num: string) => {
        const n = parseInt(num);
        const hasDeliveryContext = /delivery|arrived|scheduled|morning|concrete|truck|driver/i.test(fullText);
        
        // Only apply if strong delivery context AND reasonable delivery time
        if (hasDeliveryContext && n >= 7 && n <= 11) {
          return `at ${num}:30`;
        }
        return match; // Keep unchanged if uncertain
      },
      confidence: 'MEDIUM' as const,
      contextRequired: ['delivery', 'scheduled', 'morning', 'truck'],
      description: 'Time format correction with delivery context'
    },
    { 
      pattern: /\bhalf (\d{1,2})\b/gi, 
      replacement: '$1:30', 
      confidence: 'MEDIUM' as const,
      description: 'Half past time conversion' 
    },
    { 
      pattern: /\bquarter past (\d{1,2})\b/gi, 
      replacement: '$1:15', 
      confidence: 'MEDIUM' as const,
      description: 'Quarter past time conversion' 
    },
  ],
  
  // Equipment and terminology - Context-sensitive
  equipment: [
    { 
      pattern: /\bJC[PB]\b/gi, 
      replacement: 'JCB', 
      confidence: 'MEDIUM' as const,
      description: 'JCB brand name standardization' 
    },
    { 
      pattern: /\bready mixed?\b/gi, 
      replacement: 'ready-mix', 
      confidence: 'MEDIUM' as const,
      description: 'Ready-mix concrete terminology' 
    },
    { 
      pattern: /\bform work\b/gi, 
      replacement: 'formwork', 
      confidence: 'MEDIUM' as const,
      description: 'Formwork terminology standardization' 
    },
  ],
};

// Tier 3: Experimental patterns (track effectiveness, remove if ineffective)
export const EXPERIMENTAL_PATTERNS = {
  // Block strength notation - Monitor for over-fitting
  blockStrength: [
    { 
      pattern: /\b7\s*end\b/gi, 
      replacement: '7N', 
      confidence: 'LOW' as const,
      description: 'Block strength notation (experimental)' 
    },
  ],
  
  // Common phrases - Track success rate
  phrases: [
    { 
      pattern: /\bcrack and\b/gi, 
      replacement: 'crack on', 
      confidence: 'LOW' as const,
      description: 'Irish phrase correction (experimental)' 
    },
  ],
};

// Critical error patterns that force manual review (Business risk assessment)
export const CRITICAL_ERROR_PATTERNS = {
  // Currency errors - Critical business risk
  currency: [
    { pattern: /£(\d)/g, replacement: '€$1', critical: true, reason: 'Currency error: Ireland uses euros, not pounds' },
    { pattern: /\bpounds?\b/gi, replacement: 'euros', critical: true, reason: 'Currency terminology error' },
    { pattern: /\bsterling\b/gi, replacement: 'euro', critical: true, reason: 'Wrong currency system' },
  ],
  
  // Suspicious amounts - Force review for high values
  suspiciousAmounts: [
    { pattern: /€\d{4,}/g, critical: true, reason: 'High monetary value requires verification' },
    { pattern: /\b\d{4,}\s*euros?\b/gi, critical: true, reason: 'Large euro amount needs review' },
  ],
  
  // Known hallucination patterns - Conservative approach
  hallucinations: [
    { pattern: /\btele porter\b/gi, replacement: 'teleporter', critical: false, reason: 'Equipment name transcription error' },
  ]
};

// Pattern effectiveness tracker
class PatternEffectivenessTracker {
  private static metrics: Map<string, PatternMetrics> = new Map();
  
  static trackPatternApplication(
    pattern: string,
    applied: boolean,
    context: string,
    originalConfidence: number,
    resultingAccuracy?: number
  ): void {
    const existing = this.metrics.get(pattern) || {
      pattern,
      timesApplied: 0,
      successfulApplications: 0,
      falsePositives: 0,
      accuracy: 0,
      confidence: 'MEDIUM' as const
    };
    
    if (applied) {
      existing.timesApplied++;
      if (resultingAccuracy && resultingAccuracy > originalConfidence) {
        existing.successfulApplications++;
      } else {
        existing.falsePositives++;
      }
    }
    
    existing.accuracy = existing.timesApplied > 0 
      ? existing.successfulApplications / existing.timesApplied 
      : 0;
    
    // Update confidence based on success rate
    if (existing.accuracy > 0.8 && existing.timesApplied >= 5) {
      existing.confidence = 'HIGH';
    } else if (existing.accuracy < 0.5 && existing.timesApplied >= 3) {
      existing.confidence = 'LOW';
    }
    
    this.metrics.set(pattern, existing);
  }
  
  static getPatternMetrics(): PatternMetrics[] {
    const result: PatternMetrics[] = [];
    this.metrics.forEach((metric) => {
      result.push(metric);
    });
    return result;
  }
  
  static getPatternRecommendations(): string[] {
    const recommendations: string[] = [];
    
    this.metrics.forEach((metric) => {
      if (metric.timesApplied >= 3) {
        if (metric.accuracy < 0.3) {
          recommendations.push(`REMOVE: Pattern "${metric.pattern}" has low accuracy (${(metric.accuracy * 100).toFixed(1)}%)`);
        } else if (metric.accuracy > 0.9 && metric.confidence === 'LOW') {
          recommendations.push(`PROMOTE: Pattern "${metric.pattern}" has high accuracy (${(metric.accuracy * 100).toFixed(1)}%) - move to higher tier`);
        }
      }
    });
    
    return recommendations;
  }
}

/**
 * Apply tiered pattern fixes to transcription with effectiveness tracking
 * Story 1A.2.1 Refactored: Generalizable approach with conservative application
 */
export function applyPatternFixes(text: string, confidence?: number): {
  fixed: string;
  criticalErrors: string[];
  standardFixes: string[];
  hallucinationDetected: boolean;
  patternsApplied: string[];
  effectivenessData: PatternMetrics[];
} {
  let fixed = text;
  const criticalErrors: string[] = [];
  const standardFixes: string[] = [];
  const patternsApplied: string[] = [];
  let hallucinationDetected = false;
  const originalLength = text.length;
  
  console.log('🔧 Starting tiered pattern application:', {
    textLength: originalLength,
    confidence: confidence || 'unknown'
  });
  
  // Step 1: Always apply universal patterns (Tier 1)
  console.log('📋 Applying universal patterns (Tier 1)...');
  Object.entries(UNIVERSAL_PATTERNS).forEach(([category, patterns]) => {
    patterns.forEach(({ pattern, replacement, description }) => {
      const beforeFix = fixed;
      const matches = fixed.match(pattern);
      
      if (matches) {
        if (typeof replacement === 'string') {
          fixed = fixed.replace(pattern, replacement);
        } else {
          fixed = fixed.replace(pattern, replacement as any);
        }
        
        if (fixed !== beforeFix) {
          standardFixes.push(`Universal: ${description}`);
          patternsApplied.push(description);
          
          // Track pattern effectiveness
          PatternEffectivenessTracker.trackPatternApplication(
            pattern.toString(),
            true,
            category,
            confidence || 70
          );
          
          console.log(`✅ Applied universal pattern: ${description}`, {
            matches: matches.length,
            category
          });
        }
      }
    });
  });
  
  // Step 2: Apply contextual patterns only with proper context (Tier 2)
  console.log('🎯 Applying contextual patterns (Tier 2)...');
  Object.entries(CONTEXTUAL_PATTERNS).forEach(([category, patterns]) => {
    patterns.forEach((patternConfig) => {
      const { pattern, replacement, description } = patternConfig;
      const contextRequired = 'contextRequired' in patternConfig ? patternConfig.contextRequired : undefined;
      const beforeFix = fixed;
      
      // Check if required context is present
      const hasContext = !contextRequired || contextRequired.some(ctx => 
        new RegExp(ctx, 'i').test(fixed)
      );
      
      if (hasContext) {
        const matches = fixed.match(pattern);
        
        if (matches) {
          if (typeof replacement === 'string') {
            fixed = fixed.replace(pattern, replacement);
          } else if (typeof replacement === 'function') {
            // For context-aware replacements, pass the full text
            const contextAwareReplace = replacement(fixed);
            fixed = fixed.replace(pattern, contextAwareReplace);
          }
          
          if (fixed !== beforeFix) {
            standardFixes.push(`Contextual: ${description}`);
            patternsApplied.push(description);
            
            PatternEffectivenessTracker.trackPatternApplication(
              pattern.toString(),
              true,
              category,
              confidence || 70
            );
            
            console.log(`✅ Applied contextual pattern: ${description}`, {
              matches: matches.length,
              category,
              contextRequired
            });
          }
        }
      } else {
        console.log(`⏭️  Skipped contextual pattern (no context): ${description}`, {
          contextRequired
        });
      }
    });
  });
  
  // Step 3: Apply experimental patterns only for low confidence (Tier 3)
  if (!confidence || confidence < 70) {
    console.log('🧪 Applying experimental patterns (Tier 3) - low confidence...');
    Object.entries(EXPERIMENTAL_PATTERNS).forEach(([category, patterns]) => {
      patterns.forEach(({ pattern, replacement, description }) => {
        const beforeFix = fixed;
        const matches = fixed.match(pattern);
        
        if (matches) {
          if (typeof replacement === 'string') {
            fixed = fixed.replace(pattern, replacement);
          } else {
            fixed = fixed.replace(pattern, replacement as any);
          }
          
          if (fixed !== beforeFix) {
            standardFixes.push(`Experimental: ${description}`);
            patternsApplied.push(description);
            
            PatternEffectivenessTracker.trackPatternApplication(
              pattern.toString(),
              true,
              category,
              confidence || 70
            );
            
            console.log(`🧪 Applied experimental pattern: ${description}`, {
              matches: matches.length,
              category
            });
          }
        }
      });
    });
  } else {
    console.log('⏭️  Skipped experimental patterns - confidence too high');
  }
  
  // Step 4: Detect critical error patterns for business risk assessment
  console.log('🚨 Checking critical error patterns...');
  Object.entries(CRITICAL_ERROR_PATTERNS).forEach(([category, patterns]) => {
    patterns.forEach((errorPattern) => {
      const { pattern, critical, reason } = errorPattern;
      const replacement = 'replacement' in errorPattern ? errorPattern.replacement : undefined;
      const matches = fixed.match(pattern);
      if (matches) {
        if (critical) {
          criticalErrors.push(`${reason}: ${matches.join(', ')}`);
          if (category === 'hallucinations') {
            hallucinationDetected = true;
          }
        }
        
        // Apply the fix if replacement provided
        if (replacement) {
          if (typeof replacement === 'string') {
            fixed = fixed.replace(pattern, replacement);
          } else {
            fixed = fixed.replace(pattern, replacement as any);
          }
        }
      }
    });
  });
  
  // Calculate improvement metrics
  const finalLength = fixed.length;
  const tokenExpansion = ((finalLength - originalLength) / originalLength) * 100;
  
  console.log('🔧 Pattern application complete:', {
    originalLength,
    finalLength,
    tokenExpansion: tokenExpansion.toFixed(1) + '%',
    patternsApplied: patternsApplied.length,
    criticalErrors: criticalErrors.length
  });
  
  return {
    fixed,
    criticalErrors,
    standardFixes,
    hallucinationDetected,
    patternsApplied,
    effectivenessData: PatternEffectivenessTracker.getPatternMetrics()
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
 * Story 1A.2.1 Refactored: Conservative transcription fixing with effectiveness tracking
 * Applies tiered pattern system with reduced over-fitting risk
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
  patternsApplied: string[];
  patternRecommendations: string[];
}> {
  const { 
    useGPT4 = true, 
    initialConfidence = 70, 
    enableHallucinationGuards = true,
    maxTokenExpansion = 15 
  } = options;
  
  console.log('🔧 Starting tiered transcription fix (Story 1A.2.1 Refactored):', {
    length: rawTranscription.length,
    useGPT4,
    initialConfidence,
    enableHallucinationGuards
  });
  
  // Step 1: Apply tiered pattern-based fixes with effectiveness tracking
  const patternResult = applyPatternFixes(rawTranscription, initialConfidence);
  
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
  
  // Step 2: Conservative GPT-4 validation conditions
  const shouldUseGPT4 = useGPT4 && (
    initialConfidence < 80 || // More conservative threshold
    patternResult.criticalErrors.length > 0 ||
    patternResult.hallucinationDetected ||
    // Only use GPT-4 if clear business risk patterns detected
    /€\d{4,}/.test(patternResult.fixed) ||
    /\bpounds?\b/i.test(patternResult.fixed)
  );
  
  if (shouldUseGPT4) {
    console.log('🤖 Using GPT-4 validation due to business risk patterns or critical errors');
    
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
      requiresManualReview,
      patternsApplied: patternResult.patternsApplied,
      patternRecommendations: PatternEffectivenessTracker.getPatternRecommendations()
    };
  } else {
    console.log('⏭️  Skipping GPT-4 validation - using pattern fixes only');
  }
  
  // Return pattern-fixed version with effectiveness data
  return {
    original: rawTranscription,
    fixed: patternResult.fixed,
    confidence: calculateConfidence(patternResult.fixed, undefined, false), // Recalculate after fixes
    changes: allChanges,
    criticalErrors: patternResult.criticalErrors,
    hallucinationDetected,
    requiresManualReview,
    patternsApplied: patternResult.patternsApplied,
    patternRecommendations: PatternEffectivenessTracker.getPatternRecommendations()
  };
}

/**
 * Conservative confidence scoring based on universal quality indicators
 * Refactored to avoid over-fitting to specific patterns
 */
export function calculateConfidence(
  transcription: string,
  audioQuality?: number,
  hasCommonErrors?: boolean
): number {
  let confidence = audioQuality || 75;
  
  // Universal positive indicators (high confidence patterns)
  if (transcription.includes('€') && !transcription.includes('£')) {
    confidence += 8; // Strong indicator for Irish market
  }
  if (/C\d{2}\/\d{2}/.test(transcription)) {
    confidence += 5; // Proper concrete grade formatting
  }
  if (/\d+\s*(metres?|tonnes?|mm)\b/i.test(transcription)) {
    confidence += 3; // Metric measurements indicate good transcription
  }
  
  // Universal negative indicators (business risk patterns)
  if (transcription.includes('£') || /\bpounds?\b/i.test(transcription)) {
    confidence -= 20; // Major currency error
  }
  if (/€\d{4,}/.test(transcription)) {
    confidence -= 5; // High value requires verification (not error, but risk)
  }
  
  // Conservative approach - only penalize clear error patterns
  if (/\btele porter\b/i.test(transcription)) {
    confidence -= 8; // Known hallucination pattern
  }
  
  // Text quality indicators
  const wordCount = transcription.split(/\s+/).length;
  if (wordCount < 5) {
    confidence -= 15; // Very short transcription likely incomplete
  } else if (wordCount > 200) {
    confidence -= 5; // Long transcription more prone to drift
  }
  
  // Check for repetitive patterns (hallucination indicator)
  const words = transcription.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words).size;
  const repetitionRatio = uniqueWords / words.length;
  
  if (repetitionRatio < 0.6 && words.length > 20) {
    confidence -= 10; // High repetition suggests hallucination
  }
  
  // Reduce if common errors detected
  if (hasCommonErrors) confidence -= 10;
  
  // Clamp between 0-100
  return Math.max(0, Math.min(100, Math.round(confidence)));
}

/**
 * Test the refactored fixer with pattern effectiveness tracking
 * Now focuses on generalizable patterns rather than specific test case optimization
 */
export async function testGeneralizableTranscription(): Promise<void> {
  // Test multiple different types of construction voice notes, not just Ballymun
  const testCases = [
    {
      name: 'Currency and Time Test',
      text: 'Delivery cost £1,500 and arrived at 30. Need concrete C25-30 grade.'
    },
    {
      name: 'Equipment and Materials Test', 
      text: 'The JCP broke down. Need 200 concrete blocks, 7 end strength. Ready mixed concrete arriving.'
    },
    {
      name: 'Measurements Test',
      text: 'Used 25 mil rebar, 100 cubic meters of concrete, foundation is 50 meter long.'
    },
    {
      name: 'High Confidence Test (should apply minimal fixes)',
      text: 'Concrete delivery of C25/30 grade arrived at 8:30. Cost was €1,500 euros. All equipment working fine.'
    }
  ];
  
  console.log('🧪 Testing generalized transcription fixing...\n');
  
  for (const testCase of testCases) {
    console.log(`\n=== ${testCase.name.toUpperCase()} ===`);
    console.log('ORIGINAL:', testCase.text);
    
    const result = await fixTranscription(testCase.text, { useGPT4: false });
    
    console.log('FIXED:', result.fixed);
    console.log('CONFIDENCE:', result.confidence + '%');
    console.log('PATTERNS APPLIED:', result.patternsApplied);
    console.log('CRITICAL ERRORS:', result.criticalErrors.length);
    
    if (result.patternRecommendations.length > 0) {
      console.log('RECOMMENDATIONS:', result.patternRecommendations);
    }
  }
  
  // Test pattern effectiveness metrics
  console.log('\n=== PATTERN EFFECTIVENESS METRICS ===');
  const metrics = PatternEffectivenessTracker.getPatternMetrics();
  
  if (metrics.length > 0) {
    console.log('Pattern Performance:');
    metrics.forEach(metric => {
      console.log(`  ${metric.pattern}: ${(metric.accuracy * 100).toFixed(1)}% accuracy (${metric.timesApplied} applications)`);
    });
  } else {
    console.log('No pattern metrics collected yet. Run more tests to gather effectiveness data.');
  }
  
  // Test recommendations
  const recommendations = PatternEffectivenessTracker.getPatternRecommendations();
  if (recommendations.length > 0) {
    console.log('\nPattern Improvement Recommendations:');
    recommendations.forEach(rec => console.log(`  • ${rec}`));
  }
  
  console.log('\n✅ Generalized transcription testing complete');
  console.log('🎯 System designed for universal Irish construction applicability');
}