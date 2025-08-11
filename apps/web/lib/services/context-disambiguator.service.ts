/**
 * Story 1A.2.3: Context-Aware Disambiguation Engine
 * SiteProof - Construction Evidence Machine
 * 
 * Uses GPT-5-mini to disambiguate ambiguous terms based on construction context
 * Applies context-specific interpretation rules for better accuracy
 * 
 * CRITICAL: This service runs server-side only with OpenAI dependencies
 */

// EMERGENCY SECURITY CHECK: Ensure this service runs server-side ONLY
if (typeof window !== 'undefined') {
  throw new Error(
    'SECURITY VIOLATION: ContextDisambiguatorService contains OpenAI dependencies and must run server-side only.'
  );
}

import openai from '@/lib/openai';
import { ContextType } from './context-detector.service';

/**
 * Alternative replacement option
 */
export interface AlternativeReplacement {
  replacement: string;
  confidence: number;
  reasoning: string;
}

/**
 * Disambiguation result for a specific ambiguous term
 */
export interface DisambiguationResult {
  originalTerm: string;
  suggestedReplacement: string;
  confidence: number; // 0-100
  reasoning: string;
  contextApplied: ContextType;
  requiresHumanReview: boolean;
  alternatives: AlternativeReplacement[];
}

/**
 * Full disambiguation response for transcription
 */
export interface DisambiguationResponse {
  originalTranscription: string;
  disambiguatedTranscription: string;
  changes: DisambiguationResult[];
  overallConfidence: number;
  processingTime: number;
  contextType: ContextType;
  flagsForReview: string[];
  costEstimate: number; // API cost in USD
}

/**
 * Audio metadata for disambiguation
 */
export interface DisambiguationAudioMetadata {
  duration: number;
  qualityScore: number;
}

/**
 * Disambiguation request parameters
 */
export interface DisambiguationRequest {
  transcription: string;
  contextType: ContextType;
  contextConfidence: number;
  audioMetadata?: DisambiguationAudioMetadata;
}

/**
 * OpenAI API disambiguation response
 */
interface OpenAIDisambiguationResponse {
  disambiguations: Array<{
    originalTerm: string;
    suggestedReplacement: string;
    confidence: number;
    reasoning: string;
    requiresHumanReview: boolean;
    alternatives?: Array<{
      replacement: string;
      confidence: number;
    }>;
  }>;
  overallConfidence: number;
  flagsForReview: string[];
}

/**
 * Common ambiguous patterns in Irish construction
 */
interface AmbiguousPattern {
  pattern: RegExp;
  contexts: {
    [key in ContextType]?: {
      interpretation: string;
      confidence: number;
      requiresReview: boolean;
    };
  };
}

/**
 * Context-specific processing hints
 */
interface ContextSpecificHints {
  focus: string;
  numberInterpretation: string;
}

export class ContextDisambiguatorService {
  
