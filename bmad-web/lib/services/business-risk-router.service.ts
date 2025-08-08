/**
 * Story 1A.2.1: Business Risk Router Service
 * SiteProof - Construction Evidence Machine
 * 
 * Routes transcriptions based on business risk instead of fake confidence scores
 * Replaces confidence-based routing with real business impact assessment
 */

export type RoutingDecision = 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'URGENT_REVIEW';

export interface BusinessRiskAssessment {
  decision: RoutingDecision;
  riskScore: number; // 0-100 scale
  riskFactors: string[];
  reasoning: string;
  requiredActions: string[];
  estimatedValue?: number; // Monetary value if detected
  criticalPatterns: string[];
}

export interface RiskContext {
  transcription: string;
  audioQuality: 'high' | 'medium' | 'low';
  audioScore: number;
  duration?: number;
  fileSize: number;
  userId: string;
}

export class BusinessRiskRouterService {
  
  // Critical error patterns that force manual review
  private static readonly CRITICAL_ERROR_PATTERNS = [
    // Currency errors (Ireland uses euros, not pounds)
    { pattern: /£\d+/g, risk: 'currency_error', severity: 'high', description: 'Pound symbol detected (should be euros)' },
    { pattern: /\bpounds?\b/gi, risk: 'currency_error', severity: 'high', description: 'Pounds mentioned (should be euros)' },
    
    // Time format ambiguities
    { pattern: /\bat \d{1,2}(?!\d|:|am|pm)/gi, risk: 'time_ambiguity', severity: 'medium', description: 'Ambiguous time format' },
    { pattern: /\bat 30(?!\d)/gi, risk: 'time_error', severity: 'high', description: 'Likely time transcription error' },
    
    // Suspicious amounts
    { pattern: /€\d{4,}/g, risk: 'high_value', severity: 'high', description: 'High monetary value detected' },
    { pattern: /\b\d{4,}\s*euros?\b/gi, risk: 'high_value', severity: 'high', description: 'Large euro amount detected' },
    
    // Material quantity risks
    { pattern: /\d{3,}\s*(tonnes?|cubic\s*metres?|bags?)\b/gi, risk: 'large_quantity', severity: 'medium', description: 'Large material quantity' },
    
    // Safety-critical terms
    { pattern: /\b(accident|injury|unsafe|dangerous|emergency)\b/gi, risk: 'safety_critical', severity: 'urgent', description: 'Safety incident mentioned' },
    
    // Common transcription hallucinations
    { pattern: /\b(safe farming|tele porter)\b/gi, risk: 'hallucination', severity: 'medium', description: 'Likely transcription hallucination' }
  ];
  
  // High-value thresholds for automatic review
  private static readonly VALUE_THRESHOLDS = {
    URGENT: 10000,    // €10k+ requires urgent review
    MANUAL: 1000,     // €1k+ requires manual review
    AUTO_APPROVE: 500 // <€500 can auto-approve if no other risks
  };
  
