# Figma Design Specifications - Enhanced with Business Risk UI

**Update**: Added business risk indicators, critical error warnings, and audio quality indicators

## 1. Design System Foundation

### Color Palette
```
Primary Colors:
- Construction Orange: #FF6B35 (High-vis safety inspired)
  - Use: Primary CTAs, active states, progress indicators
  - Accessibility: Passes WCAG AA on white background
  
- Professional Navy: #0A2540
  - Use: Headers, important text, trust elements
  - Conveys: Banking-level security feel

Secondary Colors:
- Success Green: #10B981 (Verified/Complete)
- Warning Amber: #F59E0B (Attention needed)
- Error Red: #EF4444 (Failed/Critical)
- Confidence Blue: #3B82F6 (AI confidence indicators)

Neutral Palette:
- White: #FFFFFF (Primary background)
- Light Gray: #F7F8FA (Secondary background)
- Border Gray: #E5E7EB (Dividers)
- Text Gray: #6B7280 (Secondary text)
- Dark Gray: #374151 (Primary text)
- Black: #111827 (High emphasis)

Construction Site Optimized:
- High Contrast Mode: #000000 on #FFFF00 (Emergency visibility)
- Outdoor Mode: Increased contrast ratios to 7:1
```

### Typography
```
Font Stack:
- Primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif
- Monospace: 'Roboto Mono', 'Courier New', monospace (for data/codes)

Type Scale (Mobile First):
- Display: 32px/40px, Bold (Page titles)
- H1: 28px/36px, Semibold (Section headers)
- H2: 24px/32px, Semibold (Subsections)
- H3: 20px/28px, Medium (Card titles)
- Body Large: 18px/28px, Regular (Primary content)
- Body: 16px/24px, Regular (Default text)
- Small: 14px/20px, Regular (Captions, meta)
- Tiny: 12px/16px, Regular (Timestamps)

Desktop Adjustments:
- Display: 48px/56px
- H1: 36px/44px
- Body remains 16-18px for readability
```

### Spacing System
```
8px Grid System:
- xs: 4px (Inline spacing)
- sm: 8px (Related items)
- md: 16px (Default spacing)
- lg: 24px (Section spacing)
- xl: 32px (Major sections)
- 2xl: 48px (Page sections)
- 3xl: 64px (Mobile margins)

Touch Targets (Construction Gloves):
- Minimum: 60px × 60px (Critical actions)
- Standard: 48px × 48px (Regular buttons)
- Desktop: 40px × 40px (Mouse targets)
```

### Border Radius
```
- Sharp: 0px (Industrial feel)
- Small: 4px (Inputs, small buttons)
- Medium: 8px (Cards, containers)
- Large: 12px (Modals, major containers)
- Full: 9999px (Pills, badges)
```

## 2. Component Library Specifications

### Primary Button
```
Default State:
- Background: #FF6B35
- Text: #FFFFFF, 16px, Semibold
- Padding: 16px 32px
- Height: 60px (mobile), 48px (desktop)
- Border-radius: 8px
- Shadow: 0 4px 6px rgba(255, 107, 53, 0.1)

Hover State:
- Background: #E5602F
- Shadow: 0 6px 8px rgba(255, 107, 53, 0.15)
- Transform: translateY(-1px)

Active State:
- Background: #CC5329
- Shadow: 0 2px 4px rgba(255, 107, 53, 0.1)
- Transform: translateY(0)

Disabled State:
- Background: #E5E7EB
- Text: #9CA3AF
- Shadow: none
- Cursor: not-allowed

Loading State:
- Show spinner: 20px white spinner
- Text: "Processing..."
```

### Input Field (Paste Area)
```
Default:
- Border: 2px solid #E5E7EB
- Background: #FFFFFF
- Padding: 16px
- Font-size: 16px (prevents iOS zoom)
- Min-height: 200px (mobile), 300px (desktop)
- Border-radius: 8px

Focus:
- Border: 2px solid #FF6B35
- Outline: 4px solid rgba(255, 107, 53, 0.1)
- Background: #FFFBF7

Error:
- Border: 2px solid #EF4444
- Background: #FEF2F2

With Content:
- Show character count: bottom right
- Show "Clear" button: top right
```

### File Drop Zone
```
Default:
- Border: 2px dashed #E5E7EB
- Background: #F7F8FA
- Min-height: 160px
- Border-radius: 8px
- Icon: 48px upload icon centered
- Text: "Drop voice notes and photos here"

Drag Active:
- Border: 2px solid #FF6B35
- Background: #FFF5F0
- Scale: 1.02
- Shadow: 0 8px 16px rgba(255, 107, 53, 0.1)

Files Added:
- Show file grid: 80px × 80px thumbnails
- Show count badge: "+12 files"
- Show total size: "47 MB total"
```

