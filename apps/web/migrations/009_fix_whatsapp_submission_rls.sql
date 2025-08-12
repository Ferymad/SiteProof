-- Fix critical RLS policy for WhatsApp submissions
-- Story 1.3 - QA Critical Fix: RLS violations preventing message submissions

-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Users can insert their own submissions" ON whatsapp_submissions;
DROP POLICY IF EXISTS "Users can view their own submissions" ON whatsapp_submissions;
DROP POLICY IF EXISTS "Users can update their own submissions" ON whatsapp_submissions;
DROP POLICY IF EXISTS "Users can delete their own submissions" ON whatsapp_submissions;

-- Create new policies that validate both user ownership AND project access
CREATE POLICY "Users can insert submissions to accessible projects" ON whatsapp_submissions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (
      project_id IS NULL OR 
      project_id IN (
        SELECT p.id 
        FROM projects p
        JOIN users u ON p.company_id = u.company_id
        WHERE u.id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can view their own submissions" ON whatsapp_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions" ON whatsapp_submissions
  FOR UPDATE USING (
    auth.uid() = user_id AND
    (
      project_id IS NULL OR 
      project_id IN (
        SELECT p.id 
        FROM projects p
        JOIN users u ON p.company_id = u.company_id
        WHERE u.id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their own submissions" ON whatsapp_submissions
  FOR DELETE USING (auth.uid() = user_id);

-- Add comment for clarity
COMMENT ON POLICY "Users can insert submissions to accessible projects" ON whatsapp_submissions IS
'Allows users to insert WhatsApp submissions for projects within their company. Fixes critical RLS violation from Story 1.3 QA testing.';