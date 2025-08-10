# Task Completion Workflow

## When Task is Completed

### 1. Code Quality Checks
```bash
cd bmad-web
npm run lint         # Check for linting errors
npm run build        # Ensure build succeeds
npm run test         # Run all tests
```

### 2. Security Validation
- Ensure no API keys in frontend code
- Verify environment variables are server-side only
- Check that sensitive operations are in API routes
- Validate proper client/server separation

### 3. Testing Requirements
- Unit tests for new components
- Integration tests for API routes
- Security tests for API key handling
- Browser testing for UI components

### 4. Documentation Updates
- Update component documentation
- Update API documentation
- Add security considerations
- Update architecture diagrams if needed

### 5. Git Workflow
```bash
git add .
git commit -m "feat: descriptive commit message"
git push origin master
```

## Architecture Standards
- Frontend components NEVER import OpenAI directly
- All AI processing in API routes
- Environment variables server-side only
- Clear separation of concerns
- Security-first approach