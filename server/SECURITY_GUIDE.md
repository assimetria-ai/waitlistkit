# Security Middleware Guide

## Quick Reference

This guide explains the security middleware available in the template and how to use them properly in your API routes.

## 🛡️ Available Security Features

### 1. **Helmet** (Security Headers)
**Auto-applied to all routes** - No action needed!

```javascript
// Applied globally in app.js
app.use(securityHeaders)
```

### 2. **CSRF Protection**
**Auto-applied to all `/api` routes** - No action needed!

```javascript
// Applied globally to /api routes in app.js
app.use('/api', csrfProtection)
```

**Client-side usage:**
```javascript
// 1. Fetch CSRF token (GET /api/csrf-token is auto-created)
const response = await fetch('/api/csrf-token')
const { csrfToken } = await response.json()

// 2. Include token in subsequent requests
await fetch('/api/resource', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(data)
})
```

### 3. **Rate Limiting**
**Auto-applied to all `/api` routes** with baseline protection (100 req/min).

**Additional endpoint-specific limiters available:**

```javascript
const {
  loginLimiter,        // 10 attempts per 15 minutes
  registerLimiter,     // 5 registrations per hour
  passwordResetLimiter, // 5 per hour
  uploadLimiter,       // 20 per minute
  aiChatLimiter,       // 20 per minute
  aiImageLimiter,      // 5 per hour
  adminWriteLimiter,   // 10 per minute
  // ... see RateLimit/index.js for full list
} = require('../lib/@system/RateLimit')

// Apply to specific routes
router.post('/auth/login', loginLimiter, handler)
router.post('/auth/register', registerLimiter, handler)
router.post('/uploads', uploadLimiter, handler)
```

### 4. **Input Validation**
**MUST BE APPLIED MANUALLY** to each route that accepts user input.

```javascript
const { validate } = require('../../lib/@system/Middleware')
const { z } = require('zod')

// 1. Define validation schema
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().min(18).optional()
})

// 2. Apply to route
router.post('/users',
  authenticate,
  validate({ body: CreateUserSchema }),
  async (req, res, next) => {
    // req.body is now validated and type-coerced
    const { email, name, age } = req.body
    // ...
  }
)
```

## 📝 Validation Patterns

### Path Parameters (IDs)

```javascript
const { z } = require('zod')

const UuidSchema = z.object({
  id: z.string().uuid()
})

const IntIdSchema = z.object({
  id: z.coerce.number().int().positive()
})

router.get('/users/:id',
  authenticate,
  validate({ params: UuidSchema }),
  handler
)
```

### Query Parameters (Pagination, Filters)

```javascript
const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['created_at', 'updated_at', 'name']).optional(),
  order: z.enum(['asc', 'desc']).optional()
})

router.get('/users',
  authenticate,
  validate({ query: PaginationSchema }),
  handler
)
```

### Request Body (Create/Update)

```javascript
const CreateResourceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
})

router.post('/resources',
  authenticate,
  validate({ body: CreateResourceSchema }),
  handler
)
```

### Multiple Validations (Params + Body)

```javascript
router.patch('/resources/:id',
  authenticate,
  validate({
    params: UuidSchema,
    body: UpdateResourceSchema
  }),
  handler
)
```

## 🔒 Authentication & Authorization

```javascript
const { authenticate, requireAdmin } = require('../../lib/@system/Helpers/auth')

// Require authenticated user
router.get('/profile', authenticate, handler)

// Require admin role
router.delete('/users/:id', authenticate, requireAdmin, handler)

// Custom authorization check
router.get('/resources/:id',
  authenticate,
  async (req, res, next) => {
    const resource = await ResourceRepo.findById(req.params.id)
    if (resource.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' })
    }
    next()
  },
  handler
)
```

## 🎯 Complete Route Example

Here's a fully secured route with all best practices:

