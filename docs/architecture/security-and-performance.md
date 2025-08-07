# Security and Performance

## Security Requirements

**Frontend Security:**
- CSP Headers: `default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline';`
- XSS Prevention: React's automatic escaping + DOMPurify for user content
- Secure Storage: Sensitive data in httpOnly cookies, non-sensitive in localStorage

**Backend Security:**
- Input Validation: Django REST Framework serializers with strict validation
- Rate Limiting: 100 requests/minute for authenticated users, 20 for anonymous
- CORS Policy: Whitelist frontend domains only

**Authentication Security:**
- Token Storage: httpOnly cookies for refresh tokens, memory for access tokens
- Session Management: 15-minute access tokens, 7-day refresh tokens
- Password Policy: Minimum 8 characters, complexity requirements

## Performance Optimization

**Frontend Performance:**
- Bundle Size Target: <200KB initial JS
- Loading Strategy: Code splitting, lazy loading, progressive enhancement
- Caching Strategy: SWR for data fetching, service worker for offline

**Backend Performance:**
- Response Time Target: <500ms p95, <100ms p50
- Database Optimization: Indexes on foreign keys, materialized views for stats
- Caching Strategy: Redis for sessions, CloudFront for static assets
