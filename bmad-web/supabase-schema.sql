-- BMAD Construction - Supabase Database Schema
-- Run this SQL in your Supabase SQL editor to set up the required tables and policies

-- Create table for WhatsApp submissions
CREATE TABLE whatsapp_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  whatsapp_text TEXT,
  voice_file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for voice notes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'voice-notes', 
  'voice-notes', 
  false, 
  10485760, -- 10MB limit
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

-- Optional: Create a view for easier querying with user email
CREATE VIEW whatsapp_submissions_with_user AS
SELECT 
  ws.*,
  au.email as user_email
FROM whatsapp_submissions ws
JOIN auth.users au ON ws.user_id = au.id;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;