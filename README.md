# Product Template

**Assimetria's foundational scaffold for spinning up new products**

> Internal tooling for Assimetria agents and operators. This template provides a consistent, production-ready foundation for building SaaS products within the Assimetria OS ecosystem.

---

## Purpose

The Product Template is the starting point for all Assimetria products. It solves the "blank slate problem" by providing:

1. **Consistent architecture** — All products share the same structure, making agent handoffs seamless
2. **Battle-tested patterns** — Auth, database, payments, and deployment are solved once, reused everywhere
3. **Fast iteration** — Bootstrap a new product in minutes, not days
4. **Maintainability** — Template updates (`@system`) propagate to all products via sync workflow

**Not a framework.** This is a scaffold — fork it, customize it, ship it.

---

## What's Included

### Frontend (React + Vite)

- **shadcn/ui** — High-quality, accessible components (not a dependency, you own the code)
- **Tailwind CSS** — Utility-first styling
- **React Router** — Client-side routing with protected routes
- **Lucide React** — Beautiful, consistent icons
- **JWT authentication** — Secure, stateless sessions
- **Mobile-first** — Responsive design with touch-friendly targets, safe area support, and mobile components

### Backend (Node.js + Express)

- **PostgreSQL** — Relational database via `pg-promise`
- **JWT sessions** — Secure authentication with RS256 signing
- **API scaffolding** — Pagination, search, and CRUD helpers for rapid API development (see `docs/API_PATTERNS.md`)
- **Stripe integration** — Subscription billing ready to go
- **Security middleware** — Helmet, CSRF protection, rate limiting, input validation
- **Email system** — Multi-provider transactional emails (Resend, SMTP, SES, Console)
- **File uploads** — Direct browser-to-cloud uploads via presigned URLs (S3, R2, local)
- **Audit logging** — Structured application logging and compliance trails

### SaaS Features

- **Teams & Collaboration** — Multi-tenant workspaces, role-based access control, email invitations (see `docs/TEAMS.md`)
- **UX Components** — Dashboard layouts, onboarding wizard, user settings, data tables, and more
- **Admin APIs** — Log analysis, user management

### DevOps & Tooling

- **Railway deployment** — One-click deploy config included (see `docs/railway-deploy.md`)
- **Docker support** — Containerized for portability
- **E2E tests (Playwright)** — Automated browser testing
- **Bootstrap scripts** — Auto-generate crypto keys, copy env files

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Client** | React 18 + Vite |
| **UI Library** | shadcn/ui |
| **Styling** | Tailwind CSS |
| **Server** | Node.js 20+ + Express 4.x |
| **Database** | PostgreSQL 15+ via pg-promise |
| **Auth** | JWT (RS256) |
| **Payments** | Stripe |
| **Email** | Resend / SMTP / SES |
| **Deployment** | Railway |
| **E2E Testing** | Playwright |

---

## Project Structure

```
product-template/
├── client/                    # React (Vite) SPA
│   └── src/app/
│       ├── components/@system/ # Template components (do not modify)
│       ├── components/@custom/ # Your product components go here
│       ├── pages/app/          # Authenticated pages (/app/*)
│       ├── pages/static/       # Public pages (/, /pricing, /blog)
│       └── config/             # Product branding, env vars
│
├── server/                    # Node.js API
│   └── src/
│       ├── api/@system/        # Template endpoints (auth, billing, admin)
│       ├── api/@custom/        # Your product endpoints go here
│       ├── db/migrations/      # Database migrations
│       └── lib/@system/        # Integrations (PostgreSQL, Stripe, email)
│
├── e2e/                       # Playwright E2E tests
│   ├── @system/               # Template test suites
│   └── @custom/               # Your product tests go here
│
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md
│   ├── AUTH.md
│   ├── API_PATTERNS.md
│   ├── API-SCAFFOLDING.md
│   ├── GIT_WORKFLOW.md
│   ├── QA.md
│   ├── RUNBOOK.md
│   ├── TEAMS.md
│   ├── railway-deploy.md
│   └── webpack-setup.md
│
├── assets/                    # Brand assets (logos, favicons, OG images)
├── scripts/@system/dev/       # Bootstrap and key generation scripts
├── package.json               # Root workspace scripts
├── docker-compose.yml         # Local dev containers
└── playwright.config.js       # E2E test config
```

---

## Conventions: `@system` vs `@custom`

| Directory | Purpose | Rules |
|-----------|---------|-------|
| **@system** | Template code (synced from upstream) | **Do not modify.** Changes here will be overwritten when syncing template updates. |
| **@custom** | Product-specific code | **Your code goes here.** Safe from template sync overwrites. |

