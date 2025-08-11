-- Story 1.2: Complete Multi-Tenant Security Implementation
-- Migration: Fix remaining RLS policies and ensure complete company data isolation
-- Task 5: Implement multi-tenant security

-- CRITICAL FIX: Enable RLS on whatsapp_submissions table
-- Migration 003 created policies but forgot to enable RLS
ALTER TABLE whatsapp_submissions ENABLE ROW LEVEL SECURITY;

-- Add company_id to processing_analytics table for multi-tenant isolation
ALTER TABLE processing_analytics 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Create index for company-based queries on processing_analytics
CREATE INDEX IF NOT EXISTS idx_processing_analytics_company_id 
ON processing_analytics(company_id);

-- Update existing processing_analytics records with company_id from whatsapp_submissions
UPDATE processing_analytics 
SET company_id = (
  SELECT ws.company_id 
  FROM whatsapp_submissions ws 
  WHERE ws.id = processing_analytics.submission_id
)
WHERE company_id IS NULL;

-- Drop existing RLS policies on processing_analytics and recreate with company isolation
DROP POLICY IF EXISTS "Users can view their own processing analytics" ON processing_analytics;
DROP POLICY IF EXISTS "System can insert processing analytics" ON processing_analytics;

-- New company-aware RLS policies for processing_analytics
CREATE POLICY "Users can view analytics in their company" ON processing_analytics
  FOR SELECT USING (
    company_id = (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert analytics for their company" ON processing_analytics
  FOR INSERT WITH CHECK (
    company_id = (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- Update storage policies for voice-notes bucket to include company context
-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload their own voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own voice notes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own voice notes" ON storage.objects;

-- New company-aware storage policies
-- Voice notes should be organized by company_id/user_id/filename structure
CREATE POLICY "Users can upload voice notes for their company" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'voice-notes' AND
    (storage.foldername(name))[1] = (
      SELECT company_id::text FROM users WHERE id = auth.uid()
    ) AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Users can view voice notes in their company" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'voice-notes' AND
    (storage.foldername(name))[1] = (
      SELECT company_id::text FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own voice notes" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'voice-notes' AND
    (storage.foldername(name))[1] = (
      SELECT company_id::text FROM users WHERE id = auth.uid()
    ) AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Create audit_logs table for security compliance and breach detection
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Audit event details
  event_type VARCHAR(50) NOT NULL,
  table_name VARCHAR(50),
  record_id UUID,
  action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE, SELECT
  
  -- Event data
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  
  -- Security context
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  
  -- Risk assessment
  risk_level VARCHAR(20) DEFAULT 'LOW', -- LOW, MEDIUM, HIGH, CRITICAL
  risk_factors TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit_logs - company admins and users can view their company's logs
CREATE POLICY "Users can view audit logs in their company" ON audit_logs
  FOR SELECT USING (
    company_id = (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- System can insert audit logs (service role only in production)
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Create indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_level ON audit_logs(risk_level);

-- Create security_alerts table for data breach detection
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Alert details
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Alert data
  trigger_data JSONB,
  affected_users UUID[],
  affected_records TEXT[],
  
  -- Alert status
  status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INVESTIGATING, RESOLVED, FALSE_POSITIVE
  assigned_to UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on security_alerts  
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for security_alerts - company admins can view/manage their company's alerts
CREATE POLICY "Company admins can view security alerts" ON security_alerts
  FOR SELECT USING (
    company_id = (
      SELECT u.company_id FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin')
    )
  );

CREATE POLICY "Company admins can update security alerts" ON security_alerts
  FOR UPDATE USING (
    company_id = (
      SELECT u.company_id FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin')
    )
  );

-- System can insert security alerts
CREATE POLICY "System can insert security alerts" ON security_alerts
  FOR INSERT WITH CHECK (true);

-- Create indexes for security alerts
CREATE INDEX IF NOT EXISTS idx_security_alerts_company_id ON security_alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON security_alerts(created_at DESC);

-- Create trigger function for automatic audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS trigger AS $$
DECLARE
  company_id_val UUID;
  user_id_val UUID;
  old_data_json JSONB;
  new_data_json JSONB;
  changed_fields_array TEXT[];
BEGIN
  -- Get current user and their company
  user_id_val := auth.uid();
  
  IF user_id_val IS NOT NULL THEN
    SELECT u.company_id INTO company_id_val 
    FROM users u WHERE u.id = user_id_val;
  END IF;
  
  -- Only audit if we have company context
  IF company_id_val IS NOT NULL THEN
    -- Prepare audit data based on operation
    CASE TG_OP
      WHEN 'INSERT' THEN
        new_data_json := row_to_json(NEW);
        old_data_json := NULL;
      WHEN 'UPDATE' THEN  
        new_data_json := row_to_json(NEW);
        old_data_json := row_to_json(OLD);
        -- Calculate changed fields
        SELECT array_agg(key) INTO changed_fields_array
        FROM jsonb_each(new_data_json) n
        WHERE n.value != COALESCE((old_data_json->n.key), 'null'::jsonb);
      WHEN 'DELETE' THEN
        new_data_json := NULL;
        old_data_json := row_to_json(OLD);
    END CASE;
    
    -- Insert audit log
    INSERT INTO audit_logs (
      company_id, user_id, event_type, table_name, 
      record_id, action, old_data, new_data, changed_fields
    ) VALUES (
      company_id_val, user_id_val, TG_TABLE_NAME::VARCHAR, TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id), TG_OP, old_data_json, new_data_json, changed_fields_array
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for key tables
CREATE TRIGGER audit_companies_trigger
  AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_users_trigger  
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_whatsapp_submissions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON whatsapp_submissions  
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create function for data breach detection
CREATE OR REPLACE FUNCTION detect_security_breaches()
RETURNS void AS $$
DECLARE
  alert_record RECORD;
BEGIN
  -- Detect unusual access patterns (e.g., user accessing multiple companies' data)
  FOR alert_record IN
    SELECT 
      DISTINCT u.company_id,
      u.id as user_id,
      COUNT(DISTINCT al.company_id) as companies_accessed
    FROM users u
    JOIN audit_logs al ON al.user_id = u.id
    WHERE al.created_at > NOW() - INTERVAL '1 hour'
      AND al.company_id != u.company_id
    GROUP BY u.company_id, u.id
    HAVING COUNT(DISTINCT al.company_id) > 1
  LOOP
    -- Create security alert for potential data breach
    INSERT INTO security_alerts (
      company_id, alert_type, severity, title, description,
      trigger_data, affected_users
    ) VALUES (
      alert_record.company_id,
      'DATA_BREACH_ATTEMPT',
      'CRITICAL',
      'Potential Cross-Company Data Access',
      'User attempted to access data from multiple companies, which should not be possible with proper RLS policies.',
      jsonb_build_object(
        'user_id', alert_record.user_id,
        'companies_accessed', alert_record.companies_accessed,
        'detection_time', NOW()
      ),
      ARRAY[alert_record.user_id]
    );
  END LOOP;
  
  -- Detect bulk data access (potential data exfiltration)
  FOR alert_record IN
    SELECT 
      u.company_id,
      u.id as user_id,
      COUNT(*) as access_count
    FROM users u
    JOIN audit_logs al ON al.user_id = u.id
    WHERE al.created_at > NOW() - INTERVAL '1 hour'
      AND al.action = 'SELECT'
      AND al.table_name IN ('whatsapp_submissions', 'processing_analytics')
    GROUP BY u.company_id, u.id
    HAVING COUNT(*) > 100 -- Threshold for bulk access
  LOOP
    INSERT INTO security_alerts (
      company_id, alert_type, severity, title, description,
      trigger_data, affected_users
    ) VALUES (
      alert_record.company_id,
      'BULK_DATA_ACCESS',
      'HIGH',
      'Unusual Data Access Pattern Detected',
      'User performed unusually high number of data access operations in short time period.',
      jsonb_build_object(
        'user_id', alert_record.user_id,
        'access_count', alert_record.access_count,
        'detection_time', NOW()
      ),
      ARRAY[alert_record.user_id]
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Security audit trail for all data access and modifications';
COMMENT ON TABLE security_alerts IS 'Security alerts and breach detection notifications';
COMMENT ON FUNCTION detect_security_breaches() IS 'Automated security breach detection based on audit logs';

-- Update processing_performance_summary view to include company isolation
DROP VIEW IF EXISTS processing_performance_summary;
CREATE OR REPLACE VIEW processing_performance_summary AS
SELECT 
  pa.processing_version,
  pa.company_id,
  COUNT(*) as total_submissions,
  AVG(pa.total_processing_time) as avg_processing_time_ms,
  AVG(pa.final_confidence - pa.original_confidence) as avg_confidence_improvement,
  AVG(pa.disambiguation_count) as avg_disambiguation_count,
  AVG(pa.total_cost) as avg_cost_usd,
  COUNT(*) FILTER (WHERE pa.critical_fixes_count > 0) as submissions_with_critical_fixes,
  DATE_TRUNC('day', pa.created_at) as date_group
FROM processing_analytics pa
WHERE pa.company_id = (SELECT company_id FROM users WHERE id = auth.uid())
GROUP BY pa.processing_version, pa.company_id, DATE_TRUNC('day', pa.created_at)
ORDER BY date_group DESC;

-- Create database function for cross-company violation detection
CREATE OR REPLACE FUNCTION detect_cross_company_violations(lookback_hours integer)
RETURNS TABLE (
  user_id UUID,
  user_email VARCHAR,
  user_company_id UUID, 
  user_company_name VARCHAR,
  target_company_id UUID,
  target_company_name VARCHAR,
  access_count BIGINT,
  first_violation TIMESTAMP WITH TIME ZONE,
  last_violation TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    u.id as user_id,
    u.email as user_email,
    u.company_id as user_company_id,
    uc.name as user_company_name,
    al.company_id as target_company_id,
    tc.name as target_company_name,
    COUNT(al.id) as access_count,
    MIN(al.created_at) as first_violation,
    MAX(al.created_at) as last_violation
  FROM users u
  JOIN companies uc ON uc.id = u.company_id
  JOIN audit_logs al ON al.user_id = u.id
  JOIN companies tc ON tc.id = al.company_id
  WHERE al.created_at >= NOW() - (lookback_hours || ' hours')::INTERVAL
    AND u.company_id != al.company_id  -- Cross-company access
    AND al.action IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
  GROUP BY u.id, u.email, u.company_id, uc.name, al.company_id, tc.name
  HAVING COUNT(al.id) > 0;
END;
$$;

-- Create function to run automated security analysis
CREATE OR REPLACE FUNCTION run_security_analysis(lookback_hours integer DEFAULT 1)
RETURNS TABLE (
  alert_type VARCHAR,
  severity VARCHAR,
  company_id UUID,
  description TEXT,
  affected_user_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER  
AS $$
BEGIN
  -- This function would be called by the security monitoring service
  -- Returns summary of detected security issues
  
  RETURN QUERY
  SELECT 
    'CROSS_COMPANY_ACCESS'::VARCHAR as alert_type,
    'CRITICAL'::VARCHAR as severity,
    v.user_company_id as company_id,
    'Cross-company access violations detected'::TEXT as description,
    1::INTEGER as affected_user_count
  FROM detect_cross_company_violations(lookback_hours) v
  
  UNION ALL
  
  -- Bulk access detection
  SELECT
    'BULK_DATA_ACCESS'::VARCHAR as alert_type,
    CASE WHEN COUNT(*) > 500 THEN 'CRITICAL'::VARCHAR ELSE 'HIGH'::VARCHAR END as severity,
    al.company_id,
    'Bulk data access detected - ' || COUNT(*) || ' requests in ' || lookback_hours || ' hours' as description,
    1::INTEGER as affected_user_count
  FROM audit_logs al
  WHERE al.created_at >= NOW() - (lookback_hours || ' hours')::INTERVAL
    AND al.action = 'SELECT'
    AND al.table_name IN ('whatsapp_submissions', 'processing_analytics')
  GROUP BY al.company_id, al.user_id
  HAVING COUNT(*) > 100;
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION detect_cross_company_violations(integer) TO service_role;
GRANT EXECUTE ON FUNCTION run_security_analysis(integer) TO service_role;

-- Migration completed successfully
-- Version: 1.2 Task 5
-- Date: 2025-08-11