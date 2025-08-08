import { NextApiRequest, NextApiResponse } from 'next';
import { TranscriptionService } from '@/lib/services/transcription.service';
import { supabase } from '@/lib/supabase';

/**
 * Story 1A.2: AI Processing Pipeline - Transcription Endpoint
 * SiteProof - Construction Evidence Machine
 * 
 * Handles voice note transcription using OpenAI Whisper API
 * Structured for easy migration to Django: /api/processing/transcribe/
 * 
 * Future Django equivalent:
 * class TranscriptionView(APIView):
 *     def post(self, request):
 *         # Process voice note transcription
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
    
    // Process transcription
    const service = new TranscriptionService();
    const result = await service.processVoiceNote({
      fileUrl: file_url,
      userId: user_id,
      submissionId: submission_id
    });
    
    // Return Django-compatible response
    if (result.status === 'failed') {
      return res.status(500).json({
        detail: result.error || 'Transcription failed',
        status: 'failed'
      });
    }
    
    return res.status(200).json({
      transcription: result.transcription,
      confidence_score: result.confidence_score,
      processing_time: result.processing_time,
      word_count: result.word_count,
      duration: result.duration,
      status: 'completed'
    });
    
  } catch (error: any) {
    console.error('Transcription endpoint error:', error);
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