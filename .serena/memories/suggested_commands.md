# BMAD-Explore Development Commands

## Development Commands
```bash
cd bmad-web
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate test coverage
```

## Testing Commands
```bash
npm test -- --testPathPattern=components  # Test specific directory
npm test -- --testNamePattern="OpenAI"    # Test by name pattern
npm run test:coverage                      # Full coverage report
```

## Git Commands (Windows)
```bash
git status           # Check working directory status
git add .            # Stage all changes
git commit -m "message"  # Commit with message
git push origin master   # Push to remote
git pull origin master   # Pull latest changes
```

## Windows System Commands
```cmd
dir                  # List directory contents
cd /path/to/dir     # Change directory
type filename       # Display file contents
findstr "pattern" file  # Search in files
```

## Project Structure Navigation
- Main app: `bmad-web/`
- Components: `bmad-web/components/`
- API routes: `bmad-web/pages/api/`
- Services: `bmad-web/lib/services/`
- Documentation: `docs/`