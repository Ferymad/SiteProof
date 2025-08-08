# Construction Evidence Machine - Ultra-Minimal MVP (Technical Validation)

## 🎯 Ultra-Minimal MVP Purpose

**Goal**: Validate core AI transcription accuracy and PDF generation value with minimum technical complexity in **30 days** instead of 90 days.

**Success Criteria**: Prove that AI can accurately transcribe Irish construction voice notes and generate professional evidence packages that save significant time.

## 🔥 Absolute Essential Features Only

### **Epic 1: Core Validation (30 days)**

#### **Story 1.1: Basic Web Interface**
As a PM,
I want a simple web form to input WhatsApp data,
so that I can test the core transcription workflow.

**Acceptance Criteria:**
1. **Simple HTML Form**: Text area for WhatsApp messages + file upload for single voice note
2. **Basic Authentication**: Simple email/password login (no company management)
3. **Mobile Responsive**: Works on smartphone for on-site testing
4. **File Storage**: Voice notes stored in Supabase storage

#### **Story 1.2: AI Processing Pipeline**
As a PM,
I want voice notes transcribed with construction accuracy,
so that I can validate the core value proposition.

**Acceptance Criteria:**
1. **Whisper Integration**: Single voice note transcription via OpenAI API
2. **Construction Prompting**: Basic GPT-4 prompt for construction terminology
3. **Confidence Display**: Show confidence score to user
4. **Error Handling**: Basic error messages for failed processing

#### **Story 1.3: Evidence Package Generation**
As a PM,
I want a professional PDF output,
so that I can evaluate whether it's suitable for claims submission.

**Acceptance Criteria:**
1. **Basic PDF Template**: Simple professional template with transcription
2. **Photo Inclusion**: Attach photos from WhatsApp input
3. **Metadata**: Timestamp and basic project information
4. **Download**: Direct PDF download link

## 🚫 Explicitly Excluded from Ultra-Minimal MVP

**Infrastructure Complexity:**
- ❌ CI/CD pipelines (manual deployment)
- ❌ Monitoring and alerting (basic error logs only)
- ❌ Auto-generated API docs (not needed for validation)

**User Management:**
- ❌ Multi-tenant company management
- ❌ Role-based permissions
- ❌ Team collaboration features

**Human Validation:**
- ❌ Validation queue dashboard
- ❌ Admin interfaces
- ❌ Workflow management

**Advanced Features:**
- ❌ Real-time updates
- ❌ Project management
- ❌ Search functionality
- ❌ Analytics and reporting
- ❌ API integrations
- ❌ Vector similarity search

## 🛠 Ultra-Minimal Tech Stack

**Frontend**: Basic Next.js pages (no complex state management)
**Backend**: Django with minimal setup (no DRF initially)
**Database**: Supabase with basic schema
**AI**: OpenAI Whisper + GPT-4 only
**Deployment**: Single environment deployment
**Storage**: Supabase storage for files

**Estimated Effort**: 
- Week 1: Basic web interface + authentication
- Week 2: AI processing integration
- Week 3: PDF generation + styling
- Week 4: Testing with real construction data + refinements

## 📊 Validation Success Metrics

**Technical Validation:**
- ✅ Can process Irish construction voice notes with >85% accuracy (measured by WER on benchmark dataset)
- ✅ Business-critical fields (currency, time, amounts) routed correctly regardless of AI confidence
- ✅ Audio normalization improves transcription quality on field recordings
- ✅ Critical error patterns (£→€, time formats, high amounts) trigger mandatory manual review
- ✅ PDF output looks professional enough for internal use
- ✅ Processing time <60 seconds per voice note
- ✅ System handles typical WhatsApp message format

**Business Validation:**
- ✅ Saves >50% time vs manual transcription
- ✅ Construction terminology captured correctly (with enhanced pattern fixes)
- ✅ Critical business errors (currency, amounts, timing) prevent costly mistakes
- ✅ Business risk routing ensures high-value items get appropriate attention
- ✅ Output suitable for informal claims documentation
- ✅ Interface usable on mobile construction sites

## 🚀 Graduation to Full MVP

**Trigger Conditions** (Any 2 of 3):
1. **Accuracy Validated**: >90% transcription accuracy on 20+ construction voice notes
2. **Time Savings Proven**: >60% reduction in evidence compilation time
3. **User Validation**: 3+ construction PMs confirm they would use this tool

**Upon Graduation**: Implement full PRD scope with proper infrastructure, multi-tenancy, and human validation workflows.

## ⚡ Rapid Validation Alternative (2 weeks)

**Even Faster Option**: Manual validation before building
1. **Week 1**: Collect 20 construction voice notes from current job
2. **Week 2**: Process through OpenAI API manually, create PDF templates
3. **Result**: Validate AI accuracy and value prop before any development

## 💡 Key Risk Mitigations

**AI Accuracy Risk**: Test with real Irish construction audio before building interface
**User Adoption Risk**: Focus on mobile-first design for actual construction site conditions  
**Technical Risk**: Use proven stack components (Next.js + Supabase + OpenAI)
**Scope Risk**: Ruthless feature exclusion - no feature creep allowed

## 🔄 Integration with Full PRD

This ultra-minimal MVP serves as **technical validation** before the full **market validation** MVP described in the main PRD. Success here validates the core technical assumptions, enabling confident investment in the complete platform.