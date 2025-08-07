# BMAD Web Setup Guide

## Quick Setup for Testing

### 1. Supabase Project Setup
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to Settings > API to get your URL and anon key
3. Copy `.env.local.example` to `.env.local` and add your credentials

### 2. Database Schema Setup
Run this SQL in your Supabase SQL Editor:

```sql
-- Create table for WhatsApp submissions
CREATE TABLE whatsapp_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  whatsapp_text TEXT,
  voice_file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for voice notes
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-notes', 'voice-notes', false);

-- Set up Row Level Security
ALTER TABLE whatsapp_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own submissions" ON whatsapp_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own submissions" ON whatsapp_submissions
  FOR SELECT USING (auth.uid() = user_id);

-- Storage policies
CREATE POLICY "Users can upload their own voice notes" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own voice notes" ON storage.objects
  FOR SELECT USING (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 3. Test the Application
```bash
npm run dev
```

Visit `http://localhost:3000` and test:
1. Create an account with email/password
2. Submit WhatsApp text and/or upload a voice note
3. Verify the data appears in your Supabase dashboard

### 4. Mobile Testing
- Test on actual mobile device using your local IP
- Verify file upload works on mobile browsers
- Check touch targets are large enough for construction site usage

## Ready for Story 1A.2
Once this interface is working, you can proceed to implement the AI processing pipeline (Whisper + GPT-4) in the next story.