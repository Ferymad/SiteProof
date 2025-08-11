import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { createClient } from '@supabase/supabase-js';
import { SimpleTranscriptionService } from '@/lib/services/simple-transcription.service';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  api: {
    bodyParser: false,
  },
};

interface ProcessResult {
  success: boolean;
  submissionId?: string;
  transcription?: string;
  confidence?: number;
  duration?: number;
  validationUrl?: string;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ProcessResult>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    console.log('🚀 Starting audio processing pipeline...');

    // Parse the uploaded file
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      // Temporarily remove filter for testing
      // filter: ({ mimetype }) => {
      //   return mimetype && (
      //     mimetype.includes('audio/') ||
      //     mimetype.includes('video/')
      //   );
      // },
    });

    const [fields, files] = await form.parse(req);
    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;

    if (!audioFile) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    console.log('📁 File received:', {
      name: audioFile.originalFilename,
      size: audioFile.size,
      type: audioFile.mimetype
    });

    // Validate file type
    const allowedExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.mp4'];
    const fileExtension = path.extname(audioFile.originalFilename || '').toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        error: `File type ${fileExtension} not supported. Allowed: ${allowedExtensions.join(', ')}`
      });
    }

    // Read file data for transcription
    const fileData = fs.readFileSync(audioFile.filepath);
    
    // Create initial database record
    const { data: submission, error: dbError } = await supabase
      .from('whatsapp_submissions')
      .insert({
        whatsapp_text: 'Audio processing in progress',
        processing_status: 'processing',
        transcription_metadata: {
          original_filename: audioFile.originalFilename,
          file_size: audioFile.size,
          mime_type: audioFile.mimetype,
          uploaded_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create database record'
      });
    }

    console.log('💾 Database record created:', submission.id);

    // Upload file to storage
    const timestamp = Date.now();
    const fileName = `audio_${timestamp}${fileExtension}`;
    const filePath = `audio-uploads/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(filePath, fileData, {
        contentType: audioFile.mimetype || 'audio/mpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError);
      console.log('⚠️ Continuing without storage upload - transcription will still work');
      // Note: Audio playback in ValidationTool will be limited without storage
      // To fix: Set up Supabase bucket 'audio-files' with public access
    }

    let publicUrl = '';
    if (!uploadError) {
      const { data: { publicUrl: url } } = supabase.storage
        .from('audio-files')
        .getPublicUrl(filePath);
      publicUrl = url;
    }

    // Transcribe audio using Whisper
    console.log('🎙️ Starting transcription...');
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'
      });
    }
    
    const transcriptionService = SimpleTranscriptionService.getInstance();
    const transcriptionResult = await transcriptionService.transcribeAudio(
      fileData,
      audioFile.originalFilename || fileName,
      {
        response_format: 'verbose_json',
        temperature: 0.1
      }
    );

    console.log('✅ Transcription completed:', {
      text: transcriptionResult.text.substring(0, 100) + '...',
      confidence: transcriptionResult.confidence,
      duration: transcriptionResult.duration
    });

    // Apply critical construction fixes using the real service
    const fixedText = transcriptionService.applyCriticalFixes(transcriptionResult.text);
    
    console.log('🔧 Applied critical fixes:', {
      original: transcriptionResult.text.substring(0, 50) + '...',
      fixed: fixedText.substring(0, 50) + '...',
      hasChanges: fixedText !== transcriptionResult.text
    });
    
    // Update database with transcription results
    const { error: updateError } = await supabase
      .from('whatsapp_submissions')
      .update({
        transcription: fixedText,
        raw_transcription: transcriptionResult.text,
        confidence_score: transcriptionResult.confidence,
        voice_file_path: publicUrl || null,
        processing_status: 'transcribed',
        transcription_metadata: {
          ...submission.transcription_metadata,
          duration: transcriptionResult.duration,
          language: transcriptionResult.language,
          segments_count: transcriptionResult.segments?.length,
          transcribed_at: new Date().toISOString(),
          critical_fixes_applied: fixedText !== transcriptionResult.text
        }
      })
      .eq('id', submission.id);

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update transcription results'
      });
    }

    // Clean up temporary file
    fs.unlinkSync(audioFile.filepath);

    const validationUrl = `${req.headers.origin || 'http://localhost:3002'}/validation?id=${submission.id}`;

    console.log('🎉 Processing completed successfully!');

    return res.status(200).json({
      success: true,
      submissionId: submission.id,
      transcription: fixedText,
      confidence: transcriptionResult.confidence,
      duration: transcriptionResult.duration,
      validationUrl
    });

  } catch (error) {
    console.error('❌ Processing error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown processing error'
    });
  }
}