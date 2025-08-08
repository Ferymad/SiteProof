# Data Models

## Company
**Purpose:** Multi-tenant organization that owns projects and users

**Key Attributes:**
- id: UUID - Unique identifier
- name: string - Company name
- type: enum - 'subcontractor' | 'main_contractor' | 'validator'
- subscription_tier: enum - 'trial' | 'starter' | 'professional' | 'enterprise'
- created_at: timestamp - Registration date
- settings: JSONB - Company-specific configuration

```typescript
interface Company {
  id: string;
  name: string;
  type: 'subcontractor' | 'main_contractor' | 'validator';
  subscriptionTier: 'trial' | 'starter' | 'professional' | 'enterprise';
  createdAt: Date;
  settings: {
    whatsappIntegration?: boolean;
    autoProcessing?: boolean;
    confidenceThreshold?: number;
  };
}
```

**Relationships:**
- Has many Users
- Has many Projects
- Has many EvidencePackages

## User
**Purpose:** Individual user with role-based access to company resources

**Key Attributes:**
- id: UUID - Unique identifier  
- email: string - Login email
- name: string - Display name
- role: enum - 'admin' | 'pm' | 'validator' | 'viewer'
- company_id: UUID - Parent company
- preferences: JSONB - User settings

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'pm' | 'validator' | 'viewer';
  companyId: string;
  preferences: {
    notificationSettings?: NotificationPrefs;
    defaultProject?: string;
  };
}
```

**Relationships:**
- Belongs to Company
- Has many ProjectAssignments
- Has many ValidationTasks

## Project
**Purpose:** Construction project container for all evidence and communications

**Key Attributes:**
- id: UUID - Unique identifier
- name: string - Project name
- location: string - Site location
- company_id: UUID - Owner company
- start_date: date - Project start
- end_date: date - Project end (nullable)
- metadata: JSONB - Project-specific data

```typescript
interface Project {
  id: string;
  name: string;
  location: string;
  companyId: string;
  startDate: Date;
  endDate?: Date;
  metadata: {
    contractValue?: number;
    mainContractor?: string;
    projectCode?: string;
  };
}
```

**Relationships:**
- Belongs to Company
- Has many WhatsAppMessages
- Has many EvidencePackages
- Has many Users through ProjectAssignments

## WhatsAppMessage
**Purpose:** Raw WhatsApp communication data including text, voice, and media

**Key Attributes:**
- id: UUID - Unique identifier
- project_id: UUID - Parent project
- raw_content: text - Original message
- sender_name: string - WhatsApp sender
- timestamp: timestamp - Message time
- type: enum - 'text' | 'voice' | 'image' | 'document'
- media_url: string - Storage reference (nullable)
- processed: boolean - Processing status

```typescript
interface WhatsAppMessage {
  id: string;
  projectId: string;
  rawContent: string;
  senderName: string;
  timestamp: Date;
  type: 'text' | 'voice' | 'image' | 'document';
  mediaUrl?: string;
  processed: boolean;
  processingMetadata?: {
    voiceDuration?: number;
    fileSize?: number;
  };
}
```

**Relationships:**
- Belongs to Project
- Has one ProcessedContent
- Has many MediaAttachments

## ProcessedContent - Enhanced with Business Risk Assessment
**Purpose:** AI-processed and validated content from WhatsApp messages with business risk routing

**Key Attributes:**
- id: UUID - Unique identifier
- message_id: UUID - Source message
- transcription: text - Voice transcription (nullable)
- extracted_data: JSONB - Structured extraction
- business_risk_assessment: JSONB - **NEW**: Business risk metrics replacing confidence scores
- audio_quality_metrics: JSONB - **NEW**: Audio normalization and quality data
- critical_errors: JSONB - **NEW**: Detected currency, time, amount errors
- validation_status: enum - 'pending' | 'auto_approved' | 'validated' | 'rejected'
- routing_decision: enum - **NEW**: 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'URGENT_REVIEW'
- validator_id: UUID - Human validator (nullable)
- validated_at: timestamp - Validation time

```typescript
interface ProcessedContent {
  id: string;
  messageId: string;
  transcription?: string;
  extractedData: {
    who?: string;
    what?: string;
    when?: Date;
    where?: string;
    amount?: number;
    materials?: string[];
    equipment?: string[];
  };
  businessRiskAssessment: {
    riskScore: number; // 0-100 business risk level
    riskFactors: string[]; // Array of risk indicators
    amountThreshold: boolean; // High-value amount flag
    criticalErrors: string[]; // Currency, time, quantity errors
  };
  audioQualityMetrics?: {
    qualityScore: number;
    normalized: boolean;
    originalFormat: string;
  };
  validationStatus: 'pending' | 'auto_approved' | 'validated' | 'rejected';
  routingDecision: 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'URGENT_REVIEW';
  validatorId?: string;
  validatedAt?: Date;
}
```

**Relationships:**
- Belongs to WhatsAppMessage
- Validated by User
- Included in EvidenceItems

## EvidencePackage
**Purpose:** Generated PDF documentation package for claims submission

**Key Attributes:**
- id: UUID - Unique identifier
- project_id: UUID - Parent project
- date_range_start: date - Evidence period start
- date_range_end: date - Evidence period end
- status: enum - 'draft' | 'review' | 'approved' | 'submitted'
- pdf_url: string - Generated PDF location
- metadata: JSONB - Package metadata
- created_by: UUID - Creating user

```typescript
interface EvidencePackage {
  id: string;
  projectId: string;
  dateRangeStart: Date;
  dateRangeEnd: Date;
  status: 'draft' | 'review' | 'approved' | 'submitted';
  pdfUrl?: string;
  metadata: {
    totalAmount?: number;
    itemCount?: number;
    confidenceAverage?: number;
    submittedTo?: string;
    claimReference?: string;
  };
  createdBy: string;
  createdAt: Date;
}
```

**Relationships:**
- Belongs to Project
- Has many EvidenceItems
- Created by User
- Has many ApprovalRecords

## ValidationQueue
**Purpose:** Queue management for human validation tasks

**Key Attributes:**
- id: UUID - Unique identifier
- processed_content_id: UUID - Content to validate
- priority: integer - Queue priority (1-10)
- assigned_to: UUID - Assigned validator (nullable)
- due_at: timestamp - SLA deadline
- completed_at: timestamp - Completion time (nullable)

```typescript
interface ValidationQueue {
  id: string;
  processedContentId: string;
  priority: number;
  assignedTo?: string;
  dueAt: Date;
  completedAt?: Date;
  metadata: {
    reason: 'low_confidence' | 'high_amount' | 'manual_request';
    originalConfidence?: number;
  };
}
```

**Relationships:**
- References ProcessedContent
- Assigned to User
- Tracked in AuditLog
