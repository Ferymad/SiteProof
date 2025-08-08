import { NextApiRequest, NextApiResponse } from 'next';
// EMERGENCY SECURITY FIX: OpenAI services ONLY on server-side
// These imports are SAFE here because this is an API route (server-side)
// NEVER import these in components - they contain OpenAI client code
import { TranscriptionService } from '@/lib/services/transcription.service';
import { smartSuggestionService } from '@/lib/services/smart-suggestion.service';
import { supabase } from '@/lib/supabase';

/**
 * EMERGENCY FIX: Server-side OpenAI Transcription Endpoint
 * 
 * Story 1A.2.1: Enhanced AI Processing Pipeline - Transcription Endpoint
 * SiteProof - Construction Evidence Machine
 * 
 * CRITICAL SECURITY ARCHITECTURE:
 * - All OpenAI client usage confined to server-side API routes
 * - Components communicate via fetch() calls ONLY
 * - Services with OpenAI dependencies are server-side ONLY
 * 
 * This endpoint resolves the browser security violation:
 * "Error: It looks like you're running in a browser-like environment"
 * 
 * Handles voice note transcription with business risk routing and critical error detection
 * Includes Story 1A.2.2 smart suggestion generation
 * 
 * Future Django equivalent:
 * class TranscriptionView(APIView):
 *     def post(self, request):
 *         # Process voice note transcription with business risk assessment
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      detail: 'Method not allowed',
      allowed_methods: ['POST']
    });
  }

  try {
    // Validate request body
    const { submission_id, file_url, user_id } = req.body;
    
    if (!submission_id || !file_url || !user_id) {
      return res.status(400).json({
        detail: 'Missing required fields',
        required: ['submission_id', 'file_url', 'user_id']
      });
    }
    
    // Verify user owns this submission
    const { data: submission, error: fetchError } = await supabase
      .from('whatsapp_submissions')
      .select('id, user_id')
      .eq('id', submission_id)
      .eq('user_id', user_id)
      .single();
    
    if (fetchError || !submission) {
      return res.status(404).json({
        detail: 'Submission not found or access denied'
      });
    }
    
    console.log('🔒 SECURE SERVER-SIDE PROCESSING: Transcription request validated');
    
    // Process transcription using OpenAI (server-side ONLY)
    const service = new TranscriptionService();
    const result = await service.processVoiceNote({
      fileUrl: file_url,
      userId: user_id,
      submissionId: submission_id
    });
    
    // Story 1A.2.1: Enhanced response with business risk routing
    if (result.status === 'failed') {
      return res.status(500).json({
        detail: result.error || 'Transcription failed',
        status: 'failed',
        routing_decision: result.routing_decision || 'MANUAL_REVIEW',
        critical_errors: result.critical_errors || [],
        hallucination_detected: result.hallucination_detected || false
      });
    }
    
    // Story 1A.2.2: Generate smart suggestions for transcription improvements
    let smartSuggestions: any[] = [];
    let suggestionAnalysis: any = undefined;
    try {
      console.log('🧠 SECURE SERVER-SIDE: Generating smart suggestions...');
      suggestionAnalysis = await smartSuggestionService.generateSuggestions({
        text: result.transcription || '',
        confidence: result.confidence_score,
        audioQuality: typeof result.audio_quality === 'object' ? result.audio_quality?.quality_score : result.audio_quality,
        userId: user_id,
        submissionId: submission_id
      });
      
      smartSuggestions = suggestionAnalysis.suggestions;
      
      console.log('🧠 Smart suggestions generated:', {
        suggestionCount: smartSuggestions.length,
        businessImpact: suggestionAnalysis.businessImpact,
        requiresReview: suggestionAnalysis.requiresReview,
        estimatedTime: suggestionAnalysis.estimatedReviewTime
      });
    } catch (error) {
      console.error('Smart suggestion generation failed:', error);
      // Don't fail the entire request if suggestions fail
      smartSuggestions = [];
      suggestionAnalysis = {
        totalRiskScore: 0,
        requiresReview: false,
        estimatedReviewTime: 10,
        businessImpact: 'LOW' as const
      };
    }
    
    // Determine HTTP status based on routing decision
    let httpStatus = 200;
    if (result.routing_decision === 'URGENT_REVIEW') {
      httpStatus = 202; // Accepted but requires urgent review
    } else if (result.routing_decision === 'MANUAL_REVIEW') {
      httpStatus = 202; // Accepted but requires manual review
    }
    
    // Update HTTP status for suggestion review requirements
    if (suggestionAnalysis && suggestionAnalysis.requiresReview && smartSuggestions.length > 0) {
      httpStatus = 202; // Accepted but requires suggestion review
    }
    
    console.log('🔒 SECURE RESPONSE: All OpenAI processing completed server-side');
    
    return res.status(httpStatus).json({
      transcription: result.transcription,
      confidence_score: result.confidence_score,
      processing_time: result.processing_time,
      word_count: result.word_count,
      duration: result.duration,
      status: smartSuggestions.length > 0 ? 'reviewing_suggestions' : 'completed',
      // Story 1A.2.1: Enhanced response fields
      routing_decision: result.routing_decision,
      business_risk: result.business_risk ? {
        decision: result.business_risk.decision,
        risk_score: result.business_risk.riskScore,
        reasoning: result.business_risk.reasoning,
        estimated_value: result.business_risk.estimatedValue,
        critical_patterns: result.business_risk.criticalPatterns,
        risk_factors: result.business_risk.riskFactors
      } : undefined,
      audio_quality: result.audio_quality,
      critical_errors: result.critical_errors || [],
      hallucination_detected: result.hallucination_detected || false,
      requires_review: result.routing_decision !== 'AUTO_APPROVE',
      // Story 1A.2.2: Smart suggestion fields
      smart_suggestions: smartSuggestions || [],
      original_transcription: result.transcription, // Store for comparison
      suggestion_analysis: suggestionAnalysis ? {
        total_risk_score: suggestionAnalysis.totalRiskScore,
        business_impact: suggestionAnalysis.businessImpact,
        estimated_review_time: suggestionAnalysis.estimatedReviewTime,
        requires_suggestion_review: suggestionAnalysis.requiresReview
      } : undefined
    });
    
  } catch (error: any) {
    console.error('SECURE TRANSCRIPTION ENDPOINT ERROR:', error);
    return res.status(500).json({
      detail: error.message || 'Internal server error',
      status: 'error'
    });
  }
}

// Configure API route to handle larger payloads for audio processing
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '30mb' // Support up to 30MB for processing metadata
    },
    responseLimit: '10mb'
  }
};