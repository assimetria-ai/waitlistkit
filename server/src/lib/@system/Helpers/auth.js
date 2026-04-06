// @system — authentication middleware
// Exports: authenticate(req, res, next)
//
// Supports four auth methods:
//   1. X-API-Key header  — raw API key (SHA-256 hashed for lookup)
//   2. Bearer <96-hex>   — opaque session token (validated against sessions table)
//   3. Bearer <jwt>      — JWT access token (RS256, signed with JWT_PRIVATE_KEY)
//   4. Bearer <other>    — API key (broader detection via looksLikeJwt — supports sk_*, sv_live_*, and product-prefixed keys)
//
// Both API key and JWT paths share an in-memory lockout store:
//   API key:  10 failures / 1 hour  → 429  (keyed on key hash)
//   JWT/pw:   10 failures / 1 hour  → 429  (keyed on userId)
//
// Session tokens also enforce a hard 30-day family lifetime via
// the sessions.family_created_at column (required; sessions without it are rejected).

const crypto = require('crypto')
const { verifyTokenAsync } = require('./jwt')
const UserRepo = require('../../../db/repos/@system/UserRepo')
const ApiKeyRepo = require('../../../db/repos/@system/ApiKeyRepo')
const SessionRepo = require('../../../db/repos/@system/SessionRepo')
const logger = require('../Logger')

// ── Lockout constants ──────────────────────────────────────────────────────────

const LOCKOUT_WINDOW_MS = 60 * 60 * 1000   // 1 hour
const LOCKOUT_THRESHOLD = 10               // failures before block

// ── In-memory failure store ────────────────────────────────────────────────────
// Map<string, { count: number, expiresAt: number }>
//
// Note: this store is per-process. In a multi-process deployment backed by
// Redis, replace _record/_isBlocked/_reset with a Redis INCR+EXPIRE pattern
// similar to RateLimit/index.js.

const failStore = new Map()

function _storeKey(type, id) {
  return `${type}:${id}`
}

/** Returns new failure count for this key. */
function _record(key) {
  const now = Date.now()
  let entry = failStore.get(key)

  if (!entry || entry.expiresAt <= now) {
    entry = { count: 0, expiresAt: now + LOCKOUT_WINDOW_MS }
    failStore.set(key, entry)
  }

  entry.count++
  return entry.count
}

/** Returns true when the key has exceeded the failure threshold. */
function _isBlocked(key) {
  const now = Date.now()
  const entry = failStore.get(key)
  if (!entry || entry.expiresAt <= now) return false
  return entry.count >= LOCKOUT_THRESHOLD
}

/** Clears the failure counter on successful auth. */
function _reset(key) {
  failStore.delete(key)
}

// ── Session token constants ────────────────────────────────────────────────────

/** Maximum age of a session family — matching the value in sessions/index.js. */
const SESSION_FAMILY_MAX_MS = 30 * 24 * 60 * 60 * 1000

// ── Helpers ────────────────────────────────────────────────────────────────────

function hashKey(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

/**
 * Returns true if the token looks like a signed JWT (header.payload.signature).
 * JWTs always have exactly two dots separating three non-empty base64url segments.
 */
function looksLikeJwt(token) {
  const parts = token.split('.')
  return parts.length === 3 && parts.every(p => p.length > 0)
}

/**
 * Extract the raw access token string from an incoming request.
 * Checks, in order:
 *   1. Authorization: Bearer <token> header (API clients / mobile apps)
 *   2. access_token HttpOnly cookie (browser SPA)
 *   3. token cookie (legacy name, backward-compatible)
 *   4. X-API-Key header (fallback; primary X-API-Key path is handled first in authenticate)
 *
 * Returns the token string, or null if none is present.
 */
function extractAccessToken(req) {
  const auth = req.headers['authorization'] ?? ''
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7)
    return token || null
  }
  return req.cookies?.access_token ?? req.cookies?.token ?? req.headers['x-api-key'] ?? null
}

