# WaitlistKit Custom Features Migration Plan

Generated: 2026-02-26 22:56  
Status: Analysis complete, ready for implementation

## Overview
This document maps all custom features from legacy WaitlistKit to the new product-template-based structure.  
ALL custom code MUST go in `@custom/` directories only. NEVER modify `@system/` files.

**Core Product:** WaitlistKit is a waitlist management SaaS with viral referral mechanics, position tracking, and invite workflows.

---

## Backend Custom Features

### Database Repositories (@custom/repos)
Legacy location: `legacy/waitlistkit/server/src/db/repos/@custom/`

**Required repos:**
1. **ApiKeyRepo.js** (60 lines) - API key generation and management
2. **BrandRepo.js** (107 lines) - Brand management (core feature)
3. **CollaboratorRepo.js** (108 lines) - Team collaboration features
4. **ErrorEventRepo.js** (122 lines) - Error tracking persistence
5. **UserRepo.js** (100 lines) - Extended user functionality beyond auth
6. **index.js** (14 lines) - Exports all custom repos

### Database Migrations (@custom/migrations)
Legacy location: `legacy/waitlistkit/server/src/db/migrations/@custom/`

**Required migrations (in order):**
1. `001_error_events.js` - Error tracking table
2. `002_brands.js` - Brand management
3. `002_collaborators.js` - Team collaboration
4. `002_users_custom.js` - User extensions
5. `003_api_keys.js` - API key storage
6. `003_invitation_tokens.js` - Invite system
7. `003_full_text_search.js` - Search optimization

**⚠️ CRITICAL: Waitlist Core Tables**  
The **waitlists** and **waitlist_subscribers** tables are defined in `001_initial.sql` (NOT in @custom).  
These MUST be migrated to `@custom/migrations/001_waitlist_tables.js` or added to the new template's base schema!

**Waitlist table schema:**
```sql
-- waitlists: stores multiple waitlists per user
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER, FK to users)
- name (VARCHAR 255)
- slug (VARCHAR 255 UNIQUE) - public URL identifier
- description (TEXT)
- product_url (TEXT)
- referral_enabled (BOOLEAN, default true)
- status (VARCHAR 20: 'active' | 'paused' | 'closed')
- created_at, updated_at (TIMESTAMPTZ)

-- waitlist_subscribers: signups with referral tracking
- id (SERIAL PRIMARY KEY)
- waitlist_id (INTEGER, FK to waitlists)
- email (VARCHAR 255)
- position (INTEGER) - queue position
- referral_code (VARCHAR 20 UNIQUE) - user's unique referral code
- referred_by (INTEGER, FK to waitlist_subscribers) - who referred them
- referral_count (INTEGER, default 0) - viral coefficient
- priority (VARCHAR 20: 'normal' | 'vip')
- status (VARCHAR 20: 'waiting' | 'invited' | 'joined')
- invited_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- UNIQUE(waitlist_id, email)
```

### API Endpoints (@custom/api)
Legacy location: `legacy/waitlistkit/server/src/api/@custom/`

**Required API modules:**

#### 1. Waitlist API (`waitlist/index.js`) - **CORE PRODUCT FEATURE**
**Endpoints:**
- `GET /api/waitlist` - List user's waitlists
- `POST /api/waitlist` - Create new waitlist (auto-generates slug)
- `POST /api/waitlist/:slug/join` - **PUBLIC** - Join waitlist (with referral tracking)
- `GET /api/waitlist/:id/subscribers` - List subscribers (paginated, ordered by referrals)
- `POST /api/waitlist/:id/invite` - Batch invite top N subscribers
- `GET /api/waitlist/stats` - Dashboard stats (total_subscribers, referrals, invited count)

**Key features:**
- Position tracking (auto-increments on join)
- Referral code generation (random 6-char uppercase)
- Viral mechanics: referred_by tracking + referral_count increment
- Priority-based ordering: referral_count DESC, then position ASC
- Status workflow: waiting → invited → joined

#### 2. Errors API (`errors/index.js`)
**Endpoints:**
- `GET /api/errors/stats` - Error statistics
- `GET /api/errors` - List error events (filtered, paginated)
- `GET /api/errors/:id` - Single error event
- `POST /api/errors` - Ingest error (DSN auth, upserts by fingerprint)
- `PATCH /api/errors/:id/status` - Update error status (unresolved/resolved/ignored)

#### 3. Search API (`search/index.js`)
**Endpoints:**
- `GET /api/search?q=term&types=users,brands,errors&limit=20` - Full-text search across entities

### Configuration
- `server/src/config/@custom/index.js` - Product-specific config
- `server/src/scheduler/tasks/@custom/index.js` - Scheduled jobs (if any)
- `server/src/lib/@custom/index.js` - Custom utilities
- `server/src/workers/@custom/index.js` - Background workers (if any)

