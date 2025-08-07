# Components

## Frontend Components

### AuthenticationService
**Responsibility:** Handle user authentication, token management, and session persistence

**Key Interfaces:**
- login(email, password): Promise<User>
- register(companyData): Promise<User>
- logout(): void
- refreshToken(): Promise<string>

**Dependencies:** Supabase Auth SDK, Next.js middleware

**Technology Stack:** TypeScript, Supabase JS Client, JWT handling

### ProjectManager
**Responsibility:** Manage project CRUD operations and project switching

**Key Interfaces:**
- getProjects(): Promise<Project[]>
- createProject(data): Promise<Project>
- setActiveProject(id): void
- getProjectStats(id): Promise<ProjectStats>

**Dependencies:** API Client, State Store (Zustand)

**Technology Stack:** React Query for caching, Zustand for state

### WhatsAppProcessor
**Responsibility:** Handle WhatsApp message input, file uploads, and processing initiation

**Key Interfaces:**
- processMessages(text, files): Promise<ProcessingResult>
- uploadVoiceNotes(files): Promise<UploadResult[]>
- getProcessingStatus(id): Observable<ProcessingStatus>

**Dependencies:** API Client, Supabase Storage, Realtime Client

**Technology Stack:** React Hook Form, Supabase Storage SDK, RxJS for observables

### EvidenceReviewer
**Responsibility:** Display processed content with confidence scores and enable corrections

**Key Interfaces:**
- getProcessedContent(messageId): Promise<ProcessedContent>
- updateContent(id, corrections): Promise<void>
- approveForPackage(contentIds): Promise<void>

**Dependencies:** API Client, Audio Player Component

**Technology Stack:** React, Radix UI for accessible components

### PDFGenerator
**Responsibility:** Generate and preview PDF evidence packages

**Key Interfaces:**
- generatePackage(projectId, dateRange): Promise<PackageResult>
- previewPDF(packageId): Promise<PDFUrl>
- downloadPDF(packageId): void

**Dependencies:** API Client, PDF Viewer Library

**Technology Stack:** react-pdf for preview, API-based generation

## Backend Components

### AuthenticationMiddleware
**Responsibility:** Validate JWT tokens and enforce role-based access control

**Key Interfaces:**
- authenticate(request): User | None
- authorize(user, resource, action): boolean
- rate_limit(user): boolean

**Dependencies:** Supabase Auth, Django REST Framework

**Technology Stack:** Django middleware, PyJWT, Redis for rate limiting

### WhatsAppService
**Responsibility:** Process WhatsApp messages through AI pipeline with smart confidence routing

**Key Interfaces:**
- process_message(message): ProcessedContent
- transcribe_voice(audio_url): TranscriptionResult
- extract_data(text): ExtractedData
- calculate_confidence(data): ConfidenceScores
- route_by_risk_factors(content, context): RoutingDecision

**Dependencies:** OpenAI Client, Replicate Client, Django-Q, SmartConfidenceRouter

**Technology Stack:** Python, OpenAI SDK, Celery/Django-Q for async

### ValidationQueueManager
**Responsibility:** Manage human validation queue and SLA tracking

**Key Interfaces:**
- add_to_queue(content, priority): QueueItem
- assign_validator(queue_id, user_id): void
- check_sla_violations(): List[QueueItem]
- complete_validation(queue_id, corrections): void

**Dependencies:** Database Models, Notification Service

**Technology Stack:** Django ORM, Django Admin customization

### EvidencePackageBuilder
**Responsibility:** Compile processed content into PDF evidence packages

**Key Interfaces:**
- create_package(project_id, date_range): EvidencePackage
- add_content_to_package(package_id, content_ids): void
- generate_pdf(package_id): PDFResult
- apply_template(package_id, template_id): void

**Dependencies:** PDF Generation Library, Template Engine

**Technology Stack:** ReportLab or WeasyPrint, Django templates

### IntegrationAdapter
**Responsibility:** Handle external system integrations (WhatsApp, Procore, etc.)

**Key Interfaces:**
- whatsapp_webhook(payload): void
- sync_with_procore(project_id): SyncResult
- export_to_main_contractor(package_id, system): ExportResult

**Dependencies:** External API Clients, Webhook Handler

**Technology Stack:** Django REST Framework, Requests library, Celery

### SmartConfidenceRouter
**Responsibility:** Dynamic confidence threshold routing based on risk factors

**Key Interfaces:**
- calculate_risk_score(content, context): float
- get_confidence_threshold(risk_score, timing): float
- route_for_validation(content): ValidationLevel
- apply_friday_mode_adjustments(): void

**Dependencies:** User Context, Time Utils, Business Rules Engine

**Technology Stack:** Python, Django business logic, time-based scheduling

### InputRecoveryService
**Responsibility:** Backup and recover user inputs to prevent data loss

**Key Interfaces:**
- backup_form_data(form_id, data): void
- recover_form_data(form_id): FormData | null
- clear_backup(form_id): void
- check_for_recoverable_session(): RecoverySession[]

**Dependencies:** Frontend LocalStorage, Session Management

**Technology Stack:** TypeScript, Browser LocalStorage API, React Context
