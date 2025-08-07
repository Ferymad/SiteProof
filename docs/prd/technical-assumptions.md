# Technical Assumptions

## Repository Structure: Monorepo
**Rationale**: Coordinated development across Next.js frontend, Django API, and AI processing components while maintaining single deployment pipeline for MVP speed.

## Service Architecture: API-First Monolith
**Decision**: Start with Django REST Framework monolith with clear API boundaries for easy future microservices extraction. API-first design enables seamless integrations with Procore, PlanGrid, and main contractor systems from Day 1.

**Core Architecture Components:**
- **Frontend**: Next.js 14 with App Router for mobile-first responsive design
- **API Layer**: Django + Django REST Framework for robust API development
- **Database**: Supabase (PostgreSQL + Vector + Auth + Storage + Real-time)
- **AI Processing**: OpenAI primary + Replicate backup for cost optimization
- **File Storage**: Supabase Storage for voice notes, photos, and PDF packages
- **Real-time**: Supabase Realtime for validation queue updates
- **Deployment**: Vercel (frontend) + Railway (Django backend)

## Testing Requirements: Unit + Integration + AI Validation
**Critical Testing Strategy**:
- **AI Accuracy Testing**: Automated testing against construction audio samples with confidence scoring validation
- **Integration Testing**: WhatsApp Business API reliability, rate limiting, and webhook processing
- **Human Validation Testing**: Queue management, SLA compliance, and validator workflow testing
- **API Testing**: Comprehensive REST API testing for future integrations (Procore, PlanGrid)
- **Vector Search Testing**: Similarity matching accuracy for duplicate detection and BoQ intelligence

## Technology Stack Decisions and Rationale

**Frontend: Next.js 14**
- **Why**: Mobile-first performance, built-in API routes for webhooks, excellent SEO for marketing site
- **Server-Side Rendering**: Faster initial loads for poor connectivity construction sites
- **API Routes**: Handle WhatsApp webhooks and external system integrations
- **App Router**: Modern React patterns with better performance

**Backend: Django + Django REST Framework**
- **Why**: Fastest API development, built-in admin for human validation workflows, extensive integration ecosystem
- **Django Admin**: Perfect for validation queue management and content moderation
- **DRF**: Auto-generates OpenAPI specs for main contractor integrations
- **Python Ecosystem**: Unmatched for AI/ML processing and construction data analysis

**Database: Supabase (PostgreSQL + Extensions)**
- **Why**: Vector search built-in (pgvector), real-time subscriptions, built-in auth, EU data residency
- **Vector Search**: Essential for future BoQ intelligence and duplicate detection
- **Row Level Security**: GDPR compliance out-of-the-box
- **Real-time**: Validation queue updates and progress tracking
- **Storage**: Integrated file handling for voice notes and images

**AI Services: OpenAI + Replicate Backup**
- **OpenAI Whisper**: Proven accuracy for voice transcription
- **OpenAI GPT-4**: Construction-specific prompt engineering for data extraction
- **Replicate**: Cost-effective backup for high-volume processing
- **Confidence Scoring**: Built-in reliability metrics for human validation triggers

**Deployment: Railway + Vercel**
- **Railway**: Simple Django deployment with PostgreSQL, auto-scaling, EU regions
- **Vercel**: Zero-config Next.js deployment, global CDN, automatic HTTPS
- **Cost Efficiency**: €45/month MVP vs €500+ AWS complexity

## Integration Architecture for Future Growth

**Phase 2-3 Integration Readiness:**
- **REST API**: Django DRF provides comprehensive API for main contractor systems
- **Webhook Processing**: Next.js API routes handle real-time integrations
- **Database Events**: Supabase triggers for automated workflow processing
- **Vector Similarity**: Built-in semantic search for BoQ line matching

**Specific Integration Endpoints (Pre-planned):**
- `/api/v1/evidence/` - Evidence package CRUD for main contractor QS teams
- `/api/v1/projects/` - Project management integration with Procore/PlanGrid
- `/api/v1/webhooks/whatsapp` - WhatsApp Business API message processing
- `/api/v1/validation/` - Human validation queue management

**Data Export Capabilities:**
- **PDF Packages**: Structured evidence for claims submission
- **JSON/CSV**: Machine-readable data for external systems
- **API Access**: Real-time data access for main contractor dashboards

## Additional Technical Assumptions and Decisions

**Security and Compliance:**
- **GDPR Compliance**: Supabase EU region with built-in data protection
- **End-to-End Encryption**: Voice notes and sensitive data encrypted at rest
- **Audit Trails**: Complete decision tracking for TII-SCD compliance
- **API Security**: Django REST Framework authentication with proper rate limiting

**Performance and Scaling:**
- **Edge Functions**: Supabase Edge Functions for AI processing queues
- **CDN**: Vercel global CDN for fast mobile performance
- **Auto-scaling**: Railway handles backend scaling based on load
- **Vector Indexing**: Optimized similarity search for large datasets

**Development and Operations:**
- **Environment Management**: Separate dev/staging/production with consistent configs
- **CI/CD**: GitHub Actions with automated testing and deployment
- **Monitoring**: Supabase built-in monitoring + Sentry for error tracking
- **Cost Control**: €45/month MVP scaling to €170/month at 1000 users
