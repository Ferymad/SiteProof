/**
 * Simple Transcribe API Endpoint
 * Story 1A.3 - Clean MVP Implementation
 * 
 * POST /api/simple-transcribe
 * Accepts audio file, returns transcription with suggestions
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { SimpleTranscriptionService } from '@/lib/services/simple-transcription.service';

const simpleTranscriptionService = new SimpleTranscriptionService();
import { supabase } from '@/lib/supabase';
import formidable from 'formidable';
import fs from 'fs/promises';

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['POST']
    });
  }

  try {
    console.log('📝 Simple transcribe endpoint called');

    // Parse multipart form data
    const form = formidable({
      maxFileSize: 25 * 1024 * 1024, // 25MB max
    });

    const [fields, files] = await form.parse(req);
    
    // Get audio file
    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
    const userId = Array.isArray(fields.userId) ? fields.userId[0] : fields.userId;

    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Read file buffer
    const audioBuffer = await fs.readFile(audioFile.filepath);
    const filename = audioFile.originalFilename || 'audio.mp3';

    // Process with transcription service
    console.log('🎤 Processing audio...');
    const result = await simpleTranscriptionService.transcribeAudio(
      audioBuffer,
      filename
    );

    // Save to database
    console.log('💾 Saving to database...');
    const { data: submission, error: dbError } = await supabase
      .from('whatsapp_submissions')
      .insert({
        user_id: userId,
        raw_transcription: result.text,
        transcription: result.text, // Will be updated after validation
        processing_status: 'pending_validation',
        context_type: 'GENERAL',
        processing_stage: 'transcribed',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save submission');
    }

    // Clean up temp file
    await fs.unlink(audioFile.filepath).catch(console.error);

    // Return result for ValidationTool
    return res.status(200).json({
      success: true,
      submissionId: submission.id,
      transcription: result.text,
      suggestions: [], // No suggestions in simple transcription service
      metadata: { confidence: result.confidence, duration: result.duration },
    });

  } catch (error: any) {
    console.error('❌ Transcription endpoint error:', error);
    return res.status(500).json({
      error: 'Transcription failed',
      details: error.message,
    });
  }
}