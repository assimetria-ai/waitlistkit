# CSRF Integration Example

## Example: Adding CSRF Protection to Session Routes

This document shows how to add CSRF protection to the `/api/sessions` endpoints.

---

## Before: Sessions Route Without CSRF

```javascript
// src/api/@system/sessions/index.js (original)

const express = require('express')
const router = express.Router()
const { authenticate } = require('../../../lib/@system/Helpers/auth')
const { loginLimiter, refreshLimiter } = require('../../../lib/@system/RateLimit')
const { validate } = require('../../../lib/@system/Validation')

// Login - no CSRF protection
router.post('/sessions', loginLimiter, validate({ body: LoginBody }), async (req, res, next) => {
  // Login logic
})

// Token refresh - no CSRF protection
router.post('/sessions/refresh', refreshLimiter, async (req, res, next) => {
  // Refresh logic
})

// Logout - no CSRF protection
router.delete('/sessions', authenticate, async (req, res, next) => {
  // Logout logic
})

// Revoke session - no CSRF protection
router.delete('/sessions/:id', authenticate, validate({ params: DeleteSessionParams }), async (req, res, next) => {
  // Revoke logic
})
```

---

## After: Sessions Route With CSRF

```javascript
// src/api/@system/sessions/index.js (with CSRF)

const express = require('express')
const router = express.Router()
const { authenticate } = require('../../../lib/@system/Helpers/auth')
const { loginLimiter, refreshLimiter } = require('../../../lib/@system/RateLimit')
const { validate, csrfProtection } = require('../../../lib/@system/Middleware')  // <-- Added csrfProtection

// Login - CSRF protection added (optional but recommended)
// Note: Login CSRF prevents login CSRF attacks where an attacker
// tricks a user into logging into the attacker's account
router.post('/sessions', 
  loginLimiter, 
  csrfProtection,  // <-- Added CSRF protection
  validate({ body: LoginBody }), 
  async (req, res, next) => {
    // Login logic
  }
)

// Token refresh - CSRF protection added (recommended)
router.post('/sessions/refresh', 
  refreshLimiter, 
  csrfProtection,  // <-- Added CSRF protection
  async (req, res, next) => {
    // Refresh logic
  }
)

// Logout - CSRF protection added (critical)
// Prevents attacker from logging the user out
router.delete('/sessions', 
  authenticate, 
  csrfProtection,  // <-- Added CSRF protection
  async (req, res, next) => {
    // Logout logic
  }
)

// Revoke session - CSRF protection added (critical)
// Prevents attacker from revoking user's sessions
router.delete('/sessions/:id', 
  authenticate, 
  csrfProtection,  // <-- Added CSRF protection
  validate({ params: DeleteSessionParams }), 
  async (req, res, next) => {
    // Revoke logic
  }
)
```

---

## Alternative: Apply CSRF to All Routes in Router

Instead of adding CSRF to individual routes, you can apply it to all routes in the router:

```javascript
// src/api/@system/sessions/index.js (router-level CSRF)

const express = require('express')
const router = express.Router()
const { authenticate } = require('../../../lib/@system/Helpers/auth')
const { loginLimiter, refreshLimiter } = require('../../../lib/@system/RateLimit')
const { validate, csrfProtection } = require('../../../lib/@system/Middleware')

// Apply CSRF protection to all routes in this router
// This automatically protects POST, PUT, PATCH, DELETE but not GET, HEAD, OPTIONS
router.use(csrfProtection)  // <-- Applied once at router level

// All routes below now have CSRF protection
router.post('/sessions', loginLimiter, validate({ body: LoginBody }), async (req, res, next) => {
  // Login logic
})

router.post('/sessions/refresh', refreshLimiter, async (req, res, next) => {
  // Refresh logic
})

router.delete('/sessions', authenticate, async (req, res, next) => {
  // Logout logic
})

router.delete('/sessions/:id', authenticate, validate({ params: DeleteSessionParams }), async (req, res, next) => {
  // Revoke logic
})

// GET endpoint - not affected by CSRF (safe method)
router.get('/sessions', authenticate, async (req, res, next) => {
  // List sessions - no CSRF needed for GET
})
```

---

## Client-Side Integration

### React Example

```javascript
// src/lib/api.js

// Fetch and store CSRF token on app initialization
export async function initializeCsrf() {
  try {
    const response = await fetch('/api/csrf-token', {
      credentials: 'include',
    })
    const { csrfToken } = await response.json()
    localStorage.setItem('csrfToken', csrfToken)
    return csrfToken
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error)
    throw error
  }
}

// Helper to make authenticated requests with CSRF token
export async function apiRequest(url, options = {}) {
  const csrfToken = localStorage.getItem('csrfToken')
  
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
    },
  }

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  })

  // Handle CSRF token expiration
  if (response.status === 403) {
    const data = await response.json()
    if (data.error === 'CSRF_VALIDATION_FAILED') {
      // Refresh CSRF token and retry
      await initializeCsrf()
      return apiRequest(url, options)
    }
  }

  return response
}

// Usage in components
export async function login(email, password) {
  const response = await apiRequest('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return response.json()
}

export async function logout() {
  const response = await apiRequest('/api/sessions', {
    method: 'DELETE',
  })
  return response.json()
}
```