/**
 * Normalise a user DB row (or req.user object) to the public-safe shape
 * returned by auth endpoints. Strips sensitive fields and fills in safe
 * defaults for optional columns. Accepts both snake_case DB rows and
 * camelCase req.user objects.
 */
function toPublicUser(user) {
  return {
    id:                  user.id,
    email:               user.email,
    name:                user.name                ?? null,
    role:                user.role                ?? 'user',
    emailVerified:       user.emailVerified       ?? !!(user.email_verified_at ?? user.email_verified),
    onboardingCompleted: user.onboardingCompleted ?? !!(user.onboarding_completed ?? false),
  }
}

// ── API key auth helper ────────────────────────────────────────────────────────

async function _authenticateApiKey(req, res, next, rawKey) {
  const keyHash = hashKey(rawKey)
  const lockKey = _storeKey('ak', keyHash)

  if (_isBlocked(lockKey)) {
    logger.warn({ keyHash: keyHash.slice(0, 8) }, 'API key auth blocked — lockout active')
    return res.status(429).json({ message: 'Too many failed API key attempts. Please try again later.' })
  }

  const apiKey = await ApiKeyRepo.findByHash(keyHash)
  if (!apiKey) {
    const count = _record(lockKey)
    logger.warn({ keyHash: keyHash.slice(0, 8), failCount: count }, 'API key auth failed — key not found or revoked')
    return res.status(401).json({ message: 'Invalid API key' })
  }

  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
    return res.status(401).json({ message: 'API key expired' })
  }

  const user = await UserRepo.findById(apiKey.user_id)
  if (!user) {
    _record(lockKey)
    return res.status(401).json({ message: 'Unauthorized' })
  }

  _reset(lockKey)
  ApiKeyRepo.touchLastUsed(apiKey.id).catch(() => {})

  req.user = toPublicUser(user)
  req.apiKey = { id: apiKey.id, name: apiKey.name }
  req.authMethod = 'api_key'
  return next()
}

// ── authenticate middleware ────────────────────────────────────────────────────

async function authenticate(req, res, next) {
  try {
    // ── 1. API key via X-API-Key header ───────────────────────────────────────
    const apiKeyRaw = req.headers['x-api-key']
    if (apiKeyRaw) {
      return _authenticateApiKey(req, res, next, apiKeyRaw)
    }

    const rawToken = extractAccessToken(req)
    if (!rawToken) return res.status(401).json({ message: 'Authentication required' })

    // ── 2. Opaque session token (96-hex chars) ────────────────────────────────
    //
    // Tokens are hashed with SHA-256 before lookup so the sessions table stores
    // only token_hash, never the raw token.  The optional family_created_at column
    // enforces a hard 30-day cap on the session family lifetime regardless of the
    // per-row expires_at value.
    if (/^[0-9a-f]{96}$/.test(rawToken)) {
      const tokenHash = hashKey(rawToken)
      const session = await SessionRepo.findActiveWithUser(tokenHash)

      if (!session) {
        return res.status(401).json({ message: 'Invalid or expired session token' })
      }

      // Family age check: hard cap on session family lifetime. Fail closed if
      // family_created_at is missing — such sessions should not exist.
      const familyAgeMs = session.family_created_at
        ? Date.now() - new Date(session.family_created_at).getTime()
        : Infinity
      if (!session.family_created_at || familyAgeMs > SESSION_FAMILY_MAX_MS) {
        logger.warn(
          { userId: session.user_id, familyCreatedAt: session.family_created_at, familyAgeMs },
          'session auth rejected — token family age exceeds maximum lifetime'
        )
        await SessionRepo.revoke(session.id, session.user_id)
        return res.status(401).json({ message: 'Session expired. Please log in again.' })
      }

      req.user = {
        id: session.user_id,
        email: session.email,
        name: session.name,
        role: session.role,
        emailVerified: !!session.email_verified_at,
        onboardingCompleted: !!session.onboarding_completed,
      }
      req.authMethod = 'session'
      return next()
    }

    // ── 3. JWT access token ───────────────────────────────────────────────────
    if (looksLikeJwt(rawToken)) {
      let payload
      try {
        payload = await verifyTokenAsync(rawToken)
      } catch {
        return res.status(401).json({ message: 'Invalid or expired token' })
      }

      // Account lockout — keyed on userId for JWT-based auth
      const lockKey = _storeKey('pw', String(payload.userId))
      if (_isBlocked(lockKey)) {
        logger.warn({ userId: payload.userId }, 'JWT auth blocked — lockout active')
        return res.status(429).json({
          message: 'Account temporarily locked due to too many failed attempts. Please try again later.',
        })
      }

      const user = await UserRepo.findById(payload.userId)
      if (!user) {
        const count = _record(lockKey)
        logger.warn({ userId: payload.userId, failCount: count }, 'JWT auth failed — user not found')
        return res.status(401).json({ message: 'Unauthorized' })
      }

      _reset(lockKey)
      req.user = toPublicUser(user)
      req.authMethod = 'jwt'
      return next()
    }

    // ── 4. API key via Bearer (broader detection) ─────────────────────────────
    // Supports sk_*, sv_live_*, and other product-prefixed key formats.
    // Any token that isn't a session token or JWT is treated as an API key.
    return _authenticateApiKey(req, res, next, rawToken)
  } catch (err) {
    next(err)
  }
}