### Routes
- `server/src/routes/@custom/index.js` - Mounts custom API endpoints:
  - `/api/waitlist/*` (waitlist management)
  - `/api/errors/*` (error tracking)
  - `/api/search` (multi-entity search)

### Database Schemas (@custom/schemas)
Legacy location: `legacy/waitlistkit/server/src/db/schemas/@custom/`

**Required schema files:**
1. `api_keys.sql` - API key storage
2. `brands.sql` - Brand configuration
3. `collaborators.sql` - Team members
4. `error_events.sql` - Error event tracking
5. `full_text_search.sql` - Search indexes
6. `invitation_tokens.sql` - Invite system
7. `users_custom.sql` - User extensions

---

## Frontend Custom Features

### Pages (@custom/pages)
Legacy location: `legacy/waitlistkit/client/src/app/pages/app/@custom/`

**Required pages:**

#### 1. WaitlistKitDashboardPage.tsx - **MAIN PRODUCT UI**
**Features:**
- **Stats Cards:**
  - Total Subscribers (across all waitlists)
  - Total Referrals (viral growth metric)
  - Average Position
  - Invited Count
  
- **Waitlist Management:**
  - Grid view of user's waitlists
  - Each card shows: name, status badge (active/paused), subscriber count, created date
  - Actions: View, Invite (batch invite)
  
- **Subscriber Table:**
  - Columns: Position #, Email, Referral Count, Source, Joined Date, Priority (VIP/Normal), Action
  - VIP badge with crown icon for high-referrers
  - Individual invite buttons
  - Bulk actions: "Invite Top 10", "Export CSV"
  - Real-time status updates (invited state)
  
- **Mock Data Fallback:** Uses MOCK_STATS, MOCK_WAITLISTS, MOCK_SUBSCRIBERS during development

**Dependencies:**
- Icons: List, Users, Star, Mail, Plus, Gift, Download, BarChart2, Crown (lucide-react)
- UI Components: Button, Header, PageLayout (from @system)
- API calls: `/api/waitlists/stats`, `/api/waitlists`, `/api/waitlists/subscribers`

#### 2. ErrorTrackingPage.tsx
**Features:**
- Error event dashboard
- Error status management (unresolved/resolved/ignored)
- Stack trace viewing
- Error fingerprint grouping

### Routes (@custom/routes)
- `client/src/app/routes/@custom/index.tsx` - Custom route definitions:
  - `/app/waitlists` → WaitlistKitDashboardPage

### Integrations
- **Sentry** (`app/lib/@custom/sentry.ts`) - Error monitoring integration

### Configuration
- `client/src/config/@custom/info.ts` - Product metadata:
  - name: "WaitlistKit"
  - tagline: "Your runway starts here."
  - url: https://waitlistkit.com
  - supportEmail: support@waitlistkit.com

### Components (@custom/components)
- `client/src/app/components/@custom/index.tsx` - Custom React components (if any)

---

## Implementation Priority

### Phase 1: Core Waitlist Data Model (P0) 🔴
**Critical for product functionality**
- [ ] Create `@custom/migrations/001_waitlist_tables.js` (waitlists + waitlist_subscribers)
- [ ] Migrate database migrations from legacy @custom
- [ ] Implement all @custom repos (ApiKeyRepo, BrandRepo, CollaboratorRepo, ErrorEventRepo, UserRepo)
- [ ] Test database initialization: `npm run db:migrate`
- [ ] Verify waitlist tables exist with correct schema and indexes

### Phase 2: Waitlist Backend API (P0) 🔴
**Core product features - MUST work**
- [ ] Implement `@custom/api/waitlist/index.js` (6 endpoints)
  - Create waitlist with slug generation
  - Public join endpoint with referral tracking
  - Subscriber listing with referral-based sorting
  - Batch invite workflow
  - Stats aggregation
- [ ] Implement `@custom/routes/index.js` to mount waitlist API
- [ ] Test all waitlist endpoints with Postman/curl
- [ ] Verify referral mechanics: code generation, referred_by linking, referral_count increment

### Phase 3: Waitlist Dashboard Frontend (P0) 🔴
**Primary user interface**
- [ ] Implement WaitlistKitDashboardPage.tsx
  - Stats cards with real API data
  - Waitlist grid with create/view/invite actions
  - Subscriber table with sorting, filtering, invites
  - CSV export functionality
- [ ] Implement custom routes: `/app/waitlists`
- [ ] Update `@custom/info.ts` with WaitlistKit branding
- [ ] Test full user flow: create waitlist → view subscribers → invite users
- [ ] Test referral flow: join with referral code → verify position boost

### Phase 4: Secondary Features (P1) 🟡
**Supporting infrastructure**
- [ ] Implement Errors API (`@custom/api/errors/index.js`)
- [ ] Implement ErrorTrackingPage.tsx
- [ ] Implement Search API (`@custom/api/search/index.js`)
- [ ] Sentry integration (`@custom/lib/sentry.ts`)
- [ ] Custom config and utilities

