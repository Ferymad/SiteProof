import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

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
    const { submission_id, user_id } = req.body;
    
    if (!submission_id || !user_id) {
      return res.status(400).json({
        detail: 'Missing required fields',
        required: ['submission_id', 'user_id']
      });
    }
    
    // Get submission details (bypass RLS for testing)
    const { data: submission, error: fetchError } = await supabase
      .from('whatsapp_submissions')
      .select('*')
      .eq('id', submission_id)
      .single();
    
    if (fetchError) {
      return res.status(404).json({
        detail: 'Submission not found',
        debug: { fetchError: fetchError.message, submission_id, user_id }
      });
    }
    
    if (!submission) {
      return res.status(404).json({
        detail: 'No submission data returned',
        debug: { submission_id, user_id }
      });
    }
    
    // For now, just return mock processing results
    return res.status(200).json({
      transcription: submission.whatsapp_text || "Mock transcription",
      transcription_confidence: 85,
      extracted_data: {
        amounts: ["€3,500", "15 cubic meters", "2 tonnes"],
        materials: ["concrete", "rebar", "blocks"],
        dates: ["tomorrow"],
        safety_concerns: ["scaffolding needs inspection"],
        work_status: "foundation pour planned"
      },
      extraction_confidence: 90,
      combined_confidence: 87,
      processing_time: {
        transcription: 2.5,
        extraction: 1.8,
        total: 4.3
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