// ── Role / ownership middleware ────────────────────────────────────────────────

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' })
  }
  next()
}

/**
 * Require the authenticated user to own the resource (or be an admin).
 *
 * Pass a resolver that receives `req` and returns the owner's user id.
 * The resolver can be async — use it to look up the row if needed.
 *
 * Usage:
 *   // ownership already on req (e.g. after findById):
 *   router.patch('/items/:id', authenticate, requireOwnerOrAdmin(req => req.resource.user_id), handler)
 *
 *   // ownership from DB:
 *   router.patch('/items/:id', authenticate, requireOwnerOrAdmin(async req => {
 *     const row = await ItemRepo.findById(req.params.id)
 *     req.resource = row          // cache for handler
 *     return row?.user_id
 *   }), handler)
 */
function requireOwnerOrAdmin(getOwnerId) {
  return async function ownerOrAdminMiddleware(req, res, next) {
    try {
      if (!req.user) return res.status(401).json({ message: 'Authentication required' })
      if (req.user.role === 'admin') return next()

      const ownerId = await getOwnerId(req)
      if (ownerId === undefined || ownerId === null) {
        return res.status(404).json({ message: 'Not found' })
      }

      if (String(ownerId) !== String(req.user.id)) {
        return res.status(403).json({ message: 'Forbidden' })
      }

      next()
    } catch (err) {
      next(err)
    }
  }
}

// ── Lockout helpers (exported for use by login route) ─────────────────────────

/**
 * Record a failed password login attempt for a userId.
 * Call this from the login route on bcrypt mismatch.
 */
function recordPasswordFailure(userId) {
  return _record(_storeKey('pw', String(userId)))
}

/**
 * Returns true if the userId is currently locked out of password auth.
 * Call this from the login route before attempting bcrypt.compare().
 */
function isPasswordLocked(userId) {
  return _isBlocked(_storeKey('pw', String(userId)))
}

/**
 * Clear the password failure counter on successful login.
 * Call this from the login route after a successful bcrypt.compare().
 */
function resetPasswordLock(userId) {
  _reset(_storeKey('pw', String(userId)))
}

module.exports = {
  authenticate,
  requireAdmin,
  requireOwnerOrAdmin,
  extractAccessToken,
  toPublicUser,
  looksLikeJwt,
  recordPasswordFailure,
  isPasswordLocked,
  resetPasswordLock,
  LOCKOUT_THRESHOLD,
  LOCKOUT_WINDOW_MS,
}
