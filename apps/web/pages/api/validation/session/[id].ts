import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

/**
 * API endpoint to fetch validation session data
 * GET /api/validation/session/[id] - Get submission data for validation
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      detail: 'Method not allowed',
      allowed_methods: ['GET']
    });
  }

  try {
    const { id: submissionId } = req.query;

    if (!submissionId || typeof submissionId !== 'string') {
      return res.status(400).json({
        detail: 'Invalid submission ID provided'
      });
    }

    console.log('🔍 Fetching validation session data for:', submissionId);

    // Fetch submission data from database (using actual schema columns)
    const { data: submission, error } = await supabase
      .from('whatsapp_submissions')
      .select(`
        id,
        user_id,
        voice_file_path,
        transcription,
        extracted_data,
        processing_status,
        confidence_score,
        context_type,
        context_confidence,
        raw_transcription,
        disambiguation_log,
        processing_stage,
        processing_cost,
        created_at,
        updated_at
      `)
      .eq('id', submissionId)
      .single();

    if (error || !submission) {
      console.error('Submission not found:', error);
      return res.status(404).json({
        detail: 'Validation session not found',
        submission_id: submissionId
      });
    }

    console.log('✅ Validation session data fetched:', {
      submissionId,
      hasTranscription: !!submission.transcription,
      hasVoiceFile: !!submission.voice_file_path,
      processingStatus: submission.processing_status,
      contextType: submission.context_type
    });

    // Extract transcription from available sources
    let transcription = '';
    
    // Primary source is the direct transcription column
    if (submission.transcription) {
      transcription = submission.transcription;
    } else if (submission.raw_transcription) {
      transcription = submission.raw_transcription;
    } else {
      transcription = 'No transcription available';
    }

    console.log('✅ Transcription data found:', {
      hasTranscription: !!transcription,
      transcriptionLength: transcription.length,
      source: submission.transcription ? 'direct' : submission.raw_transcription ? 'raw' : 'none'
    });

    // Return validation session data
    return res.status(200).json({
      submission_id: submissionId,
      transcription: transcription,
      voice_file_url: submission.voice_file_path,
      processing_status: submission.processing_status,
      confidence_score: submission.confidence_score,
      context_type: submission.context_type,
      context_confidence: submission.context_confidence,
      disambiguation_log: submission.disambiguation_log,
      processing_cost: submission.processing_cost,
      user_id: submission.user_id,
      created_at: submission.created_at,
      updated_at: submission.updated_at,
      // Add extracted data if available  
      extracted_data: submission.extracted_data || null,
      success: true
    });

  } catch (error: unknown) {
    console.error('Validation session API error:', error);
    return res.status(500).json({
      detail: error instanceof Error ? error.message : 'Internal server error',
      error: 'validation_session_error'
    });
  }
}