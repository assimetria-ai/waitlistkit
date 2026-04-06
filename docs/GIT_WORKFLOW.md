# Git Workflow & Branching Strategy

> Branching model for product-template and guidance for OS/product repos

---

## Overview

This document defines the **branching strategy** for the Product Template and clarifies how it differs from OS-level tooling and individual products.

### Three Repository Types

Assimetria maintains three categories of repositories, each with its own branching model:

| Type | Examples | Branching Model | Rationale |
|------|----------|-----------------|-----------|
| **Template** | `product-template` | `dev` + `main` | Active template development requires isolation before stable releases |
| **OS** | `flint`, `preflight`, `shelf`, `splice` | `main` only | Infrastructure tools are stable; changes are infrequent and deployed immediately |
| **Products** | `broadr`, `nestora`, `dropmagic`, `waitlistkit` | `main` only (recommended) | Products fork from template then diverge; they control their own workflow |

---

## Product Template: Dev + Main

The `product-template` uses a **two-branch workflow** to balance rapid iteration with stability.

### Branch Roles

#### `main` — Stable Release Branch

**Purpose:** Production-ready template code that products can safely fork from

**Characteristics:**
- ✅ All tests passing
- ✅ Documentation up-to-date
- ✅ Breaking changes are documented in CHANGELOG.md
- ✅ Tagged releases (e.g., `v2.1.0`)
- ❌ No work-in-progress commits
- ❌ No experimental features

**Protected:** Requires pull request + review before merge

**Who merges:** Frederico (docs), Carlos (backend), or authorized agents after QA

#### `dev` — Active Development Branch

**Purpose:** Integration branch for ongoing template improvements

**Characteristics:**
- 🚧 May contain work-in-progress features
- 🚧 Breaking changes allowed (but documented)
- 🚧 Tests should pass, but occasional failures are acceptable during iteration
- ✅ All agent work starts here
- ✅ Fast-moving; multiple merges per day

**Protected:** Direct commits allowed for agents; prefer feature branches for major work

**Merges to:** `main` (via PR after QA)

---

## Workflow

### 1. Starting New Work

All template improvements begin on `dev`:

```bash
cd product-template

# Ensure you're on dev
git checkout dev
git pull origin dev

# Option A: Work directly on dev (small fixes, docs updates)
# Make changes
git add .
git commit -m "feat: add pagination helper"
git push origin dev

# Option B: Create feature branch (large features, refactors)
git checkout -b feat/teams-collaboration
# Make changes across multiple commits
git push origin feat/teams-collaboration
# Open PR: feat/teams-collaboration → dev
```

**Rule:** Never commit directly to `main`. All work goes through `dev`.

### 2. Testing on Dev

Before merging to `main`, verify on `dev`:

```bash
# Run full test suite
npm run test          # Backend unit tests
npm run test:e2e      # Frontend E2E tests

# Check for regressions
npm run lint
npm run build         # Ensure production build succeeds
```

### 3. Promoting Dev to Main

When `dev` is stable and ready for products to consume:

```bash
# Create PR: dev → main
git checkout main
git pull origin main
git checkout -b release/v2.2.0

# Merge dev into release branch
git merge dev

# Update CHANGELOG.md
# Add release notes (breaking changes, new features, bug fixes)

# Push and open PR
git push origin release/v2.2.0
# Open PR: release/v2.2.0 → main
# Assign reviewers: Frederico (docs), Carlos (backend)

# After approval + merge:
git checkout main
git pull origin main
git tag v2.2.0
git push origin v2.2.0
```

**Cadence:** Weekly releases (or as needed for critical fixes)

**Review criteria:**
- ✅ All tests passing (CI green)
- ✅ CHANGELOG.md updated
- ✅ No known regressions
- ✅ Documentation reflects new features
- ✅ Breaking changes communicated to product teams

### 4. Products Pulling Template Updates

Products (e.g., `broadr`, `nestora`) can sync template improvements:

```bash
# From product repo
git remote add template https://github.com/assimetria-ai/product-template.git
git fetch template

# Merge latest stable template
git checkout main
git merge template/main --allow-unrelated-histories

# Resolve conflicts (prefer @custom changes, accept @system updates)
git commit -m "chore: sync template v2.2.0"
git push origin main
```

**Important:** Products should only pull from `template/main`, never `template/dev`. `dev` may contain breaking changes or WIP code.

---

## OS Repos: Main Only

OS-level tools (`flint`, `preflight`, `shelf`, `splice`) use a **simpler model**: `main` only.

### Why Main-Only?

1. **Infrequent changes** — OS tools are stable; updates happen monthly, not daily
2. **Immediate deployment** — Changes are tested locally then pushed directly to prod
3. **Small team** — Fewer concurrent features mean less merge complexity
4. **Internal tooling** — No external users depending on "stable releases"

### Workflow

```bash
# Work directly on main
git checkout main
git pull origin main

# Make changes
git add .
git commit -m "feat(flint): add retry logic to deploy command"
git push origin main

# Deploy immediately
# (OS tools are deployed via agents or manual deploy scripts)
```

