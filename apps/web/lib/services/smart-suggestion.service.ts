// EMERGENCY SECURITY CHECK: Ensure this service runs server-side ONLY
if (typeof window !== 'undefined') {
  throw new Error(
    'SECURITY VIOLATION: SmartSuggestionService contains OpenAI dependencies and must run server-side only. ' +
    'Components should use fetch() calls to API endpoints instead of importing this service directly.'
  );
}

import { SmartSuggestion } from '@/components/SmartSuggestionReview';
import { applyPatternFixes, CRITICAL_ERROR_PATTERNS } from './transcription-fixer';

/**
 * EMERGENCY FIX: Server-Side Smart Suggestion Service
 * 
 * Story 1A.2.2 - Smart Suggestion Service
 * Interactive Unit Disambiguation Layer for Construction Transcription
 * 
 * CRITICAL SECURITY ARCHITECTURE:
 * - This service contains OpenAI dependencies and MUST run server-side only
 * - Components should NEVER import this service directly
 * - Use fetch() calls to /api/processing/* endpoints instead
 * - Browser execution will throw security violation error
 * 
 * Generates smart suggestions with business risk assessment and confidence scoring
 * Optimized for construction PM workflow with mobile-first UX considerations
 */

export interface SuggestionContext {
  text: string;
  confidence?: number;
  audioQuality?: number;
  userId?: string;
  submissionId?: string;
}

export interface SuggestionAnalysis {
  suggestions: SmartSuggestion[];
  totalRiskScore: number;
  requiresReview: boolean;
  estimatedReviewTime: number; // in seconds
  businessImpact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Core suggestion generation service
 * Analyzes transcription and generates contextual smart suggestions
 */
export class SmartSuggestionService {
  private static instance: SmartSuggestionService;
  
  public static getInstance(): SmartSuggestionService {
    if (!SmartSuggestionService.instance) {
      SmartSuggestionService.instance = new SmartSuggestionService();
    }
    return SmartSuggestionService.instance;
  }

  /**
   * Generate smart suggestions from transcription analysis
   * Uses pattern-based detection with risk assessment
   */
  public async generateSuggestions(context: SuggestionContext): Promise<SuggestionAnalysis> {
    const { text, confidence = 70, audioQuality = 75 } = context;
    
    console.log('🧠 Generating smart suggestions:', {
      textLength: text.length,
      confidence,
      audioQuality
    });

    // Step 1: Apply pattern fixes to identify potential corrections
    const patternResult = applyPatternFixes(text, confidence);
    
    // Step 2: Generate suggestions from pattern analysis
    const suggestions = this.extractSuggestionsFromPatterns(
      text, 
      patternResult.fixed,
      patternResult.criticalErrors,
      patternResult.patternsApplied
    );

    // Step 3: Add currency and unit disambiguation suggestions
    const currencySuggestions = this.generateCurrencySuggestions(text);
    const unitSuggestions = this.generateUnitSuggestions(text);
    const safetyTermSuggestions = this.generateSafetyTermSuggestions(text);
    
    const allSuggestions = [
      ...suggestions,
      ...currencySuggestions,
      ...unitSuggestions,
      ...safetyTermSuggestions
    ];

    // Step 4: Risk assessment and prioritization
    const analysis = this.analyzeBusinessRisk(allSuggestions);
    
    console.log('🧠 Smart suggestions generated:', {
      totalSuggestions: allSuggestions.length,
      businessImpact: analysis.businessImpact,
      requiresReview: analysis.requiresReview,
      estimatedTime: analysis.estimatedReviewTime
    });

    return {
      suggestions: allSuggestions,
      ...analysis
    };
  }

