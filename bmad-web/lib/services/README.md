# Service Layer - Hybrid Architecture

This service layer implements the business logic for the BMAD Construction Evidence Machine, designed with portability in mind for future Django migration.

## Architecture Philosophy

All services follow these principles:
1. **Business logic isolation** - No framework-specific code
2. **Clear interfaces** - TypeScript interfaces match future Django serializers
3. **Portable patterns** - Class-based services easily convert to Python
4. **Consistent naming** - Method names work in both TypeScript and Python

## Services Overview

### TranscriptionService (Story 1A.2)
- Handles voice note transcription via OpenAI Whisper
- Future location: `apps/processing/services.py`

### ExtractionService (Story 1A.2)
- Extracts structured data using GPT-4
- Construction-specific prompting
- Future location: `apps/processing/extraction.py`

### PDFService (Story 1A.3)
- Generates professional PDF evidence packages
- Future location: `apps/evidence/services.py`

## Migration Path

### Current (TypeScript/Next.js)
```typescript
export class TranscriptionService {
  async processVoiceNote(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    // Business logic here
  }
}
```

### Future (Python/Django)
```python
class TranscriptionService:
    def process_voice_note(self, request: dict) -> dict:
        # Same business logic here
```

## Implementation Status

- [ ] TranscriptionService - To be implemented in Story 1A.2
- [ ] ExtractionService - To be implemented in Story 1A.2
- [ ] PDFService - To be implemented in Story 1A.3

## Usage Pattern

Services are called from API routes, maintaining separation of concerns:

```typescript
// pages/api/processing/transcribe.ts
import { TranscriptionService } from '@/lib/services/transcription.service';

export default async function handler(req, res) {
  const service = new TranscriptionService();
  const result = await service.processVoiceNote(req.body);
  return res.json(result);
}
```

This pattern ensures easy migration to Django views:

```python
# apps/processing/views.py
from apps.processing.services import TranscriptionService

class TranscriptionView(APIView):
    def post(self, request):
        service = TranscriptionService()
        result = service.process_voice_note(request.data)
        return Response(result)
```

## Notes for Developers

1. Keep services framework-agnostic
2. Use dependency injection where possible
3. Document all methods for easy Python conversion
4. Maintain consistent error handling patterns
5. Use interfaces that map to Django serializers