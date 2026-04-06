# Architecture — Product Template

> Comprehensive system design documentation for Assimetria's product scaffold

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Directory Structure](#directory-structure)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Architecture](#backend-architecture)
6. [Database Design](#database-design)
7. [Authentication Flow](#authentication-flow)
8. [API Design](#api-design)
9. [Payment Integration](#payment-integration)
10. [Email System](#email-system)
11. [Security Architecture](#security-architecture)
12. [Performance & Scalability](#performance--scalability)
13. [Deployment Architecture](#deployment-architecture)
14. [Technology Decisions](#technology-decisions)

---

## Overview

The Product Template is a **full-stack SaaS scaffold** designed for rapid product development within the Assimetria OS ecosystem.

### Design Principles

1. **Convention over configuration** — Sensible defaults, escape hatches when needed
2. **Separation of concerns** — `@system` (template) vs `@custom` (product-specific)
3. **Stateless by default** — JWT auth, horizontal scaling ready
4. **Batteries included, not required** — Stripe, SES, admin panel optional
5. **Modern but stable** — Proven tech (React 18, Express 4, PostgreSQL 15)

### Architecture Style

- **Client-Server (CSR)** — React SPA communicates with Express API via fetch
- **RESTful API** — JSON payloads, standard HTTP methods
- **Cookie-based auth** — HTTP-only JWT cookies for security
- **Relational data model** — PostgreSQL with pg-promise

---

## System Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React 18 SPA (Vite)                                 │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │  │
│  │  │  Pages     │  │ Components │  │   Store    │     │  │
│  │  │  (Routes)  │  │ (shadcn/ui)│  │ (Context)  │     │  │
│  │  └────────────┘  └────────────┘  └────────────┘     │  │
│  │         │               │                │           │  │
│  │         └───────────────┴────────────────┘           │  │
│  │                     │                                │  │
│  │              ┌──────▼──────┐                         │  │
│  │              │ API Client  │  (fetch + auth)         │  │
│  │              └──────┬──────┘                         │  │
│  └─────────────────────┼────────────────────────────────┘  │
└────────────────────────┼─────────────────────────────────┬─┘
                         │ HTTP/JSON (cookies)             │
                         │                           Port 5173
                         │
┌────────────────────────▼─────────────────────────────────▼─┐
│                       SERVER                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Node.js + Express                                   │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │  │
│  │  │   Routes   │  │ Middleware │  │   API      │     │  │
│  │  │  (Express) │  │ (Auth/CORS)│  │ Handlers   │     │  │
│  │  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘     │  │
│  │         │               │                │           │  │
│  │         └───────────────┴────────────────┘           │  │
│  │                     │                                │  │
│  │              ┌──────▼──────┐                         │  │
│  │              │  Repos (DAL) │                        │  │
│  │              └──────┬──────┘                         │  │
│  └─────────────────────┼────────────────────────────────┘  │
└────────────────────────┼─────────────────────────────────┬─┘
                         │ SQL                        Port 3000
                         │
┌────────────────────────▼─────────────────────────────────▼─┐
│                     POSTGRESQL                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Tables: users, sessions, subscriptions, invoices    │  │
│  │  Indexes: Foreign keys, unique constraints           │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┬┘
                                                        Port 5432

┌────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Stripe     │  │   AWS SES    │  │   Railway    │     │
│  │  (Payments)  │  │   (Emails)   │  │  (Hosting)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────────────────────────────────────────┘
```

### Request Flow

**Public page load (e.g., `/pricing`):**

1. Browser requests `http://localhost:5173/pricing`
2. Vite dev server responds with `index.html`
3. React Router matches `/pricing` route
4. `PricingPage` component renders
5. Page fetches pricing data from `/api/pricing`
6. Express handles request, queries PostgreSQL
7. JSON response rendered in React

**Authenticated page load (e.g., `/app/dashboard`):**

1. Browser requests `http://localhost:5173/app/dashboard`
2. Vite serves `index.html`, React Router matches route
3. `ProtectedRoute` component checks auth state
4. Client sends `GET /api/sessions/me` with JWT cookie
5. Server validates JWT, returns user data
6. If valid: Render dashboard. If invalid: Redirect to `/auth`

---

## Directory Structure

### Root Layout

```
product-template/
├── client/                    # React SPA
├── server/                    # Node.js API
├── e2e/                       # Playwright E2E tests
├── docs/                      # Documentation
├── scripts/                   # Dev & ops scripts
├── @custom/                   # Product-specific overrides (rare)
├── backups/                   # Database backup scripts
├── .github/                   # GitHub Actions workflows
├── package.json               # Root workspace scripts
├── playwright.config.js       # E2E test configuration
├── docker-compose.yml         # Local dev containers
├── Dockerfile                 # Production container
├── Procfile                   # Railway/Heroku start command
└── railway.json               # Railway deployment config
```

### Client (`client/`)

```
client/
├── src/
│   ├── App.jsx                # Root component
│   ├── main.jsx               # Vite entry point
│   ├── index.css              # Global styles (Tailwind)
│   └── app/
│       ├── api/@system/       # API wrappers
│       │   ├── client.js      # Base fetch client
│       │   ├── sessions.js    # Auth API
│       │   ├── users.js       # User management API
│       │   └── billing.js     # Stripe API
│       ├── components/
│       │   ├── @system/       # Template components
│       │   │   ├── ui/        # shadcn/ui primitives
│       │   │   ├── layout/    # Page layouts
│       │   │   ├── Header/    # Site header
│       │   │   ├── Footer/    # Site footer
│       │   │   └── ...
│       │   └── @custom/       # Product components
│       ├── hooks/             # React hooks
│       │   ├── useAuth.js     # Auth context hook
│       │   └── ...
│       ├── lib/@system/       # Utilities
│       │   ├── utils.js       # cn() for Tailwind
│       │   └── api.js         # API client factory
│       ├── pages/
│       │   ├── app/           # Authenticated pages
│       │   │   ├── @system/
│       │   │   │   ├── HomePage.jsx
│       │   │   │   ├── SettingsPage.jsx
│       │   │   │   ├── BillingPage.jsx
│       │   │   │   └── AdminPage.jsx
│       │   │   └── @custom/   # Product pages
│       │   └── static/        # Public pages
│       │       └── @system/
│       │           ├── LandingPage.jsx
│       │           ├── PricingPage.jsx
│       │           ├── AuthPage.jsx
│       │           └── ...
│       ├── routes/
│       │   ├── @system/
│       │   │   └── AppRoutes.jsx  # Route definitions
│       │   └── @custom/
│       │       └── index.js       # Custom routes
│       ├── store/
│       │   └── @system/
│       │       └── auth.jsx       # Auth context provider
│       └── config/
│           └── index.js           # Product config
├── public/                        # Static assets
├── .env.example                   # Env template
├── package.json
├── vite.config.js
└── tailwind.config.js
```

### Server (`server/`)

```
server/
├── src/
│   ├── index.js               # Server entry point
│   ├── app.js                 # Express app factory
│   ├── api/
│   │   ├── @system/           # Template endpoints
│   │   │   ├── sessions/      # Auth (login/logout/me)
│   │   │   ├── users/         # User CRUD
│   │   │   ├── billing/       # Stripe subscriptions
│   │   │   ├── webhooks/      # Stripe webhooks
│   │   │   ├── admin/         # Admin panel
│   │   │   └── storage/       # File uploads
│   │   └── @custom/           # Product endpoints
│   ├── config/@system/
│   │   ├── database.js        # PostgreSQL config
│   │   ├── stripe.js          # Stripe config
│   │   ├── ses.js             # AWS SES config
│   │   └── jwt.js             # JWT config
│   ├── db/
│   │   ├── index.js           # pg-promise instance
│   │   ├── repos/@system/     # Data access layer
│   │   │   ├── users.js
│   │   │   ├── subscriptions.js
│   │   │   └── ...
│   │   ├── schemas/@system/   # SQL schema definitions
│   │   │   ├── users.sql
│   │   │   ├── subscriptions.sql
│   │   │   └── ...
│   │   └── migrations/        # Migration scripts
│   ├── lib/@system/           # Shared libraries
│   │   ├── db.js              # Database client
│   │   ├── stripe.js          # Stripe client
│   │   ├── ses.js             # SES email sender
│   │   ├── jwt.js             # JWT helpers
│   │   ├── crypto.js          # Encryption helpers
│   │   └── validation.js      # Input validation
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   ├── cors.js            # CORS config
│   │   ├── rate-limit.js      # Rate limiting
│   │   └── error.js           # Error handler
│   ├── routes/
│   │   └── index.js           # Router registration
│   ├── scheduler/             # Cron jobs
│   │   └── @custom/
│   └── workers/               # Background jobs
│       └── @custom/
├── test/                      # Unit + integration tests
│   ├── unit/
│   └── api/
├── scripts/                   # Ops scripts
├── .env.example               # Env template
├── package.json
└── start.sh                   # Production startup script
```

---

## Frontend Architecture

### Tech Stack

- **React 18** — UI library with concurrent rendering
- **Vite 5** — Dev server + bundler (fast HMR, ESM-native)
- **React Router 6** — Client-side routing
- **shadcn/ui** — Accessible components (Radix UI + Tailwind)
- **Tailwind CSS 3** — Utility-first styling
- **Lucide React** — Icon library

### State Management

**Built-in React Context:**

The template uses React Context for global state (auth, theme). No Redux/Zustand by default to keep it simple.

```jsx
// app/store/@system/auth.jsx
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch current user on mount
    fetch('/api/sessions/me', { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => setUser(data?.user || null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    })
    if (res.ok) {
      const data = await res.json()
      setUser(data.user)
      return { success: true }
    }
    return { success: false, error: await res.text() }
  }

  const logout = async () => {
    await fetch('/api/sessions', {
      method: 'DELETE',
      credentials: 'include'
    })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

### Routing

**React Router 6** with lazy-loaded routes:

```jsx
// app/routes/@system/AppRoutes.jsx
import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'

const LandingPage = lazy(() => import('../../pages/static/@system/LandingPage'))
const AuthPage = lazy(() => import('../../pages/static/@system/AuthPage'))
const HomePage = lazy(() => import('../../pages/app/@system/HomePage'))

export function AppRoutes() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/app" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        {/* ... */}
      </Routes>
    </Suspense>
  )
}
```

### Protected Routes

```jsx
// app/components/@system/ProtectedRoute/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../store/@system/auth'

export function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/auth" replace />
  if (role && user.role !== role) return <Navigate to="/app" replace />

  return <>{children}</>
}
```

### API Client

**Centralized fetch wrapper:**

```js
// app/lib/@system/api.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function apiClient(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include', // Send cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(error || 'Request failed')
  }

  return res.json()
}
```

**Usage in components:**

```js
// app/api/@system/sessions.js
import { apiClient } from '../../lib/@system/api'

export const sessionsAPI = {
  login: (email, password) =>
    apiClient('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  me: () => apiClient('/api/sessions/me'),

  logout: () => apiClient('/api/sessions', { method: 'DELETE' })
}
```

---

## Backend Architecture

### Tech Stack

- **Node.js 20+** — JavaScript runtime
- **Express 4** — Web framework
- **pg-promise** — PostgreSQL client
- **jsonwebtoken** — JWT signing/verification
- **bcryptjs** — Password hashing
- **Stripe SDK** — Payment processing
- **AWS SDK (SES)** — Email delivery

### Application Structure

**Express app factory pattern:**

```js
// src/app.js
const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const { errorHandler } = require('./middleware/error')
const { corsConfig } = require('./middleware/cors')
const routes = require('./routes')

function createApp() {
  const app = express()

  // Middleware
  app.use(cors(corsConfig))
  app.use(express.json())
  app.use(cookieParser())

  // Routes
  app.use('/api', routes)

  // Error handling
  app.use(errorHandler)

  return app
}

module.exports = { createApp }
```

**Server entry point:**

```js
// src/index.js
const { createApp } = require('./app')
const { db } = require('./lib/@system/db')

const PORT = process.env.PORT || 3000

async function start() {
  // Test database connection
  await db.one('SELECT 1')
  console.log('✓ Database connected')

  const app = createApp()
  app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`)
  })
}

start().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
```

### Data Access Layer (Repos)

**Repository pattern for database operations:**

```js
// src/db/repos/@system/users.js
const { db } = require('../../lib/@system/db')
const bcrypt = require('bcryptjs')

const usersRepo = {
  async create({ email, password, name }) {
    const passwordHash = await bcrypt.hash(password, 10)
    return db.one(
      `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, role, created_at`,
      [email, passwordHash, name]
    )
  },

  async findByEmail(email) {
    return db.oneOrNone('SELECT * FROM users WHERE email = $1', [email])
  },

  async findById(id) {
    return db.oneOrNone('SELECT * FROM users WHERE id = $1', [id])
  },

  async update(id, fields) {
    const updates = Object.keys(fields)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ')
    return db.one(
      `UPDATE users SET ${updates} WHERE id = $1 RETURNING *`,
      [id, ...Object.values(fields)]
    )
  },

  async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password_hash)
  }
}

module.exports = { usersRepo }
```

### Middleware

**Authentication middleware:**

```js
// src/middleware/auth.js
const jwt = require('jsonwebtoken')
const { JWT_PUBLIC_KEY } = process.env

function requireAuth(req, res, next) {
  const token = req.cookies.token

  if (!token) {
    return res.status(401).send('Unauthorized')
  }

  try {
    const payload = jwt.verify(token, JWT_PUBLIC_KEY, { algorithms: ['RS256'] })
    req.userId = payload.sub
    next()
  } catch (err) {
    res.status(401).send('Invalid token')
  }
}

function requireRole(role) {
  return async (req, res, next) => {
    const { usersRepo } = require('../db/repos/@system/users')
    const user = await usersRepo.findById(req.userId)

    if (!user || user.role !== role) {
      return res.status(403).send('Forbidden')
    }

    req.user = user
    next()
  }
}

module.exports = { requireAuth, requireRole }
```

**Rate limiting:**

```js
// src/middleware/rate-limit.js
const rateLimit = require('express-rate-limit')

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later'
})

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
})

module.exports = { authLimiter, apiLimiter }
```

---

## Database Design

### Schema Overview

**Core tables:**

1. **users** — User accounts
2. **subscriptions** — Stripe subscriptions
3. **invoices** — Payment history
4. **api_keys** — API access tokens
5. **activity_logs** — Audit trail

### Schema: `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user', -- 'user' | 'admin'
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMPTZ,
  totp_secret TEXT, -- For 2FA
  totp_enabled BOOLEAN DEFAULT FALSE,
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
```

### Schema: `subscriptions`

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'active' | 'canceled' | 'past_due'
  plan VARCHAR(50) NOT NULL, -- 'pro' | 'enterprise'
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
```

### Schema: `invoices`

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
  amount_paid INTEGER NOT NULL, -- cents
  currency VARCHAR(10) DEFAULT 'usd',
  status VARCHAR(50) NOT NULL, -- 'paid' | 'open' | 'void'
  invoice_pdf VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_stripe ON invoices(stripe_invoice_id);
```

### Schema: `api_keys`

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
```

### Schema: `activity_logs`

```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'login', 'subscription.created', etc.
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_activity_action ON activity_logs(action);
CREATE INDEX idx_activity_created ON activity_logs(created_at);
```

### Migrations

**Migration workflow:**

1. Create file: `server/src/db/migrations/20260306_add_totp.sql`
2. Write SQL:
   ```sql
   ALTER TABLE users ADD COLUMN totp_secret TEXT;
   ALTER TABLE users ADD COLUMN totp_enabled BOOLEAN DEFAULT FALSE;
   ```
3. Run: `cd server && npm run migrate`

**Migration script:**

```js
// server/scripts/migrate.js
const { db } = require('../src/lib/@system/db')
const fs = require('fs')
const path = require('path')

async function migrate() {
  const dir = path.join(__dirname, '../src/db/migrations')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8')
    console.log(`Running migration: ${file}`)
    await db.none(sql)
  }

  console.log('✓ Migrations complete')
}

migrate().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
```

---

## Authentication Flow

### Registration

1. User submits email + password on `/register`
2. Backend validates input, hashes password (bcrypt)
3. Creates user record in PostgreSQL
4. Generates JWT with user ID
5. Sets HTTP-only cookie (`token=<jwt>; HttpOnly; Secure; SameSite=Strict`)
6. Sends verification email (SES)
7. Redirects to `/onboarding`

### Login

1. User submits email + password on `/auth`
2. Backend finds user by email
3. Verifies password (bcrypt.compare)
4. If 2FA enabled: Redirect to `/2fa/verify`
5. Generates JWT (RS256 signed)
6. Sets HTTP-only cookie
7. Returns `{ user: { id, email, name, role } }`

### Session Verification

1. Client sends `GET /api/sessions/me` with cookie
2. Middleware (`requireAuth`) extracts JWT from cookie
3. Verifies signature with public key
4. Decodes payload: `{ sub: userId, iat, exp }`
5. Returns user data (from database)

### Logout

1. Client sends `DELETE /api/sessions`
2. Server clears cookie (`Set-Cookie: token=; Max-Age=0`)
3. Client redirects to `/`

### JWT Structure

**Payload:**

```json
{
  "sub": "user-uuid",
  "iat": 1678886400,
  "exp": 1679491200
}
```

**Signing:**

- **Algorithm:** RS256 (asymmetric)
- **Private key:** Signs tokens (server only)
- **Public key:** Verifies tokens (can be shared)

**Cookie options:**

```js
res.cookie('token', jwt, {
  httpOnly: true, // No JS access (XSS protection)
  secure: process.env.NODE_ENV === 'production', // HTTPS only
  sameSite: 'strict', // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
})
```

---

## API Design

### Endpoint Conventions

- **RESTful routes:** Standard HTTP verbs (GET/POST/PUT/DELETE)
- **JSON payloads:** `Content-Type: application/json`
- **Consistent responses:** `{ success: true, data: {...} }` or `{ success: false, error: "..." }`
- **HTTP status codes:** 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error)

### Core Endpoints

#### **Auth**

```
POST   /api/sessions          # Login
DELETE /api/sessions          # Logout
GET    /api/sessions/me       # Get current user
POST   /api/users             # Register
POST   /api/users/verify      # Verify email
POST   /api/users/reset       # Request password reset
PUT    /api/users/password    # Update password
```

#### **Users**

```
GET    /api/users/:id         # Get user (admin only)
PUT    /api/users/:id         # Update user
DELETE /api/users/:id         # Delete user (admin only)
```

#### **Billing**

```
GET    /api/billing/plans     # List plans
POST   /api/billing/subscribe # Create subscription
PUT    /api/billing/cancel    # Cancel subscription
GET    /api/billing/portal    # Stripe customer portal URL
POST   /api/webhooks/stripe   # Stripe webhook handler
```

#### **Admin**

```
GET    /api/admin/users       # List all users
GET    /api/admin/stats       # Dashboard stats
POST   /api/admin/users/:id/role # Change user role
```

### Example: Login Endpoint

```js
// src/api/@system/sessions/index.js
const express = require('express')
const jwt = require('jsonwebtoken')
const { usersRepo } = require('../../../db/repos/@system/users')
const { authLimiter } = require('../../../middleware/rate-limit')

const router = express.Router()

router.post('/', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).send('Email and password required')
    }

    // Find user
    const user = await usersRepo.findByEmail(email)
    if (!user) {
      return res.status(401).send('Invalid credentials')
    }

    // Verify password
    const valid = await usersRepo.verifyPassword(user, password)
    if (!valid) {
      return res.status(401).send('Invalid credentials')
    }

    // Generate JWT
    const token = jwt.sign(
      { sub: user.id },
      process.env.JWT_PRIVATE_KEY,
      { algorithm: 'RS256', expiresIn: '7d' }
    )

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    // Return user data (no password)
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).send('Server error')
  }
})

module.exports = router
```

---

## Payment Integration

### Stripe Architecture

**Flow:**

1. User selects plan on `/pricing`
2. Client calls `POST /api/billing/subscribe`
3. Server creates Stripe Checkout Session
4. User redirected to Stripe-hosted checkout
5. User completes payment
6. Stripe sends webhook to `/api/webhooks/stripe`
7. Webhook handler creates `subscription` record
8. User redirected to `/app` with active subscription

### Subscription Plans

```js
// src/api/@system/billing/index.js
const PLANS = {
  starter: {
    priceId: 'price_1234567890',
    name: 'Starter',
    price: 1900, // $19/month
    features: ['Feature A', 'Feature B']
  },
  pro: {
    priceId: 'price_0987654321',
    name: 'Pro',
    price: 4900, // $49/month
    features: ['Feature A', 'Feature B', 'Feature C']
  }
}
```

### Webhook Handling

```js
// src/api/@system/webhooks/stripe.js
const express = require('express')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { subscriptionsRepo } = require('../../../db/repos/@system/subscriptions')

const router = express.Router()

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`)
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object)
      break
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object)
      break
    case 'customer.subscription.deleted':
      await handleSubscriptionCancel(event.data.object)
      break
  }

  res.send({ received: true })
})