### Progress Indicator
```
Container:
- Background: #F7F8FA
- Border-radius: 8px
- Padding: 24px

Progress Bar:
- Height: 8px
- Background: #E5E7EB
- Fill: Linear gradient #FF6B35 to #F59E0B
- Border-radius: 4px
- Animation: shimmer effect while processing

Status Text:
- Current action: 18px, Semibold, #0A2540
- Detail: 14px, Regular, #6B7280
- Percentage: 24px, Bold, #FF6B35

Phase Indicators:
- Completed: ✓ with #10B981
- Active: Pulsing dot #FF6B35
- Pending: Empty circle #E5E7EB
```

### Confidence Score Badge
```
High (>90%):
- Background: #10B981
- Text: #FFFFFF
- Icon: Shield check

Medium (70-90%):
- Background: #F59E0B  
- Text: #FFFFFF
- Icon: Alert triangle

Low (<70%):
- Background: #EF4444
- Text: #FFFFFF
- Icon: Alert circle
- Action: "Review Required" link

MVP Critical Amounts:
- >€1000: Red border + "⚠️ Verify amount"
- Show original text beside extracted amount
- One-click to play related audio
```

## 3. Layout Specifications

### Mobile Layout (375px - 768px)
```
Container:
- Padding: 16px
- Max-width: 100%
- Stack vertically

Header:
- Height: 64px
- Logo: 32px height
- Sticky position

Content Area:
- Single column
- Card margins: 16px
- Full-width buttons

Bottom Actions:
- Fixed bottom bar
- Height: 80px
- Padding: 16px
- Shadow: 0 -4px 6px rgba(0,0,0,0.05)
```

### Tablet Layout (768px - 1024px)
```
Container:
- Padding: 24px
- Max-width: 768px
- Center aligned

Two Column Option:
- Sidebar: 280px
- Main: Flexible
- Gap: 24px
```

### Desktop Layout (1024px+)
```
Container:
- Padding: 32px
- Max-width: 1280px
- Center aligned

Three Panel Layout:
- Left sidebar: 280px
- Main content: Flexible
- Right panel: 320px (context)
- Gaps: 32px
```

## 4. Screen Specifications

### Screen 1: Input Screen
```
Structure:
├─ Header (64px)
│  ├─ Logo
│  └─ Help button
├─ Main Content
│  ├─ Title: "Process WhatsApp Evidence"
│  ├─ Step indicator (1 of 3)
│  ├─ Paste area
│  ├─ File drop zone
│  └─ Sample data option
└─ Bottom Action
   └─ "Process Evidence" button

Interactions:
- Paste: Ctrl+V anywhere on page
- Drag: Visual feedback on hover
- Sample: One-click demo data
```

### Screen 2: Processing Screen
```
Structure:
├─ Header (minimal)
├─ Main Content
│  ├─ Large progress circle
│  ├─ Current action text
│  ├─ Progress bar
│  ├─ Phase checklist
│  └─ Confidence indicator
└─ Cancel button (subtle)

Animations:
- Progress bar: Smooth fill
- Status text: Fade transitions
- Phase dots: Pulse when active
```

### Screen 3: Review Screen  
```
Structure:
├─ Header with actions
├─ Split View
│  ├─ Original (40%)
│  │  ├─ WhatsApp messages
│  │  ├─ Voice indicators
│  │  └─ Photo thumbnails
│  └─ Processed (60%)
│     ├─ Extracted data
│     ├─ Confidence scores
│     └─ Edit buttons
├─ Day grouping tabs
└─ Bottom: Generate PDF

Interactions:
- Click voice: Play audio
- Click photo: Lightbox view
- Click edit: Inline editing
- Keyboard: Tab navigation
```

### Screen 4: PDF Preview
```
Structure:
├─ Header with download
├─ PDF Viewer
│  ├─ Page navigation
│  ├─ Zoom controls
│  └─ Full document
├─ Metadata sidebar
│  ├─ Creation time
│  ├─ Confidence score
 │  └─ Page count
└─ Actions: Download, Email
```

## 5. Interaction Patterns

### Loading States
```
Skeleton Screens:
- Gray boxes: #E5E7EB
- Animation: Shimmer left to right
- Duration: 1.5s per cycle
- Show realistic content structure

Spinners:
- Size: 20px (inline), 48px (full page)
- Color: #FF6B35
- Speed: 1 rotation per second
- Always with descriptive text
```