### Phase 5: Testing & Polish (P2) 🟢
- [ ] Unit tests for waitlist repos and referral logic
- [ ] API integration tests for all waitlist endpoints
- [ ] E2E tests: full signup → referral → invite flow
- [ ] Load test: 1000+ subscribers per waitlist
- [ ] CSV export validation
- [ ] Error handling and edge cases

---

## Acceptance Criteria

### Core Functionality ✅
1. Users can create multiple waitlists with unique slugs
2. Public join endpoint works without authentication
3. Referral codes are generated and tracked correctly
4. Referral count increments when someone joins via code
5. Subscribers are sorted by referral_count DESC, position ASC
6. Batch invite workflow updates status to 'invited'
7. Dashboard shows accurate stats across all waitlists
8. CSV export includes all subscriber data

### Technical Requirements ✅
1. Zero modifications to @system files
2. All custom code in @custom directories
3. All tests pass (unit + integration + e2e)
4. Dev server runs without errors: `npm run dev`
5. Database migrations execute cleanly: `npm run db:migrate`
6. No console errors in browser

### User Experience ✅
1. Dashboard loads in <2s with 1000+ subscribers
2. Invite actions provide immediate visual feedback
3. Referral mechanics are intuitive (clear CTA for sharing)
4. VIP badges appear for users with 5+ referrals
5. Mock data fallback works during development

---

## Migration Checklist

### Pre-Migration
- [ ] Read this document fully
- [ ] Review legacy code structure: `/Users/ruipedro/.openclaw/workspace-assimetria/legacy/waitlistkit/`
- [ ] Understand referral mechanics and position tracking logic
- [ ] Note: 44 total custom files to migrate

### During Migration
- [ ] Copy migrations one-by-one, adapting to new template structure
- [ ] DO NOT copy-paste API code blindly - verify auth middleware paths
- [ ] Test each phase independently before moving to next
- [ ] Use legacy code as reference, not as copy-paste source
- [ ] Document any schema changes in CHANGELOG.md

### Post-Migration
- [ ] Run full test suite
- [ ] Manual QA: create waitlist, join via referral, invite subscribers
- [ ] Deploy to staging environment
- [ ] Load test with realistic data
- [ ] Update documentation for deployment

---

## Key Observations

### Waitlist-Specific Design Patterns 🎯

1. **Viral Loop Architecture:**
   - Every signup generates a unique referral code
   - Referrers gain higher priority (referral_count sorting)
   - Gamification: top referrers get VIP badges
   - Position tracking creates FOMO (early signups = lower numbers)

2. **Multi-Waitlist Support:**
   - Users can manage multiple products/launches simultaneously
   - Each waitlist has independent slug (public URL)
   - Aggregated stats across all waitlists (dashboard)

3. **Invite Workflow:**
   - Batch invites: select top N by referral count
   - Individual invites: manual selection
   - Status tracking: waiting → invited → joined
   - Email integration likely in production (not in current codebase)

4. **Public vs Authenticated Endpoints:**
   - `/api/waitlist/:slug/join` - PUBLIC (no auth middleware)
   - All other endpoints require `authenticate` middleware
   - Admin-only features: error tracking, search

5. **Performance Optimizations:**
   - Database indexes on: user_id, slug, waitlist_id, referral_code
   - Pagination on subscriber lists (limit/offset)
   - Efficient sorting: referral_count DESC + position ASC

### Technical Debt to Address 🔧

1. **Missing WaitlistRepo:**
   - Currently using raw `db.any()` / `db.one()` in API routes
   - Should create `WaitlistRepo.js` and `WaitlistSubscriberRepo.js` for consistency

2. **Email Integration:**
   - Invite workflow doesn't send emails yet
   - Should integrate with AWS SES templates (see `@system/AWS/SES`)

3. **Referral Analytics:**
   - No tracking of referral sources (which code generated most signups)
   - Could add `referral_source` tracking (utm parameters)

4. **Webhook Support:**
   - No webhook notifications for new signups or invites
   - Could add webhook configuration per waitlist

---

## Notes
- Legacy code location: `/Users/ruipedro/.openclaw/workspace-assimetria/legacy/waitlistkit/`
- New structure: `/Users/ruipedro/.openclaw/workspace-assimetria/waitlistkit/`
- Total custom files: 44 (excluding .gitkeep placeholders)
- Core product feature: Waitlist management with viral referrals
- Reference legacy files directly when implementing
- DO NOT copy-paste blindly - adapt to new template structure
- Test referral mechanics thoroughly - this is the product's main differentiator

---

## Related Documentation
- Template reference: `/Users/ruipedro/.openclaw/workspace-frederico/product-template/`
- Nestora migration: `/Users/ruipedro/.openclaw/workspace-assimetria/nestora/CUSTOM_FEATURES_MIGRATION.md`
- Database docs: `legacy/waitlistkit/docs/` (if exists)
