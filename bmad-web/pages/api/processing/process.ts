import { NextApiRequest, NextApiResponse } from 'next';
import { TranscriptionService } from '@/lib/services/transcription.service';
import { ExtractionService } from '@/lib/services/extraction.service';
import { supabase } from '@/lib/supabase';

/**
 * Story 1A.2: Combined Processing Endpoint
 * SiteProof - Construction Evidence Machine
 * 
 * Handles complete processing pipeline: transcription + extraction
 * This is the main endpoint used by the UI for convenience
 * 
 * Future Django equivalent:
 * class ProcessingView(APIView):
 *     def post(self, request):
 *         # Process both transcription and extraction
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
    
    // Get submission details
    const { data: submission, error: fetchError } = await supabase
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
    
    // Return comprehensive response
    return res.status(200).json({
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
      status: 'completed'
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