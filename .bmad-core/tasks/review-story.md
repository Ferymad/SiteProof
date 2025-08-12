# review-story

When a developer agent marks a story as "Ready for Review", perform a comprehensive senior developer code review with the ability to refactor and improve code directly.

## Prerequisites

- Story status must be "Review"
- Developer has completed all tasks and updated the File List
- All automated tests are passing

## Review Process

1. **Read the Complete Story**
   - Review all acceptance criteria
   - Understand the dev notes and requirements
   - Note any completion notes from the developer

2. **Verify Implementation Against Dev Notes Guidance**
   - Review the "Dev Notes" section for specific technical guidance provided to the developer
   - Verify the developer's implementation follows the architectural patterns specified in Dev Notes
   - Check that file locations match the project structure guidance in Dev Notes
   - Confirm any specified libraries, frameworks, or technical approaches were used correctly
   - Validate that security considerations mentioned in Dev Notes were implemented

3. **Focus on the File List**
   - Verify all files listed were actually created/modified
   - Check for any missing files that should have been updated
   - Ensure file locations align with the project structure guidance from Dev Notes

4. **Senior Developer Code Review**
   - Review code with the eye of a senior developer
   - If changes form a cohesive whole, review them together
   - If changes are independent, review incrementally file by file
   - Focus on:
     - Code architecture and design patterns
     - Refactoring opportunities
     - Code duplication or inefficiencies
     - Performance optimizations
     - Security concerns
     - Best practices and patterns

5. **Active Refactoring**
   - As a senior developer, you CAN and SHOULD refactor code where improvements are needed
   - When refactoring:
     - Make the changes directly in the files
     - Explain WHY you're making the change
     - Describe HOW the change improves the code
     - Ensure all tests still pass after refactoring
     - Update the File List if you modify additional files

6. **Standards Compliance Check**
   - Verify adherence to `docs/coding-standards.md`
   - Check compliance with `docs/unified-project-structure.md`
   - Validate testing approach against `docs/testing-strategy.md`
   - Ensure all guidelines mentioned in the story are followed

7. **Acceptance Criteria Validation**
   - Verify each AC is fully implemented
   - Check for any missing functionality
   - Validate edge cases are handled

8. **Test Coverage Review**
   - Ensure unit tests cover edge cases
   - Add missing tests if critical coverage is lacking
   - Verify integration tests (if required) are comprehensive
   - Check that test assertions are meaningful
   - Look for missing test scenarios

9. **BRUTAL QA VALIDATION (External Service Stories Only)**
   - **MANDATORY CHECK**: Look for "🧪 Critical QA Testing Requirements (For QA Agent)" section in story
   - **IF QA requirements found**: Execute ALL critical testing scenarios using Playwright MCP
   - **Playwright Execution Workflow**:
     a. Use `mcp__microsoft-playwright-mcp__browser_navigate` to navigate to application
     b. Execute each scenario step-by-step following exact reproduction steps
     c. Use `mcp__microsoft-playwright-mcp__browser_snapshot` to capture current state
     d. Use `mcp__microsoft-playwright-mcp__browser_take_screenshot` to document any failures
     e. Document EVERY flaw found with exact reproduction steps
   - **Critical Failure Mode Detection**:
     - ✅ **Story 1.2 Prevention**: Verify no infinite auth loops (login → dashboard, not login → login)
     - ✅ **External Service Integration**: All third-party services actually working
     - ✅ **Error State Handling**: App handles failures gracefully without crashes
   - **Brutal Documentation Standard**: Every bug must include:
     - Exact steps to reproduce
     - Expected behavior
     - Actual behavior
     - Screenshot evidence
     - Clear fix instructions for Dev Agent

10. **Documentation and Comments**
    - Verify code is self-documenting where possible
    - Add comments for complex logic if missing
    - Ensure any API changes are documented

## Update Story File - QA Results Section ONLY

