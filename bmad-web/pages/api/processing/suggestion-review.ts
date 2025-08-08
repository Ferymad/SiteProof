import { NextApiRequest, NextApiResponse } from 'next';
import { smartSuggestionService } from '@/lib/services/smart-suggestion.service';
import { supabase } from '@/lib/supabase';

/**
 * Story 1A.2.2: Smart Suggestion Review API Endpoint
 * Server-side endpoint for applying user decisions to smart suggestions
 * 
 * This endpoint handles the application of user decisions without exposing
 * OpenAI client to browser context.
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      detail: 'Method not allowed',
      allowed_methods: ['POST']
    });
  }

  try {
    const { 
      submission_id, 
      user_id, 
      original_transcription,
      suggestions,
      decisions 
    } = req.body;
    
    if (!submission_id || !user_id || !original_transcription || !suggestions || !decisions) {
      return res.status(400).json({
        detail: 'Missing required fields',
        required: ['submission_id', 'user_id', 'original_transcription', 'suggestions', 'decisions']
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
    
    // Apply user decisions to the transcription
    const correctionResult = smartSuggestionService.applyDecisions(
      original_transcription,
      suggestions,
      decisions
    );
    
    console.log('📝 Applied user decisions via API:', {
      submissionId: submission_id,
      appliedChanges: correctionResult.appliedChanges.length,
      rejectedChanges: correctionResult.rejectedChanges.length,
      originalLength: original_transcription.length,
      correctedLength: correctionResult.correctedText.length
    });

    return res.status(200).json({
      corrected_text: correctionResult.correctedText,
      applied_changes: correctionResult.appliedChanges,
      rejected_changes: correctionResult.rejectedChanges,
      status: 'completed'
    });
    
  } catch (error: any) {
    console.error('Suggestion review endpoint error:', error);
    return res.status(500).json({
      detail: error.message || 'Internal server error',
      status: 'error'
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    },
    responseLimit: '5mb'
  }
};