import { NextApiRequest, NextApiResponse } from 'next';
// STORY 1A.2.10: Speech Engine Migration - Server-side ONLY
// These imports are SAFE here because this is an API route (server-side)
// NEVER import these in components - they contain API client code
import { TranscriptionMigrationService } from '@/lib/services/transcription-migration.service';
import { smartSuggestionService } from '@/lib/services/smart-suggestion.service';
import { supabase } from '@/lib/supabase';

/**
 * Story 1A.2.10: Speech Engine Migration Endpoint
 * 
 * Intelligent transcription endpoint with AssemblyAI + Whisper fallback
 * SiteProof - Construction Evidence Machine
 * 
 * CRITICAL ARCHITECTURE UPDATE:
 * - Primary: AssemblyAI Universal-2 (93.4% accuracy, construction-optimized)
 * - Fallback: OpenAI Whisper (previous system for compatibility)
 * - Smart engine selection based on performance thresholds
 * - All speech engine usage confined to server-side API routes
 * 
 * This endpoint delivers on MVP requirements:
 * - >85% transcription accuracy for Irish construction sites
 * - <$0.01 per transcription cost
 * - Construction terminology recognition (C25/30, 804 stone, DPC, etc.)
 * - Critical error fixes ("at 30" → "at 8:30", "safe farming" → "safe working")
 * 
 * Includes Story 1A.2.2 smart suggestion generation
 * 
 * Future Django equivalent:
 * class TranscriptionView(APIView):
 *     def post(self, request):
 *         # Process with AssemblyAI + intelligent fallback
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
    
    // Story 1A.2.10: Process with AssemblyAI + intelligent fallback (server-side ONLY)
    const migrationService = new TranscriptionMigrationService();
    const result = await migrationService.processVoiceNote({
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