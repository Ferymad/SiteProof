import { NextApiRequest, NextApiResponse } from 'next';
import { ExtractionService } from '@/lib/services/extraction.service';
import { supabase } from '@/lib/supabase';

/**
 * Story 1A.2: AI Processing Pipeline - Data Extraction Endpoint
 * SiteProof - Construction Evidence Machine
 * 
 * Extracts construction-specific data using GPT-4
 * Structured for easy migration to Django: /api/processing/extract/
 * 
 * Future Django equivalent:
 * class ExtractionView(APIView):
 *     def post(self, request):
 *         # Extract structured data from transcription
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
    const { submission_id, transcription, whatsapp_text, user_id } = req.body;
    
    if (!submission_id || !user_id) {
      return res.status(400).json({
        detail: 'Missing required fields',
        required: ['submission_id', 'user_id']
      });
    }
    
    if (!transcription && !whatsapp_text) {
      return res.status(400).json({
        detail: 'Either transcription or whatsapp_text must be provided'
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
    
    // Process extraction
    const service = new ExtractionService();
    const result = await service.extractData({
      transcription: transcription || '',
      whatsappText: whatsapp_text,
      userId: user_id,
      submissionId: submission_id
    });
    
    // Return Django-compatible response
    if (result.status === 'failed') {
      return res.status(500).json({
        detail: result.error || 'Extraction failed',
        status: 'failed'
      });
    }
    
    return res.status(200).json({
      extracted_data: result.extracted_data,
      confidence_score: result.confidence_score,
      processing_time: result.processing_time,
      status: 'completed'
    });
    
  } catch (error: any) {
    console.error('Extraction endpoint error:', error);
    return res.status(500).json({
      detail: error.message || 'Internal server error',
      status: 'error'
    });
  }
}

// Configure API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb' // Support larger text content
    }
  }
};