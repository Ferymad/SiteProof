# Dev Notes

### OpenAI API Integration
**API Configuration:**
- Use OpenAI Whisper API for transcription
- Model: `whisper-1` (latest stable)
- Language hint: `en` (English optimized for Irish accents)
- Temperature: 0.2 for consistency
- Response format: `json` with timestamps
[Source: epic-1a-core-validation.md#ai-openai-whisper-gpt-4-only]

### Construction-Specific Prompting
**GPT-4 Prompt Template:**
```
You are transcribing construction site communications from Ireland. Focus on:
- Construction terminology (scaffolding, formwork, reinforcement, etc.)
- Irish/UK measurement units (metres, millimetres, tonnes)
- Common construction materials (concrete, steel, timber, block)
- Site safety terms and procedures
- Weather-related construction impacts
- Equipment and machinery names

Extract key information:
- Amounts/quantities mentioned
- Materials or services referenced
- Dates/deadlines mentioned
- Safety concerns or incidents
- Work completion status
```
[Source: epic-1a-core-validation.md#construction-prompting]

### File Locations (Hybrid Architecture)
- **API Routes**: `pages/api/processing/` (structured for Django migration)
  - `transcribe.ts` → future: `/api/processing/transcribe/`
  - `extract.ts` → future: `/api/processing/extract/`
- **Business Logic**: `lib/services/` (portable to Django)
  - `transcription.service.ts` → future: `apps/processing/services.py`
  - `extraction.service.ts` → future: `apps/processing/extraction.py`
- **Database**: Supabase tables (future: Django models)
- **Frontend Components**: `components/ProcessingStatus.tsx`, `components/ConfidenceBadge.tsx`

### Confidence Scoring Logic
**Scoring Factors:**
- Whisper confidence score (primary)
- Audio quality indicators (no_speech_prob, etc.)
- Construction terminology recognition
- Amount/currency extraction accuracy
- Overall processing success rate

**Confidence Levels:**
- **High (85%+)**: Green badge, can proceed automatically
- **Medium (60-84%)**: Yellow badge, suggest manual review
- **Low (<60%)**: Red badge, requires manual review
[Source: epic-1a-core-validation.md#confidence-display]

### Error Handling Scenarios
**Common Errors:**
- File format not supported
- Audio quality too poor for transcription
- OpenAI API rate limits or failures
- Network connectivity issues
- File too large or too long

**User-Friendly Messages:**
- "Audio quality is too low for accurate transcription. Try recording closer to the speaker."
- "File format not supported. Please use MP3, M4A, or WAV files."
- "Processing temporarily unavailable. Please try again in a moment."

### API Response Format (Django-Compatible Structure)
```json
{
  "transcription": "...",
  "confidence_score": 87,
  "extracted_data": {
    "amounts": ["€1,250", "15 tonnes"],
    "materials": ["concrete", "rebar"],
    "dates": ["next Friday"]
  },
  "processing_time": 23.4,
  "status": "completed"
}
```

### Hybrid Implementation Strategy
**Next.js API Route Example (Structured for Django Migration):**
```typescript
// pages/api/processing/transcribe.ts
import { TranscriptionService } from '@/lib/services/transcription.service';

export default async function handler(req, res) {
  // This structure mirrors Django REST Framework views
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Business logic in service layer (easily portable to Django)
    const service = new TranscriptionService();
    const result = await service.processVoiceNote({
      fileUrl: req.body.file_url,
      userId: req.body.user_id
    });
    
    // Response format matches Django REST serializer structure
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      status: 'failed' 
    });
  }
}
```

### Database Schema (Supabase → Django Models)
```sql
-- Supabase table (future Django model)
CREATE TABLE processing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  voice_file_url TEXT,
  transcription TEXT,
  confidence_score NUMERIC,
  extracted_data JSONB,
  processing_time NUMERIC,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Future Django model structure
-- class ProcessingRecord(models.Model):
--   user = models.ForeignKey(User, on_delete=models.CASCADE)
--   voice_file_url = models.URLField()
--   transcription = models.TextField()
--   confidence_score = models.DecimalField(max_digits=5, decimal_places=2)
--   extracted_data = models.JSONField()
--   processing_time = models.FloatField()
--   status = models.CharField(max_length=20)
--   created_at = models.DateTimeField(auto_now_add=True)
--   updated_at = models.DateTimeField(auto_now=True)
```

### Testing
**Validation Requirements:**
- Test with real Irish construction voice notes
- Verify >85% accuracy target for clear audio
- Test error handling with corrupted/invalid files
- Validate construction terminology extraction
- Measure processing times (<60 seconds target)

**Test Data:**
- Collect 10+ real construction voice notes for testing
- Include various Irish accents and site conditions
- Test with background noise (typical construction site audio)

### Test Cases for AI Processing

#### Test Case 1: Basic Construction WhatsApp Messages
**WhatsApp Text Input:**
```
Hey John, need to order materials for the foundation pour tomorrow. 
We'll need 15 cubic meters of concrete, 2 tonnes of rebar, 
and 200 concrete blocks. Total cost around €3,500. 
The scaffolding arrived this morning but needs inspection.
Weather looks good for the pour.
```

**Expected Extractions:**
- **Amounts**: €3,500, 15 cubic meters, 2 tonnes, 200 blocks
- **Materials**: concrete, rebar, concrete blocks, scaffolding
- **Dates**: tomorrow, this morning
- **Safety**: scaffolding needs inspection
- **Work Status**: foundation pour planned

#### Test Case 2: Ballymun Site Voice Recording
**Real transcription test (with errors):**
```
Morning lads, quick update from the Ballymun site. 
Concrete delivery arrived today at 30. [Should be: 8:30]
45 cubic metres of C25-30 ready mix. 
Cost came to £2,850 including delivery. [Should be: €2,850]
Safe farming. [Should be: safe working]
```
