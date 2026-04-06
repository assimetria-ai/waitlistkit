const cors = require('cors')

const ALLOWED_ORIGINS = [
  process.env.APP_URL,
  process.env.RAILWAY_PUBLIC_DOMAIN && `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean)

function isOriginAllowed(origin) {
  // Requests without an Origin header are NOT cross-origin browser requests — they come
  // from curl, Postman, server-to-server calls, or same-origin navigation. The browser
  // always sends an Origin header on cross-origin requests, so absence of Origin means
  // CORS enforcement doesn't apply. Allow these in all environments.
  // Production healthchecks still use /healthz (registered before CORS middleware).
  //
  // Also handle the string 'undefined' — Railway CDN edge proxies (Fastly/Varnish) may
  // serialise a missing Origin header as the literal string 'undefined'.
  if (!origin || origin === 'undefined') return true

  // Exact match only — wildcard subdomain matching removed (SEC-1500: attacker-registered subdomain risk)
  if (ALLOWED_ORIGINS.includes(origin)) return true

  return false
}

/**
 * CORS middleware with inline rejection handling.
 * Rejections return 403 directly without going through Express error handler.
 * This avoids the 500 status code that callback(err) can produce when the error
 * flows through middleware chains that strip/ignore err.status.
 */
const corsHandler = cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-CSRF-Token'],
  exposedHeaders: ['X-Total-Count', 'X-Request-Id'],
  maxAge: 600, // preflight cache 10 min
})

function corsMiddleware(req, res, next) {
  const origin = req.headers.origin

  if (isOriginAllowed(origin)) {
    // Allowed — delegate to cors package for proper header setting
    return corsHandler(req, res, next)
  }

  // Rejection: respond directly with 403 — never pass to next(err)
  // This prevents Express error handler from converting it to 500
  res.status(403).json({ message: `CORS: origin '${origin}' not allowed` })
}

module.exports = corsMiddleware
