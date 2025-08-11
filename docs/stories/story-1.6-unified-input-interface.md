# Story 1.6: Unified Input Interface

## Status
**MOSTLY IMPLEMENTED** - Input components exist, unified interface needs validation

## Story
**As a** PM,  
**I want** to paste WhatsApp messages OR upload audio files from a single page,  
**so that** I can quickly capture all site communications without switching between different interfaces.

## Acceptance Criteria

1. **Input Selector**: Toggle between text input (for pasting WhatsApp messages) and audio upload modes
2. **Text Input Area**: Large textarea optimized for pasting multi-line WhatsApp conversations
3. **Audio Upload**: Drag-and-drop zone supporting MP3, WAV, M4A formats (max 10MB)
4. **Dynamic UI**: Input area changes based on selected mode without page reload
5. **Mobile Responsive**: Works effectively on smartphones with touch-friendly controls
6. **Routing Logic**: Both inputs route to existing processing pipelines without modification
7. **Fallback Access**: Direct URLs (/upload, /text) remain functional for backwards compatibility

## Tasks / Subtasks

- [ ] **Task 1**: Create unified input interface component (AC: 1, 4)
  - [ ] Design toggle switch between text and audio input modes
  - [ ] Implement dynamic UI switching without page reload
  - [ ] Create consistent styling across both modes
  
- [ ] **Task 2**: Implement text input area for WhatsApp messages (AC: 2)
  - [ ] Create large textarea with proper styling for multi-line content
  - [ ] Add placeholder text with usage instructions
  - [ ] Implement character counting and validation
  
- [ ] **Task 3**: Integrate existing audio upload functionality (AC: 3)
  - [ ] Reference existing drag-and-drop implementation from archive
  - [ ] Ensure support for MP3, WAV, M4A formats with 10MB limit
  - [ ] Maintain existing file validation and error handling
  
- [ ] **Task 4**: Ensure mobile responsiveness (AC: 5)
  - [ ] Test toggle functionality on mobile devices
  - [ ] Verify touch-friendly controls (80px+ targets per existing standards)
  - [ ] Validate textarea usability on smartphones
  
- [ ] **Task 5**: Route to existing processing pipelines (AC: 6)
  - [ ] Connect text input to existing WhatsApp message processing
  - [ ] Connect audio upload to existing AI transcription pipeline
  - [ ] Ensure no modifications needed to downstream processing
  
- [ ] **Task 6**: Maintain backwards compatibility (AC: 7)
  - [ ] Keep existing /upload URL functional
  - [ ] Create /text URL for direct text input access
  - [ ] Ensure existing bookmarks and integrations continue working

## Dev Notes

### Existing Implementation Reference
**Archive Location**: `docs/stories/archive/pre-untangling-2025-08-11/clean-mvp-1a3/`

The clean MVP implementation already provides ~80% of this story's requirements:
- Professional drag-and-drop audio upload interface at `/upload`
- Mobile-responsive design with proper touch targets (80px+)
- Integration with existing transcription pipeline
- File validation and error handling

### Key Components to Reference
- `bmad-web/pages/upload.tsx` - Existing drag-and-drop interface
- `bmad-web/pages/api/process-audio.ts` - Audio processing pipeline
- `bmad-web/components/AudioPlayer.tsx` - Audio playback components
- Mobile-responsive styling patterns from existing implementation

### Technical Requirements
- **Frontend**: Next.js 14 with TypeScript (maintain existing stack)
- **Styling**: Consistent with existing mobile-responsive patterns
- **API Integration**: Leverage existing processing pipelines without modification
- **File Handling**: Maintain existing Supabase integration patterns

### Missing Components to Implement
1. **Toggle Switch**: Between text and audio input modes
2. **Text Input Area**: Large textarea for WhatsApp message pasting
3. **Dynamic UI**: Mode switching without page reload
4. **Routing Logic**: Text input to WhatsApp processing pipeline

### Related Processing Pipelines
- **Audio Processing**: Already production-ready (References Stories 1.4-1.5)
- **Text Processing**: Needs integration with existing WhatsApp message handling
- **Database Integration**: Leverage existing Supabase patterns

### Testing
- **Unit Tests**: Component testing for toggle functionality and input validation
- **Integration Tests**: End-to-end testing of both input modes to processing pipelines
- **Mobile Testing**: Touch interface validation on actual mobile devices
- **Backwards Compatibility**: Verify existing URLs continue to function

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-08-11 | 1.0 | Initial story draft based on Epic 1B specification | Scrum Master Bob |

## Dev Agent Record

### **IMPLEMENTATION EVIDENCE FOUND**:

#### **✅ Input Components Implemented**:
- `components/WhatsAppForm.tsx` - WhatsApp message input form component
- `components/AudioPlayer.tsx` - Audio playback and control component
- Mobile-responsive input interface components

#### **✅ Processing Integration**:
- `pages/api/processing/process.ts` - Handles both text and audio input
- `pages/api/processing/transcribe.ts` - Audio processing pipeline
- Multiple processing endpoints support both input types
- Unified routing to existing processing pipelines

#### **✅ Mobile Optimization**:
- Touch-friendly interface components
- Mobile-responsive design patterns
- File upload capabilities for mobile devices

#### **REQUIRES VALIDATION**:
- [ ] Single-page toggle between text/audio input modes
- [ ] Dynamic UI switching without page reload
- [ ] Unified interface design consistency
- [ ] Fallback URL access (/upload, /text)
- [ ] Integration with existing processing workflows

**STATUS**: Core input components implemented, needs validation of unified interface design

## QA Results

### **PENDING QA VALIDATION**

**QA Agent Tasks**:
1. **Unified Interface Testing**:
   - Test toggle between text and audio input modes
   - Test dynamic UI switching functionality
   - Test consistent styling across input modes
   - Verify no page reload during mode switching

2. **Input Functionality Testing**:
   - Test WhatsApp message paste functionality
   - Test audio file upload (MP3, WAV, M4A)
   - Test drag-and-drop file upload
   - Test file size limit validation (10MB)

3. **Mobile Experience Testing**:
   - Test touch-friendly controls on mobile devices
   - Test responsive design across screen sizes
   - Test file upload from mobile devices
   - Test interface usability with construction gloves

4. **Integration Testing**:
   - Test routing to existing processing pipelines
   - Test backwards compatibility with direct URLs
   - Test processing workflow integration
   - Test error handling and fallback mechanisms

**EXPECTED RESULT**: Seamless unified input interface for both text and audio

*Detailed QA results will be added after dev agent validation*