async function handleCheckoutComplete(session) {
  const { customer, subscription } = session
  const sub = await stripe.subscriptions.retrieve(subscription)

  await subscriptionsRepo.create({
    userId: session.metadata.userId,
    stripeSubscriptionId: sub.id,
    status: sub.status,
    plan: session.metadata.plan,
    currentPeriodStart: new Date(sub.current_period_start * 1000),
    currentPeriodEnd: new Date(sub.current_period_end * 1000)
  })
}

module.exports = router
```

---

## Email System

### AWS SES Integration

**Transactional emails:**

- Welcome email (registration)
- Email verification
- Password reset
- Invoice receipts
- Subscription updates

### Email Sender

```js
// src/lib/@system/ses.js
const AWS = require('aws-sdk')

const ses = new AWS.SES({
  region: process.env.AWS_SES_REGION,
  accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY
})

async function sendEmail({ to, subject, html }) {
  const params = {
    Source: process.env.SES_FROM_EMAIL,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject },
      Body: { Html: { Data: html } }
    }
  }

  return ses.sendEmail(params).promise()
}

module.exports = { sendEmail }
```

### Email Templates

```js
// src/lib/@system/ses/templates/welcome.js
function welcomeEmail(name, verifyUrl) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .button { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; }
      </style>
    </head>
    <body>
      <h1>Welcome, ${name}!</h1>
      <p>Click below to verify your email:</p>
      <a href="${verifyUrl}" class="button">Verify Email</a>
    </body>
    </html>
  `
}

module.exports = { welcomeEmail }
```

