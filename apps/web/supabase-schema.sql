-- SiteProof - Construction Evidence Machine Database Schema
-- Story 1A.2: Updated schema with AI processing fields
-- Run this SQL in your Supabase SQL editor to set up the required tables and policies

-- Create table for WhatsApp submissions with AI processing support
CREATE TABLE whatsapp_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Original input data
  whatsapp_text TEXT,
  voice_file_path TEXT,
  
  -- AI processing results (Story 1A.2)
  transcription TEXT,
  confidence_score NUMERIC(5,2), -- Transcription confidence 0-100
  extraction_confidence NUMERIC(5,2), -- Extraction confidence 0-100
  extracted_data JSONB, -- Structured extraction results
  
  -- Processing status tracking
  processing_status VARCHAR(50) DEFAULT 'pending',
  processing_error TEXT,
  transcription_metadata JSONB, -- Duration, word count, etc.
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create storage bucket for voice notes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'voice-notes', 
  'voice-notes', 
  false, 
  26214400, -- 25MB limit (WhatsApp max)
  ARRAY['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a']
);

-- Set up Row Level Security for whatsapp_submissions
ALTER TABLE whatsapp_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own submissions
CREATE POLICY "Users can insert their own submissions" ON whatsapp_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own submissions
CREATE POLICY "Users can view their own submissions" ON whatsapp_submissions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can update their own submissions
CREATE POLICY "Users can update their own submissions" ON whatsapp_submissions
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own submissions
CREATE POLICY "Users can delete their own submissions" ON whatsapp_submissions
  FOR DELETE USING (auth.uid() = user_id);

-- Storage policies for voice-notes bucket
-- Policy: Users can upload their own voice notes
CREATE POLICY "Users can upload their own voice notes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'voice-notes' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can view their own voice notes
CREATE POLICY "Users can view their own voice notes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'voice-notes' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own voice notes
CREATE POLICY "Users can delete their own voice notes" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'voice-notes' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at on whatsapp_submissions
CREATE TRIGGER update_whatsapp_submissions_updated_at 
    BEFORE UPDATE ON whatsapp_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_whatsapp_submissions_user_id ON whatsapp_submissions(user_id);
CREATE INDEX idx_whatsapp_submissions_created_at ON whatsapp_submissions(created_at DESC);
CREATE INDEX idx_whatsapp_submissions_status ON whatsapp_submissions(processing_status);
CREATE INDEX idx_whatsapp_submissions_processed_at ON whatsapp_submissions(processed_at DESC);

-- Create indexes on JSONB fields for efficient querying
CREATE INDEX idx_extracted_data_amounts ON whatsapp_submissions USING GIN ((extracted_data->'amounts'));
CREATE INDEX idx_extracted_data_materials ON whatsapp_submissions USING GIN ((extracted_data->'materials'));

-- Create enhanced view with processing status summary
CREATE VIEW submissions_with_processing_status AS
SELECT 
  ws.*,
  au.email as user_email,
  
  -- Processing summary fields
  CASE 
    WHEN ws.processing_status = 'completed' THEN 'Processing Complete'
    WHEN ws.processing_status = 'failed' THEN 'Processing Failed'
    WHEN ws.processing_status = 'transcribed' THEN 'Transcription Complete'
    WHEN ws.processing_status = 'pending' THEN 'Awaiting Processing'
    ELSE ws.processing_status
  END as status_display,
  
  -- Confidence level indicators
  CASE 
    WHEN GREATEST(ws.confidence_score, ws.extraction_confidence) >= 85 THEN 'High'
    WHEN GREATEST(ws.confidence_score, ws.extraction_confidence) >= 60 THEN 'Medium'
    WHEN GREATEST(ws.confidence_score, ws.extraction_confidence) > 0 THEN 'Low'
    ELSE 'Unknown'
  END as confidence_level,
  
  -- Data extraction summary
  COALESCE(
    (extracted_data->>'amounts')::json,
    '[]'::json
  ) as extracted_amounts,
  
  COALESCE(
    (extracted_data->>'materials')::json,
    '[]'::json
  ) as extracted_materials,
  
  COALESCE(
    (extracted_data->>'dates')::json,
    '[]'::json
  ) as extracted_dates
  
FROM whatsapp_submissions ws
JOIN auth.users au ON ws.user_id = au.id;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;