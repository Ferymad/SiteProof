# Story Draft Checklist

The Scrum Master should use this checklist to validate that each story contains sufficient context for a developer agent to implement it successfully, while assuming the dev agent has reasonable capabilities to figure things out.

[[LLM: INITIALIZATION INSTRUCTIONS - STORY DRAFT VALIDATION

Before proceeding with this checklist, ensure you have access to:

1. The story document being validated (usually in docs/stories/ or provided directly)
2. The parent epic context
3. Any referenced architecture or design documents
4. Previous related stories if this builds on prior work

IMPORTANT: This checklist validates individual stories BEFORE implementation begins.

VALIDATION PRINCIPLES:

1. Clarity - A developer should understand WHAT to build
2. Context - WHY this is being built and how it fits
3. Guidance - Key technical decisions and patterns to follow
4. Testability - How to verify the implementation works
5. Self-Contained - Most info needed is in the story itself

REMEMBER: We assume competent developer agents who can:

- Research documentation and codebases
- Make reasonable technical decisions
- Follow established patterns
- Ask for clarification when truly stuck

We're checking for SUFFICIENT guidance, not exhaustive detail.]]

## 1. GOAL & CONTEXT CLARITY

[[LLM: Without clear goals, developers build the wrong thing. Verify:

1. The story states WHAT functionality to implement
2. The business value or user benefit is clear
3. How this fits into the larger epic/product is explained
4. Dependencies are explicit ("requires Story X to be complete")
5. Success looks like something specific, not vague]]

- [ ] Story goal/purpose is clearly stated
- [ ] Relationship to epic goals is evident
- [ ] How the story fits into overall system flow is explained
- [ ] Dependencies on previous stories are identified (if applicable)
- [ ] Business context and value are clear

## 2. TECHNICAL IMPLEMENTATION GUIDANCE

[[LLM: Developers need enough technical context to start coding. Check:

1. Key files/components to create or modify are mentioned
2. Technology choices are specified where non-obvious
3. Integration points with existing code are identified
4. Data models or API contracts are defined or referenced
5. Non-standard patterns or exceptions are called out

Note: We don't need every file listed - just the important ones.]]

- [ ] Key files to create/modify are identified (not necessarily exhaustive)
- [ ] Technologies specifically needed for this story are mentioned
- [ ] Critical APIs or interfaces are sufficiently described
- [ ] Necessary data models or structures are referenced
- [ ] Required environment variables are listed (if applicable)
- [ ] Any exceptions to standard coding patterns are noted

## 3. REFERENCE EFFECTIVENESS

[[LLM: References should help, not create a treasure hunt. Ensure:

1. References point to specific sections, not whole documents
2. The relevance of each reference is explained
3. Critical information is summarized in the story
4. References are accessible (not broken links)
5. Previous story context is summarized if needed]]

- [ ] References to external documents point to specific relevant sections
- [ ] Critical information from previous stories is summarized (not just referenced)
- [ ] Context is provided for why references are relevant
- [ ] References use consistent format (e.g., `docs/filename.md#section`)

## 4. SELF-CONTAINMENT ASSESSMENT

[[LLM: Stories should be mostly self-contained to avoid context switching. Verify:

1. Core requirements are in the story, not just in references
2. Domain terms are explained or obvious from context
3. Assumptions are stated explicitly
4. Edge cases are mentioned (even if deferred)
5. The story could be understood without reading 10 other documents]]

- [ ] Core information needed is included (not overly reliant on external docs)
- [ ] Implicit assumptions are made explicit
- [ ] Domain-specific terms or concepts are explained
- [ ] Edge cases or error scenarios are addressed

## 5. TESTING GUIDANCE

[[LLM: Testing ensures the implementation actually works. Check:

1. Test approach is specified (unit, integration, e2e)
2. Key test scenarios are listed
3. Success criteria are measurable
4. Special test considerations are noted
5. Acceptance criteria in the story are testable]]

- [ ] Required testing approach is outlined
- [ ] Key test scenarios are identified
- [ ] Success criteria are defined
- [ ] Special testing considerations are noted (if applicable)

## 6. STORY ENHANCEMENT ANALYSIS

[[LLM: Check if this story could benefit from Smart Enhancement guidance:

1. Analyze story content for external service integrations (authentication, payments, databases, APIs)
2. If external services detected, verify story includes phased implementation guidance
3. Check if completion validation steps are included for complex integrations
4. Use Story Enhancement Engine (.bmad-core/utils/story-enhancement-engine.js) if available
5. **REF-MCP PATTERN DEPLOYMENT**: For external services, identify patterns needed AND actually deploy them to the story document:
   - Use selectCriticalPatterns() to identify REF-MCP patterns
   - Use fetchCriticalPatterns() to generate REF-MCP instructions  
   - Use formatCriticalPatterns() to create formatted section
   - **CRITICAL**: Actually add the "🎯 Critical Implementation Patterns (For Dev Agent)" section to story Dev Notes
6. **BRUTAL QA PATTERN DEPLOYMENT**: For external services, identify testing requirements AND actually deploy them to the story document:
   - Use selectCriticalQAPatterns() to identify QA testing scenarios
   - Use formatQATestingRequirements() to create formatted section
   - **CRITICAL**: Actually add the "🧪 Critical QA Testing Requirements (For QA Agent)" section to story (after Dev Notes)
7. **ATOMIC DEPLOYMENT**: Use generateBrutalEnhancementSections() to deploy BOTH REF-MCP and QA patterns together
8. **DEPLOYMENT VERIFICATION**: After deployment, verify story document contains BOTH REF-MCP queries AND QA testing requirements (not just analysis)
9. **ROLE SEPARATION**: SM deploys ALL pattern instructions to story, Dev Agent fetches/implements code, QA Agent executes testing
10. If patterns deployed, confirm BOTH deployments in validation results

This ensures stories ACTUALLY CONTAIN deployed REF-MCP instructions AND brutal QA testing requirements for complete success, preventing Story 1.2 scenarios.]]

- [ ] Story analyzed for external service integration patterns
- [ ] Complex integrations include phased implementation guidance (if applicable)
- [ ] Completion validation steps included for external services (if applicable)
- [ ] **REF-MCP pattern instructions DEPLOYED in story Dev Notes section** (prevents deprecated API usage)
- [ ] **Critical Implementation Patterns section present with REF-MCP queries** (maximizes dev agent one-shot success)
- [ ] **QA testing requirements DEPLOYED in story QA section** (prevents runtime failures)
- [ ] **Critical QA Testing Requirements section present with Playwright scenarios** (maximizes QA brutal testing)
- [ ] **Pattern deployment verified**: Story document contains "🎯 Critical Implementation Patterns (For Dev Agent)" section
- [ ] **QA deployment verified**: Story document contains "🧪 Critical QA Testing Requirements (For QA Agent)" section
- [ ] **Sweet spot maintained**: Max 3 REF-MCP patterns + Max 3 QA scenarios, focused on preventing failure modes
- [ ] **Role boundaries respected**: SM deploys ALL pattern instructions, Dev Agent fetches/implements, QA Agent executes testing
- [ ] **Atomic deployment confirmation**: BOTH REF-MCP queries AND QA testing requirements actually exist in story document
- [ ] Story Enhancement Engine recommendations applied (if applicable)
- [ ] **API currency warnings noted** (e.g., @supabase/auth-helpers vs @supabase/ssr)
- [ ] **Playwright MCP integration confirmed**: QA scenarios include specific Playwright commands for brutal testing

## VALIDATION RESULT

[[LLM: FINAL STORY VALIDATION REPORT

Generate a concise validation report:

1. Quick Summary
   - Story readiness: READY / NEEDS REVISION / BLOCKED
   - Clarity score (1-10)
   - Major gaps identified

2. Fill in the validation table with:
   - PASS: Requirements clearly met
   - PARTIAL: Some gaps but workable
   - FAIL: Critical information missing

3. Specific Issues (if any)
   - List concrete problems to fix
   - Suggest specific improvements
   - Identify any blocking dependencies

4. Developer Perspective
   - Could YOU implement this story as written?
   - What questions would you have?
   - What might cause delays or rework?

Be pragmatic - perfect documentation doesn't exist, but it must be enough to provide the extreme context a dev agent needs to get the work down and not create a mess.]]

| Category                             | Status | Issues |
| ------------------------------------ | ------ | ------ |
| 1. Goal & Context Clarity            | _TBD_  |        |
| 2. Technical Implementation Guidance | _TBD_  |        |
| 3. Reference Effectiveness           | _TBD_  |        |
| 4. Self-Containment Assessment       | _TBD_  |        |
| 5. Testing Guidance                  | _TBD_  |        |
| 6. Story Enhancement Analysis        | _TBD_  |        |

**Final Assessment:**

- READY: The story provides sufficient context for implementation
- NEEDS REVISION: The story requires updates (see issues)
- BLOCKED: External information required (specify what information)
