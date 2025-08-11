-- Story 1A.2.3: Database Schema Updates for Context-Aware Processing
-- Migration: Add context-aware processing fields to whatsapp_submissions table

-- Add new columns for context-aware processing
ALTER TABLE whatsapp_submissions 
ADD COLUMN IF NOT EXISTS context_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS context_confidence NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS raw_transcription TEXT,
ADD COLUMN IF NOT EXISTS disambiguation_log JSONB,
ADD COLUMN IF NOT EXISTS processing_stage VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS processing_progress INTEGER DEFAULT 0 CHECK (processing_progress >= 0 AND processing_progress <= 100),
ADD COLUMN IF NOT EXISTS processing_message TEXT,
ADD COLUMN IF NOT EXISTS processing_cost NUMERIC(10,6) DEFAULT 0.00; -- API costs in USD

-- Add index on processing_stage for efficient querying
CREATE INDEX IF NOT EXISTS idx_whatsapp_submissions_processing_stage 
ON whatsapp_submissions(processing_stage);

-- Add index on context_type for analytics
CREATE INDEX IF NOT EXISTS idx_whatsapp_submissions_context_type 
ON whatsapp_submissions(context_type);

-- Add index on user_id and processing_stage for user dashboards
CREATE INDEX IF NOT EXISTS idx_whatsapp_submissions_user_processing 
ON whatsapp_submissions(user_id, processing_stage);

-- Update processing_status enum to include new advanced statuses
-- Note: PostgreSQL doesn't support ALTER TYPE ADD VALUE in transactions,
-- so we use CHECK constraints instead

-- Add constraint for context_type values
ALTER TABLE whatsapp_submissions 
ADD CONSTRAINT check_context_type 
CHECK (context_type IN ('MATERIAL_ORDER', 'TIME_TRACKING', 'SAFETY_REPORT', 'PROGRESS_UPDATE', 'GENERAL') OR context_type IS NULL);

-- Add constraint for processing_stage values  
ALTER TABLE whatsapp_submissions 
ADD CONSTRAINT check_processing_stage 
CHECK (processing_stage IN ('pending', 'transcription', 'context_detection', 'disambiguation', 'complete', 'error', 'manual_review', 'transcribed_advanced'));

-- Update existing processing_status values to be more specific
UPDATE whatsapp_submissions 
SET processing_status = 'transcribed_legacy' 
WHERE processing_status = 'transcribed' AND context_type IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN whatsapp_submissions.context_type IS 'Detected conversation context (MATERIAL_ORDER, TIME_TRACKING, SAFETY_REPORT, PROGRESS_UPDATE, GENERAL)';
COMMENT ON COLUMN whatsapp_submissions.context_confidence IS 'Confidence score for context detection (0-100)';
COMMENT ON COLUMN whatsapp_submissions.raw_transcription IS 'Original transcription before context-aware improvements';
COMMENT ON COLUMN whatsapp_submissions.disambiguation_log IS 'Log of disambiguation changes made during processing';
COMMENT ON COLUMN whatsapp_submissions.processing_stage IS 'Current processing stage for real-time updates';
COMMENT ON COLUMN whatsapp_submissions.processing_progress IS 'Processing progress percentage (0-100)';
COMMENT ON COLUMN whatsapp_submissions.processing_message IS 'Human-readable processing status message';
COMMENT ON COLUMN whatsapp_submissions.processing_cost IS 'Total API cost for processing this submission (USD)';

-- Create table for processing analytics (optional)
CREATE TABLE IF NOT EXISTS processing_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES whatsapp_submissions(id) ON DELETE CASCADE,
  processing_version VARCHAR(20) DEFAULT '1A.2.3',
  
  -- Performance metrics
  total_processing_time INTEGER, -- milliseconds
  pass1_duration INTEGER, -- Whisper transcription time
  pass2_duration INTEGER, -- Context detection time  
  pass3_duration INTEGER, -- Disambiguation time
  
  -- Quality metrics
  original_confidence NUMERIC(5,2),
  final_confidence NUMERIC(5,2),
  disambiguation_count INTEGER DEFAULT 0,
  critical_fixes_count INTEGER DEFAULT 0,
  
  -- Cost tracking
  whisper_cost NUMERIC(10,6),
  context_cost NUMERIC(10,6),
  disambiguation_cost NUMERIC(10,6),
  total_cost NUMERIC(10,6),
  
  -- A/B Testing data
  ab_test_group VARCHAR(20), -- 'legacy', 'advanced', 'control'
  accuracy_comparison VARCHAR(20), -- 'better', 'similar', 'worse'
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  
  UNIQUE(submission_id) -- One analytics record per submission
);

-- Enable RLS for processing_analytics
ALTER TABLE processing_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view analytics for their own submissions
CREATE POLICY "Users can view their own processing analytics" ON processing_analytics
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM whatsapp_submissions ws 
      WHERE ws.id = submission_id AND ws.user_id = auth.uid()
    )
  );

-- Policy: System can insert analytics (server-side only)
CREATE POLICY "System can insert processing analytics" ON processing_analytics
  FOR INSERT WITH CHECK (true); -- Will be restricted to service role in production

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_processing_analytics_version_created 
ON processing_analytics(processing_version, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_processing_analytics_ab_test 
ON processing_analytics(ab_test_group, created_at DESC);

-- Create view for easy analytics querying
CREATE OR REPLACE VIEW processing_performance_summary AS
SELECT 
  processing_version,
  COUNT(*) as total_submissions,
  AVG(total_processing_time) as avg_processing_time_ms,
  AVG(final_confidence - original_confidence) as avg_confidence_improvement,
  AVG(disambiguation_count) as avg_disambiguation_count,
  AVG(total_cost) as avg_cost_usd,
  COUNT(*) FILTER (WHERE critical_fixes_count > 0) as submissions_with_critical_fixes,
  DATE_TRUNC('day', created_at) as date_group
FROM processing_analytics 
GROUP BY processing_version, DATE_TRUNC('day', created_at)
ORDER BY date_group DESC;

-- Grant permissions for the view
GRANT SELECT ON processing_performance_summary TO authenticated;

-- Migration completed successfully
-- Version: 1A.2.3
-- Date: 2025-08-09