# Security Middleware Implementation Guide

## Task #9482 - Security Middleware Integration

This guide documents the security middleware implementation and integration for the product template.

---

## Implementation Status

### ✅ Completed Components

1. **Helmet (Security Headers)** - `src/lib/@system/Middleware/security.js`
   - ✅ Configured with CSP, HSTS, XSS protection
   - ✅ Applied globally in `app.js`
   - ✅ Production-ready configuration

2. **Rate Limiting** - `src/lib/@system/RateLimit/index.js`
   - ✅ Redis-backed distributed rate limiting
   - ✅ Multiple limiters for different endpoints
   - ✅ Applied to auth endpoints and general API

3. **Input Validation** - `src/lib/@system/Validation/index.js`
   - ✅ Zod-based validation middleware
   - ✅ Type coercion and structured errors
   - ✅ Applied to existing routes

4. **CSRF Protection** - `src/lib/@system/Middleware/csrf.js`
   - ✅ Double-submit cookie pattern
   - ✅ Token generation endpoint at `/api/csrf-token`
   - ⚠️ **Needs integration with protected routes**

---

## Integration Required: CSRF Protection

### Current State
The CSRF middleware is implemented but not applied to any routes. State-changing endpoints (POST/PUT/PATCH/DELETE) need CSRF protection.

### Implementation Options

#### Option 1: Global CSRF Protection (Recommended for new projects)

Apply CSRF to all API routes except specific exclusions:

```javascript
// src/app.js

const { csrfProtection } = require('./lib/@system/Middleware')

// Apply CSRF protection to all API routes
// Automatically skips GET, HEAD, OPTIONS
app.use('/api', csrfProtection)

// Routes
app.use('/api', systemRoutes)
app.use('/api', customRoutes)
```

**Pros:**
- Comprehensive protection by default
- No need to remember CSRF on new routes
- Consistent security posture

**Cons:**
- All POST/PUT/PATCH/DELETE requests require CSRF token
- May need exclusions for webhooks, API keys, etc.

#### Option 2: Per-Route CSRF Protection (Recommended for existing projects)

Apply CSRF selectively to sensitive endpoints:

```javascript
// Example: src/api/@system/sessions/index.js

const { csrfProtection } = require('../../../lib/@system/Middleware')

// Protect logout endpoint
router.delete('/sessions', authenticate, csrfProtection, async (req, res) => {
  // Logout logic
})

// Protect session revocation
router.delete('/sessions/:id', authenticate, csrfProtection, 
  validate({ params: DeleteSessionParams }), 
  async (req, res) => {
    // Revoke session
  }
)
```

**Pros:**
- Gradual migration for existing projects
- More control over which endpoints are protected
- Can exclude specific routes easily

**Cons:**
- Must remember to add CSRF to new routes
- Risk of forgetting protection on sensitive endpoints

---

## Client-Side Integration

### Step 1: Fetch CSRF Token

```javascript
// On app initialization or before first protected request
async function fetchCsrfToken() {
  const response = await fetch('/api/csrf-token', {
    credentials: 'include', // IMPORTANT: Include cookies
  })
  const { csrfToken } = await response.json()
  
  // Store for later use
  localStorage.setItem('csrfToken', csrfToken)
  return csrfToken
}
```

### Step 2: Include Token in Requests

```javascript
// For all POST/PUT/PATCH/DELETE requests
async function makeProtectedRequest(url, data) {
  const csrfToken = localStorage.getItem('csrfToken')
  
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include', // IMPORTANT: Include cookies
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken, // CSRF token header
    },
    body: JSON.stringify(data),
  })
  
  return response.json()
}
```

### Step 3: Handle CSRF Errors

```javascript
// Refresh token on 403 CSRF errors
async function makeProtectedRequestWithRetry(url, data) {
  let response = await makeProtectedRequest(url, data)
  
  // If CSRF token is invalid, refresh and retry once
  if (response.status === 403 && response.error === 'CSRF_VALIDATION_FAILED') {
    await fetchCsrfToken()
    response = await makeProtectedRequest(url, data)
  }
  
  return response
}
```

---

## Recommended Routes for CSRF Protection

### High Priority (User Account Security)

```javascript
// Authentication & Sessions
DELETE /api/sessions          // Logout
DELETE /api/sessions/:id      // Revoke session
POST   /api/sessions          // Login (optional - see note below)
POST   /api/sessions/refresh  // Token refresh (optional)

// User Management
PUT    /api/user              // Update profile
DELETE /api/user              // Delete account
PUT    /api/user/password     // Change password
PUT    /api/user/email        // Change email

// 2FA
POST   /api/totp/setup        // Setup 2FA
POST   /api/totp/enable       // Enable 2FA
POST   /api/totp/disable      // Disable 2FA

// OAuth
POST   /api/oauth/disconnect  // Disconnect OAuth provider
```

**Note on Login:** CSRF protection on login is optional but recommended. It prevents login CSRF attacks where an attacker tricks a user into logging into the attacker's account. If protecting login, ensure the client can fetch a CSRF token before authenticating.

### Medium Priority (Financial & Sensitive Operations)

```javascript
// Payments
POST   /api/subscriptions
PUT    /api/subscriptions/:id
DELETE /api/subscriptions/:id
POST   /api/payments

// API Keys
POST   /api/api-keys
DELETE /api/api-keys/:id

// Admin Actions
POST   /api/admin/*
PUT    /api/admin/*
DELETE /api/admin/*
```

### Low Priority (Content Management)

```javascript
// User-generated content (still recommend protection)
POST   /api/posts
PUT    /api/posts/:id
DELETE /api/posts/:id
```

---

## Excluded Endpoints

