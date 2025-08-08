# 1A Branch: Next.js to Django Migration Plan

## Overview
This document outlines the hybrid architecture approach for the 1A ultra-minimal MVP branch, designed for rapid validation while maintaining a clear migration path to Django for the full implementation.

## Architecture Strategy

### Phase 1: Ultra-Minimal MVP ✅ COMPLETED (Weeks 1-4)
**Stack**: Next.js + Supabase + OpenAI + Audio Processing
**Goal**: ✅ ACHIEVED - Core AI accuracy validated via Story 1A.2.1 enhancements
**Enhancements**: Audio normalization, business risk routing, critical error detection

### Phase 2: Production Ready (Future - After Validation)
**Stack**: Django + PostgreSQL + Celery + OpenAI
**Goal**: Scale to multi-tenant production system

## Key Design Principles

### 1. API Contract Consistency
All Next.js API routes follow Django REST Framework conventions:
```typescript
// Next.js (Current)
pages/api/processing/transcribe.ts → POST /api/processing/transcribe

// Django (Future)
/api/processing/transcribe/ → ProcessingViewSet.transcribe()
```

### 2. Service Layer Pattern
Business logic isolated in service classes for easy migration:
```typescript
// Next.js Service (lib/services/transcription.service.ts)
export class TranscriptionService {
  async processVoiceNote(data) { /* logic */ }
}

// Django Service (apps/processing/services.py)
class TranscriptionService:
  def process_voice_note(self, data): # same logic
```

### 3. Database Schema Alignment
Supabase tables structured to match future Django models:
```sql
-- Supabase (Current)
CREATE TABLE processing_records (
  id UUID PRIMARY KEY,
  user_id UUID,
  transcription TEXT,
  confidence_score NUMERIC
);

-- Django Model (Future)
class ProcessingRecord(models.Model):
  id = models.UUIDField(primary_key=True)
  user = models.ForeignKey(User)
  transcription = models.TextField()
  confidence_score = models.DecimalField()
```

## Migration Checklist

### Story 1A.2: AI Processing Pipeline
- [x] API routes structured as `/api/processing/*`
- [x] Service layer with portable business logic
- [x] Response format matches Django REST serializers
- [x] Database schema compatible with Django models

### Story 1A.3: Evidence Package Generation  
- [x] API routes structured as `/api/evidence/*`
- [x] PDF generation logic in service layer
- [x] Template structure convertible to Django templates
- [x] File storage abstraction for easy migration

## File Structure Mapping

### Current (Next.js)
```
pages/api/
  processing/
    transcribe.ts
    extract.ts
  evidence/
    generate.ts
    download/[id].ts
lib/
  services/
    transcription.service.ts
    extraction.service.ts
    pdf.service.ts
components/
  pdf/
    EvidenceTemplate.tsx
```

### Future (Django)
```
apps/
  processing/
    views.py (TranscriptionView, ExtractionView)
    services.py (TranscriptionService, ExtractionService)
    models.py (ProcessingRecord)
  evidence/
    views.py (EvidenceGenerateView, EvidenceDownloadView)
    services.py (PDFService)
    templates/
      evidence_package.html
```

## Migration Steps (Post-Validation)

### Week 5-6: Backend Setup
1. Initialize Django project with same API structure
2. Port service layer classes from TypeScript to Python
3. Create Django models matching Supabase schema
4. Migrate data from Supabase to PostgreSQL

### Week 7: API Migration
1. Implement Django REST Framework viewsets
2. Match existing API contracts exactly
3. Update frontend to point to Django backend
4. Run parallel testing (Next.js vs Django)

### Week 8: Deployment & Cutover
1. Deploy Django backend to production
2. Set up Celery for async processing
3. Implement proper authentication (Django + JWT)
4. Switch frontend to Django backend
5. Decommission Next.js API routes

## Benefits of Hybrid Approach

### Immediate Benefits
- ✅ 2-week faster initial deployment
- ✅ Single codebase during validation
- ✅ Simpler deployment (just Vercel)
- ✅ Lower initial infrastructure costs

### Long-term Benefits
- ✅ Clear migration path defined upfront
- ✅ No wasted architectural decisions
- ✅ Service layer code largely reusable
- ✅ API contracts remain stable
- ✅ Frontend requires minimal changes

## Risk Mitigation

### Technical Risks
1. **TypeScript to Python conversion**: Keep business logic simple and well-documented
2. **Database migration**: Use standard SQL features, avoid Supabase-specific features
3. **Authentication differences**: Abstract auth logic in service layer

### Business Risks
1. **Scope creep during migration**: Migrate first, enhance later
2. **Breaking changes**: Maintain API compatibility throughout
3. **Data loss**: Implement proper backup strategy before migration

## Success Metrics

### Validation Phase (Weeks 1-4)
- [ ] Core AI accuracy validated (>85%)
- [ ] PDF generation meets requirements
- [ ] System handles real construction data
- [ ] PM confirms time savings (>50%)

### Migration Phase (Weeks 5-8)
- [ ] Zero API breaking changes
- [ ] <1 day of downtime during cutover
- [ ] All data successfully migrated
- [ ] Performance equal or better than Next.js version

## Notes for Developers

When implementing features in the Next.js MVP:
1. Always structure API responses to match Django REST format
2. Keep business logic in service classes, not in API routes
3. Use consistent naming conventions that work in both ecosystems
4. Document any Next.js-specific code that will need refactoring
5. Avoid using Next.js-specific features in business logic

This hybrid approach ensures rapid validation while maintaining architectural integrity for future scaling.