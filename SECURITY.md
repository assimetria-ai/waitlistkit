# Security Features

This template includes comprehensive security middleware to protect against common web vulnerabilities.

## ✅ Implemented Security Measures

### 1. Helmet - HTTP Security Headers

**Location**: `server/src/lib/@system/Middleware/security.js`

**Features**:
- **Content-Security-Policy (CSP)**: Restricts resource loading to prevent XSS
- **Strict-Transport-Security (HSTS)**: Forces HTTPS in production
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Prevents MIME-sniffing
- **Referrer-Policy**: Controls information leakage via Referer header
- **Cross-Origin Policies**: Isolates the application from other origins

**Configuration**:
```javascript
const securityHeaders = helmet({
  contentSecurityPolicy: { /* CSP directives */ },
  hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000 } : false,
  frameguard: { action: 'deny' },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // ... more security options
})
```

### 2. CSRF Protection

**Location**: `server/src/lib/@system/Middleware/csrf.js`

**Features**:
- Double-submit cookie pattern using `csrf-csrf` library
- Automatic validation on POST/PUT/PATCH/DELETE requests
- Token exposed via GET `/api/csrf-token` endpoint
- httpOnly cookies with SameSite=Strict

**Usage**:
```javascript
// 1. Fetch token
GET /api/csrf-token
// Response: { csrfToken: "..." }

// 2. Include in requests
POST /api/endpoint
Headers: X-CSRF-Token: <token>
```

**Implementation**:
- Cookie name: `__Host-psifi.x-csrf-token`
- Token size: 64 bytes
- Bypassed in test environment for easier testing

### 3. Rate Limiting

**Location**: `server/src/lib/@system/RateLimit/index.js`

**Features**:
- Redis-backed store with graceful fallback to in-memory
- Multiple limiters for different endpoints:

| Endpoint Type | Limit | Window | Purpose |
|--------------|-------|---------|----------|
| General API | 100/min | 1 min | Baseline DoS protection |
| Login | 10 | 15 min | Brute-force prevention |
| Register | 5 | 1 hour | Account creation abuse |
| Password Reset | 5 | 1 hour | Reset abuse |
| File Upload | 20 | 1 min | DoS via uploads |
| AI Chat | 20 | 1 min | Cost control |
| AI Images | 5 | 1 hour | Expensive API calls |
| Admin Write | 10 | 1 min | State-changing operations |

**Configuration**:
```javascript
const apiLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 100,
  prefix: 'rl:api:',
  message: 'Too many requests. Please slow down.',
})
```

**Features**:
- Automatic bypass in development/test environments
- Standard RateLimit-* headers
- Per-IP tracking
- Logging of rate limit violations

### 4. Input Validation

**Location**: `server/src/lib/@system/Validation/index.js`

**Features**:
- Zod-based schema validation
- Validates `req.body`, `req.query`, and `req.params`
- Type coercion (e.g., string → number)
- Structured error responses

**Usage**:
```javascript
const { validate } = require('../lib/@system/Validation')
const { z } = require('zod')

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

router.post('/users', 
  validate({ body: CreateUserSchema }), 
  handler
)
```

**Error Response**:
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "body.email",
      "message": "Invalid email address"
    }
  ]
}
```

### 5. CORS (Cross-Origin Resource Sharing)

**Location**: `server/src/lib/@system/Middleware/cors.js`

**Features**:
- Whitelist-based origin validation
- Credential support enabled
- Strict origin matching (no wildcard subdomains)
- Health check endpoints bypass CORS

**Configuration**:
```javascript
const ALLOWED_ORIGINS = [
  process.env.APP_URL,
  'http://localhost:5173',
  'http://localhost:3000',
]

const corsOptions = {
  origin: isOriginAllowed,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}
```

## 📋 Security Checklist

- ✅ HTTP security headers (Helmet)
- ✅ CSRF protection (double-submit cookie)
- ✅ Rate limiting (per-endpoint configuration)
- ✅ Input validation (Zod schemas)
- ✅ CORS (whitelist-based)
- ✅ Cookie security (httpOnly, SameSite, Secure in production)
- ✅ SQL injection prevention (parameterized queries via pg-promise)
- ✅ XSS prevention (CSP headers, React auto-escaping)

## 🔒 Additional Security Recommendations

### Environment Variables

Ensure the following are set in production:

```bash
# Required for CSRF protection
CSRF_SECRET=<random-64-char-string>

# Required for JWT/sessions
JWT_SECRET=<random-64-char-string>

# Database connection (ensure SSL in production)
DATABASE_URL=postgresql://...
DB_POOL_SSL=true

# Application URL for CORS
APP_URL=https://your-domain.com
```

### Database Security

1. **Use SSL connections** in production:
   ```bash
   DB_POOL_SSL=true
   ```

2. **Principle of least privilege**: Use database users with minimal required permissions

3. **Regular backups**: Implement automated backup strategy

### API Keys & Secrets

1. **Never commit secrets** to version control
2. **Rotate secrets regularly**
3. **Use environment-specific secrets**

### Logging & Monitoring

1. **Log security events**: Login failures, rate limit violations, CSRF failures
2. **Monitor suspicious patterns**: Multiple failed auth attempts, unusual API usage
3. **Set up alerts** for security events

### SSL/TLS

1. **Use HTTPS** in production (required for many security features)
2. **Enable HSTS** (already configured via Helmet)
3. **Use strong cipher suites**

## 🧪 Testing Security

Run security-focused tests:

```bash
# Run all tests
npm test

# Run specific security tests
npm test -- --testPathPattern=test/api/@system/csrf.test.js
npm test -- --testPathPattern=test/unit/@system/password-validator.test.js

# Test rate limiting
npm test -- --testPathPattern=test/api --grep rate
```

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [CSRF Protection Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Rate Limiting Strategies](https://www.nginx.com/blog/rate-limiting-nginx/)

## 🐛 Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** open a public GitHub issue
2. Email security concerns to: [security@your-domain.com]
3. Include detailed reproduction steps
4. Allow time for fix before disclosure

## 📝 Security Audit Log

| Date | Change | Author |
|------|--------|--------|
| 2025-03-09 | Initial security middleware implementation | System |
| 2025-03-09 | Added Database.js compatibility wrapper | Junior Agent |
| 2025-03-09 | Updated CORS to include X-CSRF-Token header | Junior Agent |
