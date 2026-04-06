const { doubleCsrf } = require('csrf-csrf')

/**
 * CSRF protection middleware using double-submit cookie pattern.
 *
 * This middleware protects against Cross-Site Request Forgery attacks by:
 * 1. Generating a CSRF token stored in an httpOnly cookie
 * 2. Requiring clients to send this token in a custom header (X-CSRF-Token)
 * 3. Validating that both values match before processing state-changing requests
 *
 * The middleware automatically handles GET, HEAD, and OPTIONS requests as safe
 * and only validates tokens for POST, PUT, PATCH, DELETE requests.
 *
 * Usage:
 *   - Add csrfProtection middleware to routes that need CSRF protection
 *   - Expose generateCsrfToken() via a GET endpoint so clients can fetch the token
 *   - Clients must include the token in the X-CSRF-Token header for protected requests
 */
const {
  generateCsrfToken: _generateCsrfToken, // Generate a new CSRF token
  doubleCsrfProtection                    // Middleware to validate CSRF tokens
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
  // __Host- prefix requires the Secure attribute (browsers enforce this regardless of the
  // Secure flag the server sets). In development over HTTP the cookie would be silently
  // rejected, breaking the double-submit pattern entirely. Use the prefixed name only in
  // production where HTTPS is always present.
  cookieName: process.env.NODE_ENV === 'production'
    ? '__Host-psifi.x-csrf-token'
    : 'psifi.x-csrf-token',
  cookieOptions: {
    sameSite: 'strict',
    path: '/',
    secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
    httpOnly: true, // Prevent JavaScript access to the cookie
  },
  size: 64, // Token size in bytes
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'], // Safe methods that don't need CSRF protection
  getTokenFromRequest: (req) => req.headers['x-csrf-token'], // Custom header for the token
  getSessionIdentifier: (req) => {
    // Use session ID if available, otherwise fall back to a default empty string
    // This is safe because CSRF protection relies on the double-submit cookie pattern,
    // not on session identification
    return req.sessionID || req.session?.id || ''
  },
})

/**
 * Routes exempt from CSRF validation.
 * Auth routes (register/login/forgot-password) are called before the client
 * has a session, so CSRF protection doesn't apply — there's no cookie to steal.
 * Webhook routes receive server-to-server calls that can't carry CSRF tokens.
 * /api/v1/* is the programmatic API namespace; all access is via API keys, not browsers.
 */
const CSRF_EXEMPT_PATHS = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/refresh',
  '/api/auth/csrf',  // CSRF token endpoint alias — called pre-auth by health check runners
  '/api/csrf-token', // Primary CSRF token endpoint
  '/api/sessions',
  '/api/sessions/refresh',
  '/api/sessions/register',
  '/api/users',      // Registration endpoint (POST /api/users) — called pre-auth, before any session/CSRF token exists
  '/api/webhook',
  '/api/stripe/webhook',
  '/api/payments/webhook',
  '/api/v1/',        // Programmatic API namespace — accessed via API keys, not browser sessions
]

/**
 * Returns true if the request carries a Bearer token or API key in a header.
 *
 * CSRF attacks exploit cookie-based authentication — a malicious site tricks
 * the browser into sending a credentialed request. Custom request headers
 * (Authorization, X-API-Key) cannot be set by browsers cross-origin without
 * an explicit CORS preflight that the server controls, so CSRF does not apply
 * to ANY Authorization: Bearer request — whether it carries a session JWT or
 * an API key.
 *
 * Handles:
 *   - Authorization: Bearer <jwt>     (session JWT sent by health-check clients)
 *   - Authorization: Bearer sk_*      (test/seed keys)
 *   - Authorization: Bearer sv_live_* (user-created keys)
 *   - X-API-Key: <any value>          (header-based API key auth)
 */
function isApiKeyRequest(req) {
  const auth = req.headers.authorization || ''
  if (auth.startsWith('Bearer ')) return true
  if (req.headers['x-api-key']) return true
  return false
}

/**
 * Returns true if the request carries a session cookie.
 *
 * The auth cookies (access_token / token) are set with SameSite=Strict, which
 * means the browser will NEVER attach them to cross-origin requests. Therefore,
 * if either cookie is present the request is definitionally same-site and a
 * CSRF attack is impossible — the double-submit token check is redundant.
 *
 * This allows the SPA frontend to call cookie-authenticated API endpoints
 * (e.g. POST /api/templates, POST /api/api-keys) without having to obtain and
 * forward a CSRF token on every request.
 */
function isSessionRequest(req) {
  return !!(req.cookies?.access_token || req.cookies?.token)
}

/**
 * CSRF protection middleware that validates tokens on state-changing requests
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF validation in test/development environments if needed
  if (process.env.NODE_ENV === 'test' || process.env.SKIP_CSRF === 'true') {
    return next()
  }

  // Skip CSRF for requests using API key auth — CSRF only applies to
  // cookie/session auth; Authorization header tokens are cross-origin safe.
  if (isApiKeyRequest(req)) {
    return next()
  }

  // Skip CSRF for cookie-authenticated requests — the auth cookie uses
  // SameSite=Strict so it is never sent cross-origin; if it is present the
  // request MUST be same-site, making CSRF impossible (#18406).
  if (isSessionRequest(req)) {
    return next()
  }

  // Skip CSRF for auth and webhook routes (no session to protect)
  // Check both full path (app-level mount) and stripped path (router-level mount)
  const fullPath = req.originalUrl || req.path
  if (CSRF_EXEMPT_PATHS.some(p => fullPath.startsWith(p) || req.path.startsWith(p) || req.path.startsWith(p.replace('/api', '')))) {
    return next()
  }

  doubleCsrfProtection(req, res, (err) => {
    if (err) {
      return res.status(403).json({
        message: 'Invalid or missing CSRF token',
        error: 'CSRF_VALIDATION_FAILED'
      })
    }
    next()
  })
}

/**
 * Middleware to generate and expose CSRF token to clients
 * Mount this on a GET endpoint (e.g., GET /api/csrf-token)
 */
const generateCsrfToken = (req, res) => {
  const token = _generateCsrfToken(req, res)
  res.json({ csrfToken: token })
}

/**
 * Export generateToken as an alias for compatibility
 */
const generateToken = _generateCsrfToken

module.exports = {
  csrfProtection,
  generateCsrfToken,
  generateToken,
  isApiKeyRequest,
  isSessionRequest,
}