**Exception:** For major refactors (e.g., rewriting flint's core), use a feature branch:

```bash
git checkout -b refactor/flint-v2
# Work on refactor
git push origin refactor/flint-v2
# Open PR: refactor/flint-v2 → main
# Review + merge when ready
```

---

## Product Repos: Main Only (Recommended)

Individual products (`broadr`, `nestora`, etc.) are **independent after forking** from the template. They can choose their own workflow, but we recommend **main-only** for simplicity.

### Why Main-Only for Products?

1. **Products diverge quickly** — After forking the template, products add custom features that don't sync back
2. **Small teams** — Most products have 1-2 agents working on them
3. **Rapid iteration** — Products ship daily; dev/main adds overhead without benefit
4. **Railway auto-deploys** — Railway deploys from `main` on every push (simple = fast)

### Recommended Workflow

```bash
# Work directly on main
git checkout main
git pull origin main

# Make product-specific changes (in @custom directories)
git add client/src/app/components/@custom/
git commit -m "feat(broadr): add team collaboration dashboard"
git push origin main

# Railway auto-deploys → production
```

**Exception:** For breaking changes or major rewrites, use a feature branch:

```bash
git checkout -b feat/new-billing-flow
# Work on feature
git push origin feat/new-billing-flow
# Open PR: feat/new-billing-flow → main
# Test in Railway preview environment
# Merge when ready
```

**Note:** Products that have multiple developers or complex features may adopt `dev` + `main`. This is a product-by-product decision.

---

## Emergency Hotfixes

### Hotfix for Template (Main)

If `main` has a critical bug, fix it directly:

```bash
git checkout main
git pull origin main
git checkout -b hotfix/auth-token-expiry

# Fix the bug
git add .
git commit -m "fix: correct JWT expiry calculation (24h → 7d)"
git push origin hotfix/auth-token-expiry

# Open PR: hotfix/auth-token-expiry → main
# Fast-track review (no dev merge needed for hotfixes)
# Merge → tag → notify products
```

After merging to `main`, also merge into `dev`:

```bash
git checkout dev
git merge main
git push origin dev
```

This ensures the hotfix doesn't regress when `dev` is next promoted.

### Hotfix for Products

Products fix bugs directly on `main` (Railway auto-deploys):

```bash
git checkout main
# Fix bug
git commit -m "fix: resolve payment webhook timeout"
git push origin main
# Deployed in <2 minutes
```

---

## Commit Message Conventions

Follow **Conventional Commits** for clarity:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, missing semicolons (no code change)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or updating tests
- `chore`: Maintenance (deps, build config)

### Examples

```bash
feat(auth): add password strength validation
fix(billing): handle Stripe webhook retry logic
docs(api): update pagination examples
chore(deps): upgrade express to 4.18.2
refactor(repos): extract query builder to separate file
```

---

## Branch Protection Rules

### Template (`product-template`)

**Branch: `main`**
- ✅ Require pull request before merging
- ✅ Require 1 approving review
- ✅ Require status checks to pass (CI)
- ✅ Do not allow force pushes
- ❌ Do not allow deletions

**Branch: `dev`**
- ❌ Allow direct commits (agents can push)
- ✅ Require status checks to pass (CI)
- ❌ Do not allow force pushes
- ❌ Do not allow deletions

### OS Repos

**Branch: `main`**
- ❌ No protection (agents push directly)
- ✅ Optional: Require CI to pass before deploy

### Product Repos

**Branch: `main`**
- ❌ No protection (fast iteration)
- ✅ Railway auto-deploys (CI = canary test)

---

## FAQ

### Why not GitFlow (main/develop/feature/release/hotfix)?

**Too complex.** GitFlow was designed for software with scheduled releases (e.g., desktop apps shipped on CDs). SaaS products deploy continuously. Our `dev` + `main` model provides the benefits of GitFlow (stable releases) without the overhead (release branches, hotfix branches).

### Why not trunk-based development (main-only everywhere)?

**Template stability matters.** Products need a stable base to fork from. `main`-only works for OS tools and products, but the template benefits from a `dev` buffer where breaking changes can be tested before products consume them.

### Can products use dev + main?

**Yes, if needed.** Products like `broadr` (multiple agents, complex features) may adopt `dev` + `main`. It's a product-by-product decision. Start with `main`-only; upgrade to `dev` + `main` if merge conflicts or broken deploys become frequent.

### How often should dev merge to main?

**Weekly, or as needed.** If `dev` has critical fixes or widely-requested features, merge sooner. If `dev` is unstable or has WIP features, wait until they're complete.

### What if I accidentally commit to main?

**Revert on main, apply on dev:**

```bash
# Oops, I committed to main instead of dev
git checkout main
git revert HEAD
git push origin main

# Now apply the change correctly
git checkout dev
git cherry-pick <original-commit-hash>
git push origin dev
```

### How do I sync dev with main after a hotfix?

**Merge main into dev:**

```bash
git checkout dev
git pull origin dev
git merge main
git push origin dev
```

This ensures hotfixes don't regress when `dev` is next promoted.

---

## Summary

| Repo Type | Branching Model | Workflow |
|-----------|-----------------|----------|
| **Template** | `dev` + `main` | Work on `dev` → PR to `main` weekly → Tag releases → Products pull from `main` |
| **OS Tools** | `main` only | Work on `main` → Deploy immediately → Optional feature branches for big changes |
| **Products** | `main` only (recommended) | Work on `main` → Railway auto-deploys → Optional feature branches for breaking changes |

**Key principle:** Use the simplest workflow that prevents broken deployments. Templates need `dev` as a stability buffer. OS tools and products can move faster with `main`-only.

---

**Questions?** Ask in #product-template or #git-workflow (Discord/Slack).

**Last updated:** 2026-03-08 by Junior Agent (Task #9766)
