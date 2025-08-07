# BMAD Construction - Web Interface

Ultra-minimal web interface for construction site WhatsApp data input and voice note upload.

## Story Implementation: 1A.1 Basic Web Interface

This implements the basic web form for MVP validation with:
- Simple email/password authentication via Supabase
- WhatsApp text input form
- Single voice note file upload
- Mobile-responsive design for construction sites

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Supabase**
   - Create a new Supabase project
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase URL and anon key

3. **Set up Database Schema**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy and paste the contents of `supabase-schema.sql` into the SQL editor
   - Click "Run" to execute the schema
   
   This will create:
   - `whatsapp_submissions` table with proper RLS policies
   - `voice-notes` storage bucket with file type and size limits
   - Necessary indexes and triggers for performance
   - Storage policies for secure file access

4. **Configure Email Authentication (Important)**
   - In your Supabase project, go to Authentication > Settings
   - Ensure "Confirm email" is enabled
   - Configure your email templates if needed
   - Users will receive confirmation emails after registration

5. **Run Development Server**
   ```bash
   npm run dev
   ```

## Features Implemented

- ✅ Simple HTML Form: Text area for WhatsApp messages + file upload
- ✅ Basic Authentication: Email/password login via Supabase with email confirmation
- ✅ Registration Flow: Clear success messages and email confirmation prompts
- ✅ Mobile Responsive: Large touch targets, mobile-first design
- ✅ File Storage: Voice notes stored in Supabase storage bucket with security policies

## Tech Stack

- **Frontend**: Next.js with TypeScript (Pages router)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS with construction-themed colors
- **File Upload**: Direct to Supabase storage with size/type validation

## Mobile Optimization

- Minimum touch target size: 48px
- Mobile-first responsive design (375px+)
- Large form inputs for easy mobile interaction
- Construction-themed color scheme (yellow/amber)
- Works reliably on iOS and Android browsers

## Troubleshooting

### "Could not find the table 'public.whatsapp_submissions' in the schema cache"
- Ensure you've run the `supabase-schema.sql` file in your Supabase SQL editor
- Check that the table was created successfully in the Table Editor
- Verify your Supabase URL and anon key are correct in `.env.local`

### Users not receiving confirmation emails
- Check your Supabase project's Authentication > Settings
- Ensure "Confirm email" is enabled
- Check spam/junk folders
- Configure custom SMTP if using a custom domain

### Registration success but no confirmation prompt
- This is now fixed - users will see a clear success message after registration
- Users must confirm their email before they can log in

## What's Next

This basic interface will be extended in subsequent stories:
- **Story 1A.2**: AI Processing Pipeline (Whisper transcription + GPT-4)
- **Story 1A.3**: Evidence Package Generation (PDF creation)

## File Structure

```
bmad-web/
├── pages/
│   ├── _app.tsx          # App configuration
│   └── index.tsx         # Main page with auth routing
├── components/
│   ├── AuthForm.tsx      # Login/signup form
│   └── WhatsAppForm.tsx  # Main data input form
├── lib/
│   └── supabase.ts       # Supabase client setup
└── styles/
    └── globals.css       # Tailwind CSS + custom styles
```