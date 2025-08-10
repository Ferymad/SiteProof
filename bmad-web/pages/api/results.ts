import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TranscriptionResult {
  id: string;
  originalText: string;
  finalText: string;
  confidence: number;
  createdAt: string;
  duration?: number;
  status: string;
  hasAudio: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all completed transcriptions from the database
    const { data: submissions, error } = await supabase
      .from('whatsapp_submissions')
      .select(`
        id,
        transcription,
        raw_transcription,
        confidence_score,
        created_at,
        processing_status,
        voice_file_path,
        transcription_metadata
      `)
      .or('processing_status.eq.transcribed,processing_status.eq.validated')
      .order('created_at', { ascending: false })
      .limit(50); // Limit to most recent 50 results

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch results' });
    }

    // Transform database records into the format expected by the frontend
    const results: TranscriptionResult[] = (submissions || []).map(submission => {
      const metadata = submission.transcription_metadata || {};
      
      return {
        id: submission.id,
        originalText: submission.raw_transcription || submission.transcription || '',
        finalText: submission.transcription || '',
        confidence: submission.confidence_score || 0,
        createdAt: submission.created_at,
        duration: metadata.duration,
        status: submission.processing_status || 'unknown',
        hasAudio: !!(submission.voice_file_path)
      };
    });

    return res.status(200).json({
      success: true,
      results,
      total: results.length
    });

  } catch (error) {
    console.error('Results API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}