These endpoints should NOT have CSRF protection:

1. **Webhooks** - External services can't provide CSRF tokens
   ```javascript
   POST /api/stripe/webhook
   POST /api/github/webhook
   ```

2. **API Key Authenticated Requests** - Use API key authentication instead
   ```javascript
   // When using API key middleware
   router.post('/api/data', authenticateApiKey, handler)
   ```

3. **Public Endpoints** - No authentication required
   ```javascript
   GET  /api/public/posts
   POST /api/contact  // If public contact form
   ```

4. **Health Checks** - Infrastructure endpoints
   ```javascript
   GET /health
   GET /healthz
   GET /api/health
   ```

---

## Testing CSRF Protection

### Manual Testing

```bash
# 1. Fetch CSRF token
curl -c cookies.txt http://localhost:4000/api/csrf-token

# 2. Extract token from response
# {"csrfToken":"<token-value>"}

# 3. Make protected request with token
curl -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token-value>" \
  -X DELETE \
  http://localhost:4000/api/sessions

# 4. Try without token (should fail)
curl -b cookies.txt \
  -H "Content-Type: application/json" \
  -X DELETE \
  http://localhost:4000/api/sessions
# Expected: 403 {"message":"Invalid or missing CSRF token","error":"CSRF_VALIDATION_FAILED"}
```

### Automated Tests

```javascript
// test/api/@system/csrf.test.js
const request = require('supertest')
const app = require('../../../src/app')

describe('CSRF Protection', () => {
  let csrfToken
  let cookies

  beforeEach(async () => {
    // Fetch CSRF token
    const res = await request(app)
      .get('/api/csrf-token')
    
    csrfToken = res.body.csrfToken
    cookies = res.headers['set-cookie']
  })

  it('should reject POST requests without CSRF token', async () => {
    const res = await request(app)
      .post('/api/protected-endpoint')
      .set('Cookie', cookies)
      .expect(403)
    
    expect(res.body.error).toBe('CSRF_VALIDATION_FAILED')
  })

  it('should accept POST requests with valid CSRF token', async () => {
    const res = await request(app)
      .post('/api/protected-endpoint')
      .set('Cookie', cookies)
      .set('X-CSRF-Token', csrfToken)
      .expect(200)
  })
})
```

---

## Environment Configuration

### Required Environment Variables

```env
# CSRF Protection
CSRF_SECRET=<generate-random-32-char-string>

# Generate with:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Optional Configuration

```env
# Disable CSRF in development (not recommended)
SKIP_CSRF=true

# Redis for distributed rate limiting
REDIS_URL=redis://localhost:6379

# Enable HTTPS-only cookies in production
NODE_ENV=production
```

---

## Migration Checklist

For integrating CSRF protection into an existing project:

- [ ] Set `CSRF_SECRET` in environment variables
- [ ] Choose implementation strategy (global vs per-route)
- [ ] Update client code to fetch and include CSRF tokens
- [ ] Apply CSRF protection to high-priority routes
- [ ] Apply CSRF protection to medium-priority routes
- [ ] Add CSRF exclusions for webhooks and public endpoints
- [ ] Write integration tests for protected endpoints
- [ ] Test client-side integration in staging
- [ ] Document CSRF requirements for developers
- [ ] Update API documentation with CSRF requirements
- [ ] Deploy to production

---

## Common Issues & Solutions

### Issue: "CSRF token missing" on first request

**Cause:** Client hasn't fetched CSRF token yet

**Solution:** Fetch token on app initialization before making protected requests

```javascript
// In app initialization
await fetchCsrfToken()
```

### Issue: CSRF protection blocks webhooks

**Cause:** External services can't provide CSRF tokens

**Solution:** Exclude webhook endpoints from CSRF protection

```javascript
// Apply CSRF after webhook routes
app.use('/api/stripe/webhook', stripeWebhookHandler)
app.use('/api', csrfProtection)  // Applied after webhooks
```

### Issue: CORS errors with CSRF cookies

**Cause:** Cookies not being sent due to CORS configuration

**Solution:** Ensure `credentials: 'include'` in fetch and proper CORS config

```javascript
// Server-side (already configured in cors.js)
credentials: true

// Client-side
fetch(url, { credentials: 'include' })
```

---

## Security Best Practices

1. **Always use HTTPS in production** - CSRF cookies are secure-only
2. **Set `CSRF_SECRET` to a strong random value** - Never use default
3. **Include CSRF protection on all state-changing endpoints** - POST/PUT/PATCH/DELETE
4. **Keep CSRF tokens short-lived** - Regenerate on important actions
5. **Combine CSRF with authentication** - CSRF doesn't replace auth
6. **Monitor CSRF failures** - High failure rate may indicate attack
7. **Use SameSite cookies** - Already configured in csrf.js
8. **Test thoroughly** - Both positive and negative test cases

---

## Additional Resources

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Double Submit Cookie Pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie)
- [csrf-csrf Documentation](https://github.com/Psifi-Solutions/csrf-csrf)

---

## Summary

This product template includes a comprehensive security middleware stack:

- ✅ **Helmet** - HTTP security headers (CSP, HSTS, etc.)
- ✅ **Rate Limiting** - DoS protection with Redis support
- ✅ **Input Validation** - Zod-based request validation
- ✅ **CSRF Protection** - Double-submit cookie pattern (requires integration)

**Next Steps:**
1. Choose CSRF implementation strategy (global vs per-route)
2. Apply CSRF protection to sensitive endpoints
3. Update client code to handle CSRF tokens
4. Test thoroughly in staging environment
5. Deploy to production with proper environment configuration

All security middleware is production-ready and follows OWASP best practices.
