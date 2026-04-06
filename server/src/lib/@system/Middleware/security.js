const helmet = require('helmet')

/**
 * Security headers middleware built on helmet.
 *
 * Helmet sets sensible defaults for:
 *  - Content-Security-Policy
 *  - Strict-Transport-Security (HSTS)
 *  - X-Frame-Options
 *  - X-Content-Type-Options
 *  - Referrer-Policy
 *  - Permissions-Policy
 *  - Cross-Origin-* policies
 */
const securityHeaders = helmet({
  // Content-Security-Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // allow inline styles (needed by most React apps)
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },

  // Only send HSTS in production (HTTPS environments)
  hsts: process.env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,

  // Prevent clickjacking
  frameguard: { action: 'deny' },

  // Prevent MIME sniffing
  noSniff: true,

  // Referrer policy — don't leak full URL to third parties
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // Disable X-Powered-By (already done by helmet by default)
  hidePoweredBy: true,

  // Cross-Origin policies
  crossOriginEmbedderPolicy: false, // set to true only if you need SharedArrayBuffer
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' },
})

module.exports = securityHeaders