  /**
   * Assess business risk and return routing decision
   */
  assessBusinessRisk(context: RiskContext): BusinessRiskAssessment {
    console.log('🎯 Starting business risk assessment:', {
      transcriptionLength: context.transcription.length,
      audioQuality: context.audioQuality,
      audioScore: context.audioScore
    });
    
    const riskFactors: string[] = [];
    const criticalPatterns: string[] = [];
    const requiredActions: string[] = [];
    let riskScore = 0;
    let maxSeverity: 'low' | 'medium' | 'high' | 'urgent' = 'low';
    let estimatedValue: number | undefined;
    
    // 1. Detect critical error patterns
    for (const errorPattern of BusinessRiskRouterService.CRITICAL_ERROR_PATTERNS) {
      const matches = context.transcription.match(errorPattern.pattern);
      if (matches) {
        riskFactors.push(errorPattern.description);
        criticalPatterns.push(...matches);
        
        // Add risk score based on severity
        switch (errorPattern.severity) {
          case 'urgent': 
            riskScore += 40; 
            maxSeverity = 'urgent';
            requiredActions.push('URGENT: Review immediately');
            break;
          case 'high': 
            riskScore += 25;
            if (maxSeverity !== 'urgent') maxSeverity = 'high';
            requiredActions.push('Manual review required');
            break;
          case 'medium': 
            riskScore += 15;
            if (!['urgent', 'high'].includes(maxSeverity)) maxSeverity = 'medium';
            break;
        }
        
        console.log(`🚨 Critical pattern detected: ${errorPattern.description}`, { matches });
      }
    }
    
    // 2. Assess monetary value risks
    estimatedValue = this.extractMonetaryValue(context.transcription);
    if (estimatedValue !== undefined) {
      if (estimatedValue >= BusinessRiskRouterService.VALUE_THRESHOLDS.URGENT) {
        riskScore += 35;
        maxSeverity = 'urgent';
        riskFactors.push(`High value transaction: €${estimatedValue.toLocaleString()}`);
        requiredActions.push('URGENT: High-value transaction review');
      } else if (estimatedValue >= BusinessRiskRouterService.VALUE_THRESHOLDS.MANUAL) {
        riskScore += 20;
        if (!['urgent'].includes(maxSeverity)) maxSeverity = 'high';
        riskFactors.push(`Significant value: €${estimatedValue.toLocaleString()}`);
        requiredActions.push('Manual review for value verification');
      }
    }
    
    // 3. Assess audio quality risks
    if (context.audioQuality === 'low' || context.audioScore < 50) {
      riskScore += 20;
      riskFactors.push('Low audio quality increases transcription error risk');
      if (maxSeverity === 'low') maxSeverity = 'medium';
    } else if (context.audioQuality === 'medium' || context.audioScore < 75) {
      riskScore += 10;
      riskFactors.push('Medium audio quality - transcription may have errors');
    }
    
    // 4. Assess duration risks (very short or very long)
    if (context.duration) {
      if (context.duration < 5) {
        riskScore += 10;
        riskFactors.push('Very short recording - may be incomplete');
      } else if (context.duration > 300) { // 5 minutes
        riskScore += 15;
        riskFactors.push('Long recording - higher chance of transcription drift');
      }
    }
    
    // 5. Check for hallucination indicators
    const hallucinationRisk = this.assessHallucinationRisk(context.transcription);
    if (hallucinationRisk.hasRisk) {
      riskScore += hallucinationRisk.score;
      riskFactors.push(...hallucinationRisk.factors);
      if (hallucinationRisk.severity === 'high' && !['urgent'].includes(maxSeverity)) {
        maxSeverity = 'high';
      }
    }
    
    // 6. Determine routing decision based on risk score and severity
    let decision: RoutingDecision;
    let reasoning: string;
    
    if (maxSeverity === 'urgent' || riskScore >= 80) {
      decision = 'URGENT_REVIEW';
      reasoning = 'Critical business risk detected requiring immediate attention';
    } else if (maxSeverity === 'high' || riskScore >= 45) {
      decision = 'MANUAL_REVIEW';
      reasoning = 'Significant business risk requires manual verification';
    } else if (riskScore >= 25) {
      decision = 'MANUAL_REVIEW';
      reasoning = 'Moderate risk factors present - manual review recommended';
    } else {
      decision = 'AUTO_APPROVE';
      reasoning = 'Low business risk - safe for automatic processing';
    }
    
    // Cap risk score at 100
    riskScore = Math.min(100, riskScore);
    
    const assessment: BusinessRiskAssessment = {
      decision,
      riskScore,
      riskFactors,
      reasoning,
      requiredActions,
      estimatedValue,
      criticalPatterns
    };
    
    console.log('🎯 Business risk assessment complete:', {
      decision,
      riskScore,
      factorCount: riskFactors.length,
      criticalPatternCount: criticalPatterns.length,
      estimatedValue
    });
    
    return assessment;
  }
  
