# Coding Standards

## Critical Fullstack Rules
- **Type Sharing:** Always define types in packages/shared and import from there
- **API Calls:** Never make direct HTTP calls - use the service layer
- **Environment Variables:** Access only through config objects, never process.env directly
- **Error Handling:** All API routes must use the standard error handler
- **State Updates:** Never mutate state directly - use proper state management patterns
- **Database Access:** Always use repository pattern, never raw SQL
- **File Uploads:** Validate file types and sizes on both frontend and backend
- **Authentication:** Check permissions at both API and database levels
- **Async Operations:** Use proper loading states and error boundaries
- **Testing:** Minimum 80% coverage for business logic

## Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `UserProfile.tsx` |
| Hooks | camelCase with 'use' | - | `useAuth.ts` |
| API Routes | - | kebab-case | `/api/user-profile` |
| Database Tables | - | snake_case | `user_profiles` |
| Environment Variables | SCREAMING_SNAKE_CASE | SCREAMING_SNAKE_CASE | `NEXT_PUBLIC_API_URL` |
| TypeScript Interfaces | PascalCase with 'I' prefix | - | `IUserProfile` |
| Python Classes | PascalCase | PascalCase | `UserProfile` |
| Python Functions | - | snake_case | `get_user_profile` |