**CRITICAL**: You are ONLY authorized to update the "QA Results" section of the story file. DO NOT modify any other sections.

After review and any refactoring, append your results to the story file in the QA Results section:

```markdown
## QA Results

### Review Date: [Date]

### Reviewed By: Quinn (Brutal QA Agent)

### Code Quality Assessment

[Overall assessment of implementation quality]

### Brutal QA Testing Results

**External Service Integration Testing**: [✓ Executed / ⚠️ Skipped - No QA requirements found]

[IF QA testing was executed, document each scenario result:]

#### Authentication Flow Validation
- **Login Success Path**: [✓ PASS / ✗ FAIL]
  - **Steps Executed**: [Actual steps performed]
  - **Result**: [What happened]
  - **Evidence**: [Screenshot filename if failure]
  - **Issues Found**: [Specific bugs discovered]

- **Session Persistence**: [✓ PASS / ✗ FAIL]
  - **Steps Executed**: [Actual steps performed]
  - **Result**: [What happened]
  - **Issues Found**: [Specific bugs discovered]

#### Payment Flow Validation (if applicable)
- **Payment Success Path**: [✓ PASS / ✗ FAIL]
- **Payment Error Handling**: [✓ PASS / ✗ FAIL]

#### Story 1.2 Prevention Validation
- **No Infinite Auth Loops**: [✓ CONFIRMED / ✗ FAILED - Infinite loops detected]
- **Deprecated Package Detection**: [✓ CLEAN / ⚠️ DEPRECATED PACKAGES FOUND]

### Critical Bugs Discovered

[IF any critical bugs found during brutal testing:]

1. **Bug**: [Short description]
   - **Reproduction Steps**: 
     1. [Step 1]
     2. [Step 2] 
     3. [Step 3]
   - **Expected**: [What should happen]
   - **Actual**: [What actually happened]
   - **Evidence**: [Screenshot: screenshot-file.png]
   - **Fix Required**: [Specific instructions for Dev Agent]
   - **Priority**: [HIGH/MEDIUM/LOW]

### Refactoring Performed

[List any refactoring you performed with explanations]

- **File**: [filename]
  - **Change**: [what was changed]
  - **Why**: [reason for change]
  - **How**: [how it improves the code]

### Compliance Check

- Coding Standards: [✓/✗] [notes if any]
- Project Structure: [✓/✗] [notes if any]
- Testing Strategy: [✓/✗] [notes if any]
- All ACs Met: [✓/✗] [notes if any]
- **Brutal QA Requirements**: [✓ All scenarios tested / ⚠️ Partial / ✗ Failed]

### Improvements Checklist

[Check off items you handled yourself, leave unchecked for dev to address]

- [x] Refactored user service for better error handling (services/user.service.ts)
- [x] Added missing edge case tests (services/user.service.test.ts)
- [ ] Consider extracting validation logic to separate validator class
- [ ] Add integration test for error scenarios
- [ ] Update API documentation for new error codes

### Security Review

[Any security concerns found and whether addressed]

### Performance Considerations

[Any performance issues found and whether addressed]

### Final Status

[✓ Approved - Ready for Done] / [✗ Changes Required - See Critical Bugs and unchecked items above]

**Brutal QA Summary**: [Total scenarios tested: X | Passed: Y | Failed: Z]
```

## Key Principles

- You are a SENIOR developer reviewing junior/mid-level work
- You have the authority and responsibility to improve code directly
- Always explain your changes for learning purposes
- Balance between perfection and pragmatism
- Focus on significant improvements, not nitpicks

## Blocking Conditions

Stop the review and request clarification if:

- Story file is incomplete or missing critical sections
- File List is empty or clearly incomplete
- No tests exist when they were required
- Code changes don't align with story requirements
- Critical architectural issues that require discussion

## Completion

After review:

1. If all items are checked and approved: Update story status to "Done"
2. If unchecked items remain: Keep status as "Review" for dev to address
3. Always provide constructive feedback and explanations for learning
