# Story 1.3: Basic Project Structure & WhatsApp Input

## Status
**PARTIALLY IMPLEMENTED** - WhatsApp input component exists, project structure needs validation

## Story
**As a** PM,  
**I want** to create projects and input WhatsApp messages,  
**so that** I can start organizing site communications by project.

## Acceptance Criteria

1. **Project Creation**: Simple form to create projects with name, location, and date ranges
2. **WhatsApp Input Interface**: Text area for copy-pasting WhatsApp messages with file upload for voice notes
3. **Message Storage**: Raw message data stored in Supabase with proper project relationships
4. **File Handling**: Voice notes and images uploaded to Supabase storage with organized folder structure
5. **Mobile-Optimized UI**: Responsive interface working effectively on smartphones for on-site use
6. **Integration Webhooks Ready**: Database schema and API endpoints prepared for WhatsApp Business API integration

## Tasks / Subtasks

- [ ] **Task 1**: Create project management system (AC: 1)
  - [ ] Design project creation form with validation
  - [ ] Add project name, location, and date range fields
  - [ ] Implement project listing and selection interface
  - [ ] Add project metadata fields (contract value, main contractor, project code)
  - [ ] Create project dashboard with basic statistics
  - [ ] Implement project archiving and reactivation functionality

- [ ] **Task 2**: Build WhatsApp input interface (AC: 2)
  - [ ] Create large text area for pasting WhatsApp conversations
  - [ ] Add file upload component for voice notes and images
  - [ ] Implement drag-and-drop functionality for files
  - [ ] Add message parsing for WhatsApp format recognition
  - [ ] Create preview functionality for uploaded files
  - [ ] Add input validation and size limits

- [ ] **Task 3**: Implement message storage system (AC: 3)
  - [ ] Create database schema for WhatsApp messages
  - [ ] Implement message parsing and storage logic
  - [ ] Add project-message relationships and foreign keys
  - [ ] Create message listing and search functionality
  - [ ] Implement message metadata tracking (sender, timestamp, type)
  - [ ] Add message status tracking (raw, processed, archived)

- [ ] **Task 4**: Set up file handling system (AC: 4)
  - [ ] Configure Supabase storage buckets for different file types
  - [ ] Implement organized folder structure (project/date/type)
  - [ ] Add file validation (type, size, format)
  - [ ] Create secure file upload with progress indicators
  - [ ] Implement file thumbnail generation for images
  - [ ] Add file download and streaming functionality

- [ ] **Task 5**: Optimize for mobile experience (AC: 5)
  - [ ] Ensure responsive design for smartphone screens (375px+)
  - [ ] Implement touch-friendly interface elements (80px+ targets)
  - [ ] Add mobile-specific UX patterns (swipe, long-press)
  - [ ] Optimize file upload for mobile connections
  - [ ] Test on actual mobile devices for usability
  - [ ] Add offline-aware features for poor connectivity

- [ ] **Task 6**: Prepare WhatsApp API integration (AC: 6)
  - [ ] Design database schema for WhatsApp webhook data
  - [ ] Create API endpoints for webhook processing
  - [ ] Implement message format standardization
  - [ ] Add webhook signature verification
  - [ ] Create message deduplication logic
  - [ ] Document integration requirements and setup

## Dev Notes

### Architecture Reference
**Source**: `docs/architecture.md` - Data models and frontend architecture

### Database Schema (From Architecture)
```sql
-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_project_name_per_company UNIQUE (company_id, name)
);

-- WhatsApp messages with media support
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    raw_content TEXT,
    sender_name VARCHAR(255),
    message_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('text', 'voice', 'image', 'document')),
    media_url TEXT,
    processed BOOLEAN DEFAULT FALSE,
    processing_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Project Data Model
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

### WhatsApp Message Data Model
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

### Frontend Components to Create
```typescript
// Project management components
- ProjectCreateForm: Form for creating new projects
- ProjectList: List of company projects with search/filter
- ProjectSelector: Dropdown for selecting active project
- ProjectDashboard: Project overview with statistics

// WhatsApp input components
- WhatsAppInput: Main input interface for messages and files
- FileUploader: Drag-and-drop file upload with progress
- MessagePreview: Preview of parsed WhatsApp messages
- FilePreview: Thumbnail and preview for uploaded files
```

### Mobile-First Design Requirements
- **Base Screen Size**: 375px (iPhone SE) as minimum
- **Touch Targets**: 80px+ minimum for all interactive elements
- **Typography**: Minimum 16px font size to prevent zoom
- **Navigation**: Thumb-friendly navigation patterns
- **Loading States**: Clear indicators for slow mobile connections

### File Storage Organization
```
supabase-storage/
├── projects/
│   ├── {project-id}/
│   │   ├── voice/
│   │   │   └── {date}/
│   │   │       └── {message-id}.mp3
│   │   ├── images/
│   │   │   └── {date}/
│   │   │       └── {message-id}.jpg
│   │   └── documents/
│   │       └── {date}/
│   │           └── {message-id}.pdf
```

### WhatsApp Message Parsing
- **Message Format Detection**: Recognize WhatsApp export format
- **Sender Extraction**: Parse sender names and timestamps
- **Message Grouping**: Group consecutive messages by sender
- **Media References**: Link text messages to uploaded files
- **Timestamp Parsing**: Handle different timestamp formats

### API Endpoints to Implement
```python
# Project management
GET /projects/               # List company projects
POST /projects/              # Create new project
GET /projects/{id}/          # Get project details
PATCH /projects/{id}/        # Update project
DELETE /projects/{id}/       # Archive project