### Error Handling
```
Inline Errors:
- Red text: #EF4444, 14px
- Icon: Alert circle 16px
- Position: Below field
- Animation: Slide down

Toast Notifications:
- Position: Top center
- Width: Max 400px
- Auto-dismiss: 5 seconds
- Colors: Match severity
- Action: "Retry" or "Dismiss"

Error Recovery:
- Always offer solution
- "Try again" prominent
- Contact support visible
```

### MVP Failure Recovery (Essential)
```
Browser State Preservation:
- LocalStorage saves paste content on input
- "Restore last session?" on page reload
- Simple implementation, high value

Network Failure (MVP):
- Show clear error: "Connection lost - Check internet"
- Disable submit until connection restored
- Keep user data in form (don't clear)
```

### Micro-interactions
```
Button Feedback:
- Scale: 0.98 on press
- Duration: 150ms
- Easing: ease-out

Drag Feedback:
- Opacity: 0.8 while dragging
- Cursor: grabbing
- Drop zone: Scale 1.02

Progress Updates:
- Smooth transitions
- No jumps backwards
- Celebrate completion
```

## 6. Responsive Breakpoints

```
Mobile First Breakpoints:
- Base: 0-374px (Small phones)
- Mobile: 375-767px (Standard phones)
- Tablet: 768-1023px (Tablets)
- Desktop: 1024-1439px (Laptops)
- Wide: 1440px+ (Monitors)

Critical Adaptations:

Mobile (375-767px):
- Single column
- Fixed bottom actions
- Full-width inputs
- Stacked review panels
- 60px touch targets

Tablet (768-1023px):
- Two column option
- Side-by-side review
- Floating actions
- 48px touch targets

Desktop (1024px+):
- Three panel layout
- Inline actions
- Hover states enabled
- Keyboard shortcuts
- 40px click targets
```

## 7. Accessibility Specifications

### WCAG AA Compliance
```
Color Contrast:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- Active elements: 3:1 minimum
- Outdoor mode: 7:1 enhanced

Focus Indicators:
- Width: 3px minimum
- Color: #FF6B35
- Offset: 2px from element
- Style: Solid or double
- Visible on all interactions

Screen Reader:
- All images: Alt text
- Form labels: Associated
- Errors: Announced
- Progress: Live regions
- Landmarks: Properly marked

Keyboard Navigation:
- Tab order: Logical
- Skip links: Present
- Escape: Close modals
- Enter: Activate buttons
- Arrow keys: Navigate lists
```

### Construction-Specific Accessibility
```
Work Gloves Mode:
- Touch targets: 60px minimum
- Spacing: 16px between
- Gestures: Simple only
- No double-tap required

Outdoor Visibility:
- High contrast toggle
- Brightness boost option
- Reduced animations
- Bold fonts available

Safety Gear Compatible:
- Works with screen protectors
- Visible through safety glasses
- Usable with one hand
- No precision required
```

## 8. Performance Targets

```
Loading Performance:
- First Paint: <1.5s
- Interactive: <3s
- Complete: <5s
- On 3G connection

Interaction Performance:
- Input lag: <100ms
- Animation: 60fps
- Scroll: No jank
- Resize: Responsive

File Handling:
- Upload start: Immediate
- Progress shown: Always
- Max file: 50MB each
- Batch upload: 100 files

AI Processing:
- Start: <2s from submit
- Updates: Every 5s
- Timeout: 5 minutes
- Recovery: Automatic
```

## 9. Content Guidelines

### Voice & Tone
```
Professional but Approachable:
- "Process Evidence" not "Submit Data"
- "Almost done!" not "Processing..."
- "Check this" not "Error detected"

Construction-Aware:
- "Voice notes" not "Audio files"
- "Site photos" not "Images"
- "Dayworks" not "Daily reports"
- "Evidence package" not "Document"

Action-Oriented:
- "Process Evidence →"
- "Review & Confirm"
- "Generate PDF"
- "Download Package"
```

### Error Messages
```
Be Specific:
❌ "Error occurred"
✅ "Voice note too quiet - try uploading again"

Offer Solutions:
❌ "Upload failed"
✅ "Upload failed - Check connection and try again"

Stay Positive:
❌ "Invalid input"
✅ "Let's try that again - paste WhatsApp messages here"
```

## 10. Platform-Specific Considerations

### iOS Safari
```
- Input font-size: 16px minimum (prevents zoom)
- File input: Accept multiple
- Safe area: Respect notch
- Scroll: -webkit-overflow-scrolling
- Height: 100vh issues handled
```