  /**
   * Extract suggestions from pattern-based fixes
   */
  private extractSuggestionsFromPatterns(
    original: string, 
    fixed: string, 
    criticalErrors: string[],
    patternsApplied: string[]
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    
    // If text was changed, create suggestions for major differences
    if (original !== fixed) {
      // Simple word-level diff to identify changes
      const originalWords = original.toLowerCase().split(/\s+/);
      const fixedWords = fixed.toLowerCase().split(/\s+/);
      
      // Find replaced segments (simplified approach)
      for (let i = 0; i < Math.max(originalWords.length, fixedWords.length); i++) {
        if (originalWords[i] !== fixedWords[i]) {
          // Find the context around this change
          const contextStart = Math.max(0, i - 3);
          const contextEnd = Math.min(originalWords.length, i + 4);
          
          const contextBefore = originalWords.slice(contextStart, i).join(' ');
          const contextAfter = originalWords.slice(i + 1, contextEnd).join(' ');
          
          if (originalWords[i] && fixedWords[i]) {
            suggestions.push({
              id: `pattern-fix-${i}`,
              type: this.determineChangeType(originalWords[i], fixedWords[i]),
              original: originalWords[i],
              suggested: fixedWords[i],
              confidence: 'HIGH',
              reason: this.getChangeReason(originalWords[i], fixedWords[i]),
              businessRisk: this.assessWordChangeRisk(originalWords[i], fixedWords[i]),
              requiresReview: criticalErrors.length > 0,
              contextBefore,
              contextAfter
            });
          }
        }
      }
    }

    return suggestions;
  }

  /**
   * Generate currency-specific suggestions
   * Critical for Irish construction market
   */
  private generateCurrencySuggestions(text: string): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    const words = text.split(/\s+/);
    
    // Check for pound symbol usage (major error in Ireland)
    const poundMatches = text.match(/£(\d+(?:,\d+)*(?:\.\d+)?)/g);
    if (poundMatches) {
      poundMatches.forEach((match, index) => {
        const amount = match.replace('£', '');
        const numericValue = parseFloat(amount.replace(/,/g, ''));
        
        suggestions.push({
          id: `currency-pound-${index}`,
          type: 'currency',
          original: match,
          suggested: `€${amount}`,
          confidence: 'HIGH',
          reason: 'Ireland uses euros, not pounds',
          businessRisk: numericValue > 1000 ? 'CRITICAL' : 'HIGH',
          estimatedValue: numericValue,
          requiresReview: true,
          contextBefore: this.getContext(text, match, 'before'),
          contextAfter: this.getContext(text, match, 'after')
        });
      });
    }

    // Check for "pounds" terminology
    const poundWordMatches = text.match(/\b(\d+(?:,\d+)*(?:\.\d+)?)\s*pounds?\b/gi);
    if (poundWordMatches) {
      poundWordMatches.forEach((match, index) => {
        const amount = match.match(/\d+(?:,\d+)*(?:\.\d+)?/)?.[0] || '';
        const numericValue = parseFloat(amount.replace(/,/g, ''));
        
        suggestions.push({
          id: `currency-pounds-word-${index}`,
          type: 'currency',
          original: match,
          suggested: match.replace(/pounds?/gi, 'euros'),
          confidence: 'HIGH',
          reason: 'Irish currency terminology correction',
          businessRisk: numericValue > 1000 ? 'CRITICAL' : 'HIGH',
          estimatedValue: numericValue,
          requiresReview: true,
          contextBefore: this.getContext(text, match, 'before'),
          contextAfter: this.getContext(text, match, 'after')
        });
      });
    }

    return suggestions;
  }

  /**
   * Generate unit measurement suggestions
   * Standardize to metric system for Irish construction
   */
  private generateUnitSuggestions(text: string): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    
    // Common unit conversions needed in Irish construction
    const unitPatterns = [
      {
        pattern: /(\d+(?:\.\d+)?)\s*(?:feet|ft)\b/gi,
        replacement: (match: string, num: string) => `${(parseFloat(num) * 0.3048).toFixed(1)} metres`,
        type: 'units' as const,
        reason: 'Convert feet to metres (Irish standard)',
        risk: 'HIGH' as const
      },
      {
        pattern: /(\d+(?:\.\d+)?)\s*(?:yards?|yds?)\b/gi,
        replacement: (match: string, num: string) => `${(parseFloat(num) * 0.9144).toFixed(1)} metres`,
        type: 'units' as const,
        reason: 'Convert yards to metres (Irish standard)',
        risk: 'HIGH' as const
      },
      {
        pattern: /(\d+(?:\.\d+)?)\s*(?:inches?|in)\b/gi,
        replacement: (match: string, num: string) => `${(parseFloat(num) * 25.4).toFixed(0)}mm`,
        type: 'units' as const,
        reason: 'Convert inches to millimetres',
        risk: 'LOW' as const
      },
      {
        pattern: /(\d+(?:\.\d+)?)\s*mil\b/gi,
        replacement: (match: string, num: string) => `${num}mm`,
        type: 'units' as const,
        reason: 'Standardize millimetre abbreviation',
        risk: 'LOW' as const
      }
    ];

