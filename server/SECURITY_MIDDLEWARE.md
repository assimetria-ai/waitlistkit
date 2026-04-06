# Security Middleware Documentation

This document explains the security middleware stack implemented in the product template server.

## Overview

The template includes a comprehensive security middleware stack that protects against common web vulnerabilities:

1. **Helmet (Security Headers)** - Protects against various attacks via HTTP headers
2. **CSRF Protection** - Prevents Cross-Site Request Forgery attacks
3. **Rate Limiting** - Prevents abuse and DoS attacks
4. **Input Validation** - Validates and sanitizes all incoming data

---

## 1. Helmet (Security Headers)

**Location:** `src/lib/@system/Middleware/security.js`

Helmet automatically sets secure HTTP headers including:

- **Content-Security-Policy (CSP)** - Prevents XSS attacks by controlling resource loading
- **Strict-Transport-Security (HSTS)** - Forces HTTPS connections
- **X-Frame-Options** - Prevents clickjacking attacks
- **X-Content-Type-Options** - Prevents MIME sniffing
- **Referrer-Policy** - Controls referrer information leakage
- **Permissions-Policy** - Restricts browser features

### Configuration

The middleware is pre-configured with sensible defaults. Key settings:

```javascript
// Applied globally in app.js
app.use(securityHeaders)
```

### Customization

To modify CSP rules or other headers, edit `src/lib/@system/Middleware/security.js`:

```javascript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "trusted-cdn.com"],
    // ... more directives
  },
}
```

---

## 2. CSRF Protection

**Location:** `src/lib/@system/Middleware/csrf.js`

Protects against Cross-Site Request Forgery using the double-submit cookie pattern.

### How It Works

1. Client fetches a CSRF token from `GET /api/csrf-token`
2. Server sets two values:
   - An httpOnly cookie containing the token
   - Returns the token in the response body
3. Client includes the token in the `X-CSRF-Token` header for state-changing requests
4. Server validates that both values match before processing the request

### Setup

#### Environment Variable

Add to your `.env` file:

```env
CSRF_SECRET=your-random-32-plus-character-secret-here
```

Generate a secure secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Client-Side Usage

**1. Fetch the token on app initialization:**

```javascript
// On app load or before making protected requests
const response = await fetch('/api/csrf-token', {
  credentials: 'include', // Important: include cookies
})
const { csrfToken } = await response.json()

// Store the token (localStorage, React state, etc.)
localStorage.setItem('csrfToken', csrfToken)
```

**2. Include the token in protected requests:**

```javascript
// For all POST/PUT/PATCH/DELETE requests
await fetch('/api/protected-endpoint', {
  method: 'POST',
  credentials: 'include', // Important: include cookies
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': localStorage.getItem('csrfToken'),
  },
  body: JSON.stringify(data),
})
```

#### Server-Side Usage

**Protecting specific routes:**

```javascript
const { csrfProtection } = require('../../lib/@system/Middleware')

// Protect a single route
router.post('/sensitive-action', csrfProtection, async (req, res) => {
  // Only executes if CSRF token is valid
})

// Protect all routes in a router
router.use(csrfProtection)
router.post('/action-1', handler1)
router.put('/action-2', handler2)
```

**Protecting all API routes (optional):**

In `src/app.js`, you can add CSRF protection globally to all API routes:

```javascript
// After other middleware, before routes
app.use('/api', csrfProtection)
```

⚠️ **Note:** This will require CSRF tokens for all POST/PUT/PATCH/DELETE requests, including authentication endpoints. You may want to exclude certain endpoints like `/api/auth/login`.

### Testing

CSRF validation is automatically disabled in test environments (`NODE_ENV=test`). To disable it in development:

```env
SKIP_CSRF=true
```

---

## 3. Rate Limiting

**Location:** `src/lib/@system/RateLimit/index.js`

Prevents abuse and DoS attacks by limiting request rates from a single IP address.

### Available Limiters

The template includes pre-configured rate limiters for different endpoint types:

| Limiter | Window | Max Requests | Use Case |
|---------|--------|--------------|----------|
| `apiLimiter` | 1 minute | 100 | General API protection (baseline) |
| `loginLimiter` | 15 minutes | 10 | Login attempts |
| `registerLimiter` | 1 hour | 5 | New account creation |
| `passwordResetLimiter` | 1 hour | 5 | Password reset requests |
| `refreshLimiter` | 1 minute | 30 | Token refresh |
| `apiKeyLimiter` | 1 hour | 10 | API key creation |
| `uploadLimiter` | 1 minute | 20 | File uploads |
| `integrationTestLimiter` | 1 minute | 10 | External service tests |
| `aiChatLimiter` | 1 minute | 20 | AI chat endpoints |
| `aiImageLimiter` | 1 hour | 5 | AI image generation |
| `totpSetupLimiter` | 1 hour | 5 | 2FA setup |
| `totpEnableLimiter` | 10 minutes | 5 | 2FA enable/disable |
| `adminReadLimiter` | 1 minute | 60 | Admin queries |
| `adminWriteLimiter` | 1 minute | 10 | Admin mutations |
| `emailTestLimiter` | 1 hour | 10 | Email test endpoint |
| `oauthLimiter` | 1 minute | 20 | OAuth flow endpoints |

