# Epic 1A: Ultra-Minimal MVP - Core Validation (30 Days)

**Goal**: Validate core AI transcription accuracy and PDF generation value with minimum technical complexity.

**Success Criteria**: Prove that AI can accurately transcribe Irish construction voice notes and generate professional evidence packages that save significant time.

## Story 1A.1: Basic Web Interface
As a PM,
I want a simple web form to input WhatsApp data,
so that I can test the core transcription workflow.

### Acceptance Criteria
1. **Simple HTML Form**: Text area for WhatsApp messages + file upload for single voice note
2. **Basic Authentication**: Simple email/password login (no company management)
3. **Mobile Responsive**: Works on smartphone for on-site testing
4. **File Storage**: Voice notes stored in Supabase storage

## Story 1A.2: AI Processing Pipeline
As a PM,
I want voice notes transcribed with construction accuracy,
so that I can validate the core value proposition.

### Acceptance Criteria
1. **Whisper Integration**: Single voice note transcription via OpenAI API
2. **Construction Prompting**: Basic GPT-4 prompt for construction terminology
3. **Confidence Display**: Show confidence score to user
4. **Error Handling**: Basic error messages for failed processing

## Story 1A.3: Evidence Package Generation
As a PM,
I want a professional PDF output,
so that I can evaluate whether it's suitable for claims submission.

### Acceptance Criteria
1. **Basic PDF Template**: Simple professional template with transcription
2. **Photo Inclusion**: Attach photos from WhatsApp input
3. **Metadata**: Timestamp and basic project information
4. **Download**: Direct PDF download link

## 🛠 Ultra-Minimal Tech Stack
- **Frontend**: Basic Next.js pages (no complex state management)
- **Backend**: Django with minimal setup (no DRF initially)  
- **Database**: Supabase with basic schema
- **AI**: OpenAI Whisper + GPT-4 only
- **Deployment**: Single environment deployment
- **Storage**: Supabase storage for files

## 📊 Validation Success Metrics

**Technical Validation:**
- ✅ Can process Irish construction voice notes with >85% accuracy
- ✅ PDF output looks professional enough for internal use
- ✅ Processing time <60 seconds per voice note
- ✅ System handles typical WhatsApp message format

**Business Validation:**
- ✅ Saves >50% time vs manual transcription
- ✅ Construction terminology captured correctly
- ✅ Output suitable for informal claims documentation
- ✅ Interface usable on mobile construction sites

## 🚀 Graduation to Enterprise SaaS (Epic 1B)

**Trigger Conditions** (Any 2 of 3):
1. **Accuracy Validated**: >90% transcription accuracy on 20+ construction voice notes
2. **Time Savings Proven**: >60% reduction in evidence compilation time
3. **User Validation**: 3+ construction PMs confirm they would use this tool

**Upon Graduation**: Execute Epic 1B (Enterprise Foundation) with full infrastructure, multi-tenancy, CI/CD, and human validation workflows.

## ⚡ Implementation Timeline
- **Week 1**: Basic web interface + authentication
- **Week 2**: AI processing integration
- **Week 3**: PDF generation + styling  
- **Week 4**: Testing with real construction data + refinements