-- SiteProof Migration: Add AI Processing Fields
-- Story 1A.2: Add fields for transcription and extraction
-- Run this if you already have an existing database from Story 1A.1

-- Add AI processing fields to existing table
ALTER TABLE whatsapp_submissions
ADD COLUMN IF NOT EXISTS transcription TEXT,
ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS extraction_confidence NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS extracted_data JSONB,
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS processing_error TEXT,
ADD COLUMN IF NOT EXISTS transcription_metadata JSONB,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add new indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_submissions_status ON whatsapp_submissions(processing_status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_submissions_processed_at ON whatsapp_submissions(processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_extracted_data_amounts ON whatsapp_submissions USING GIN ((extracted_data->'amounts'));
CREATE INDEX IF NOT EXISTS idx_extracted_data_materials ON whatsapp_submissions USING GIN ((extracted_data->'materials'));

-- Update storage bucket file size limit to 25MB
UPDATE storage.buckets 
SET file_size_limit = 26214400 -- 25MB
WHERE id = 'voice-notes';

-- Create enhanced view with processing status
DROP VIEW IF EXISTS whatsapp_submissions_with_user;
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

-- Update any existing pending submissions to have the new default status
UPDATE whatsapp_submissions 
SET processing_status = 'pending' 
WHERE processing_status IS NULL;

-- Add comment for documentation
COMMENT ON TABLE whatsapp_submissions IS 'SiteProof construction evidence submissions with AI processing capabilities (Story 1A.2)';
COMMENT ON COLUMN whatsapp_submissions.extracted_data IS 'JSON structure: {amounts: [], materials: [], dates: [], safety_concerns: [], work_status: string}';
COMMENT ON COLUMN whatsapp_submissions.processing_status IS 'Status: pending, transcribed, completed, failed, extraction_failed';
COMMENT ON COLUMN whatsapp_submissions.confidence_score IS 'Transcription confidence score (0-100)';
COMMENT ON COLUMN whatsapp_submissions.extraction_confidence IS 'Data extraction confidence score (0-100)';