---

## Security Architecture

### Threat Model

1. **XSS (Cross-Site Scripting)** → HTTP-only cookies, CSP headers
2. **CSRF (Cross-Site Request Forgery)** → SameSite cookies
3. **SQL Injection** → Prepared statements (pg-promise)
4. **Brute force attacks** → Rate limiting
5. **Data breaches** → Encryption at rest (AES-256)

### Defense Layers

| Threat | Mitigation |
|--------|------------|
| XSS | HTTP-only cookies (no JS access), CSP headers |
| CSRF | SameSite=Strict cookies |
| SQL Injection | Prepared statements, parameterized queries |
| Brute force | express-rate-limit (5 attempts/15min) |
| Token theft | Short-lived JWTs (7 days), secure cookies |
| Data leaks | AES-256 encryption for sensitive fields |
| MITM | HTTPS enforced in production |

### Encryption

**Sensitive data encryption:**

```js
// src/lib/@system/crypto.js
const crypto = require('crypto')

const ALGORITHM = 'aes-256-cbc'
const KEY = Buffer.from(process.env.ENCRYPT_KEY, 'hex') // 32 bytes
const IV = Buffer.from(process.env.ENCRYPT_IV, 'hex')   // 16 bytes

function encrypt(text) {
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, IV)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

function decrypt(encrypted) {
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, IV)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

module.exports = { encrypt, decrypt }
```