  /**
   * Extract monetary values from transcription
   */
  private extractMonetaryValue(text: string): number | undefined {
    // Pattern to match various monetary formats
    const patterns = [
      /€(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,           // €1,250.00
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*euros?/gi,   // 1,250.00 euros
      /(\d{1,3}(?:,\d{3})*)\s*euros?\b/gi              // 1250 euros
    ];
    
    let maxValue = 0;
    let foundValue = false;
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const valueStr = match[1] || match[0].replace(/€|euros?/gi, '').trim();
        const value = parseFloat(valueStr.replace(/,/g, ''));
        
        if (!isNaN(value) && value > maxValue) {
          maxValue = value;
          foundValue = true;
        }
      }
    }
    
    return foundValue ? maxValue : undefined;
  }
  
  /**
   * Assess risk of AI hallucination in transcription
   */
  private assessHallucinationRisk(transcription: string): {
    hasRisk: boolean;
    score: number;
    factors: string[];
    severity: 'low' | 'medium' | 'high';
  } {
    const factors: string[] = [];
    let score = 0;
    let severity: 'low' | 'medium' | 'high' = 'low';
    
    // 1. Check for common hallucination patterns
    const hallucinationPatterns = [
      { pattern: /\bsafe farming\b/gi, description: 'Common Whisper hallucination: "safe farming" instead of "safe working"' },
      { pattern: /\btele porter\b/gi, description: 'Hallucination: "tele porter" instead of "teleporter"' },
      { pattern: /\b7\s*end\b/gi, description: 'Hallucination: "7 end" instead of "7N"' }
    ];
    
    for (const pattern of hallucinationPatterns) {
      if (pattern.pattern.test(transcription)) {
        factors.push(pattern.description);
        score += 10;
        severity = 'medium';
      }
    }
    
    // 2. Check for repetitive patterns (sign of hallucination)
    const words = transcription.toLowerCase().split(/\s+/);
    const wordCounts = new Map<string, number>();
    
    words.forEach(word => {
      if (word.length > 3) { // Only check meaningful words
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    });
    
    // Look for words repeated more than expected
    wordCounts.forEach((count, word) => {
      if (count > 5 && words.length > 50) { // Word repeated >5 times in longer text
        factors.push(`Suspicious repetition: "${word}" appears ${count} times`);
        score += 5;
        if (count > 10) {
          severity = 'high';
          score += 10;
        }
      }
    });
    
    // 3. Check for token expansion (sign of hallucination)
    const expectedTokenRatio = transcription.length / 4; // Rough estimate: 4 chars per token
    if (transcription.length > 1000 && words.length < expectedTokenRatio * 0.5) {
      factors.push('Unusual token/length ratio suggests possible hallucination');
      score += 15;
      severity = 'high';
    }
    
    return {
      hasRisk: factors.length > 0,
      score,
      factors,
      severity
    };
  }
  
  /**
   * Get human-readable routing explanation
   */
  getRoutingExplanation(assessment: BusinessRiskAssessment): string {
    let explanation = `Risk Score: ${assessment.riskScore}/100 - ${assessment.reasoning}\n\n`;
    
    if (assessment.estimatedValue) {
      explanation += `💰 Estimated Value: €${assessment.estimatedValue.toLocaleString()}\n`;
    }
    
    if (assessment.criticalPatterns.length > 0) {
      explanation += `🚨 Critical Patterns: ${assessment.criticalPatterns.join(', ')}\n`;
    }
    
    if (assessment.riskFactors.length > 0) {
      explanation += `⚠️ Risk Factors:\n${assessment.riskFactors.map(f => `  • ${f}`).join('\n')}\n`;
    }
    
    if (assessment.requiredActions.length > 0) {
      explanation += `📋 Required Actions:\n${assessment.requiredActions.map(a => `  • ${a}`).join('\n')}\n`;
    }
    
    return explanation;
  }
}