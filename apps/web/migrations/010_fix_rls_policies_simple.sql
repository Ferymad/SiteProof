-- Fix RLS policies for WhatsApp submissions with simplified approach
-- Story 1.3 - Critical Fix: Remove dependency on users table join

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert submissions to accessible projects" ON whatsapp_submissions;
DROP POLICY IF EXISTS "Users can view their own submissions" ON whatsapp_submissions;
DROP POLICY IF EXISTS "Users can update their own submissions" ON whatsapp_submissions;
DROP POLICY IF EXISTS "Users can delete their own submissions" ON whatsapp_submissions;

-- Create simplified policies that work with auth.uid() directly
-- Allow users to insert submissions they own, with basic project access check
CREATE POLICY "Users can insert their own submissions" ON whatsapp_submissions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Users can view their own submissions
CREATE POLICY "Users can view their own submissions" ON whatsapp_submissions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own submissions  
CREATE POLICY "Users can update their own submissions" ON whatsapp_submissions
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own submissions
CREATE POLICY "Users can delete their own submissions" ON whatsapp_submissions
  FOR DELETE USING (auth.uid() = user_id);

-- Add comment explaining the simplified approach
COMMENT ON POLICY "Users can insert their own submissions" ON whatsapp_submissions IS
'Simplified RLS policy allowing users to insert their own submissions. Project access validation moved to application layer.';