# WhatsApp message processing
POST /projects/{id}/messages/        # Submit messages for processing
GET /projects/{id}/messages/         # List project messages
GET /messages/{id}/                  # Get specific message
DELETE /messages/{id}/               # Delete message

# File handling
POST /projects/{id}/files/           # Upload files
GET /files/{id}/                     # Get file metadata
GET /files/{id}/download/            # Download file
DELETE /files/{id}/                  # Delete file
```

### Integration Preparation
**WhatsApp Business API Webhook Structure**:
```json
{
  "entry": [{
    "id": "PHONE_NUMBER_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "messages": [{
          "id": "MESSAGE_ID",
          "from": "PHONE_NUMBER",
          "timestamp": "TIMESTAMP",
          "type": "text|audio|image|document",
          "text": {"body": "MESSAGE_TEXT"},
          "audio": {"id": "MEDIA_ID"},
          "image": {"id": "MEDIA_ID"},
          "document": {"id": "MEDIA_ID"}
        }]
      }
    }]
  }]
}
```

### File Upload Configuration
- **Supported Formats**: 
  - Audio: MP3, WAV, M4A, OGG
  - Images: JPG, PNG, WebP, GIF  
  - Documents: PDF, DOC, DOCX, TXT
- **Size Limits**: 
  - Audio files: 25MB max
  - Images: 10MB max
  - Documents: 20MB max
- **Security**: File type validation, virus scanning, secure storage

### Mobile Optimization Strategy
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Offline Awareness**: Show connectivity status, queue uploads
- **Touch Gestures**: Swipe for navigation, long-press for context menus
- **Performance**: Lazy loading, image optimization, minimal bundle size

### Testing Requirements
- **Unit Tests**: Project CRUD, message parsing, file validation
- **Integration Tests**: File upload, WhatsApp parsing, API endpoints
- **Mobile Tests**: Touch interactions, responsive design, connection handling
- **E2E Tests**: Complete project creation and message input workflow

### Security Considerations
- **File Upload Security**: Type validation, size limits, virus scanning
- **Data Isolation**: Ensure projects only accessible to company members
- **Input Validation**: Sanitize WhatsApp message content and metadata
- **Storage Security**: Secure file access with proper permissions

### Performance Requirements
- **File Upload**: Progress indicators, chunked upload for large files
- **Message Processing**: Efficient parsing of large WhatsApp exports
- **Mobile Performance**: <3 second load time on 3G connections
- **Database Queries**: Indexed searches, pagination for large datasets

### Related Stories
- **Story 1.1**: Project Setup & Development Environment (provides infrastructure)
- **Story 1.2**: User Authentication & Company Management (provides user context)
- **Story 1.4**: Health Check & Basic AI Processing Pipeline (consumes this data)

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-11 | 1.0 | Initial story draft based on architecture document | Scrum Master Bob |

## Dev Agent Record

### **IMPLEMENTATION EVIDENCE FOUND**:

#### **✅ WhatsApp Input Components**:
- `components/WhatsAppForm.tsx` - WhatsApp message input form implemented
- File upload infrastructure in place (Supabase storage integration)
- Mobile-responsive UI components structure

#### **✅ Database Schema**:
- Database migrations support project structure (`migrations/001_add_ai_processing_fields.sql`)
- Project-message relationship structure indicated in database schema
- File storage organization capabilities

#### **✅ Storage Infrastructure**:
- Supabase storage configured (`lib/supabase.ts`, `lib/supabase-admin.ts`)
- File upload/download functionality infrastructure
- Organized folder structure capabilities

#### **REQUIRES VALIDATION**:
- [ ] Project creation workflow completeness
- [ ] WhatsApp message parsing functionality
- [ ] File validation and size limits
- [ ] Mobile optimization verification
- [ ] WhatsApp Business API webhook preparation
- [ ] Project-based data organization

**STATUS**: Core input components implemented, needs validation of complete project workflow

## QA Results

### **PENDING QA VALIDATION**

**QA Agent Tasks**:
1. **Project Management Testing**:
   - Test project creation workflow
   - Test project listing and selection
   - Test project metadata handling
   - Verify project-based data isolation

2. **WhatsApp Input Testing**:
   - Test WhatsApp message paste functionality
   - Test message parsing and storage
   - Test file upload (voice notes, images, documents)
   - Test drag-and-drop file handling

3. **File Handling Testing**:
   - Test file validation (type, size limits)
   - Test Supabase storage integration
   - Test organized folder structure
   - Test file download and streaming

4. **Mobile Experience Testing**:
   - Test responsive design on mobile devices
   - Test touch-friendly interactions
   - Test file upload from mobile devices
   - Test poor connectivity handling

**EXPECTED RESULT**: Complete project and WhatsApp input functionality

*Detailed QA results will be added after dev agent validation*