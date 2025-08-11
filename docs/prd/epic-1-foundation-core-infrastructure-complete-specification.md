# Epic 1: Foundation & Core Infrastructure (Complete Specification)

**Expanded Goal**: Establish technical foundation with Next.js architecture, user authentication, message processing, unified input interface, and MVP PDF generation. This epic now includes Phase 1B enhancement based on user validation feedback.

## Phase 1A: Core Foundation (Stories 1.1-1.5) ✅ COMPLETE

## Story 1.1: Project Setup & Development Environment
As a developer,
I want a properly configured development environment with CI/CD pipeline,
so that I can build and deploy features consistently across environments.

### Acceptance Criteria
1. **Monorepo Setup**: Next.js frontend and Django backend in single repository with proper folder structure
2. **Database Configuration**: Supabase project configured with PostgreSQL, authentication, and storage buckets
3. **Environment Management**: Separate dev/staging/production environments with consistent configurations
4. **CI/CD Pipeline**: GitHub Actions workflow for automated testing and deployment to Railway + Vercel
5. **Monitoring Setup**: Sentry error tracking and Supabase monitoring dashboard configured
6. **API Documentation**: Auto-generated OpenAPI docs from Django REST Framework for future integrations

## Story 1.2: User Authentication & Company Management
As a PM,
I want to register my company and create secure user accounts,
so that my team's evidence data is properly protected and organized by company.

### Acceptance Criteria
1. **Company Registration**: Multi-step signup flow capturing company details and construction industry role
2. **User Authentication**: Supabase auth integration with email/password and password recovery
3. **Company Types**: Support for subcontractor, main contractor, and validator user roles
4. **User Profiles**: Basic profile management with construction industry preferences
5. **Multi-Tenant Security**: Row-level security ensuring companies only access their own data
6. **API Authentication**: JWT token-based API authentication for future mobile app and integrations

## Story 1.3: Basic Project Structure & WhatsApp Input
As a PM,
I want to create projects and input WhatsApp messages,
so that I can start organizing site communications by project.

### Acceptance Criteria
1. **Project Creation**: Simple form to create projects with name, location, and date ranges
2. **WhatsApp Input Interface**: Text area for copy-pasting WhatsApp messages with file upload for voice notes
3. **Message Storage**: Raw message data stored in Supabase with proper project relationships
4. **File Handling**: Voice notes and images uploaded to Supabase storage with organized folder structure
5. **Mobile-Optimized UI**: Responsive interface working effectively on smartphones for on-site use
6. **Integration Webhooks Ready**: Database schema and API endpoints prepared for WhatsApp Business API integration

## Story 1.4: Health Check & Basic AI Processing Pipeline
As a system administrator,
I want a health check endpoint and basic AI processing,
so that I can verify the system is working end-to-end with real construction data.

### Acceptance Criteria
1. **Health Check Endpoint**: `/api/health/` returning system status and dependency health
2. **OpenAI Integration**: Whisper API integration with error handling and rate limiting
3. **Basic Transcription**: Single voice note can be transcribed with confidence scoring
4. **Processing Queue**: Django-Q task queue for asynchronous AI processing
5. **Error Handling**: Comprehensive error logging and fallback mechanisms
6. **Integration Testing**: End-to-end test processing actual construction site voice recording

## Story 1.5: Smart Features MVP Addition
As a PM,
I want intelligent confidence routing and input recovery,
so that high-value items get proper attention and I don't lose work during Friday rushes.

### Acceptance Criteria
1. **Smart Confidence Routing**: Dynamic thresholds based on financial amounts (€1000+ requires higher confidence)
2. **Friday Mode Detection**: Lower confidence thresholds during Friday afternoon (2-6 PM) for faster processing
3. **Input Recovery**: LocalStorage backup of form inputs with "Restore session?" prompt on page reload
4. **High-Value Warnings**: Visual warnings for amounts >€1000 with mandatory review flow and red borders
5. **Processing Context**: Include timing and risk factors in API responses
6. **Simple Monitoring**: Basic error tracking and processing time logging
7. **Bulk Selection**: Simple checkbox selection for multiple items with approve/reject actions

## Phase 1B: MVP Completion (Stories 1.6-1.8) 🚀 IN DEVELOPMENT

**Rationale**: Based on user validation feedback, PMs need unified input and PDF generation immediately for claim submissions. These features are being accelerated from Epic 3 to deliver complete MVP value.

## Story 1.6: Unified Input Interface
As a PM,
I want to paste WhatsApp messages OR upload audio files from a single page,
so that I can quickly capture all site communications without switching between different interfaces.

### Acceptance Criteria
1. **Input Selector**: Toggle between text input (for pasting WhatsApp messages) and audio upload modes
2. **Text Input Area**: Large textarea optimized for pasting multi-line WhatsApp conversations
3. **Audio Upload**: Drag-and-drop zone supporting MP3, WAV, M4A formats (max 10MB)
4. **Dynamic UI**: Input area changes based on selected mode without page reload
5. **Mobile Responsive**: Works effectively on smartphones with touch-friendly controls
6. **Routing Logic**: Both inputs route to existing processing pipelines without modification
7. **Fallback Access**: Direct URLs (/upload, /text) remain functional for backwards compatibility

## Story 1.7: MVP PDF Generation
As a PM,
I want to generate a professional PDF with validated transcriptions and extracted data,
so that I can submit evidence packages for payment claims without manual document creation.

### Acceptance Criteria  
1. **PDF Template**: Clean, professional template with company header and structured sections
2. **Data Population**: Automatically populate validated transcription and extracted amounts/materials/dates
3. **Preview Interface**: Show PDF preview before final generation for last-minute edits
4. **Download Function**: Generate and download PDF with proper filename (project_date.pdf)
5. **Processing Time**: PDF generation completes in <5 seconds
6. **Error Handling**: Fallback to JSON export if PDF generation fails
7. **Mobile Support**: PDF viewable and downloadable on mobile devices

## Story 1.8: Integration & Polish
As a PM,
I want a smooth, fast workflow from input to PDF in under 3 minutes,
so that documentation doesn't interrupt my site management duties.

### Acceptance Criteria
1. **Workflow Transitions**: Smooth navigation between input → validation → PDF preview → download
2. **Progress Indicators**: Clear visual feedback during processing and generation steps
3. **Loading States**: Prevent double-submission with proper loading state management
4. **Success Metrics**: Track and log completion times to verify <3 minute target
5. **Consistent UI**: Unified visual design across all workflow steps
6. **Error Recovery**: Clear error messages with retry options at each step
7. **Performance**: All transitions complete in <100ms, no UI blocking