### Android Chrome
```
- Pull to refresh: Disabled
- Address bar: Account for hide
- File picker: Native support
- Permissions: Request clearly
```

### Desktop Browsers
```
- Drag-drop: Full support
- Shortcuts: Ctrl/Cmd aware
- Multiple tabs: State preserved
- Back button: Proper handling
```

## 11. Asset Requirements

### Icons (24px base size)
```
Required Icons:
- Upload (cloud upload)
- Process (arrow right)
- Voice (microphone)
- Photo (camera)
- Calendar (date)
- Clock (time)
- Check (success)
- Alert (warning)
- X (error/close)
- Play (audio playback)
- Download (PDF)
- Edit (pencil)
- Confidence (shield)
- Help (question)
- Menu (hamburger)

Style: Outlined, 2px stroke
Format: SVG, optimized
Color: Inherit from parent
```

### Illustrations
```
Empty States:
- No messages: "Paste WhatsApp messages to start"
- Processing: Animated construction helmet
- Success: Checkmark with confetti
- Error: Construction cone with "!"

Style: Simple, geometric
Colors: Limited palette
Size: 200x200px maximum
```

## 12. Component States Documentation

### Complete State Matrix
```
For Each Component:
- Default
- Hover (desktop only)
- Focus
- Active/Pressed
- Disabled
- Loading
- Error
- Success
- Empty

Document:
- Visual appearance
- Interaction behavior
- Transition timing
- Accessibility state
```

## 13. Handoff Specifications

### Developer Handoff
```
Each Component Needs:
1. Figma component link
2. States documentation
3. Interaction specs
4. CSS properties
5. Animation timing
6. Accessibility requirements
7. Test scenarios
8. Edge cases

Naming Convention:
- Components: PascalCase
- Props: camelCase
- CSS: BEM or CSS Modules
- Files: kebab-case
```

### Asset Export
```
Images:
- 1x, 2x, 3x for mobile
- WebP with PNG fallback
- Lazy loading enabled

SVGs:
- Optimized with SVGO
- Inline for icons
- External for illustrations

Fonts:
- WOFF2 format
- Subset for performance
- Local fallbacks
```

## 14. Scalability Considerations

### MVP to Full SaaS Evolution

```
Component Architecture for Growth:

MVP Components (Phase 1):
├─ InputArea
│  ├─ PasteBox
│  └─ FileDropZone
├─ ProcessingView
│  ├─ ProgressBar
│  └─ StatusText
├─ ReviewPanel
│  ├─ OriginalView
│  └─ ProcessedView
└─ PDFViewer
   └─ DownloadButton

Full SaaS Additions (Phase 2-3):
├─ ProjectManager
│  ├─ ProjectList
│  └─ ProjectDetails
├─ ValidationQueue
│  ├─ QueueList
│  └─ ValidationTools
├─ IntegrationPanel
│  ├─ WhatsAppConnect
│  └─ APISettings
└─ Analytics
   ├─ UsageCharts
   └─ ROICalculator
```

### Design Token Structure
```
Tokens for Easy Theming:
// MVP: Hardcoded values
--color-primary: #FF6B35;
--spacing-unit: 8px;

// Future: Dynamic themes
--color-primary: var(--brand-primary);
--spacing-unit: var(--company-spacing);

Allows:
- White-labeling
- Company branding
- Industry variants
- Regional preferences
```

## 15. Implementation Priorities

### Week 1: Core Visual Identity
```
Priority Order:
1. Design tokens setup
2. Color system
3. Typography scale
4. Spacing system
5. Basic components:
   - Button
   - Input
   - Card
   - Progress

Deliverables:
- Figma design system file
- Style guide document
- Component library started
```

### Week 2: Key Screens
```
Priority Order:
1. Input screen (critical path)
2. Processing screen (trust building)
3. Review screen (value delivery)
4. PDF preview (outcome)

Deliverables:
- Figma mockups
- Interactive prototype
- User flow diagram
- Responsive variants
```

### Week 3: Interaction Design
```
Priority Order:
1. Drag-drop behavior
2. Progress animations
3. Error states
4. Success celebrations
5. Loading patterns

Deliverables:
- Micro-interaction specs
- Animation timeline
- Prototype with interactions
- Lottie files if needed
```

### Week 4: Developer Handoff
```
Priority Order:
1. Component documentation
2. Asset preparation
3. Responsive specs
4. Accessibility checklist
5. Test scenarios

Deliverables:
- Complete Figma file
- Exported assets
- Dev documentation
- CSS/Tailwind config
```