---

## Performance & Scalability

### Optimization Strategies

1. **Lazy loading** — Code-split React routes
2. **Connection pooling** — pg-promise manages PostgreSQL connections
3. **Stateless architecture** — JWT enables horizontal scaling
4. **CDN for static assets** — Serve client build from CDN
5. **Database indexes** — Foreign keys, unique constraints, common queries
6. **Query optimization** — Avoid N+1 queries, use JOINs

### Horizontal Scaling

**Stateless design enables:**

- Multiple server instances behind load balancer
- No session store (JWT in cookies)
- Read replicas for PostgreSQL

**Railway auto-scaling:**

Railway can spin up additional instances based on CPU/memory usage.

---

## Deployment Architecture

### Railway

**Components:**

- **Web service** — Runs `npm run start:railway`
- **PostgreSQL plugin** — Managed database
- **Environment variables** — Secrets injected at runtime
- **Preview environments** — Auto-deploy for PR branches

**Build process:**

1. Railway detects `railway.json`
2. Runs `npm run build:railway`:
   - `cd client && npm install && npm run build`
   - `cp -r client/dist server/public` (static assets)
   - `cd server && npm install`
3. Starts server: `node server/src/index.js`
4. Server serves API at `/api/*` and static assets at `/*`

**Environment:**

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `JWT_PRIVATE_KEY` | JWT signing key |
| `PORT` | Server port (Railway sets this) |

