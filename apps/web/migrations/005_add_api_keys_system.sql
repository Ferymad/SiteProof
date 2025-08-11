-- Story 1.2 Task 6: API Authentication System
-- Migration: Add API keys table and related functionality for integrations

-- Create API keys table for third-party integrations
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- API key details
  name VARCHAR(255) NOT NULL, -- Human-readable name for the key
  description TEXT, -- Purpose/description of the API key
  key_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash of the actual key
  key_prefix VARCHAR(20) NOT NULL, -- First few characters for identification
  
  -- Permissions and limits
  permissions JSONB DEFAULT '[]', -- Array of permission strings
  scopes TEXT[] DEFAULT '{read}', -- API scopes (read, write, admin)
  
  -- Rate limiting configuration
  rate_limit_requests_per_minute INTEGER DEFAULT 60,
  rate_limit_requests_per_hour INTEGER DEFAULT 1000,
  rate_limit_requests_per_day INTEGER DEFAULT 10000,
  
  -- Security and lifecycle
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  user_agent TEXT, -- User agent that created the key
  ip_address INET, -- IP address that created the key
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for API keys
CREATE INDEX IF NOT EXISTS idx_api_keys_company_id ON api_keys(company_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON api_keys(created_by);

-- Enable RLS for API keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies for API keys
-- Company admins can manage their company's API keys
CREATE POLICY "Company admins can manage API keys" ON api_keys
  FOR ALL USING (
    company_id = (
      SELECT u.company_id FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- Create API key usage tracking table
CREATE TABLE IF NOT EXISTS api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Request details
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  
  -- Request metadata
  ip_address INET,
  user_agent TEXT,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  
  -- Rate limiting tracking
  requests_this_minute INTEGER DEFAULT 1,
  requests_this_hour INTEGER DEFAULT 1,
  requests_this_day INTEGER DEFAULT 1,
  
  -- Timestamps
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for time-based queries (computed via indexes instead of generated columns)
  date_hour TIMESTAMP WITH TIME ZONE,
  date_day DATE
);

-- Create indexes for API key usage tracking
CREATE INDEX IF NOT EXISTS idx_api_key_usage_api_key_id ON api_key_usage(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_company_id ON api_key_usage(company_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_timestamp ON api_key_usage(timestamp DESC);
-- Note: Time-based indexes removed due to PostgreSQL immutability restrictions
-- The timestamp index will still provide good performance for time-range queries
CREATE INDEX IF NOT EXISTS idx_api_key_usage_status ON api_key_usage(status_code);

-- Enable RLS for API key usage
ALTER TABLE api_key_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies for API key usage
-- Company members can view their company's API key usage
CREATE POLICY "Company members can view API key usage" ON api_key_usage
  FOR SELECT USING (
    company_id = (
      SELECT company_id FROM users WHERE id = auth.uid()
    )
  );

-- System can insert API key usage (service role only)
CREATE POLICY "System can insert API key usage" ON api_key_usage
  FOR INSERT WITH CHECK (true);

-- Create refresh tokens table for JWT token rotation
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Token details
  token_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash of refresh token
  family_id UUID NOT NULL, -- Token family for rotation tracking
  
  -- Security metadata
  ip_address INET,
  user_agent TEXT,
  device_fingerprint VARCHAR(128),
  
  -- Lifecycle
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Prevent concurrent token use
  UNIQUE(family_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Create indexes for refresh tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_company_id ON refresh_tokens(company_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family_id ON refresh_tokens(family_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_is_active ON refresh_tokens(is_active);

-- Enable RLS for refresh tokens
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies for refresh tokens
-- Users can manage their own refresh tokens
CREATE POLICY "Users can manage their own refresh tokens" ON refresh_tokens
  FOR ALL USING (user_id = auth.uid());

-- Create CORS origins table for managing allowed domains
CREATE TABLE IF NOT EXISTS cors_origins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  
  -- Origin details
  origin VARCHAR(255) NOT NULL, -- Full origin (https://app.example.com)
  description TEXT, -- Purpose of this origin
  
  -- Configuration
  is_active BOOLEAN DEFAULT true,
  allow_credentials BOOLEAN DEFAULT false,
  allowed_methods TEXT[] DEFAULT '{GET,POST,PUT,PATCH,DELETE}',
  allowed_headers TEXT[] DEFAULT '{Authorization,Content-Type}',
  max_age INTEGER DEFAULT 86400, -- Preflight cache time in seconds
  
  -- Security
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure unique origins per company
  UNIQUE(company_id, origin)
);

-- Create indexes for CORS origins
CREATE INDEX IF NOT EXISTS idx_cors_origins_company_id ON cors_origins(company_id);
CREATE INDEX IF NOT EXISTS idx_cors_origins_origin ON cors_origins(origin);
CREATE INDEX IF NOT EXISTS idx_cors_origins_is_active ON cors_origins(is_active);

-- Enable RLS for CORS origins
ALTER TABLE cors_origins ENABLE ROW LEVEL SECURITY;

-- RLS policies for CORS origins
-- Company admins can manage their company's CORS origins
CREATE POLICY "Company admins can manage CORS origins" ON cors_origins
  FOR ALL USING (
    company_id = (
      SELECT u.company_id FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- Create function to generate API key statistics
CREATE OR REPLACE FUNCTION get_api_key_stats(
  target_company_id UUID,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_requests BIGINT,
  successful_requests BIGINT,
  failed_requests BIGINT,
  avg_response_time_ms NUMERIC,
  top_endpoints JSON,
  requests_by_day JSON,
  rate_limit_violations BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*) as total_reqs,
      COUNT(*) FILTER (WHERE status_code < 400) as success_reqs,
      COUNT(*) FILTER (WHERE status_code >= 400) as failed_reqs,
      AVG(response_time_ms) as avg_response_time,
      COUNT(*) FILTER (WHERE status_code = 429) as rate_limit_violations_count
    FROM api_key_usage 
    WHERE company_id = target_company_id 
      AND timestamp >= CURRENT_TIMESTAMP - (days_back || ' days')::INTERVAL
  ),
  endpoints AS (
    SELECT json_agg(
      json_build_object(
        'endpoint', endpoint,
        'method', method, 
        'requests', request_count,
        'avg_response_time', avg_response_time
      ) ORDER BY request_count DESC
    ) as top_endpoints_json
    FROM (
      SELECT 
        endpoint,
        method,
        COUNT(*) as request_count,
        AVG(response_time_ms) as avg_response_time
      FROM api_key_usage 
      WHERE company_id = target_company_id 
        AND timestamp >= CURRENT_TIMESTAMP - (days_back || ' days')::INTERVAL
      GROUP BY endpoint, method
      ORDER BY request_count DESC
      LIMIT 10
    ) t
  ),
  daily_stats AS (
    SELECT json_agg(
      json_build_object(
        'date', date_day,
        'requests', daily_requests,
        'success_rate', success_rate
      ) ORDER BY date_day
    ) as requests_by_day_json
    FROM (
      SELECT 
        date_day,
        COUNT(*) as daily_requests,
        ROUND(
          COUNT(*) FILTER (WHERE status_code < 400) * 100.0 / COUNT(*), 
          2
        ) as success_rate
      FROM api_key_usage 
      WHERE company_id = target_company_id 
        AND timestamp >= CURRENT_TIMESTAMP - (days_back || ' days')::INTERVAL
      GROUP BY date_day
      ORDER BY date_day
    ) t
  )
  SELECT 
    s.total_reqs,
    s.success_reqs,
    s.failed_reqs,
    s.avg_response_time,
    COALESCE(e.top_endpoints_json, '[]'::json),
    COALESCE(d.requests_by_day_json, '[]'::json),
    s.rate_limit_violations_count
  FROM stats s
  CROSS JOIN endpoints e
  CROSS JOIN daily_stats d;
END;
$$;

-- Grant permissions on the function
GRANT EXECUTE ON FUNCTION get_api_key_stats(UUID, INTEGER) TO authenticated;

-- Create function to cleanup expired tokens and keys
CREATE OR REPLACE FUNCTION cleanup_expired_auth_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
  temp_count INTEGER := 0;
BEGIN
  -- Delete expired API keys
  DELETE FROM api_keys 
  WHERE expires_at IS NOT NULL 
    AND expires_at < CURRENT_TIMESTAMP;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete expired refresh tokens
  DELETE FROM refresh_tokens 
  WHERE expires_at < CURRENT_TIMESTAMP;
  
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Delete old API key usage records (keep 90 days)
  DELETE FROM api_key_usage 
  WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '90 days';
  
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  RETURN deleted_count;
END;
$$;

-- Create triggers for updated_at columns
CREATE TRIGGER update_api_keys_updated_at 
  BEFORE UPDATE ON api_keys 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cors_origins_updated_at 
  BEFORE UPDATE ON cors_origins 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add audit triggers for API keys management
CREATE TRIGGER audit_api_keys_trigger
  AFTER INSERT OR UPDATE OR DELETE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_cors_origins_trigger
  AFTER INSERT OR UPDATE OR DELETE ON cors_origins  
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Add comments for documentation
COMMENT ON TABLE api_keys IS 'API keys for third-party integrations with rate limiting and permissions';
COMMENT ON TABLE api_key_usage IS 'Usage tracking and analytics for API keys';
COMMENT ON TABLE refresh_tokens IS 'Refresh tokens for secure JWT token rotation';
COMMENT ON TABLE cors_origins IS 'Approved CORS origins per company for API access';

COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256 hash of the actual API key (one-way)';
COMMENT ON COLUMN api_keys.permissions IS 'JSON array of specific permissions granted to this key';
COMMENT ON COLUMN api_keys.scopes IS 'High-level scopes: read, write, admin';
COMMENT ON COLUMN refresh_tokens.family_id IS 'Token family ID for refresh token rotation security';

-- Migration completed successfully
-- Version: 1.2 Task 6 - API Keys System
-- Date: 2025-08-11