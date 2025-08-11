# SiteProof - Construction Evidence Machine

AI-powered construction evidence collection and processing system for validating site communications.

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
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Go to Settings > API to get your URL and anon key
   - Copy `.env.local.example` to `.env.local` and add your credentials:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your-project-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     OPENAI_API_KEY=your-openai-key
     TRANSCRIPTION_MODEL=gpt-4o-mini  # For better Irish accent accuracy
     ```

3. **Set up Database Schema**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy and paste the contents of `supabase-schema.sql` into the SQL editor
   - Click "Run" to execute the schema
   - This creates tables for submissions, storage buckets, and security policies
   
   This will create:
   - `whatsapp_submissions` table with proper RLS policies
   - `voice-notes` storage bucket with file type and size limits
   - Necessary indexes and triggers for performance
   - Storage policies for secure file access

4. **Configure OpenAI API (Story 1A.2)**
   - Get your API key from https://platform.openai.com/api-keys
   - Add `OPENAI_API_KEY=sk-your-key-here` to your `.env.local`
   - **Important**: You need access to GPT-4 for data extraction

5. **Update Database Schema**
   - **For new installations**: The schema in `supabase-schema.sql` includes all Story 1A.2 fields
   - **For existing 1A.1 installations**: Run `migrations/001_add_ai_processing_fields.sql`
   - This adds fields for transcription, extraction, and confidence scoring

6. **Configure Email Authentication (Important)**
   - In your Supabase project, go to Authentication > Settings
   - Ensure "Confirm email" is enabled
   - Configure your email templates if needed
   - Users will receive confirmation emails after registration

7. **Run Development Server**
   ```bash
   npm run dev
   ```

## Features Implemented

### Story 1A.1: Basic Web Interface ✅
- ✅ Simple HTML Form: Text area for WhatsApp messages + file upload
- ✅ Basic Authentication: Email/password login via Supabase with email confirmation
- ✅ Registration Flow: Clear success messages and email confirmation prompts
- ✅ Mobile Responsive: Large touch targets, mobile-first design
- ✅ File Storage: Voice notes stored in Supabase storage bucket with security policies

### Story 1A.2: AI Processing Pipeline ✅
- ✅ **Whisper Integration**: Voice note transcription via OpenAI Whisper API
- ✅ **Construction Prompting**: GPT-4 with Irish construction terminology optimization
- ✅ **Data Extraction**: Automatic extraction of amounts, materials, dates, safety concerns
- ✅ **Confidence Display**: Multi-level confidence scoring with visual indicators
- ✅ **Error Handling**: User-friendly error messages for processing failures
- ✅ **Hybrid Architecture**: Service layer structured for future Django migration

## Tech Stack

- **Frontend**: Next.js with TypeScript (Pages router)
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL with JSONB support
- **Storage**: Supabase Storage (25MB voice note limit)
- **AI Processing**: OpenAI Whisper (transcription) + GPT-4 (extraction)
- **Styling**: Tailwind CSS with construction-themed colors
- **Architecture**: Hybrid approach structured for Django migration

## Mobile Optimization

- Minimum touch target size: 48px
- Mobile-first responsive design (375px+)
- Large form inputs for easy mobile interaction
- Construction-themed color scheme (yellow/amber)
- Works reliably on iOS and Android browsers

## Troubleshooting

### Database Issues
- **"Could not find the table 'public.whatsapp_submissions' in the schema cache"**
  - Ensure you've run the `supabase-schema.sql` file in your Supabase SQL editor
  - For existing installations, run the migration file
  - Check that the table was created successfully in the Table Editor
  - Verify your Supabase URL and anon key are correct in `.env.local`

### Authentication Issues
- **Users not receiving confirmation emails**
  - Check your Supabase project's Authentication > Settings
  - Ensure "Confirm email" is enabled
  - Check spam/junk folders
  - Configure custom SMTP if using a custom domain

### AI Processing Issues
- **"Processing failed" or API errors**
  - Verify your OpenAI API key is correct in `.env.local`
  - Ensure you have GPT-4 access (required for data extraction)
  - Check OpenAI usage limits and billing status
  - Voice files must be under 25MB and in supported formats

- **Low confidence scores**
  - Ensure voice notes are recorded clearly with minimal background noise
  - Irish construction terminology is optimized but very thick accents may affect accuracy
  - Consider re-recording voice notes closer to the speaker

- **Extraction not finding construction data**
  - The AI looks for specific patterns (amounts with currency, material names, dates)
  - Include more context in voice notes ("We need 50 cubic meters of concrete")
  - WhatsApp text and voice transcription are both analyzed together

## What's Next

✅ **Story 1A.1**: Basic Web Interface (Complete)
✅ **Story 1A.2**: AI Processing Pipeline (Complete)
🔄 **Story 1A.3**: Evidence Package Generation (Next)
  - Professional PDF creation from processed data
  - Include transcriptions, extracted data, and photos
  - API endpoints ready at `/api/evidence/`
  - PDF service prepared in `/lib/services/`

## Testing the AI Processing

1. **Submit test data** with both WhatsApp text and a voice note
2. **Include construction terms** like "concrete", "steel", "€1,500", "tomorrow"
3. **Click "Process with AI"** to see transcription and extraction
4. **Check confidence scores** - green (85%+) is high confidence
5. **Review extracted data** for accuracy of amounts, materials, and dates

### Story 1A.2: AI Processing Features

**Voice Note Processing:**
- Automatic transcription using OpenAI Whisper
- Optimized for Irish construction site audio
- Construction-specific vocabulary prompting
- Confidence scoring based on audio quality

**Data Extraction:**
- GPT-4 analysis of transcriptions and WhatsApp text
- Extraction of amounts, materials, dates, safety concerns
- Work status summarization
- Construction-specific prompting for Irish terminology

**User Experience:**
- Real-time processing status indicators
- Confidence badges with color coding
- Structured display of extracted construction data
- High-value item warnings and Friday afternoon detection

### Hybrid Architecture

The project follows a hybrid architecture designed for easy migration to Django:
- **API Routes**: Structured to match Django URL patterns
- **Service Layer**: Business logic isolated for portability
- **Response Format**: Matches Django REST Framework conventions
- See `docs/1A-django-migration-plan.md` for migration details

## File Structure

```
bmad-web/
├── pages/
│   ├── api/                    # API routes (hybrid architecture)
│   │   ├── processing/         # Story 1A.2 endpoints
│   │   │   ├── transcribe.ts   # Voice transcription (placeholder)
│   │   │   └── extract.ts      # Data extraction (placeholder)
│   │   ├── evidence/           # Story 1A.3 endpoints
│   │   │   ├── generate.ts     # PDF generation (placeholder)
│   │   │   └── download/
│   │   │       └── [id].ts     # PDF download (placeholder)
│   │   └── submissions/        # Future refactor of 1A.1
│   ├── _app.tsx                # App configuration
│   └── index.tsx               # Main page with auth routing
├── components/
│   ├── AuthForm.tsx            # Login/signup form
│   └── WhatsAppForm.tsx        # Main data input form
├── lib/
│   ├── services/               # Business logic (portable to Django)
│   │   ├── transcription.service.ts  # Whisper integration (1A.2)
│   │   ├── extraction.service.ts     # GPT-4 extraction (1A.2)
│   │   ├── pdf.service.ts            # PDF generation (1A.3)
│   │   └── README.md                 # Service layer documentation
│   └── supabase.ts             # Supabase client setup
├── components/
│   ├── AuthForm.tsx            # Login/signup form
│   ├── WhatsAppForm.tsx        # Main data input form with AI processing
│   ├── ProcessingStatus.tsx    # AI processing results display (1A.2)
│   └── ConfidenceBadge.tsx     # Confidence scoring display (1A.2)
├── migrations/
│   └── 001_add_ai_processing_fields.sql  # Database migration for 1A.2
└── styles/
    └── globals.css             # Tailwind CSS + custom styles
```