---

## Technology Decisions

### Why React over Vue/Svelte?

- **Ecosystem:** Largest component library ecosystem
- **Hiring:** Easier to find React developers
- **Stability:** Mature, stable API

### Why Express over Fastify/Koa?

- **Battle-tested:** 10+ years in production
- **Middleware ecosystem:** Huge selection
- **Simplicity:** Minimal learning curve

### Why PostgreSQL over MongoDB?

- **Relational data:** SaaS apps have structured data (users, subscriptions)
- **ACID guarantees:** Billing requires transactional integrity
- **JSON support:** JSONB for flexible data (e.g., metadata)

### Why Vite over Webpack/Parcel?

- **Speed:** Native ESM, instant HMR
- **Modern:** No legacy Babel transforms
- **Simple config:** Works out of the box

### Why shadcn/ui over Material UI/Chakra?

- **Ownership:** Components copied into your project (no dependency)
- **Customizable:** Full Tailwind control
- **Accessible:** Built on Radix UI primitives

---

## Conclusion

The Product Template is a **production-ready scaffold** that balances:

- **Speed** — Ship new products in days, not weeks
- **Maintainability** — `@system` / `@custom` separation
- **Security** — Battle-tested auth, encryption, rate limiting
- **Scalability** — Stateless architecture, horizontal scaling ready

**Not a framework.** Fork it, customize it, ship it.

---

**Questions?** See [README.md](../README.md) or ask in #product-template (Discord).