    unitPatterns.forEach((pattern, patternIndex) => {
      const matches = Array.from(text.matchAll(pattern.pattern));
      matches.forEach((match, matchIndex) => {
        const [fullMatch, num] = match;
        const suggested = pattern.replacement(fullMatch, num);
        
        suggestions.push({
          id: `units-${patternIndex}-${matchIndex}`,
          type: pattern.type,
          original: fullMatch,
          suggested,
          confidence: 'HIGH',
          reason: pattern.reason,
          businessRisk: pattern.risk,
          requiresReview: pattern.risk === 'HIGH',
          contextBefore: this.getContext(text, fullMatch, 'before'),
          contextAfter: this.getContext(text, fullMatch, 'after')
        });
      });
    });

    return suggestions;
  }

  /**
   * Generate safety terminology suggestions
   * Critical for construction site safety compliance
   */
  private generateSafetyTermSuggestions(text: string): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    
    // Safety-related term disambiguation
    const safetyPatterns = [
      {
        pattern: /\bppe\b/gi,
        suggested: 'PPE (Personal Protective Equipment)',
        reason: 'Clarify safety equipment abbreviation',
        risk: 'HIGH' as const
      },
      {
        pattern: /\bhard hat\b/gi,
        suggested: 'safety helmet',
        reason: 'Use proper safety equipment terminology',
        risk: 'MEDIUM' as const
      },
      {
        pattern: /\bsafety boots\b/gi,
        suggested: 'safety footwear',
        reason: 'Standardize safety equipment terms',
        risk: 'MEDIUM' as const
      }
    ];

    safetyPatterns.forEach((pattern, patternIndex) => {
      const matches = Array.from(text.matchAll(pattern.pattern));
      matches.forEach((match, matchIndex) => {
        const [fullMatch] = match;
        
        suggestions.push({
          id: `safety-${patternIndex}-${matchIndex}`,
          type: 'safety',
          original: fullMatch,
          suggested: pattern.suggested,
          confidence: 'MEDIUM',
          reason: pattern.reason,
          businessRisk: pattern.risk,
          requiresReview: pattern.risk === 'HIGH',
          contextBefore: this.getContext(text, fullMatch, 'before'),
          contextAfter: this.getContext(text, fullMatch, 'after')
        });
      });
    });

    return suggestions;
  }

  /**
   * Analyze overall business risk and determine review requirements
   */
  private analyzeBusinessRisk(suggestions: SmartSuggestion[]): {
    totalRiskScore: number;
    requiresReview: boolean;
    estimatedReviewTime: number;
    businessImpact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  } {
    let totalRiskScore = 0;
    let highestImpact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    let totalEstimatedValue = 0;
    
    // Calculate risk scores
    suggestions.forEach(suggestion => {
      // Risk scoring
      const riskScores = { LOW: 1, MEDIUM: 3, HIGH: 7, CRITICAL: 10 };
      totalRiskScore += riskScores[suggestion.businessRisk];
      
      // Track highest impact
      if (riskScores[suggestion.businessRisk] > riskScores[highestImpact]) {
        highestImpact = suggestion.businessRisk;
      }
      
      // Sum financial values
      if (suggestion.estimatedValue) {
        totalEstimatedValue += suggestion.estimatedValue;
      }
    });

    // Escalate impact based on total financial exposure
    if (totalEstimatedValue > 5000) {
      highestImpact = 'CRITICAL';
    } else if (totalEstimatedValue > 1000) {
      const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      if (riskLevels.indexOf(highestImpact) < riskLevels.indexOf('HIGH')) {
        highestImpact = 'HIGH';
      }
    }

    // Determine if manual review is required
    const requiresReview = (
      highestImpact === 'CRITICAL' || 
      highestImpact === 'HIGH' ||
      totalRiskScore > 10 ||
      suggestions.some(s => s.type === 'safety' && s.businessRisk !== 'LOW')
    );

    // Estimate review time (mobile-optimized)
    const highRiskCount = suggestions.filter(s => 
      s.businessRisk === 'CRITICAL' || s.businessRisk === 'HIGH'
    ).length;
    
    const estimatedReviewTime = requiresReview 
      ? Math.max(30, highRiskCount * 15) // 15 seconds per high-risk item, minimum 30 seconds
      : 10; // Quick batch approval

    return {
      totalRiskScore,
      requiresReview,
      estimatedReviewTime,
      businessImpact: highestImpact
    };
  }

  /**
   * Helper methods for suggestion generation
   */
  private determineChangeType(original: string, suggested: string): SmartSuggestion['type'] {
    // Simple heuristic to categorize change types
    if (/£|euro|pound/i.test(original) || /€|euro|pound/i.test(suggested)) {
      return 'currency';
    }
    if (/\d/.test(original) && /\d/.test(suggested)) {
      return 'amounts';
    }
    if (/mm|cm|m|metre|meter|feet|ft|inch/i.test(original)) {
      return 'units';
    }
    if (/safety|ppe|helmet|boots/i.test(original)) {
      return 'safety';
    }
    if (/concrete|steel|brick|block|cement/i.test(original)) {
      return 'materials';
    }
    if (/\d{1,2}:\d{2}|am|pm|morning|afternoon/i.test(original)) {
      return 'time';
    }
    return 'materials';
  }

  private getChangeReason(original: string, suggested: string): string {
    // Generate contextual reason for the change
    if (/£/.test(original) && /€/.test(suggested)) {
      return 'Currency correction: Ireland uses euros';
    }
    if (/pound/i.test(original) && /euro/i.test(suggested)) {
      return 'Currency terminology correction';
    }
    if (/\d+\s*mil/.test(original) && /\d+mm/.test(suggested)) {
      return 'Standardize measurement abbreviation';
    }
    return 'Construction terminology standardization';
  }

  private assessWordChangeRisk(original: string, suggested: string): SmartSuggestion['businessRisk'] {
    // Assess business risk of individual word changes
    if (/£|\bpound/i.test(original)) {
      const amount = parseFloat(original.replace(/[^\d.]/g, ''));
      return amount > 1000 ? 'CRITICAL' : 'HIGH';
    }
    if (/safety|ppe|helmet/i.test(original)) {
      return 'HIGH';
    }
    if (/\d+/.test(original)) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  private getContext(text: string, match: string, direction: 'before' | 'after'): string {
    const index = text.indexOf(match);
    if (index === -1) return '';
    
    if (direction === 'before') {
      const start = Math.max(0, index - 50);
      return text.substring(start, index).trim();
    } else {
      const end = Math.min(text.length, index + match.length + 50);
      return text.substring(index + match.length, end).trim();
    }
  }

  /**
   * Apply user decisions to transcription
   */
  public applyDecisions(
    originalText: string, 
    suggestions: SmartSuggestion[], 
    decisions: { [suggestionId: string]: 'accept' | 'reject' }
  ): {
    correctedText: string;
    appliedChanges: string[];
    rejectedChanges: string[];
  } {
    let correctedText = originalText;
    const appliedChanges: string[] = [];
    const rejectedChanges: string[] = [];

    // Sort suggestions by position in text (reverse order to avoid offset issues)
    const sortedSuggestions = suggestions
      .map(suggestion => ({
        ...suggestion,
        position: originalText.indexOf(suggestion.original)
      }))
      .filter(s => s.position !== -1)
      .sort((a, b) => b.position - a.position);

    // Apply accepted changes
    sortedSuggestions.forEach(suggestion => {
      const decision = decisions[suggestion.id];
      
      if (decision === 'accept') {
        // Replace the first occurrence of the original text with the suggestion
        correctedText = correctedText.replace(suggestion.original, suggestion.suggested);
        appliedChanges.push(`${suggestion.original} → ${suggestion.suggested}`);
      } else if (decision === 'reject') {
        rejectedChanges.push(`Kept: ${suggestion.original}`);
      }
    });

    console.log('📝 Applied user decisions:', {
      appliedChanges: appliedChanges.length,
      rejectedChanges: rejectedChanges.length,
      originalLength: originalText.length,
      correctedLength: correctedText.length
    });

    return {
      correctedText,
      appliedChanges,
      rejectedChanges
    };
  }
}

// Export singleton instance
export const smartSuggestionService = SmartSuggestionService.getInstance();