```javascript
const express = require('express')
const router = express.Router()
const { z } = require('zod')
const { authenticate, requireAdmin } = require('../../lib/@system/Helpers/auth')
const { validate } = require('../../lib/@system/Middleware')
const { apiLimiter, uploadLimiter } = require('../../lib/@system/RateLimit')
const ResourceRepo = require('../../db/repos/@custom/ResourceRepo')

// Schemas
const IdSchema = z.object({ id: z.string().uuid() })

const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})

const CreateResourceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(['electronics', 'books', 'clothing']),
  price: z.number().positive(),
  quantity: z.number().int().min(0),
  tags: z.array(z.string().max(50)).max(10).optional(),
  metadata: z.record(z.any()).optional()
})

const UpdateResourceSchema = CreateResourceSchema.partial()

// LIST - with pagination validation
router.get('/resources',
  authenticate,
  validate({ query: PaginationSchema }),
  async (req, res, next) => {
    try {
      const { page, limit } = req.query
      const offset = (page - 1) * limit
      
      const resources = await ResourceRepo.findAll({
        user_id: req.user.id,
        limit,
        offset
      })
      
      res.json({ resources, page, limit })
    } catch (err) {
      next(err)
    }
  }
)

// GET by ID - with param validation
router.get('/resources/:id',
  authenticate,
  validate({ params: IdSchema }),
  async (req, res, next) => {
    try {
      const resource = await ResourceRepo.findById(req.params.id)
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' })
      }
      
      // Authorization check
      if (resource.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' })
      }
      
      res.json({ resource })
    } catch (err) {
      next(err)
    }
  }
)

// CREATE - with body validation
router.post('/resources',
  authenticate,
  validate({ body: CreateResourceSchema }),
  async (req, res, next) => {
    try {
      const resource = await ResourceRepo.create({
        ...req.body,
        user_id: req.user.id
      })
      res.status(201).json({ resource })
    } catch (err) {
      next(err)
    }
  }
)

// UPDATE - with params + body validation
router.patch('/resources/:id',
  authenticate,
  validate({
    params: IdSchema,
    body: UpdateResourceSchema
  }),
  async (req, res, next) => {
    try {
      const resource = await ResourceRepo.findById(req.params.id)
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' })
      }
      
      // Authorization check
      if (resource.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' })
      }
      
      const updated = await ResourceRepo.update(req.params.id, req.body)
      res.json({ resource: updated })
    } catch (err) {
      next(err)
    }
  }
)

// DELETE - admin only with param validation
router.delete('/resources/:id',
  authenticate,
  requireAdmin,
  validate({ params: IdSchema }),
  async (req, res, next) => {
    try {
      await ResourceRepo.delete(req.params.id)
      res.json({ message: 'Resource deleted successfully' })
    } catch (err) {
      next(err)
    }
  }
)

// UPLOAD - with custom rate limiter
router.post('/resources/:id/upload',
  authenticate,
  uploadLimiter, // 20 uploads per minute
  validate({ params: IdSchema }),
  async (req, res, next) => {
    try {
      // Handle file upload
      res.json({ message: 'Upload successful' })
    } catch (err) {
      next(err)
    }
  }
)

module.exports = router
```

## 🚨 Common Mistakes to Avoid

### ❌ Don't: Skip validation
```javascript
// BAD - No validation
router.get('/users/:id', authenticate, async (req, res) => {
  const user = await UserRepo.findById(req.params.id) // SQL injection risk if id is not validated
  res.json({ user })
})
```

### ✅ Do: Always validate user input
```javascript
// GOOD - Validated params
router.get('/users/:id',
  authenticate,
  validate({ params: z.object({ id: z.string().uuid() }) }),
  async (req, res) => {
    const user = await UserRepo.findById(req.params.id)
    res.json({ user })
  }
)
```

### ❌ Don't: Trust client-provided IDs for authorization
```javascript
// BAD - User can change user_id to access other accounts
router.get('/profile',
  authenticate,
  validate({ query: z.object({ user_id: z.string().uuid() }) }),
  async (req, res) => {
    const profile = await ProfileRepo.findByUserId(req.query.user_id)
    res.json({ profile })
  }
)
```

### ✅ Do: Use req.user from authentication
```javascript
// GOOD - Use authenticated user's ID
router.get('/profile',
  authenticate,
  async (req, res) => {
    const profile = await ProfileRepo.findByUserId(req.user.id)
    res.json({ profile })
  }
)
```

### ❌ Don't: Expose sensitive errors to clients
```javascript
// BAD - Exposes database errors
router.post('/users', async (req, res) => {
  try {
    const user = await UserRepo.create(req.body)
    res.json({ user })
  } catch (err) {
    res.status(500).json({ error: err.message }) // Might leak SQL errors
  }
})
```

### ✅ Do: Use error handler middleware
```javascript
// GOOD - Use next(err) and let error handler deal with it
router.post('/users',
  authenticate,
  validate({ body: CreateUserSchema }),
  async (req, res, next) => {
    try {
      const user = await UserRepo.create(req.body)
      res.json({ user })
    } catch (err) {
      next(err) // Error handler will sanitize the error
    }
  }
)
```

## 📚 Additional Resources

- [Zod Documentation](https://zod.dev/)
- [Helmet Documentation](https://helmetjs.github.io/)
- [Express Rate Limit](https://express-rate-limit.mintlify.app/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)

## 🤔 Questions?

Check the following files for implementation details:
- `server/src/lib/@system/Middleware/` - All middleware implementations
- `server/src/lib/@system/RateLimit/` - Rate limiting configuration
- `server/src/lib/@system/Validation/` - Validation utilities
- `server/src/api/@custom/TEMPLATE.js` - Complete API route template

---

**Last Updated:** 2025-03-08  
**Template Version:** 0.1.0
