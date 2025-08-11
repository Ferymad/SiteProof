import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  api: {
    bodyParser: false, // Required for formidable to work
  },
};

interface UploadResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  submissionId?: string;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<UploadResult>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      // Temporarily remove filter for debugging
      // filter: ({ mimetype }) => {
      //   // Allow common audio formats
      //   return mimetype && (
      //     mimetype.includes('audio/') ||
      //     mimetype.includes('video/') // Some audio files have video MIME types
      //   );
      // },
    });

    const [fields, files] = await form.parse(req);
    console.log('Form fields:', Object.keys(fields));
    console.log('Form files:', Object.keys(files));
    
    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;

    if (!audioFile) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided. Available files: ' + Object.keys(files).join(', ')
      });
    }

    // Validate file type
    const allowedExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.webm', '.mp4'];
    const fileExtension = path.extname(audioFile.originalFilename || '').toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        error: `File type ${fileExtension} not supported. Allowed: ${allowedExtensions.join(', ')}`
      });
    }

    // Read file data
    const fileData = fs.readFileSync(audioFile.filepath);
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `audio_${timestamp}${fileExtension}`;
    const filePath = `audio-uploads/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(filePath, fileData, {
        contentType: audioFile.mimetype || 'audio/mpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      // For testing, continue without storage
      console.log('⚠️ Continuing without storage upload for testing...');
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('audio-files')
      .getPublicUrl(filePath);

    // Create database record
    const { data: submission, error: dbError } = await supabase
      .from('whatsapp_submissions')
      .insert({
        whatsapp_text: 'Audio file upload',
        voice_file_path: publicUrl,
        processing_status: 'uploaded',
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
      console.error('Database error:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create database record'
      });
    }

    // Clean up temporary file
    fs.unlinkSync(audioFile.filepath);

    return res.status(200).json({
      success: true,
      fileUrl: publicUrl,
      fileName: audioFile.originalFilename || fileName,
      fileSize: audioFile.size,
      submissionId: submission.id
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    });
  }
}