## 16. Success Metrics

### Design KPIs
```
Usability Metrics:
- Time to first document: <5 minutes
- Error rate: <5% of sessions
- Completion rate: >90%
- Support tickets: <1 per 100 uses

Performance Metrics:
- Load time: <3s on 3G
- Interaction delay: <100ms
- Processing feedback: Every 5s
- PDF generation: <30s

Business Metrics:
- Conversion: >20% trial to paid
- Retention: >80% monthly
- NPS: >50
- Time saved: >85% reduction
```

## 17. Testing Scenarios

### Critical Path Tests
```
1. The Friday Test:
   - Load 5 days of messages
   - Process in <10 minutes
   - Generate PDF
   - Verify quality

2. The Accent Test:
   - Irish construction terms
   - Confidence scoring
   - Manual correction
   - Accuracy validation

3. The Photo Test:
   - 50 photos + 10 voice notes
   - Correct day grouping
   - Proper matching
   - PDF organization

4. The Error Test:
   - Poor connection
   - Large files
   - Timeout handling
   - Recovery process

5. The Mobile Test:
   - One-handed use
   - Outdoor visibility
   - Glove interaction
   - Portrait/landscape

6. The Trust Test (MVP Critical):
   - Process document with €5,000 variation
   - Verify red flags appear correctly
   - Test audio playback for verification
   - Confirm amounts match exactly
```

## 18. Design Validation Checklist

### Before Development
```
☐ Personas validated with 5+ PMs
☐ Flow tested with paper prototype
☐ Accessibility audit complete
☐ Performance budget defined
☐ Error states documented
☐ Loading states designed
☐ Empty states created
☐ Success states celebrated
☐ Mobile-first approach
☐ Scalability considered
```

### Before Launch
```
☐ 5 construction PMs tested
☐ Accent accuracy validated
☐ PDF quality approved by QS
☐ 10-minute workflow achieved
☐ Mobile usability confirmed
☐ Error recovery tested
☐ Performance targets met
☐ Accessibility verified
☐ Cross-browser tested
☐ Analytics implemented
```

## 19. Figma File Structure

```
Construction Evidence Machine
├─ 🎨 Design System
│  ├─ Colors
│  ├─ Typography
│  ├─ Spacing
│  ├─ Effects
│  └─ Grid
├─ 🧩 Components
│  ├─ Atoms
│  ├─ Molecules
│  ├─ Organisms
│  └─ Templates
├─ 📱 Screens
│  ├─ Mobile
│  ├─ Tablet
│  └─ Desktop
├─ 🎬 Prototypes
│  ├─ Happy Path
│  ├─ Error States
│  └─ Edge Cases
└─ 📚 Documentation
   ├─ Handoff Notes
   ├─ Interaction Specs
   └─ Implementation Guide
```

## 20. Next Steps

### Immediate Actions (MVP Focus)
1. ✅ **v0/Lovable Prompt Created** - Complete UI prompt saved to `/docs/v0-lovable-prompt.md`
2. **Deploy Working Demo** - Use prompt to generate functional prototype within hours
3. **Test with Construction PMs** - Show 2-3 PMs the working demo
4. **Gather Real Feedback** - Record reactions and pain points
5. **Iterate Based on Usage** - Refine before full development

### Ready-to-Use Assets
- **Complete UI Prompt**: `/docs/v0-lovable-prompt.md`
- **Sample Construction Data**: Pat's realistic messages included
- **Trust Indicators**: Confidence scores and €1000+ warnings
- **Mobile-First Design**: 60px glove-friendly targets

### MVP Design Checklist (Essentials Only)
- [ ] Input screen with paste/upload
- [ ] Processing screen with progress
- [ ] Review screen with confidence scores
- [ ] PDF download screen
- [ ] Mobile responsive (375px+)
- [ ] Error messages for common failures
- [ ] LocalStorage for recovery
- [ ] €1000+ amount warnings
- [ ] 60px touch targets
- [ ] Demo data button

### Future Enhancements (Post-MVP)
- [ ] Advanced error recovery
- [ ] Offline mode
- [ ] Progressive web app
- [ ] Multi-project management  
- [ ] Team collaboration
- [ ] API integrations
- [ ] White-labeling

### For Development Team
```
Key Technical Requirements:
- Mobile-first responsive
- 60px touch targets
- Work offline capable
- Handle 50MB files
- Process in <30s
- Confidence scoring visible
- Day-based grouping
- Irish accent support
- PDF generation <30s
- One-click demo data
```
