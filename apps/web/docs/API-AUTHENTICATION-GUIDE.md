# API Authentication Guide
**Story 1.2 Task 6: API Authentication for Integrations**

This comprehensive guide covers all authentication methods and security features for the BMAD API.

## Table of Contents

1. [Authentication Methods](#authentication-methods)
2. [Getting Started](#getting-started)
3. [API Keys Management](#api-keys-management)
4. [JWT Token Authentication](#jwt-token-authentication)
5. [Rate Limiting](#rate-limiting)
6. [CORS Configuration](#cors-configuration)
7. [Security Best Practices](#security-best-practices)
8. [Error Handling](#error-handling)
9. [Code Examples](#code-examples)
10. [Troubleshooting](#troubleshooting)

## Authentication Methods

The BMAD API supports multiple authentication methods:

### 1. JWT Tokens (Web Applications)
- **Primary method** for web applications
- Short-lived access tokens (15 minutes)
- Automatic refresh with secure rotation
- Full user context and permissions

### 2. API Keys (Integrations)
- **Recommended** for third-party integrations
- Long-lived credentials with configurable permissions
- Company-scoped access with rate limiting
- Easy to manage and revoke

### 3. Refresh Token Rotation
- Secure token refresh mechanism
- Prevents token reuse attacks
- Automatic suspicious activity detection

## Getting Started

### Base URL
```
Production: https://api.bmad.construction
Development: http://localhost:3000/api
```

### Authentication Header
All authenticated requests must include an `Authorization` header:

```http
Authorization: Bearer <token>
```

## API Keys Management

### Creating API Keys

Only company administrators can create and manage API keys.

#### Endpoint
```http
POST /api/auth/api-keys
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

#### Request Body
```json
{
  "name": "Integration Name",
  "description": "Purpose of this API key",
  "permissions": ["read", "write"],
  "scopes": ["read", "write"],
  "rateLimits": {
    "requestsPerMinute": 60,
    "requestsPerHour": 1000,
    "requestsPerDay": 10000
  },
  "expiresIn": 365
}
```

#### Response
```json
{
  "apiKey": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Integration Name",
    "key": "bmad_a1b2c3d4e5f6...", // Only shown once!
    "keyPrefix": "bmad_a1b2c3d4",
    "permissions": ["read", "write"],
    "scopes": ["read", "write"],
    "rateLimits": {
      "requestsPerMinute": 60,
      "requestsPerHour": 1000,
      "requestsPerDay": 10000
    },
    "isActive": true,
    "expiresAt": "2025-08-11T12:00:00Z",
    "createdAt": "2024-08-11T12:00:00Z"
  }
}
```

### Listing API Keys

```http
GET /api/auth/api-keys
Authorization: Bearer <jwt-token>
```

### Updating API Keys

```http
PATCH /api/auth/api-keys
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "isActive": false,
  "rateLimits": {
    "requestsPerMinute": 30
  }
}
```

### Deleting API Keys

```http
DELETE /api/auth/api-keys
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

## JWT Token Authentication

### Initial Authentication

Use the Supabase Auth system to obtain initial JWT tokens:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
)

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@company.com',
  password: 'password'
})

if (data.session) {
  const accessToken = data.session.access_token
  const refreshToken = data.session.refresh_token
}
```

### Token Refresh

When access tokens expire (15 minutes), use the refresh endpoint:

```http
POST /api/auth/token-refresh
Content-Type: application/json

{
  "refreshToken": "refresh-token-here"
}
```

#### Response
```json
{
  "accessToken": "new-access-token",
  "refreshToken": "new-refresh-token",
  "expiresIn": 900,
  "tokenType": "Bearer"
}
```

### Token Validation

The API automatically validates JWT tokens and provides user context:

- User ID and company association
- Role-based permissions
- Company data isolation
- Session security checks

## Rate Limiting

### Default Limits

| Authentication Method | Per Minute | Per Hour | Per Day |
|----------------------|------------|----------|---------|
| JWT Tokens (Users)   | 100        | 1,000    | 10,000  |
| API Keys             | 300        | 5,000    | 50,000  |
| Anonymous            | 10         | 100      | 500     |

### Rate Limit Headers

All API responses include rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1628097600
Retry-After: 60
```

### Handling Rate Limits

When rate limited (HTTP 429), respect the `Retry-After` header:

```javascript
async function apiRequest(url, options) {
  const response = await fetch(url, options)
  
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After')
    console.log(`Rate limited. Retry after ${retryAfter} seconds`)
    
    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
    return apiRequest(url, options)
  }
  
  return response
}
```

### Custom Rate Limits

API keys can have custom rate limits configured:

```json
{
  "rateLimits": {
    "requestsPerMinute": 200,
    "requestsPerHour": 5000,
    "requestsPerDay": 100000
  }
}
```

## CORS Configuration

### Managing CORS Origins

Company administrators can configure allowed origins:

#### Adding CORS Origin
```http
POST /api/auth/cors-origins
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "origin": "https://app.example.com",
  "description": "Main application domain",
  "allowCredentials": true,
  "allowedMethods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
  "allowedHeaders": ["Authorization", "Content-Type"],
  "maxAge": 86400
}
```

#### Response
```json
{
  "corsOrigin": {
    "id": "cors-id",
    "origin": "https://app.example.com",
    "description": "Main application domain",
    "isActive": true,
    "allowCredentials": true,
    "allowedMethods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
    "allowedHeaders": ["Authorization", "Content-Type"],
    "maxAge": 86400
  },
  "securityWarnings": []
}
```

### CORS Security

- Only HTTPS origins allowed in production
- No wildcard origins supported
- Credentials only allowed for explicitly configured origins
- Regular security validation

## Security Best Practices

### API Key Security

1. **Store Securely**: Never commit API keys to version control
2. **Use Environment Variables**: Store keys in secure environment variables
3. **Rotate Regularly**: Set expiration dates and rotate keys regularly
4. **Minimum Permissions**: Grant only necessary permissions
5. **Monitor Usage**: Track API key usage and watch for anomalies

```bash
# Environment variables
BMAD_API_KEY=bmad_your_api_key_here
BMAD_API_URL=https://api.bmad.construction
```

### JWT Token Security

1. **Automatic Refresh**: Implement automatic token refresh
2. **Secure Storage**: Store refresh tokens in httpOnly cookies
3. **Don't Log Tokens**: Never log tokens in application logs
4. **Validate Origins**: Check request origins match expected domains

### Network Security

1. **Use HTTPS**: Always use HTTPS in production
2. **Validate SSL**: Verify SSL certificates
3. **IP Restrictions**: Consider IP whitelisting for sensitive operations
4. **Monitor Traffic**: Watch for unusual traffic patterns

## Error Handling

### Authentication Errors

| Status | Code | Description | Action |
|--------|------|-------------|---------|
| 401 | `AUTHENTICATION_REQUIRED` | No valid authentication | Provide valid credentials |
| 401 | `INVALID_JWT_TOKEN` | JWT token invalid/expired | Refresh token or re-authenticate |
| 401 | `INVALID_API_KEY` | API key invalid/expired | Check key or generate new one |
| 403 | `PERMISSION_DENIED` | Insufficient permissions | Check user role/permissions |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry |

### Error Response Format

```json
{
  "error": "Authentication required",
  "code": "AUTHENTICATION_REQUIRED",
  "timestamp": "2024-08-11T12:00:00Z",
  "requestId": "req_abc123"
}
```

## Code Examples

### JavaScript/Node.js with API Key

```javascript
class BMADClient {
  constructor(apiKey, baseURL = 'https://api.bmad.construction') {
    this.apiKey = apiKey
    this.baseURL = baseURL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`API Error: ${error.message}`)
    }

    return response.json()
  }

  async getSubmissions() {
    return this.request('/api/v1/submissions')
  }

  async createSubmission(data) {
    return this.request('/api/v1/submissions', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}

// Usage
const client = new BMADClient(process.env.BMAD_API_KEY)
const submissions = await client.getSubmissions()
```

### Python with API Key

```python
import requests
import os
from typing import Dict, Any

class BMADClient:
    def __init__(self, api_key: str, base_url: str = "https://api.bmad.construction"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })

    def request(self, endpoint: str, method: str = 'GET', **kwargs) -> Dict[Any, Any]:
        url = f"{self.base_url}{endpoint}"
        response = self.session.request(method, url, **kwargs)
        
        if response.status_code == 429:
            retry_after = int(response.headers.get('Retry-After', 60))
            time.sleep(retry_after)
            return self.request(endpoint, method, **kwargs)
        
        response.raise_for_status()
        return response.json()

    def get_submissions(self):
        return self.request('/api/v1/submissions')

    def create_submission(self, data: dict):
        return self.request('/api/v1/submissions', method='POST', json=data)

# Usage
client = BMADClient(os.getenv('BMAD_API_KEY'))
submissions = client.get_submissions()
```

### cURL Examples

#### Get Submissions
```bash
curl -X GET "https://api.bmad.construction/api/v1/submissions" \
  -H "Authorization: Bearer bmad_your_api_key_here" \
  -H "Content-Type: application/json"
```

#### Create Submission
```bash
curl -X POST "https://api.bmad.construction/api/v1/submissions" \
  -H "Authorization: Bearer bmad_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "whatsapp_text": "Delivered 100 concrete blocks to site",
    "voice_file_path": "/path/to/audio.mp3"
  }'
```

### React Hook for JWT Authentication

```javascript
import { useEffect, useState, useCallback } from 'react'

export function useAuth() {
  const [token, setToken] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshToken = useCallback(async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    try {
      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) throw new Error('No refresh token')

      const response = await fetch('/api/auth/token-refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      })

      if (!response.ok) throw new Error('Refresh failed')

      const data = await response.json()
      setToken(data.accessToken)
      localStorage.setItem('refresh_token', data.refreshToken)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Token refresh failed:', error)
      setIsAuthenticated(false)
      localStorage.removeItem('refresh_token')
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing])

  const apiRequest = useCallback(async (url, options = {}) => {
    if (!token) {
      await refreshToken()
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (response.status === 401) {
      await refreshToken()
      return apiRequest(url, options)
    }

    return response
  }, [token, refreshToken])

  return { token, isAuthenticated, apiRequest, refreshToken }
}
```

## Troubleshooting

### Common Issues

#### 1. Invalid API Key
```
Error: Invalid or expired API key
```
**Solution**: Check the API key format and expiration date. Regenerate if necessary.

#### 2. CORS Issues
```
Error: Access to fetch blocked by CORS policy
```
**Solution**: Add your domain to the CORS origins configuration.

#### 3. Rate Limiting
```
Error: Rate limit exceeded
```
**Solution**: Implement exponential backoff and respect retry headers.

#### 4. Permission Denied
```
Error: Insufficient permissions
```
**Solution**: Check user role and API key scopes.

### Testing Authentication

#### Test API Key
```bash
curl -X GET "https://api.bmad.construction/api/auth/validate" \
  -H "Authorization: Bearer bmad_your_api_key_here"
```

#### Expected Response
```json
{
  "valid": true,
  "keyInfo": {
    "name": "Integration Name",
    "permissions": ["read", "write"],
    "rateLimits": {
      "remaining": 95,
      "resetTime": 1628097600
    }
  }
}
```

### Debug Mode

Enable debug headers for troubleshooting:

```bash
curl -X GET "https://api.bmad.construction/api/v1/submissions" \
  -H "Authorization: Bearer bmad_your_api_key_here" \
  -H "X-Debug: true"
```

Debug response includes:
- Request ID for tracing
- Rate limit details
- Permission validation results
- Company context information

### Contact Support

For additional support:
- **Documentation**: [https://docs.bmad.construction](https://docs.bmad.construction)
- **API Status**: [https://status.bmad.construction](https://status.bmad.construction)
- **Support Email**: api-support@bmad.construction

---

**Security Notice**: Keep your API keys secure and never share them publicly. Report any security concerns immediately to security@bmad.construction.