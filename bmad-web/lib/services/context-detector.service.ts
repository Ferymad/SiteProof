/**
 * Story 1A.2.3: GPT-5 Context Detection Service
 * SiteProof - Construction Evidence Machine
 * 
 * Context-aware conversation classification using GPT-5-nano
 * Identifies construction conversation types for better disambiguation
 * 
 * CRITICAL: This service runs server-side only with OpenAI dependencies
 */

// EMERGENCY SECURITY CHECK: Ensure this service runs server-side ONLY
if (typeof window !== 'undefined') {
  throw new Error(
    'SECURITY VIOLATION: ContextDetectorService contains OpenAI dependencies and must run server-side only.'
  );
}

import openai from '@/lib/openai';

/**
 * Construction conversation context types
 */
export enum ContextType {
  MATERIAL_ORDER = 'MATERIAL_ORDER',
  TIME_TRACKING = 'TIME_TRACKING', 
  SAFETY_REPORT = 'SAFETY_REPORT',
  PROGRESS_UPDATE = 'PROGRESS_UPDATE',
  GENERAL = 'GENERAL'
}

/**
 * Alternative context option
 */
export interface AlternativeContext {
  contextType: ContextType;
  confidence: number;
}

/**
 * Context detection result with confidence and indicators
 */
export interface ContextDetectionResult {
  contextType: ContextType;
  confidence: number; // 0-100
  keyIndicators: string[];
  alternativeContexts: AlternativeContext[];
  processingTime: number;
  rawResponse?: string;
}

/**
 * Audio metadata for context detection
 */
export interface AudioMetadata {
  duration: number;
  fileSize: number;
  qualityScore: number;
}

/**
 * Context detection request parameters
 */
export interface ContextDetectionRequest {
  transcription: string;
  audioMetadata?: AudioMetadata;
}

/**
 * OpenAI API response structure
 */
interface OpenAIResponse {
  contextType: string;
  confidence: number;
  keyIndicators: string[];
  reasoning: string;
  alternativeContexts: Array<{
    contextType: string;
    confidence: number;
  }>;
}

export class ContextDetectorService {
  
