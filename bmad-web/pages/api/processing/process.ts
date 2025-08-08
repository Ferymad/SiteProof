import { NextApiRequest, NextApiResponse } from 'next';
// EMERGENCY SECURITY FIX: OpenAI services ONLY on server-side
// These imports are SAFE here because this is an API route (server-side)
// NEVER import these in components - they contain OpenAI client code
import { TranscriptionService } from '@/lib/services/transcription.service';
import { ExtractionService } from '@/lib/services/extraction.service';
import { smartSuggestionService } from '@/lib/services/smart-suggestion.service';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * EMERGENCY FIX: Complete Server-Side AI Processing Pipeline
 * 
 * Story 1A.2: Combined Processing Endpoint + Story 1A.2.2 Smart Suggestions
 * SiteProof - Construction Evidence Machine
 * 
 * CRITICAL SECURITY ARCHITECTURE:
 * - All OpenAI client usage confined to server-side API routes
 * - Components communicate via fetch() calls ONLY
 * - Services with OpenAI dependencies are server-side ONLY
 * 
 * Handles complete processing pipeline: 
 * 1. Voice transcription with business risk routing
 * 2. Data extraction with GPT-4
 * 3. Smart suggestion generation (Story 1A.2.2)
 * 4. Business risk assessment
 * 
 * This endpoint resolves the browser security violation by ensuring
 * OpenAI client never executes in browser context.
 * 
 * Future Django equivalent:
 * class ProcessingView(APIView):
 *     def post(self, request):
 *         # Process transcription, extraction, and smart suggestions
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
    const { submission_id, user_id } = req.body;
    
    if (!submission_id || !user_id) {
      return res.status(400).json({
        detail: 'Missing required fields',
        required: ['submission_id', 'user_id']
      });
    }
    
    // Get submission details using admin client (bypasses RLS)
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('whatsapp_submissions')
      .select('*')
      .eq('id', submission_id)
      .eq('user_id', user_id)
      .single();
    
    if (fetchError || !submission) {
      return res.status(404).json({
        detail: 'Submission not found or access denied'
      });
    }
    
    let transcription = submission.transcription || '';
    let transcriptionResult = null;
    let extractionResult = null;
    let smartSuggestions: any[] = [];
    let suggestionAnalysis: any = undefined;
    
    // Step 1: Transcribe if we have a voice file and no existing transcription
    if (submission.voice_file_path && !transcription) {
      const transcriptionService = new TranscriptionService();
      transcriptionResult = await transcriptionService.processVoiceNote({
        fileUrl: submission.voice_file_path,
        userId: user_id,
        submissionId: submission_id
      });
      
      if (transcriptionResult.status === 'failed') {
        return res.status(500).json({
          detail: transcriptionResult.error || 'Transcription failed',
          step: 'transcription',
          status: 'failed'
        });
      }
      
      transcription = transcriptionResult.transcription;
      
      // Story 1A.2.2: Generate smart suggestions immediately after transcription
      try {
        console.log('🧠 Generating smart suggestions for transcription...');
        suggestionAnalysis = await smartSuggestionService.generateSuggestions({
          text: transcription,
          confidence: transcriptionResult.confidence_score,
          audioQuality: typeof transcriptionResult.audio_quality === 'object' 
            ? transcriptionResult.audio_quality?.quality_score 
            : transcriptionResult.audio_quality,
          userId: user_id,
          submissionId: submission_id
        });
        
        smartSuggestions = suggestionAnalysis.suggestions;
        
        console.log('🧠 Smart suggestions generated:', {
          suggestionCount: smartSuggestions.length,
          businessImpact: suggestionAnalysis.businessImpact,
          requiresReview: suggestionAnalysis.requiresReview
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
    }
    
    // Step 2: Extract data from transcription and/or WhatsApp text
    if (transcription || submission.whatsapp_text) {
      const extractionService = new ExtractionService();
      extractionResult = await extractionService.extractData({
        transcription,
        whatsappText: submission.whatsapp_text,
        userId: user_id,
        submissionId: submission_id
      });
      
      if (extractionResult.status === 'failed') {
        return res.status(500).json({
          detail: extractionResult.error || 'Extraction failed',
          step: 'extraction',
          status: 'failed'
        });
      }
    } else {
      return res.status(400).json({
        detail: 'No content to process. Provide either voice file or WhatsApp text.',
        status: 'failed'
      });
    }
    
    // Calculate combined confidence score
    const combinedConfidence = calculateCombinedConfidence(
      transcriptionResult?.confidence_score || 100, // If no transcription needed, assume perfect
      extractionResult?.confidence_score || 0
    );
    
    // Determine final processing status based on smart suggestions
    const finalStatus = smartSuggestions.length > 0 ? 'reviewing_suggestions' : 'completed';
    
    // Determine HTTP status based on suggestion requirements
    let httpStatus = 200;
    if (suggestionAnalysis && suggestionAnalysis.requiresReview && smartSuggestions.length > 0) {
      httpStatus = 202; // Accepted but requires suggestion review
    }
    if (transcriptionResult?.routing_decision === 'URGENT_REVIEW' || 
        transcriptionResult?.routing_decision === 'MANUAL_REVIEW') {
      httpStatus = 202; // Accepted but requires manual review
    }
    
    // Return comprehensive response with smart suggestions
    return res.status(httpStatus).json({
      transcription: transcription,
      transcription_confidence: transcriptionResult?.confidence_score,
      extracted_data: extractionResult?.extracted_data,
      extraction_confidence: extractionResult?.confidence_score,
      combined_confidence: combinedConfidence,
      processing_time: {
        transcription: transcriptionResult?.processing_time || 0,
        extraction: extractionResult?.processing_time || 0,
        total: (transcriptionResult?.processing_time || 0) + (extractionResult?.processing_time || 0)
      },
      status: finalStatus,
      
      // Story 1A.2.1: Enhanced transcription response fields
      routing_decision: transcriptionResult?.routing_decision,
      business_risk: transcriptionResult?.business_risk ? {
        decision: transcriptionResult.business_risk.decision,
        risk_score: transcriptionResult.business_risk.riskScore,
        reasoning: transcriptionResult.business_risk.reasoning,
        estimated_value: transcriptionResult.business_risk.estimatedValue,
        critical_patterns: transcriptionResult.business_risk.criticalPatterns,
        risk_factors: transcriptionResult.business_risk.riskFactors
      } : undefined,
      audio_quality: transcriptionResult?.audio_quality,
      critical_errors: transcriptionResult?.critical_errors || [],
      hallucination_detected: transcriptionResult?.hallucination_detected || false,
      requires_review: transcriptionResult?.routing_decision !== 'AUTO_APPROVE',
      
      // Story 1A.2.2: Smart suggestion response fields
      smart_suggestions: smartSuggestions,
      original_transcription: transcription, // Store for suggestion comparison
      suggestion_analysis: suggestionAnalysis ? {
        total_risk_score: suggestionAnalysis.totalRiskScore,
        business_impact: suggestionAnalysis.businessImpact,
        estimated_review_time: suggestionAnalysis.estimatedReviewTime,
        requires_suggestion_review: suggestionAnalysis.requiresReview
      } : undefined
    });
    
  } catch (error: any) {
    console.error('Processing endpoint error:', error);
    return res.status(500).json({
      detail: error.message || 'Internal server error',
      status: 'error'
    });
  }
}

/**
 * Calculate combined confidence score from transcription and extraction
 */
function calculateCombinedConfidence(transcriptionConfidence: number, extractionConfidence: number): number {
  // Weight transcription more heavily as it's the foundation
  const transcriptionWeight = 0.6;
  const extractionWeight = 0.4;
  
  const combined = (transcriptionConfidence * transcriptionWeight) + (extractionConfidence * extractionWeight);
  return Math.round(combined);
}

// Configure API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '30mb'
    },
    responseLimit: '10mb'
  }
};