### Usage

#### Global Rate Limiting

Applied to all API routes in `src/app.js`:

```javascript
app.use('/api', apiLimiter)
```

#### Per-Route Rate Limiting

```javascript
const { loginLimiter } = require('../../lib/@system/RateLimit')

router.post('/login', loginLimiter, async (req, res) => {
  // Login logic
})
```

#### Creating Custom Limiters

```javascript
const { createLimiter } = require('../../lib/@system/RateLimit')

const customLimiter = createLimiter({
  windowMs: 60 * 1000,      // 1 minute
  max: 50,                   // 50 requests
  prefix: 'rl:custom:',      // Redis key prefix
  message: 'Custom rate limit exceeded',
})

router.post('/custom-endpoint', customLimiter, handler)
```

### Redis Support

Rate limiters automatically use Redis when available for distributed rate limiting across multiple server instances. Falls back to in-memory storage (single-instance only) if Redis is unavailable.

```env
REDIS_URL=redis://localhost:6379
```

### Testing

Rate limiting is automatically disabled in test and development environments. To enable it:

```env
NODE_ENV=production
```

---

## 4. Input Validation

**Location:** `src/lib/@system/Validation/index.js`

Validates and sanitizes incoming data using Zod schemas.

### Features

- **Type coercion** - Automatically converts strings to numbers, dates, etc.
- **Structured errors** - Returns detailed validation errors
- **Schema validation** - Validates req.body, req.query, and req.params
- **Type safety** - Works seamlessly with TypeScript

### Usage

#### 1. Define a Zod Schema

```javascript
const { z } = require('zod')

const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  age: z.number().int().min(18, 'Must be 18 or older'),
})
```

#### 2. Apply Validation Middleware

```javascript
const { validate } = require('../../lib/@system/Middleware')

router.post('/users', validate({ body: CreateUserSchema }), async (req, res) => {
  // req.body is now validated and typed
  const { email, password, age } = req.body
  
  // Create user...
})
```

#### Validating Multiple Sources

```javascript
router.get('/users/:id', 
  validate({
    params: z.object({ id: z.string().uuid() }),
    query: z.object({ 
      page: z.string().transform(Number).pipe(z.number().int().min(1)),
      limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)),
    }),
  }),
  async (req, res) => {
    // All validated and coerced
    const { id } = req.params      // string UUID
    const { page, limit } = req.query  // numbers
  }
)
```

### Error Format

Validation failures return HTTP 400 with structured errors:

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "body.email",
      "message": "Invalid email address"
    },
    {
      "field": "body.password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

### Common Schemas

Pre-built validation schemas are available in `src/lib/@system/Validation/schemas/`:

```javascript
const { PaginationSchema } = require('../../lib/@system/Validation/schemas')

router.get('/items', validate({ query: PaginationSchema }), handler)
```

---

## Security Checklist

When deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Generate and set `CSRF_SECRET` (32+ random characters)
- [ ] Ensure `JWT_PRIVATE_KEY` and encryption keys are set
- [ ] Configure `REDIS_URL` for distributed rate limiting
- [ ] Review and customize CSP directives for your app
- [ ] Enable HSTS by setting `NODE_ENV=production`
- [ ] Use HTTPS in production (required for secure cookies)
- [ ] Review rate limits and adjust per your traffic patterns
- [ ] Add input validation to all new endpoints

---

## Testing

### Unit Tests

```javascript
const request = require('supertest')
const app = require('../src/app')

describe('CSRF Protection', () => {
  it('should reject requests without CSRF token', async () => {
    const res = await request(app)
      .post('/api/protected-endpoint')
      .expect(403)
    
    expect(res.body.error).toBe('CSRF_VALIDATION_FAILED')
  })
})
```

### Disabling in Tests

Security middleware is automatically disabled in test environments:

```env
NODE_ENV=test
SKIP_CSRF=true  # Optional: explicit CSRF bypass
```

---

## Troubleshooting

### CSRF token errors

**Issue:** `Invalid or missing CSRF token`

**Solutions:**
1. Ensure you're fetching the token from `/api/csrf-token` first
2. Include `credentials: 'include'` in all fetch requests
3. Send the token in the `X-CSRF-Token` header (case-sensitive)
4. Check that cookies are enabled in the browser
5. Verify `CSRF_SECRET` is set in `.env`

### Rate limit false positives

**Issue:** Rate limits triggering for legitimate traffic

**Solutions:**
1. Review and increase limits in `src/lib/@system/RateLimit/index.js`
2. Use Redis for distributed rate limiting (shared state across instances)
3. Consider implementing user-based rate limiting instead of IP-based
4. Add exemptions for trusted IPs or authenticated users

### Helmet blocking resources

**Issue:** CSP blocking scripts, styles, or images

**Solutions:**
1. Review browser console for CSP violations
2. Add allowed domains to CSP directives in `src/lib/@system/Middleware/security.js`
3. Use nonces for inline scripts instead of `'unsafe-inline'`

---

## Additional Resources

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Express Rate Limit Documentation](https://express-rate-limit.mintlify.app/)
- [Zod Documentation](https://zod.dev/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