### React App Initialization

```javascript
// src/App.jsx

import { useEffect, useState } from 'react'
import { initializeCsrf } from './lib/api'

function App() {
  const [csrfReady, setCsrfReady] = useState(false)

  useEffect(() => {
    // Fetch CSRF token on app mount
    initializeCsrf()
      .then(() => setCsrfReady(true))
      .catch(err => console.error('CSRF initialization failed:', err))
  }, [])

  if (!csrfReady) {
    return <div>Loading...</div>
  }

  return (
    <div className="App">
      {/* Your app content */}
    </div>
  )
}

export default App
```

---

## Testing CSRF Protected Routes

```javascript
// test/api/@system/sessions.test.js

const request = require('supertest')
const app = require('../../../src/app')
const { getCsrfToken } = require('./csrf.test') // Import helper

describe('Sessions API with CSRF', () => {
  let csrfToken
  let cookies

  beforeEach(async () => {
    // Fetch CSRF token before each test
    const csrf = await getCsrfToken()
    csrfToken = csrf.csrfToken
    cookies = csrf.cookies
  })

  describe('POST /api/sessions (login)', () => {
    it('should reject login without CSRF token', async () => {
      await request(app)
        .post('/api/sessions')
        .set('Cookie', cookies)
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(403)
    })

    it('should allow login with valid CSRF token', async () => {
      await request(app)
        .post('/api/sessions')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', csrfToken)
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200) // or 401 for invalid credentials
    })
  })

  describe('DELETE /api/sessions (logout)', () => {
    let authToken

    beforeEach(async () => {
      // Login to get auth token
      const loginRes = await request(app)
        .post('/api/sessions')
        .set('Cookie', cookies)
        .set('X-CSRF-Token', csrfToken)
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
      
      authToken = loginRes.body.accessToken
    })

    it('should reject logout without CSRF token', async () => {
      await request(app)
        .delete('/api/sessions')
        .set('Cookie', cookies)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)
    })

    it('should allow logout with valid CSRF token', async () => {
      await request(app)
        .delete('/api/sessions')
        .set('Cookie', cookies)
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-CSRF-Token', csrfToken)
        .expect(200)
    })
  })
})
```

---

## Migration Checklist for Sessions Route

- [ ] Import `csrfProtection` from middleware
- [ ] Add CSRF protection to POST /sessions (login)
- [ ] Add CSRF protection to POST /sessions/refresh (token refresh)
- [ ] Add CSRF protection to DELETE /sessions (logout)
- [ ] Add CSRF protection to DELETE /sessions/:id (revoke session)
- [ ] Update client code to fetch CSRF token on app init
- [ ] Update login function to include CSRF token
- [ ] Update logout function to include CSRF token
- [ ] Update token refresh function to include CSRF token
- [ ] Add tests for CSRF-protected endpoints
- [ ] Test in staging environment
- [ ] Deploy to production

---

## Other Routes to Protect

Apply the same pattern to other sensitive endpoints:

### User Profile Routes
```javascript
// src/api/@system/user/index.js
router.put('/user', authenticate, csrfProtection, handler)
router.delete('/user', authenticate, csrfProtection, handler)
router.put('/user/password', authenticate, csrfProtection, handler)
router.put('/user/email', authenticate, csrfProtection, handler)
```

### 2FA Routes
```javascript
// src/api/@system/totp/index.js
router.post('/totp/setup', authenticate, csrfProtection, handler)
router.post('/totp/enable', authenticate, csrfProtection, handler)
router.post('/totp/disable', authenticate, csrfProtection, handler)
```

### API Keys
```javascript
// src/api/@system/api-keys/index.js
router.post('/api-keys', authenticate, csrfProtection, handler)
router.delete('/api-keys/:id', authenticate, csrfProtection, handler)
```

### Admin Routes
```javascript
// src/api/@system/admin/index.js
router.use(csrfProtection) // Protect all admin routes
```

---

## Summary

CSRF protection is now:
- ✅ Implemented in middleware
- ✅ Documented with examples
- ✅ Ready to integrate into routes
- ✅ Tested with comprehensive test suite

**Next Steps:**
1. Choose routes to protect (start with sessions, user, admin)
2. Add `csrfProtection` middleware to selected routes
3. Update client code to fetch and use CSRF tokens
4. Test thoroughly before deploying

**Remember:**
- CSRF tokens are required for POST, PUT, PATCH, DELETE
- GET, HEAD, OPTIONS are automatically excluded (safe methods)
- Include both cookie and header for validation
- Handle 403 errors by refreshing the token
