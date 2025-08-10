import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create a test submission with sample transcription data
    const testData = {
      whatsapp_text: 'Audio message from construction site',
      transcription: 'delivery at 30 and safe farming project needs 50 pounds of concrete',
      confidence_score: 75, // Lower confidence to trigger more patterns
      processing_status: 'transcribed',
      voice_file_path: 'https://example.com/sample-audio.wav',
      extracted_data: {},
      transcription_metadata: {
        duration: 45,
        word_count: 12
      }
    };

    const { data, error } = await supabase
      .from('whatsapp_submissions')
      .insert(testData)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create test submission', details: error.message });
    }

    return res.status(200).json({
      success: true,
      submission: data,
      testUrl: `http://localhost:3003/validation?id=${data.id}`
    });

  } catch (error) {
    console.error('Test submission creation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}