  private ambiguousPatterns: AmbiguousPattern[] = [
    // Numbers without units - highly context dependent
    {
      pattern: /\b(\d+)\b(?!\s*(cubic|metre|tonne|hour|euro|pound|am|pm))/gi,
      contexts: {
        [ContextType.MATERIAL_ORDER]: {
          interpretation: 'quantity requiring unit specification',
          confidence: 60,
          requiresReview: true
        },
        [ContextType.TIME_TRACKING]: {
          interpretation: 'time value (likely hours or clock time)',
          confidence: 75,
          requiresReview: false
        },
        [ContextType.SAFETY_REPORT]: {
          interpretation: 'incident count or severity level',
          confidence: 50,
          requiresReview: true
        }
      }
    },
    
    // Currency symbols - critical for Irish market
    {
      pattern: /£(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
      contexts: {
        [ContextType.MATERIAL_ORDER]: {
          interpretation: 'convert to euros (Ireland uses €)',
          confidence: 95,
          requiresReview: false
        },
        [ContextType.GENERAL]: {
          interpretation: 'convert to euros (Ireland uses €)',
          confidence: 90,
          requiresReview: false
        }
      }
    },
    
    // Partial times
    {
      pattern: /\bat\s+(\d{1,2})(?!\s*:)/gi,
      contexts: {
        [ContextType.TIME_TRACKING]: {
          interpretation: 'incomplete time - likely missing minutes',
          confidence: 80,
          requiresReview: true
        },
        [ContextType.MATERIAL_ORDER]: {
          interpretation: 'delivery time - needs clarification',
          confidence: 70,
          requiresReview: true
        }
      }
    },
    
    // Construction terminology confusion
    {
      pattern: /\b(engine|forest)\s+(protection|lab)\b/gi,
      contexts: {
        [ContextType.SAFETY_REPORT]: {
          interpretation: 'likely "edge protection" or "ground floor slab"',
          confidence: 75,
          requiresReview: true
        },
        [ContextType.PROGRESS_UPDATE]: {
          interpretation: 'likely construction terminology error',
          confidence: 70,
          requiresReview: true
        }
      }
    },
    
    // Safety terminology errors
    {
      pattern: /\b(safe\s+farming|engine\s+protection)\b/gi,
      contexts: {
        [ContextType.SAFETY_REPORT]: {
          interpretation: 'likely "safe working" or "edge protection"',
          confidence: 80,
          requiresReview: true
        },
        [ContextType.GENERAL]: {
          interpretation: 'likely safety terminology correction needed',
          confidence: 70,
          requiresReview: true
        }
      }
    },
    
    // Concrete grade formats
    {
      pattern: /\bc(\d+)\s*\/?\s*(\d+)\b/gi,
      contexts: {
        [ContextType.MATERIAL_ORDER]: {
          interpretation: 'concrete grade specification (C25/30 format)',
          confidence: 90,
          requiresReview: false
        }
      }
    }
  ];

  /**
   * Primary method: Disambiguate transcription using context-aware AI
   */
  async disambiguateTranscription(request: DisambiguationRequest): Promise<DisambiguationResponse> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Context disambiguation started:', {
        contextType: request.contextType,
        contextConfidence: request.contextConfidence,
        textLength: request.transcription.length
      });

      // 1. Pre-processing: Identify potential ambiguous terms
      const ambiguousTerms = this.identifyAmbiguousTerms(request.transcription, request.contextType);
      
      if (ambiguousTerms.length === 0) {
        return {
          originalTranscription: request.transcription,
          disambiguatedTranscription: request.transcription,
          changes: [],
          overallConfidence: 95,
          processingTime: Date.now() - startTime,
          contextType: request.contextType,
          flagsForReview: [],
          costEstimate: 0
        };
      }

      console.log('🔍 Found ambiguous terms:', ambiguousTerms.map(t => t.term));

      // 2. Use GPT-4o-mini for disambiguation (fallback until GPT-5-mini available)
      const disambiguationResponse = await this.callDisambiguationAPI(request, ambiguousTerms);
      
      // 3. Apply disambiguations to transcription
      const result = this.applyDisambiguations(
        request.transcription,
        disambiguationResponse,
        request.contextType
      );

      const processingTime = Date.now() - startTime;
      const costEstimate = this.estimateAPICost(request.transcription.length, ambiguousTerms.length);

      console.log('🔍 Context disambiguation complete:', {
        changesCount: result.changes.length,
        overallConfidence: result.overallConfidence,
        processingTime,
        costEstimate
      });

      return {
        ...result,
        processingTime,
        contextType: request.contextType,
        costEstimate
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown disambiguation error';
      console.error('Disambiguation error:', errorMessage);
      
      // Fallback to rule-based disambiguation
      const fallbackResult = this.fallbackDisambiguation(request);
      
      return {
        ...fallbackResult,
        processingTime: Date.now() - startTime,
        overallConfidence: Math.max(30, fallbackResult.overallConfidence - 20),
        costEstimate: 0 // No API cost for fallback
      };
    }
  }

  /**
   * Identify potentially ambiguous terms in transcription
   */
  private identifyAmbiguousTerms(transcription: string, contextType: ContextType): Array<{
    term: string;
    position: number;
    length: number;
    patternType: string;
  }> {
    const ambiguousTerms: Array<{
      term: string;
      position: number;
      length: number;
      patternType: string;
    }> = [];

    for (const pattern of this.ambiguousPatterns) {
      let match;
      const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
      
      while ((match = regex.exec(transcription)) !== null) {
        // Check if this pattern applies to current context
        if (pattern.contexts[contextType] || pattern.contexts[ContextType.GENERAL]) {
          ambiguousTerms.push({
            term: match[0],
            position: match.index,
            length: match[0].length,
            patternType: pattern.pattern.source
          });
        }
      }
    }

    // Remove duplicates and sort by position
    return ambiguousTerms
      .filter((term, index, self) => 
        index === self.findIndex(t => t.position === term.position && t.term === term.term)
      )
      .sort((a, b) => a.position - b.position);
  }

  /**
   * Call OpenAI API for disambiguation
   */
  private async callDisambiguationAPI(
    request: DisambiguationRequest,
    ambiguousTerms: Array<{ term: string; position: number; length: number; patternType: string }>
  ): Promise<OpenAIDisambiguationResponse> {
    const contextHints = this.getContextSpecificHints(request.contextType);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini-2025-08-07', // GPT-5 mini model for smart disambiguation
      messages: [
        {
          role: 'system',
          content: this.getDisambiguationPrompt(request.contextType, contextHints)
        },
        {
          role: 'user',
          content: this.buildDisambiguationRequest(request.transcription, ambiguousTerms, request.contextType)
        }
      ],
      // temperature: 1.0 (default for GPT-5, explicit setting not supported)
      max_completion_tokens: 800,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content || '{}';
    return JSON.parse(content) as OpenAIDisambiguationResponse;
  }

  /**
   * Build system prompt for disambiguation
   */
  private getDisambiguationPrompt(contextType: ContextType, hints: ContextSpecificHints): string {
    return `You are an Irish construction terminology disambiguation expert.

Context: ${contextType}
Focus: ${hints.focus}
Number Interpretation: ${hints.numberInterpretation}

Your task is to disambiguate ambiguous terms in construction transcriptions.

Key Rules:
1. Ireland uses EUROS (€), never pounds (£)
2. Convert all £ symbols to €
3. For incomplete times like "at 8", consider context:
   - Material orders: likely delivery times, suggest "at 8:00" or "at 8:30"
   - Time tracking: likely clock times, suggest full time format
4. Construction terms: 
   - "engine protection" → "edge protection"
   - "ground forest lab" → "ground floor slab"
   - "safe farming" → "safe working" 
   - "c2530" → "C25/30" (concrete grade)
5. Numbers without units in material contexts need unit specification
6. Be conservative - only suggest changes you're confident about

Return JSON:
{
  "disambiguations": [
    {
      "originalTerm": "exact text to replace",
      "suggestedReplacement": "improved text",
      "confidence": 85,
      "reasoning": "brief explanation",
      "requiresHumanReview": false,
      "alternatives": [
        {"replacement": "alternative option", "confidence": 65}
      ]
    }
  ],
  "overallConfidence": 80,
  "flagsForReview": ["reasons requiring human review"]
}`;
  }

  /**
   * Build disambiguation request content
   */
  private buildDisambiguationRequest(
    transcription: string,
    ambiguousTerms: Array<{ term: string; position: number; length: number; patternType: string }>,
    contextType: ContextType
  ): string {
    const termsText = ambiguousTerms.map(t => `"${t.term}"`).join(', ');
    
    return `Transcription (${contextType} context):
"${transcription}"

Ambiguous terms found: ${termsText}

Please disambiguate these terms considering the Irish construction context and provide specific replacements.`;
  }

  /**
   * Apply disambiguation results to transcription
   */
  private applyDisambiguations(
    originalTranscription: string,
    apiResponse: Partial<OpenAIDisambiguationResponse>,
    contextType: ContextType
  ): Omit<DisambiguationResponse, 'processingTime' | 'costEstimate'> {
    let disambiguatedTranscription = originalTranscription;
    const changes: DisambiguationResult[] = [];
    let flagsForReview: string[] = [];

    if (apiResponse.disambiguations && Array.isArray(apiResponse.disambiguations)) {
      // Apply changes in reverse order to maintain positions
      const disambiguations = [...apiResponse.disambiguations].reverse();
      
      for (const disambiguation of disambiguations) {
        const originalTerm = disambiguation.originalTerm;
        const replacement = disambiguation.suggestedReplacement;
        
        if (originalTerm && replacement && originalTerm !== replacement) {
          disambiguatedTranscription = disambiguatedTranscription.replace(
            new RegExp(this.escapeRegex(originalTerm), 'g'),
            replacement
          );
          
          // Convert alternatives to proper format
          const alternatives: AlternativeReplacement[] = (disambiguation.alternatives || [])
            .map(alt => ({
              replacement: alt.replacement,
              confidence: alt.confidence || 50,
              reasoning: `Alternative suggestion for ${originalTerm}`
            }));
          
          changes.push({
            originalTerm,
            suggestedReplacement: replacement,
            confidence: disambiguation.confidence || 70,
            reasoning: disambiguation.reasoning || '',
            contextApplied: contextType,
            requiresHumanReview: disambiguation.requiresHumanReview || false,
            alternatives
          });
          
          if (disambiguation.requiresHumanReview) {
            flagsForReview.push(`${originalTerm} → ${replacement}: ${disambiguation.reasoning}`);
          }
        }
      }
    }

    // Add API response flags
    if (apiResponse.flagsForReview && Array.isArray(apiResponse.flagsForReview)) {
      flagsForReview = [...flagsForReview, ...apiResponse.flagsForReview];
    }

    const overallConfidence = apiResponse.overallConfidence || 
      (changes.length > 0 ? Math.round(changes.reduce((acc, c) => acc + c.confidence, 0) / changes.length) : 85);

    return {
      originalTranscription,
      disambiguatedTranscription,
      changes: changes.reverse(), // Restore original order
      overallConfidence,
      flagsForReview,
      contextType
    };
  }

  /**
   * Fallback rule-based disambiguation when API fails
   */
  private fallbackDisambiguation(request: DisambiguationRequest): Omit<DisambiguationResponse, 'processingTime' | 'costEstimate'> {
    let disambiguatedTranscription = request.transcription;
    const changes: DisambiguationResult[] = [];

    // Apply high-confidence rule-based fixes
    const universalFixes = [
      {
        pattern: /£(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
        replacement: '€$1',
        reasoning: 'Ireland uses euros, not pounds'
      },
      {
        pattern: /\bc(\d+)\s*(\d+)\b/gi,
        replacement: 'C$1/$2',
        reasoning: 'Concrete grade standardization'
      }
    ];

    for (const fix of universalFixes) {
      let match;
      const regex = new RegExp(fix.pattern.source, fix.pattern.flags);
      const matches = [];
      while ((match = regex.exec(disambiguatedTranscription)) !== null) {
        matches.push(match);
        if (!regex.global) break;
      }
      
      for (const match of matches) {
        changes.push({
          originalTerm: match[0],
          suggestedReplacement: match[0].replace(fix.pattern, fix.replacement),
          confidence: 85,
          reasoning: fix.reasoning,
          contextApplied: request.contextType,
          requiresHumanReview: false,
          alternatives: []
        });
      }
      
      disambiguatedTranscription = disambiguatedTranscription.replace(fix.pattern, fix.replacement);
    }

    return {
      originalTranscription: request.transcription,
      disambiguatedTranscription,
      changes,
      overallConfidence: changes.length > 0 ? 75 : 90,
      flagsForReview: [],
      contextType: request.contextType
    };
  }

  /**
   * Get context-specific processing hints
   */
  private getContextSpecificHints(contextType: ContextType) {
    switch (contextType) {
      case ContextType.MATERIAL_ORDER:
        return {
          focus: 'quantities, costs, specifications, delivery details',
          numberInterpretation: 'likely quantities or prices - require units for clarity'
        };
      case ContextType.TIME_TRACKING:
        return {
          focus: 'work hours, schedules, deadlines, time formats',
          numberInterpretation: 'likely times or durations - standardize format'
        };
      case ContextType.SAFETY_REPORT:
        return {
          focus: 'equipment names, incident details, compliance codes',
          numberInterpretation: 'likely counts or severity levels'
        };
      case ContextType.PROGRESS_UPDATE:
        return {
          focus: 'completion status, milestones, remaining work',
          numberInterpretation: 'likely percentages or quantities'
        };
      default:
        return {
          focus: 'general construction terminology',
          numberInterpretation: 'context unclear - be conservative'
        };
    }
  }

  /**
   * Estimate API cost for disambiguation using GPT-5-mini
   */
  private estimateAPICost(transcriptionLength: number, ambiguousTermCount: number): number {
    // GPT-5-mini pricing: $0.25/1M input tokens, $2/1M output tokens
    const inputTokens = Math.ceil(transcriptionLength / 3); // Rough token estimate
    const outputTokens = Math.ceil(ambiguousTermCount * 50); // Output estimation
    
    const inputCost = (inputTokens / 1000000) * 0.25;
    const outputCost = (outputTokens / 1000000) * 2.0;
    
    return Math.round((inputCost + outputCost) * 1000000) / 1000000; // Round to 6 decimal places
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}