When a product forks this template, custom features go in `@custom`. Template improvements (`@system`) can be pulled in later without conflicts.

---

## Quick Start

### Prerequisites

- **Node.js 20+** (LTS recommended)
- **PostgreSQL 15+** (local or Docker)
- **npm 9+** (comes with Node)

### 1. Bootstrap

```bash
git clone https://github.com/assimetria-ai/product-template.git my-product
cd my-product
npm install
npm run bootstrap
# Creates server/.env, client/.env, JWT keypair, AES-256 keys
```

### 2. Configure Environment

Edit **`server/.env`**:

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
JWT_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----...
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----...
CSRF_SECRET=your-random-32-plus-character-secret
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5173
```

Edit **`client/.env`**:

```bash
VITE_API_URL=http://localhost:3000
```

### 3. Install & Run

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Initialize database
cd server && npm run migrate

# Run servers (two terminals)
cd server && npm run dev   # → http://localhost:3000
cd client && npm run dev   # → http://localhost:5173
```

---

## Deployment

### Railway (Recommended)

1. Push to GitHub
2. Connect repo in Railway dashboard
3. Add PostgreSQL plugin
4. Set environment variables
5. Deploy

See **[docs/railway-deploy.md](./docs/railway-deploy.md)** for detailed steps.

### Docker

```bash
docker-compose build
docker-compose up
```

---

## Testing

```bash
# Unit & integration
cd server && npm test

# E2E (Playwright)
npm run test:e2e           # headless
npm run test:e2e:ui        # interactive UI
npm run test:e2e:report    # view last report
```

E2E suites in `e2e/@system/`: public pages, auth flows, navigation, accessibility.

---

## How Products Use This Template

### 1. Fork

```bash
git clone https://github.com/assimetria-ai/product-template.git zipchat-ai
cd zipchat-ai
git remote rename origin template
git remote add origin https://github.com/assimetria-ai/zipchat-ai.git
npm run bootstrap
```

### 2. Customize Branding

Edit **`client/src/app/config/index.js`**:

```js
export const config = {
  productName: 'ZipChat AI',
  companyName: 'Assimetria',
  supportEmail: 'support@zipchat.ai',
}
```

### 3. Add Custom Features

```
client/src/app/components/@custom/  ← product UI components
server/src/api/@custom/             ← product API endpoints
client/src/app/routes/@custom/      ← product routes
```

### 4. Sync Template Updates

```bash
git remote add template https://github.com/assimetria-ai/product-template.git
git fetch template
git merge template/main --allow-unrelated-histories
# @system changes: accept template version
# @custom changes: keep product version
```

---

## Security

- **JWT RS256** — Asymmetric signing, HTTP-only cookies, SameSite=Strict
- **AES-256-CBC** — Encrypted sensitive data at rest, unique IV per record
- **Rate limiting** — Auth: 5 req/15min; API: 100 req/15min per IP
- **Helmet** — Security headers; CSRF protection on all state-changing endpoints
- Keys never committed — always in `.env`, never in source

See [SECURITY.md](./SECURITY.md) for full details.

---

## Git Workflow

- **`main`** — Stable, production-ready. Products fork from here.
- **`dev`** — Active development. All changes start here.

See **[docs/GIT_WORKFLOW.md](./docs/GIT_WORKFLOW.md)** for full workflow.

---

## FAQ

**Why not Next.js?** — Simplicity. Clear client/server separation, no "use server" magic, flexible (swap Vite for Webpack).

**Why shadcn/ui?** — You own the code. Components are copied into your project, no dependency upgrades or breaking changes.

**Why PostgreSQL?** — ACID compliance, JSONB support, mature tooling. Most SaaS apps have relational data.

**Why pg-promise instead of Prisma?** — Lightweight, full SQL control, prepared statements, no ORM baggage.

**Can I use TypeScript?** — Yes. Vite supports `.tsx` out of the box.

**Can I replace Vite with Webpack?** — Yes. See [docs/webpack-setup.md](./docs/webpack-setup.md).

---

## Contributing

Internal Assimetria tooling only.

1. Work on `dev` branch
2. Prefer `@system` for reusable features
3. Add E2E tests for new flows
4. Open PR: `dev → main`

---

## License

**Internal use only.** Assimetria proprietary.

---

## Credits

Built by **Assimetria** — Carlos (architecture), Frederico (docs/QA), Jeremias (product), Nora (marketing), Felix (git/automation).