  /**
   * Primary method: Detect conversation context using GPT-5-nano
   */
  async detectContext(request: ContextDetectionRequest): Promise<ContextDetectionResult> {
    const startTime = Date.now();
    
    try {
      console.log('🧠 Context detection started:', {
        textLength: request.transcription.length,
        duration: request.audioMetadata?.duration
      });

      // Use GPT-5-nano for efficient context detection
      const response = await openai.chat.completions.create({
        model: 'gpt-5-nano', // Optimized for fast, cost-effective context detection
        messages: [
          {
            role: 'system',
            content: this.getContextDetectionPrompt()
          },
          {
            role: 'user', 
            content: `Analyze this Irish construction site transcription and determine the conversation context:\n\n"${request.transcription}"`
          }
        ],
        temperature: 0.1, // Low temperature for consistent classification
        max_tokens: 300,
        response_format: { type: 'json_object' }
      });

      const result = this.parseContextResponse(response.choices[0].message.content || '');
      const processingTime = Date.now() - startTime;

      console.log('🧠 Context detection complete:', {
        contextType: result.contextType,
        confidence: result.confidence,
        processingTime,
        keyIndicators: result.keyIndicators
      });

      return {
        ...result,
        processingTime
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Context detection error:', errorMessage);
      
      // Fallback to rule-based detection
      const fallbackResult = this.fallbackContextDetection(request.transcription);
      
      return {
        ...fallbackResult,
        processingTime: Date.now() - startTime,
        confidence: Math.max(30, fallbackResult.confidence - 20) // Reduce confidence for fallback
      };
    }
  }

  /**
   * System prompt for context detection
   */
  private getContextDetectionPrompt(): string {
    return `You are a construction context analyzer for Irish construction sites.

Analyze transcriptions and classify them into one of these contexts:

1. MATERIAL_ORDER: Discussions about ordering, quantities, costs, materials, suppliers
   - Key indicators: "order", "need", "cost", quantities with units, material names
   - Focus: Numbers likely represent quantities, costs, or specifications

2. TIME_TRACKING: Work hours, schedules, deadlines, timing discussions  
   - Key indicators: times, "hours", "start", "finish", "deadline", "schedule"
   - Focus: Numbers likely represent times, hours worked, or schedules

3. SAFETY_REPORT: Safety incidents, PPE, hazards, compliance, equipment issues
   - Key indicators: "safety", "accident", "PPE", "hazard", "incident", "injury"
   - Focus: Safety equipment, procedures, compliance requirements

4. PROGRESS_UPDATE: Work completion, status updates, milestone progress
   - Key indicators: "finished", "complete", "progress", "done", "ready"
   - Focus: Completion percentages, status, next steps

5. GENERAL: Mixed conversations or unclear context
   - Use when no clear primary context emerges

Return JSON with:
{
  "contextType": "MATERIAL_ORDER|TIME_TRACKING|SAFETY_REPORT|PROGRESS_UPDATE|GENERAL",
  "confidence": 85,
  "keyIndicators": ["specific words/phrases that indicate this context"],
  "reasoning": "Brief explanation of why this context was chosen",
  "alternativeContexts": [
    {"contextType": "SECONDARY_CONTEXT", "confidence": 25}
  ]
}

Focus on Irish construction terminology and be conservative with confidence scores.`;
  }

  /**
   * Parse GPT response into structured result
   */
  private parseContextResponse(responseContent: string): Omit<ContextDetectionResult, 'processingTime'> {
    try {
      const parsed: Partial<OpenAIResponse> = JSON.parse(responseContent);
      
      // Validate and convert contextType
      const contextType = this.validateContextType(parsed.contextType);
      
      return {
        contextType,
        confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
        keyIndicators: Array.isArray(parsed.keyIndicators) ? parsed.keyIndicators : [],
        alternativeContexts: this.parseAlternativeContexts(parsed.alternativeContexts),
        rawResponse: responseContent
      };
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Parse error';
      console.warn('Failed to parse context response:', errorMessage);
      return {
        contextType: ContextType.GENERAL,
        confidence: 30,
        keyIndicators: [],
        alternativeContexts: [],
        rawResponse: responseContent
      };
    }
  }

  /**
   * Validate and convert string context type to enum
   */
  private validateContextType(contextTypeString?: string): ContextType {
    if (!contextTypeString) return ContextType.GENERAL;
    
    const validTypes = Object.values(ContextType);
    return validTypes.includes(contextTypeString as ContextType) 
      ? (contextTypeString as ContextType) 
      : ContextType.GENERAL;
  }

  /**
   * Parse and validate alternative contexts
   */
  private parseAlternativeContexts(alternatives?: unknown): AlternativeContext[] {
    if (!Array.isArray(alternatives)) return [];
    
    return alternatives
      .filter((alt): alt is { contextType: string; confidence: number } => 
        typeof alt === 'object' && 
        alt !== null &&
        'contextType' in alt && 
        'confidence' in alt &&
        typeof alt.confidence === 'number'
      )
      .map(alt => ({
        contextType: this.validateContextType(alt.contextType),
        confidence: Math.min(100, Math.max(0, alt.confidence))
      }));
  }

  /**
   * Rule-based fallback when AI detection fails
   */
  private fallbackContextDetection(transcription: string): Omit<ContextDetectionResult, 'processingTime'> {
    const text = transcription.toLowerCase();
    const rules = [
      {
        context: ContextType.MATERIAL_ORDER,
        keywords: ['order', 'need', 'cost', 'price', 'cubic', 'tonnes', 'blocks', 'concrete', 'rebar', 'deliver', 'supplier'],
        confidence: 75
      },
      {
        context: ContextType.TIME_TRACKING, 
        keywords: ['hours', 'time', 'start', 'finish', 'deadline', 'schedule', 'morning', 'afternoon', 'o\'clock'],
        confidence: 70
      },
      {
        context: ContextType.SAFETY_REPORT,
        keywords: ['safety', 'accident', 'ppe', 'hazard', 'incident', 'injury', 'helmet', 'harness', 'inspection'],
        confidence: 80
      },
      {
        context: ContextType.PROGRESS_UPDATE,
        keywords: ['finished', 'complete', 'done', 'ready', 'progress', 'status', 'milestone', 'update'],
        confidence: 65
      }
    ];

    let bestMatch = {
      context: ContextType.GENERAL,
      confidence: 40,
      matchedKeywords: [] as string[]
    };

    for (const rule of rules) {
      const matches = rule.keywords.filter(keyword => text.includes(keyword));
      const score = (matches.length / rule.keywords.length) * rule.confidence;
      
      if (score > bestMatch.confidence) {
        bestMatch = {
          context: rule.context,
          confidence: score,
          matchedKeywords: matches
        };
      }
    }

    return {
      contextType: bestMatch.context,
      confidence: Math.round(bestMatch.confidence),
      keyIndicators: bestMatch.matchedKeywords,
      alternativeContexts: []
    };
  }

  /**
   * Get context-specific processing hints
   */
  getContextHints(contextType: ContextType): {
    numberInterpretation: string;
    keyTerms: string[];
    commonAmbiguities: string[];
  } {
    switch (contextType) {
      case ContextType.MATERIAL_ORDER:
        return {
          numberInterpretation: 'quantities_and_costs',
          keyTerms: ['cubic meters', 'tonnes', 'blocks', 'concrete', 'rebar', 'delivery'],
          commonAmbiguities: ['numbers without units', 'currency confusion', 'material grades']
        };
        
      case ContextType.TIME_TRACKING:
        return {
          numberInterpretation: 'times_and_hours', 
          keyTerms: ['hours worked', 'start time', 'finish time', 'overtime'],
          commonAmbiguities: ['partial times', '24hr vs 12hr', 'duration vs clock time']
        };
        
      case ContextType.SAFETY_REPORT:
        return {
          numberInterpretation: 'quantities_and_severity',
          keyTerms: ['PPE equipment', 'incident type', 'injury severity', 'equipment condition'],
          commonAmbiguities: ['equipment names', 'severity levels', 'compliance codes']
        };
        
      case ContextType.PROGRESS_UPDATE:
        return {
          numberInterpretation: 'percentages_and_quantities',
          keyTerms: ['completion percentage', 'remaining work', 'milestone status'],
          commonAmbiguities: ['percentage vs absolute', 'completion definitions', 'timeline references']
        };
        
      default:
        return {
          numberInterpretation: 'mixed',
          keyTerms: [],
          commonAmbiguities: ['context unclear']
        };
    }
  }
}