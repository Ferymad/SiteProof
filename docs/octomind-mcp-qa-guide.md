# 🧪 Octomind MCP Server - BMAD QA Integration Guide

## Table of Contents
1. [Overview](#overview)
2. [BMAD Architecture & Context](#bmad-architecture--context)
3. [Authentication & Setup](#authentication--setup)
4. [BMAD Environment Setup](#bmad-environment-setup)
5. [Core Workflow](#core-workflow)
6. [Test Target Management](#test-target-management)
7. [BMAD-Specific Test Scenarios](#bmad-specific-test-scenarios)
8. [Test Creation Best Practices](#test-creation-best-practices)
9. [Security Testing Patterns](#security-testing-patterns)
10. [Mobile & Responsive Testing](#mobile--responsive-testing)
11. [Test Execution & Monitoring](#test-execution--monitoring)
12. [BMAD-Quinn QA Workflow Integration](#bmad-quinn-qa-workflow-integration)
13. [CI/CD Integration with GitHub Actions](#cicd-integration-with-github-actions)
14. [Troubleshooting](#troubleshooting)
15. [Advanced Patterns](#advanced-patterns)

## Overview

The Octomind MCP (Model Context Protocol) server enables QA agents to perform comprehensive browser automation testing using AI-powered test generation and execution. This guide provides detailed instructions for QA agents working specifically with the **BMAD Construction Evidence Machine** to effectively leverage Octomind for systematic testing.

### What is BMAD?

**BMAD (Construction Evidence Machine)** is a Next.js application designed for AI-powered audio transcription and evidence collection from Irish construction sites. Key features include:

- **WhatsApp Integration**: Workers submit audio messages and text from construction sites
- **AI Audio Processing**: AssemblyAI Universal-2 and OpenAI Whisper transcription with construction vocabulary
- **Project Management**: Multi-tenant project organization with company-based isolation
- **Evidence Generation**: AI-powered PDF evidence creation from processed data
- **Security Focus**: Input sanitization, XSS prevention, SQL injection protection

### Key Capabilities
- **AI-powered test creation** from natural language prompts
- **Browser automation** using Playwright under the hood
- **Local development testing** against localhost environments
- **Security testing** including SQL injection and XSS validation
- **Mobile responsiveness** testing with viewport simulation
- **Integration testing** for complex workflows

## BMAD Architecture & Context

### Tech Stack
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API routes + Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Row-Level Security (RLS)
- **File Storage**: Supabase Storage (voice notes, evidence files)
- **AI Processing**: OpenAI Whisper + AssemblyAI Universal-2
- **Testing**: Jest + Playwright (existing) + Octomind (new)

### Key User Workflows

#### 1. Construction Worker Journey
1. **WhatsApp Submission** (`/` page) - Submit audio messages and text from construction sites
2. **Project Selection** - Choose which project the evidence belongs to
3. **AI Processing** - Audio transcribed with construction vocabulary
4. **Evidence Generation** - PDF evidence created from processed data

#### 2. Project Manager Journey  
1. **Authentication** (`/auth/login`) - Company-based multi-tenant login
2. **Dashboard** (`/dashboard`) - View company statistics and activity
3. **Project Management** (`/projects`) - CRUD operations for construction projects
4. **User Management** (`/company/users`) - Manage company team members
5. **Evidence Review** (`/results`) - Review and validate processed submissions

#### 3. Admin Journey
1. **Company Registration** (`/register/company`) - Set up new construction companies
2. **Security Monitoring** (API endpoints) - Monitor system security and usage
3. **System Administration** - User roles, permissions, API management

### BMAD Pages & Components

#### Critical Pages for Testing
| Page | Route | Purpose | Auth Required |
|------|-------|---------|---------------|
| Landing | `/` | Public info + WhatsApp form | No |
| Dashboard | `/dashboard` | Company statistics | Yes |
| Projects | `/projects` | Project CRUD operations | Yes |
| Upload | `/upload` | File upload (legacy) | No |
| Results | `/results` | Evidence review | Yes |
| Company Users | `/company/users` | Team management | Yes (Admin) |
| Profile | `/profile` | User profile management | Yes |

#### Key Components
- `WhatsAppForm` - Core evidence submission interface
- `ProjectCreateForm` - Project creation with validation
- `ProjectList` - Project management with security
- `ProcessingStatus` - Real-time AI processing feedback
- `AuthForm` - Multi-tenant authentication
- `RoleBasedAccess` - Permission-based UI components

### Security Architecture

#### Authentication Flow
1. **Supabase Auth** - JWT-based authentication with refresh tokens
2. **Company Isolation** - All data filtered by `company_id` 
3. **Role-Based Access** - Admin, PM, Worker roles with different permissions
4. **RLS Policies** - Database-level security for data isolation

#### Input Validation Layers
1. **Client-side** - TypeScript types + form validation
2. **API-level** - `validation.ts` comprehensive sanitization
3. **Database** - RLS policies + constraints
4. **Display** - `sanitizeForDisplay()` for legacy data protection

## BMAD Environment Setup

### Prerequisites
```bash
# Required Node.js version
node --version  # Must be >=18.0.0

# BMAD is a monorepo using npm workspaces
cd C:\BMAD-Explore
npm install

# Environment variables required
cp .env.example .env.local
# Add your Supabase credentials:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY  
# - SUPABASE_SERVICE_ROLE_KEY
```

### Starting BMAD for Testing
```bash
# Start the web application
npm run dev:web
# OR from root directory
npm run dev

# Verify application is accessible
curl http://localhost:3000
# Should return BMAD landing page HTML
```

### Database Setup
```bash
# BMAD uses Supabase cloud database
# Local testing requires Supabase project with:
# - Projects table (with RLS policies)
# - WhatsApp submissions table  
# - Companies and users tables
# - Storage buckets for voice notes

# Verify database connectivity in BMAD admin panel
# Check /dashboard page loads without database errors
```

### Test Data Setup

#### Sample Construction Projects
```javascript
const sampleProjects = [
  {
    name: "Dublin Office Block Phase 1",
    location: "Dublin 2, Ireland", 
    start_date: "2024-01-15",
    end_date: "2024-12-31",
    metadata: {
      contractValue: 2500000,
      mainContractor: "Murphy Construction Ltd",
      projectCode: "DOB-2024-001"
    }
  },
  {
    name: "Cork Residential Development",
    location: "Cork City, Ireland",
    start_date: "2024-03-01", 
    end_date: "2025-06-30",
    metadata: {
      contractValue: 5000000,
      mainContractor: "O'Brien Builders",
      projectCode: "CRD-2024-002"
    }
  }
]
```

#### Sample WhatsApp Messages
```javascript
const sampleMessages = [
  "Just finished pouring concrete for foundation section A3. C25/30 concrete used as specified. Temperature was 8 degrees, added anti-freeze as per cold weather protocol. Pump truck arrived at 8:30 AM, pour completed by 11:15 AM. No issues to report.",
  
  "Safety concern at site entrance. Loose scaffolding boards on level 3 east side. Have cordoned off area with barrier tape. Need urgent repair before work can continue. Reported to site supervisor at 2:30 PM.",
  
  "Material delivery update: 804 stone aggregate delivered this morning. Quality check passed, certificates attached. Stored in designated area D2. Ready for use in roadway base layer tomorrow."
]
```

## Authentication & Setup

### 1. Obtain API Key

**Step 1**: Access your Octomind dashboard
- Navigate to **Settings > API Keys**
- Click **"Create an API key"**
- **CRITICAL**: Copy the API key immediately (shown only once)
- Store securely (never share or commit to repositories)

### 2. MCP Server Configuration

The hosted MCP server uses:
- **Endpoint**: `https://mcp.app.octomind.dev/mcp`
- **Transport**: HTTPS streaming protocol
- **Authentication**: `Authorization: Bearer <API_KEY>` (NOT `x-api-key`)

### 3. CLI Setup (Optional but Recommended)

```bash
# Install Octomind CLI globally
npm i -g @octomind/octomind

# Initialize with API key
octomind init
# Follow prompts to enter API key and optional test target ID
```

## Core Workflow

### MCP Functions Available

| Function | Purpose | Use Case |
|----------|---------|----------|
| `getTestTargets` | List all test targets | Initial discovery |
| `createTestTarget` | Create new test target | Set up testing for new applications |
| `getTestCases` | List test cases | Review existing tests |
| `discovery` | Create AI-generated test | Generate new test scenarios |
| `executeTests` | Run tests | Execute testing workflows |
| `getTestReports` | View test results | Analyze test outcomes |
| `updateTestCase` | Modify test settings | Enable/disable tests, update prompts |

### Basic Workflow Pattern

```typescript
1. createTestTarget() → Set up testing for your application
2. discovery() → Generate test scenarios with AI prompts  
3. updateTestCase() → Enable tests (set runStatus: "ON")
4. executeTests() → Run tests against target URL
5. getTestReports() → Analyze results and failures
```

## Test Target Management

### Creating Test Targets

```javascript
// For local development testing
mcp__octomind-mcp__createTestTarget({
  app: "YourApp-LocalTesting",
  discoveryUrl: "http://localhost:3000"
})

// For staging environment
mcp__octomind-mcp__createTestTarget({
  app: "YourApp-Staging", 
  discoveryUrl: "https://staging.yourapp.com"
})
```

### Environment Management

Each test target automatically gets a default environment with:
- **Discovery URL**: Base URL for test execution
- **Email**: Auto-generated test email for email flow testing
- **Timeout**: Default 30 seconds per step (configurable)

**Best Practices:**
- Use descriptive app names: `ProjectName-Environment-Purpose`
- Set up separate targets for each environment (local, staging, production)
- Keep discovery URLs specific to entry points

### BMAD Test Target Setup

```javascript
// Create BMAD local development target
mcp__octomind-mcp__createTestTarget({
  app: "BMAD-Construction-Evidence-Local",
  discoveryUrl: "http://localhost:3000"
})

// Create BMAD staging target (if available)
mcp__octomind-mcp__createTestTarget({
  app: "BMAD-Construction-Evidence-Staging", 
  discoveryUrl: "https://staging.bmad-evidence.com"
})
```

## BMAD-Specific Test Scenarios

### Construction Worker Evidence Submission Flow

```javascript
mcp__octomind-mcp__discovery({
  name: "BMAD WhatsApp Evidence Submission Complete Flow",
  testTargetId: "bmad-target-id",
  prompt: `INTENT
Test the complete construction worker evidence submission workflow from project selection to AI processing

INSTRUCTIONS
1. Navigate to BMAD landing page (/)
2. Scroll to "SiteProof" section with WhatsApp form
3. Click on "Select Project" dropdown and choose "Dublin Office Block Phase 1"
4. Enter construction site message: "Just finished pouring concrete for foundation section A3. C25/30 concrete used as specified. Temperature was 8 degrees, added anti-freeze as per cold weather protocol. Pump truck arrived at 8:30 AM, pour completed by 11:15 AM. No issues to report."
5. Click "Submit Construction Data" button
6. Verify success message appears: "Data submitted successfully! Now you can process it with AI."
7. Verify "Process with AI" button becomes available
8. Click "Process with AssemblyAI System" (construction-optimized)
9. Wait for processing to complete (up to 30 seconds)
10. Verify transcription results appear with construction vocabulary correctly processed
11. Check that "at 8:30" time reference is preserved (not converted to "at 30")
12. Verify construction terms like "C25/30 concrete" and "anti-freeze" are correctly transcribed

EXPECTED RESULT
- Project selection should work without errors
- WhatsApp message should submit successfully without RLS violations
- AI processing should complete without timeouts
- Construction-specific vocabulary should be accurately transcribed
- No XSS or SQL injection vulnerabilities in message processing
- Success messages should guide user through complete workflow`,
  tagNames: ["bmad-core", "whatsapp-submission", "ai-processing", "construction-workflow"],
  folderName: "BMAD Core Workflows",
  entryPointUrlPath: "/"
})
```

### BMAD Project Management Security Test

```javascript
mcp__octomind-mcp__discovery({
  name: "BMAD Project Creation with Security Validation",
  testTargetId: "bmad-target-id",
  prompt: `INTENT
Test BMAD project creation workflow with comprehensive security validation for construction data

INSTRUCTIONS
1. Navigate to /projects page (requires authentication)
2. Click "New Project" button
3. Test legitimate project creation first:
   - Name: "Galway Bridge Construction Phase 2"
   - Location: "Galway City, Ireland"
   - Start Date: Today's date
   - End Date: 6 months from today
   - Contract Value: €1,500,000
   - Main Contractor: "Galway Engineering Ltd"
   - Project Code: "GBC-2024-003"
4. Click "Create Project" and verify success
5. Test SQL injection prevention:
   - Try project name: "Test Project'; DROP TABLE projects; --"
   - Verify rejection with proper validation error
6. Test XSS prevention:
   - Try location: "<script>alert('XSS')</script>"
   - Verify sanitization or rejection
7. Test input validation:
   - Try empty required fields and verify validation errors
   - Try contract value: -50000 (negative value)
   - Try end date before start date
8. Verify created project appears in project list
9. Test project editing with same security validations
10. Test that only authorized users can create projects (role-based access)

EXPECTED RESULT
- Legitimate project creation should succeed with proper validation
- All malicious inputs should be blocked with user-friendly error messages  
- No SQL injection or XSS attacks should succeed
- Form validation should prevent invalid data entry
- Only users with appropriate permissions should access project creation
- Created projects should be properly isolated by company_id
- No sensitive database information should be exposed in error messages`,
  tagNames: ["bmad-projects", "security", "sql-injection", "xss-prevention", "input-validation"],
  folderName: "BMAD Security Tests",
  entryPointUrlPath: "/projects",
  prerequisiteName: "BMAD User Authentication"
})
```

### BMAD Multi-Device Construction Site Testing

```javascript
mcp__octomind-mcp__discovery({
  name: "BMAD Mobile Construction Site Worker Interface",
  testTargetId: "bmad-target-id", 
  prompt: `INTENT
Test BMAD mobile interface for construction site workers using phones in harsh outdoor conditions

INSTRUCTIONS
1. Set viewport to iPhone SE (375px width) - typical construction worker device
2. Navigate to BMAD landing page
3. Verify "SiteProof - Construction Evidence Collection" header is readable
4. Test project selection dropdown is touch-friendly (minimum 80px touch targets)
5. Test WhatsApp message text area:
   - Tap to focus (should work with work gloves simulation)
   - Enter long construction message with technical terms
   - Verify text remains readable (16px minimum font size)
   - No horizontal scrolling should be required
6. Test voice file upload button:
   - Should be large enough for gloved fingers
   - File selection should work on mobile
7. Verify "Submit Construction Data" button is prominent and thumb-friendly
8. Test form validation messages are readable on small screen
9. Test AI processing status display adapts to mobile layout
10. Verify no critical functionality is lost on mobile interface
11. Test landscape orientation (construction workers often rotate devices)
12. Simulate poor network conditions (construction sites often have weak signals)

EXPECTED RESULT
- All interface elements should be thumb and glove-friendly (80px+ touch targets)
- Text should be readable without zooming (16px+ font size)
- Form should be fully functional on mobile devices
- No horizontal scrolling required
- Loading states should be clear for slow network conditions
- Landscape orientation should maintain usability
- Construction worker can complete evidence submission efficiently on mobile`,
  tagNames: ["bmad-mobile", "construction-workers", "375px", "touch-interface", "field-usability"],
  folderName: "BMAD Mobile Testing",
  entryPointUrlPath: "/"
})
```

### BMAD Company Multi-Tenancy Security Test

```javascript
mcp__octomind-mcp__discovery({
  name: "BMAD Company Data Isolation Validation",
  testTargetId: "bmad-target-id",
  prompt: `INTENT
Test BMAD multi-tenant architecture ensures proper company data isolation for construction companies

INSTRUCTIONS
1. Test with Company A user login:
   - Navigate to /auth/login
   - Login with Company A credentials
   - Navigate to /projects
   - Note available projects (should only see Company A projects)
   - Navigate to /dashboard  
   - Note statistics (should only reflect Company A data)
2. Test Company B isolation:
   - Logout from Company A
   - Login with Company B credentials  
   - Verify no Company A projects are visible
   - Verify dashboard shows only Company B statistics
3. Test direct URL access attempts:
   - While logged in as Company B, try to access Company A project by direct URL
   - Should receive 404 or access denied error
4. Test API endpoint isolation:
   - Verify /api/projects only returns current company's projects
   - Test that project IDs from other companies cannot be accessed
5. Test WhatsApp submissions isolation:
   - Submit evidence while logged in as Company A
   - Login as Company B and verify Company A evidence is not visible
6. Test user management isolation:
   - Company A admin should only see Company A users
   - Cannot invite users to or manage Company B accounts

EXPECTED RESULT
- Company data should be completely isolated between tenants
- No cross-company data leakage should occur
- Direct URL attempts to access other company data should fail
- API endpoints should enforce company-based filtering  
- User management should be restricted to own company
- Dashboard statistics should only reflect current company data
- All database queries should include company_id filtering`,
  tagNames: ["bmad-security", "multi-tenancy", "company-isolation", "rls-policies"],
  folderName: "BMAD Security Tests",
  entryPointUrlPath: "/auth/login"
})
```

### BMAD AI Processing System Validation

```javascript
mcp__octomind-mcp__discovery({
  name: "BMAD Construction AI Processing Quality Test",
  testTargetId: "bmad-target-id",
  prompt: `INTENT
Test BMAD AI processing systems (OpenAI Whisper vs AssemblyAI Universal-2) for construction vocabulary accuracy

INSTRUCTIONS  
1. Navigate to WhatsApp form and select a project
2. Submit realistic construction audio message: "Material delivery at 8:30 AM. We received 804 stone aggregate and C25/30 concrete. Safe working protocols followed during unloading. Pump truck positioning complete."
3. Click "Submit Construction Data" 
4. Test OpenAI Whisper system first:
   - Toggle processing system to "OpenAI Whisper" (if available)
   - Click "Process with Whisper System"
   - Wait for processing completion
   - Note transcription accuracy for construction terms
5. Test AssemblyAI Universal-2 system:
   - Toggle to "AssemblyAI Universal-2" system  
   - Process same audio with construction-optimized system
   - Compare results for accuracy improvements
6. Test A/B comparison feature:
   - Click "Compare Both Systems (A/B Test)" button
   - Wait for side-by-side results
   - Verify both systems process simultaneously
   - Compare accuracy for construction-specific terms
7. Validate construction vocabulary fixes:
   - Check "at 8:30" is preserved (not "at 30")
   - Verify "804 stone" is correct (not "844 stone")
   - Confirm "C25/30 concrete" technical specification is accurate
   - Ensure "safe working" (not "safe farming") terminology
8. Test error handling for processing failures
9. Verify confidence scores and processing metadata

EXPECTED RESULT
- Both AI systems should process audio without errors
- AssemblyAI should show higher accuracy for construction vocabulary
- A/B comparison should work and display side-by-side results
- Construction-specific terms should be correctly transcribed
- Processing should complete within reasonable time (< 60 seconds)
- Confidence scores should be displayed for quality assessment  
- Time references and technical specifications should be preserved accurately`,
  tagNames: ["bmad-ai", "construction-vocabulary", "transcription-quality", "ab-testing"],
  folderName: "BMAD AI Processing",
  entryPointUrlPath: "/"
})
```

## Test Creation Best Practices

### Effective Prompt Engineering

Based on official Octomind guidelines, structure prompts with three sections:

```
INTENT
[Clear description of what you want to test]

INSTRUCTIONS  
[Step-by-step detailed instructions]
1. Navigate to specific page/element
2. Perform specific actions
3. Enter specific test data
4. Validate specific outcomes

EXPECTED RESULT
[Clear success criteria and assertions]
```

### Good vs. Bad Prompts

❌ **Bad Prompt:**
```
Test the login functionality
```

✅ **Good Prompt:**
```
INTENT
Validate user authentication with both valid and invalid credentials

INSTRUCTIONS
1. Navigate to /login page
2. Test valid login: enter username "testuser@example.com" and password "validpass123"
3. Click "Sign In" button  
4. Verify redirect to dashboard page
5. Test invalid login: enter username "fake@test.com" and password "wrongpass"
6. Verify error message appears
7. Confirm no redirect occurs

EXPECTED RESULT  
- Valid credentials should redirect to dashboard with success message
- Invalid credentials should show error without redirect
- Login form should remain accessible after failed attempt
```

### Test Creation Parameters

```javascript
mcp__octomind-mcp__discovery({
  name: "Descriptive Test Name",
  testTargetId: "your-target-id", 
  prompt: "INTENT/INSTRUCTIONS/EXPECTED format",
  entryPointUrlPath: "/specific-page", // Optional: start from specific route
  tagNames: ["security", "authentication"], // Categorize tests
  folderName: "Security Tests", // Organize tests
  prerequisiteName: "Login Test", // Chain tests together
  type: "LOGIN" // Special types: LOGIN, COOKIE_BANNER
})
```

## Security Testing Patterns

### SQL Injection Testing

```javascript
mcp__octomind-mcp__discovery({
  name: "SQL Injection Prevention Validation",
  testTargetId: "your-target-id",
  prompt: `INTENT
Test form inputs against SQL injection attacks to validate security measures

INSTRUCTIONS
1. Navigate to the form page
2. Test legitimate data first - enter normal values and submit successfully  
3. Test SQL injection patterns:
   - Enter: '; DROP TABLE users; --
   - Enter: ' OR '1'='1
   - Enter: UNION SELECT * FROM users
4. Verify all malicious inputs are rejected
5. Confirm proper error messages are shown
6. Ensure legitimate functionality still works

EXPECTED RESULT
- Malicious SQL patterns should be blocked with validation errors
- Forms should sanitize input and prevent database manipulation
- Legitimate data should continue to work normally
- Error messages should be user-friendly, not expose database details`,
  tagNames: ["security", "sql-injection", "input-validation"],
  folderName: "Security Tests"
})
```

### XSS Prevention Testing  

```javascript
mcp__octomind-mcp__discovery({
  name: "XSS Attack Prevention",
  testTargetId: "your-target-id", 
  prompt: `INTENT
Validate Cross-Site Scripting (XSS) prevention in user input fields

INSTRUCTIONS
1. Navigate to user input forms (comments, profiles, search, etc.)
2. Test script injection attempts:
   - Enter: <script>alert('XSS')</script>
   - Enter: javascript:alert('XSS')  
   - Enter: <img src=x onerror=alert('XSS')>
   - Enter: <iframe src="javascript:alert('XSS')"></iframe>
3. Submit forms and verify no script execution occurs
4. Check that dangerous content is sanitized or rejected
5. Confirm error messages appear for blocked content

EXPECTED RESULT
- No JavaScript should execute from user inputs
- Dangerous tags should be stripped or escaped  
- Forms should show validation errors for malicious content
- Page should remain functional after blocked attempts`,
  tagNames: ["security", "xss-prevention", "input-sanitization"],
  folderName: "Security Tests"
})
```

## Mobile & Responsive Testing

### Viewport Testing Pattern

```javascript
mcp__octomind-mcp__discovery({
  name: "Mobile Responsiveness - iPhone SE Validation",
  testTargetId: "your-target-id",
  prompt: `INTENT  
Validate mobile-responsive design and touch-friendly interface at 375px viewport

INSTRUCTIONS
1. Set browser viewport to mobile size (375px width - iPhone SE)
2. Navigate through all critical pages and forms
3. Verify touch targets are minimum 80px for thumb accessibility
4. Test form interactions - all inputs should be accessible
5. Verify text readability (minimum 16px font size to prevent zoom)
6. Test navigation menus and dropdowns work on touch
7. Confirm no horizontal scrolling is required
8. Validate all interactive elements respond to touch

EXPECTED RESULT
- All pages adapt properly to 375px viewport
- Touch targets meet 80px minimum size requirement  
- Text remains readable without forced zooming
- Navigation is thumb-friendly and accessible
- Forms function completely on mobile interface
- No content should require horizontal scrolling`,
  tagNames: ["mobile", "responsive", "375px", "touch-interface"],
  folderName: "Mobile Testing"
})
```

### Multi-Device Testing

```javascript
// Test different viewport sizes
const viewportTests = [
  { name: "iPhone SE", width: 375, tag: "mobile-small" },
  { name: "iPad", width: 768, tag: "tablet" }, 
  { name: "Desktop", width: 1920, tag: "desktop" }
]

viewportTests.forEach(device => {
  mcp__octomind-mcp__discovery({
    name: `${device.name} Responsive Test`,
    // ... prompt with device-specific testing
    tagNames: ["responsive", device.tag]
  })
})
```

## Test Execution & Monitoring

### Running Tests

```javascript
// Execute all tests for a target
mcp__octomind-mcp__executeTests({
  testTargetId: "your-target-id",
  url: "http://localhost:3000",
  description: "Comprehensive QA validation run",
  tags: ["security", "integration"] // Optional: run only specific tags
})
```

### Monitoring Results

```javascript
// Get test report
mcp__octomind-mcp__getTestReport({
  testTargetId: "your-target-id", 
  testReportId: "report-id-from-execution"
})

// Monitor test status
const report = await getTestReport(...)
if (report.status === "PASSED") {
  console.log("✅ All tests passed")
} else if (report.status === "FAILED") {
  console.log("❌ Tests failed - check specific results")
  // Analyze individual test results for failure details
}
```

### Test Result Analysis

Key result fields to monitor:
- `status`: PASSED, FAILED, WAITING
- `errorMessage`: Specific failure details
- `traceUrl`: Browser recording of test execution  
- `testResults[]`: Individual test case outcomes

## BMAD-Quinn QA Workflow Integration

### Integration with Quinn QA Agent

The BMAD project uses **Quinn**, a specialized QA agent that integrates with the Octomind MCP server for comprehensive testing workflows. Here's how they work together:

#### Quinn Agent Configuration

Quinn operates using the BMAD `.bmad-core/agents/qa.md` configuration with these key capabilities:

- **Brutal QA Mindset**: Execute every critical testing scenario using Playwright MCP
- **Story-Based Testing**: Integration with BMAD's story-driven development process
- **Security-First Approach**: ALWAYS validate external service integrations 
- **Runtime Validation Priority**: Code review PLUS brutal runtime testing
- **Architectural Review**: Senior developer analysis combined with automated testing

#### Quinn + Octomind Workflow

```javascript
// Quinn's QA workflow using Octomind MCP
async function quinnBrutalQAWorkflow(storyNumber) {
  // 1. Quinn analyzes the story requirements
  const story = await readStory(`story-${storyNumber}`)
  
  // 2. Quinn creates comprehensive test scenarios using Octomind
  const testSuites = await createBMADTestSuites(story.acceptanceCriteria)
  
  // 3. Execute brutal testing with enhanced MCP servers
  const results = await executeComprehensiveTests(testSuites)
  
  // 4. Quinn updates QA Results section in story file
  await updateStoryQAResults(storyNumber, results)
  
  // 5. Provide production deployment clearance or return to development
  return results.allPassed ? "APPROVED" : "RETURN_TO_DEVELOPMENT"
}
```

#### Story-Based Test Generation

Quinn automatically generates BMAD-specific test scenarios based on story acceptance criteria:

```javascript
// Example: Story 1.3 - Basic Project Structure & WhatsApp Input
const story13TestSuites = [
  {
    name: "Project CRUD Security Validation", 
    scenarios: ["sql-injection", "xss-prevention", "rls-policies"],
    bmadContext: "Construction project management"
  },
  {
    name: "WhatsApp Evidence Submission",
    scenarios: ["message-processing", "ai-transcription", "data-storage"], 
    bmadContext: "Construction site evidence collection"
  },
  {
    name: "Mobile Construction Worker Interface",
    scenarios: ["375px-responsive", "touch-friendly", "glove-usability"],
    bmadContext: "Outdoor construction site usage"
  }
]
```

#### Quinn's QA Commands Integration

When using Quinn agent, you can trigger Octomind testing through Quinn's commands:

- `*review story-1.3` - Complete story review with Octomind brutal testing
- `*brutal-test story-1.3` - Execute ONLY Octomind testing scenarios  
- `*config-check` - Verify enhanced MCP capabilities are available

#### Story QA Results Format

Quinn updates story files with standardized QA results:

```markdown
## ✅ QUINN BRUTAL QA VALIDATION - APPROVED FOR PRODUCTION

### Octomind Test Results Summary
- **Security Tests**: ✅ PASSED (SQL injection blocked, XSS prevented)
- **Mobile Tests**: ✅ PASSED (375px responsive, touch-friendly)  
- **Integration Tests**: ✅ PASSED (WhatsApp submission working)
- **AI Processing Tests**: ✅ PASSED (Construction vocabulary accurate)

### Test Report URLs
- [Security Test Report](https://app.octomind.dev/testreports/report-id-1)
- [Mobile Test Report](https://app.octomind.dev/testreports/report-id-2)
- [Integration Test Report](https://app.octomind.dev/testreports/report-id-3)

### Production Deployment Clearance: ✅ APPROVED
```

### BMAD Development Workflow Integration

#### 1. Story Development Phase
```bash
# Developer completes story implementation
# Triggers Quinn QA review with Octomind testing

# Quinn creates test target for story
mcp__octomind-mcp__createTestTarget({
  app: `BMAD-Story-${storyNumber}-Testing`,
  discoveryUrl: "http://localhost:3000"
})

# Quinn generates story-specific test scenarios
# Executes comprehensive testing
# Updates story QA results section
```

#### 2. Pre-Production Validation
```bash
# Before story deployment, run comprehensive test suite
npm run test:bmad:comprehensive
# This triggers Quinn to run all Octomind test scenarios

# Only deploy if Quinn provides production approval
```

#### 3. Regression Testing
```bash
# After new story deployment, validate existing functionality
npm run test:bmad:regression
# Quinn runs existing Octomind test suites to catch regressions
```

## CI/CD Integration with GitHub Actions

### BMAD GitHub Actions Setup

BMAD integrates Octomind testing into the CI/CD pipeline using the official Octomind GitHub Action:

#### 1. GitHub Action Configuration

Create `.github/workflows/bmad-octomind-testing.yml`:

```yaml
name: BMAD Octomind QA Testing

on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main ]

jobs:
  bmad-qa-testing:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout BMAD code
      uses: actions/checkout@v4
      
    - name: Setup Node.js 18
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install BMAD dependencies
      run: |
        npm ci
        npm run build:web
        
    - name: Start BMAD application
      run: |
        npm run start:web &
        sleep 10
        curl --retry 5 --retry-delay 2 http://localhost:3000
      env:
        NODE_ENV: test
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_TEST_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_TEST_ANON_KEY }}
        SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_TEST_SERVICE_KEY }}
        
    - name: Run Octomind BMAD Tests
      uses: OctoMind-dev/octomind-execute@v1
      with:
        octomind-api-key: ${{ secrets.OCTOMIND_API_KEY }}
        test-target-id: ${{ secrets.BMAD_TEST_TARGET_ID }}
        url: http://localhost:3000
        tags: 'bmad-core,security,mobile'
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        
    - name: Comment Test Results on PR
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v7
      with:
        script: |
          const { data: comments } = await github.rest.issues.listComments({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: context.issue.number,
          });
          
          // Post Octomind test results to PR comments
          await github.rest.issues.createComment({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: context.issue.number,
            body: '🧪 **BMAD Octomind QA Results**: Tests completed - check Action details for full report'
          });
```

#### 2. Environment Secrets Configuration

Configure these secrets in your GitHub repository:

```bash
# Octomind Integration
OCTOMIND_API_KEY=your_octomind_api_key
BMAD_TEST_TARGET_ID=bmad_test_target_uuid

# BMAD Test Environment  
SUPABASE_TEST_URL=your_test_supabase_url
SUPABASE_TEST_ANON_KEY=your_test_anon_key
SUPABASE_TEST_SERVICE_KEY=your_test_service_role_key
```

#### 3. Advanced CI/CD Workflow

For comprehensive BMAD testing across environments:

```yaml
name: BMAD Multi-Environment Testing

on:
  workflow_dispatch:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM

jobs:
  test-environments:
    strategy:
      matrix:
        environment: [development, staging]
        
    runs-on: ubuntu-latest
    
    steps:
    - name: Test BMAD ${{ matrix.environment }}
      uses: OctoMind-dev/octomind-execute@v1
      with:
        octomind-api-key: ${{ secrets.OCTOMIND_API_KEY }}
        test-target-id: ${{ secrets[format('BMAD_{0}_TARGET_ID', matrix.environment)] }}
        url: ${{ secrets[format('BMAD_{0}_URL', matrix.environment)] }}
        tags: 'bmad-core,security,mobile,construction-workflow'
        
  security-audit:
    runs-on: ubuntu-latest
    steps:
    - name: BMAD Security Testing
      uses: OctoMind-dev/octomind-execute@v1  
      with:
        octomind-api-key: ${{ secrets.OCTOMIND_API_KEY }}
        test-target-id: ${{ secrets.BMAD_SECURITY_TARGET_ID }}
        url: ${{ secrets.BMAD_STAGING_URL }}
        tags: 'security,sql-injection,xss-prevention,multi-tenancy'
```

#### 4. Integration with BMAD Deployment Pipeline

```yaml
name: BMAD Production Deployment

on:
  push:
    branches: [ main ]
    
jobs:
  pre-deployment-qa:
    runs-on: ubuntu-latest
    steps:
    - name: Pre-deployment QA with Octomind
      uses: OctoMind-dev/octomind-execute@v1
      with:
        octomind-api-key: ${{ secrets.OCTOMIND_API_KEY }}
        test-target-id: ${{ secrets.BMAD_STAGING_TARGET_ID }}
        url: ${{ secrets.BMAD_STAGING_URL }}
        tags: 'bmad-core,regression,critical-path'
        
  deploy-production:
    needs: pre-deployment-qa
    runs-on: ubuntu-latest
    if: success()  # Only deploy if QA passes
    
    steps:
    - name: Deploy BMAD to Production
      run: |
        # Your production deployment commands
        echo "Deploying BMAD - QA validation passed"
        
  post-deployment-validation:
    needs: deploy-production
    runs-on: ubuntu-latest
    
    steps:
    - name: Post-deployment Smoke Tests
      uses: OctoMind-dev/octomind-execute@v1
      with:
        octomind-api-key: ${{ secrets.OCTOMIND_API_KEY }}
        test-target-id: ${{ secrets.BMAD_PRODUCTION_TARGET_ID }}
        url: ${{ secrets.BMAD_PRODUCTION_URL }}
        tags: 'smoke-test,critical-path'
```

### Benefits of BMAD CI/CD Integration

1. **Automated QA Gates**: No code reaches production without passing Octomind tests
2. **PR Test Comments**: Octomind results posted directly to pull request discussions  
3. **Multi-Environment Validation**: Test local, staging, and production environments
4. **Security-First Pipeline**: Security tests run on every deployment
5. **Construction-Specific Validation**: AI processing and construction workflow testing
6. **Cost Optimization**: Pay-per-use model with parallel test execution

## Troubleshooting

### Common Issues & Solutions

#### 1. Discovery Fails - Server Not Running

**Symptom**: `STUCK_IN_A_LOOP` with "localhost server not running"

**Solution**: 
```bash
# Ensure your application is running
npm run dev # or your start command
# Verify accessibility: curl http://localhost:3000
```

#### 2. Test Case Not Executing

**Symptom**: "no test cases to execute"

**Solution**: Enable test cases before execution
```javascript
mcp__octomind-mcp__updateTestCase({
  testTargetId: "your-id",
  testCaseId: "test-id", 
  runStatus: "ON" // Enable the test
})
```

#### 3. Authentication Issues

**Symptom**: 401/403 errors

**Solution**: Verify API key format
- Use `Authorization: Bearer <API_KEY>` 
- NOT `x-api-key: <API_KEY>`
- Ensure API key has proper permissions

#### 4. Test Generation Failures

**Symptom**: Yellow alerts or failed step generation

**Solution**: Improve prompt specificity
- Add more detailed step-by-step instructions
- Include specific element selectors or text
- Mention prerequisite actions (cookie banners, etc.)

### CLI Debugging

```bash
# Run tests locally with full debug output
octomind debug --url http://localhost:3000 --testTargetId your-id --headless false

# Run specific test case with trace  
octomind debug --url http://localhost:3000 --id test-case-id

# Persist Playwright config for manual debugging
octomind debug --url http://localhost:3000 --testTargetId your-id --persist
```

## Advanced Patterns

### Test Chaining with Dependencies

Structure complex workflows using test dependencies:

```javascript
// 1. Base prerequisite test
mcp__octomind-mcp__discovery({
  name: "Accept Cookies Banner",
  prompt: "Click accept on cookie banner if present",
  type: "COOKIE_BANNER"
})

// 2. Authentication test  
mcp__octomind-mcp__discovery({
  name: "User Login",
  prompt: "Login with valid credentials",
  prerequisiteName: "Accept Cookies Banner",
  type: "LOGIN"
})

// 3. Main functionality test
mcp__octomind-mcp__discovery({
  name: "Create Project Test",
  prompt: "Test project creation workflow", 
  prerequisiteName: "User Login"
})
```

### Parallel Test Execution

```javascript
// Execute multiple test categories simultaneously
const testCategories = ["security", "mobile", "integration"]

const parallelExecutions = testCategories.map(category => 
  mcp__octomind-mcp__executeTests({
    testTargetId: "your-id",
    url: "http://localhost:3000",
    tags: [category],
    description: `${category} test suite execution`
  })
)

// Monitor all executions
const results = await Promise.all(parallelExecutions)
```

### Environment-Specific Testing

```javascript
const environments = [
  { name: "local", url: "http://localhost:3000" },
  { name: "staging", url: "https://staging.app.com" },
  { name: "production", url: "https://app.com" }
]

// Run same test suite against multiple environments
environments.forEach(env => {
  mcp__octomind-mcp__executeTests({
    testTargetId: `app-${env.name}`,
    url: env.url,
    description: `${env.name} environment validation`
  })
})
```

### Custom Variables & Test Data

```javascript
mcp__octomind-mcp__executeTests({
  testTargetId: "your-id",
  url: "http://localhost:3000", 
  variablesToOverwrite: {
    "CUSTOM_USERNAME": ["testuser1@example.com"],
    "CUSTOM_PASSWORD": ["securepass123"],
    "TEST_DATA_ID": ["12345"]
  }
})
```

## QA Agent Integration Patterns

### Comprehensive Test Suite Creation

```javascript
async function createComprehensiveTestSuite(targetId, appUrl) {
  const testSuites = [
    // Security Tests
    {
      name: "SQL Injection Prevention",
      tags: ["security", "sql-injection"],
      folder: "Security Tests"
    },
    {
      name: "XSS Prevention Validation", 
      tags: ["security", "xss-prevention"],
      folder: "Security Tests"
    },
    
    // Functional Tests
    {
      name: "User Registration Flow",
      tags: ["functional", "authentication"],
      folder: "Core Functionality"
    },
    {
      name: "Data Submission Workflow",
      tags: ["functional", "integration"],
      folder: "Core Functionality" 
    },
    
    // Mobile Tests
    {
      name: "Mobile Responsiveness Check",
      tags: ["mobile", "responsive"],
      folder: "Mobile Testing"
    }
  ]
  
  // Create all tests
  const createdTests = await Promise.all(
    testSuites.map(suite => 
      mcp__octomind-mcp__discovery({
        name: suite.name,
        testTargetId: targetId,
        prompt: generatePromptForSuite(suite),
        tagNames: suite.tags,
        folderName: suite.folder
      })
    )
  )
  
  // Enable all tests
  await Promise.all(
    createdTests.map(test => 
      mcp__octomind-mcp__updateTestCase({
        testTargetId: targetId,
        testCaseId: test.testCaseId,
        runStatus: "ON"
      })
    )
  )
  
  // Execute comprehensive test run
  return mcp__octomind-mcp__executeTests({
    testTargetId: targetId,
    url: appUrl,
    description: "Comprehensive QA validation - All test suites"
  })
}
```

### Results Analysis & Reporting

```javascript
async function analyzeTestResults(targetId, reportId) {
  const report = await mcp__octomind-mcp__getTestReport({
    testTargetId: targetId,
    testReportId: reportId
  })
  
  const analysis = {
    totalTests: report.testResults.length,
    passed: report.testResults.filter(r => r.status === "PASSED").length,
    failed: report.testResults.filter(r => r.status === "FAILED").length,
    securityIssues: report.testResults.filter(r => 
      r.status === "FAILED" && r.tags?.includes("security")
    ),
    mobileIssues: report.testResults.filter(r => 
      r.status === "FAILED" && r.tags?.includes("mobile")
    )
  }
  
  // Generate comprehensive QA report
  return {
    summary: analysis,
    reportUrl: `https://app.octomind.dev/testreports/${reportId}`,
    recommendations: generateRecommendations(analysis),
    traceUrls: report.testResults.map(r => r.traceUrl).filter(Boolean)
  }
}
```

---

## 🎯 BMAD Quick Reference Card

### Essential MCP Functions for BMAD
- `createTestTarget("BMAD-Construction-Evidence-Local", "http://localhost:3000")` - Set up BMAD testing
- `discovery(name, targetId, bmadPrompt, bmadTags)` - Create BMAD-specific tests
- `updateTestCase(targetId, caseId, runStatus: "ON")` - Enable BMAD tests  
- `executeTests(targetId, "http://localhost:3000", description)` - Run BMAD tests
- `getTestReport(targetId, reportId)` - Get BMAD results

### BMAD-Specific Prompt Template
```
INTENT: Test [BMAD feature] for construction site workers/project managers
INSTRUCTIONS: 
1. Navigate to [BMAD page/component]
2. Test with construction data: [realistic construction examples]
3. Validate [construction-specific requirements]
4. Test security: [SQL injection/XSS with construction context]
5. Verify [BMAD business logic]
EXPECTED RESULT: [Construction workflow success criteria + security validation]
```

### BMAD Test Tags
- Core: `["bmad-core", "whatsapp-submission", "ai-processing", "construction-workflow"]`
- Security: `["bmad-security", "sql-injection", "xss-prevention", "multi-tenancy", "rls-policies"]`
- Mobile: `["bmad-mobile", "construction-workers", "375px", "touch-interface", "field-usability"]`
- AI: `["bmad-ai", "construction-vocabulary", "transcription-quality", "ab-testing"]`
- Projects: `["bmad-projects", "project-management", "company-isolation"]`

### BMAD User Flows to Test
1. **Construction Worker**: Landing page → Project selection → WhatsApp submission → AI processing
2. **Project Manager**: Login → Dashboard → Project CRUD → Evidence review → User management
3. **Admin**: Company registration → Security monitoring → System administration

### BMAD Environment Setup
```bash
# Start BMAD for testing
cd C:\BMAD-Explore
npm run dev:web
curl http://localhost:3000  # Verify accessibility

# Create BMAD test target  
mcp__octomind-mcp__createTestTarget({
  app: "BMAD-Construction-Evidence-Local",
  discoveryUrl: "http://localhost:3000" 
})
```

### BMAD Security Test Checklist
- ✅ SQL injection prevention in project forms
- ✅ XSS prevention in WhatsApp message processing  
- ✅ Multi-tenant company data isolation
- ✅ RLS policy validation for submissions
- ✅ Input sanitization for construction data
- ✅ Role-based access control (Admin/PM/Worker)

### BMAD Construction Test Data
```javascript
// Sample project data
{
  name: "Dublin Office Block Phase 1",
  location: "Dublin 2, Ireland",
  contractor: "Murphy Construction Ltd",
  projectCode: "DOB-2024-001"
}

// Sample WhatsApp message
"Just finished pouring concrete for foundation section A3. C25/30 concrete used as specified. Temperature was 8 degrees, added anti-freeze as per cold weather protocol. Pump truck arrived at 8:30 AM, pour completed by 11:15 AM. No issues to report."
```

### Quinn QA Integration
- Use `*review story-1.3` to trigger Octomind testing via Quinn
- Quinn updates story QA results with Octomind test outcomes
- Production deployment requires Quinn's approval based on Octomind results

### BMAD-Specific Troubleshooting
- **RLS Violations**: Check company_id filtering in database queries
- **AI Processing Failures**: Verify construction vocabulary processing  
- **Mobile Issues**: Test 375px viewport with construction worker use cases
- **Multi-tenancy**: Ensure complete company data isolation

This guide provides comprehensive BMAD-specific coverage for QA agents to effectively use the Octomind MCP server with the Construction Evidence Machine application.