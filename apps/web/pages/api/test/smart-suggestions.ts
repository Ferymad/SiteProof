import { NextApiRequest, NextApiResponse } from 'next';
import { smartSuggestionService } from '@/lib/services/smart-suggestion.service';

/**
 * Story 1A.2.2 - Test endpoint for Smart Suggestion Review System
 * Generates sample suggestions for testing mobile UX
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Generate smart suggestions
    const analysis = await smartSuggestionService.generateSuggestions({
      text,
      confidence: 75,
      audioQuality: 80
    });

    return res.status(200).json({
      success: true,
      suggestions: analysis.suggestions,
      analysis: {
        total_risk_score: analysis.totalRiskScore,
        business_impact: analysis.businessImpact,
        estimated_review_time: analysis.estimatedReviewTime,
        requires_review: analysis.requiresReview
      }
    });

  } catch (error: any) {
    console.error('Smart suggestion test error:', error);
    return res.status(500).json({
      error: 'Failed to generate suggestions',
      details: error.message
    });
  }
}

// Test cases for development
export const TEST_CASES = {
  highRisk: "The concrete delivery cost £2,500 and the foundation is 150 feet long. Need safety boots and hard hats for the lads.",
  lowRisk: "Used 25 mil rebar and C25-30 concrete grade. JCP working fine this morning.",
  mixedRisk: "Delivery cost £500 at 30 this morning. Need 100 cubic meters of ready mixed concrete.",
  safetyFocus: "PPE inspection failed - hard hats damaged and safety boots worn out. Need replacement before work starts.",
  currencyFocus: "Material costs: concrete £1,200, steel £800, labour £2,000 pounds total"
};