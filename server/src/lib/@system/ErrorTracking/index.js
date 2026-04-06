/**
 * Error Tracking System
 * 
 * Integrates with Sentry for error monitoring, performance tracking,
 * and user context capture. Falls back gracefully if not configured.
 */

const logger = require('../Logger')

let Sentry = null
let initialized = false

/**
 * Initialize Sentry (call this early in app startup)
 * 
 * @param {Object} options - Sentry configuration options
 * @param {string} options.dsn - Sentry DSN (or from process.env.SENTRY_DSN)
 * @param {string} options.environment - Environment name (default: NODE_ENV)
 * @param {number} options.tracesSampleRate - Performance monitoring sample rate (0-1)
 * @param {boolean} options.debug - Enable Sentry debug mode
 */
function init(options = {}) {
  const dsn = options.dsn || process.env.SENTRY_DSN

  if (!dsn) {
    logger.info('[ErrorTracking] Sentry DSN not configured - error tracking disabled')
    return
  }

  try {
    // Lazy load Sentry only if configured
    Sentry = require('@sentry/node')
    const Tracing = require('@sentry/tracing')

    Sentry.init({
      dsn,
      environment: options.environment || process.env.NODE_ENV || 'development',
      tracesSampleRate: options.tracesSampleRate ?? (process.env.NODE_ENV === 'production' ? 0.1 : 1.0),
      debug: options.debug ?? false,
      
      // Release tracking (use Git SHA or version)
      release: process.env.GIT_SHA || process.env.npm_package_version,

      // Integrate with Express
      integrations: [
        // Tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // Database query monitoring (PostgreSQL)
        new Tracing.Integrations.Postgres(),
      ],

      // Don't send errors from development unless explicitly enabled
      enabled: process.env.NODE_ENV !== 'development' || options.debug === true,

      // Filter sensitive data
      beforeSend(event, hint) {
        // Remove sensitive headers
        if (event.request?.headers) {
          delete event.request.headers['authorization']
          delete event.request.headers['cookie']
          delete event.request.headers['x-csrf-token']
        }

        // Remove sensitive cookies
        if (event.request?.cookies) {
          delete event.request.cookies['token']
          delete event.request.cookies['sessionId']
        }

        return event
      },
    })

    initialized = true
    logger.info({
      environment: Sentry.getCurrentHub().getClient()?.getOptions().environment,
      release: Sentry.getCurrentHub().getClient()?.getOptions().release,
    }, '[ErrorTracking] Sentry initialized')
  } catch (err) {
    logger.error({ err }, '[ErrorTracking] Failed to initialize Sentry')
    Sentry = null
  }
}

/**
 * Capture an exception
 * 
 * @param {Error} error - Error object to capture
 * @param {Object} context - Additional context
 * @param {Object} context.user - User information
 * @param {Object} context.extra - Extra data to attach
 * @param {Object} context.tags - Tags for filtering
 * @param {string} context.level - Severity level ('fatal', 'error', 'warning', 'info', 'debug')
 * @returns {string|null} Event ID if sent to Sentry
 */
function captureError(error, context = {}) {
  // Always log to standard logger
  logger.error({
    err: error,
    ...context.extra,
  }, `[ErrorTracking] ${error.message}`)

  if (!initialized || !Sentry) {
    return null
  }

  return Sentry.captureException(error, {
    user: context.user,
    extra: context.extra,
    tags: context.tags,
    level: context.level || 'error',
  })
}

/**
 * Capture a message (for non-error events)
 * 
 * @param {string} message - Message to capture
 * @param {Object} context - Additional context
 * @param {string} context.level - Severity level (default: 'info')
 * @param {Object} context.extra - Extra data
 * @param {Object} context.tags - Tags
 * @returns {string|null} Event ID if sent to Sentry
 */
function captureMessage(message, context = {}) {
  logger.info({ ...context.extra }, `[ErrorTracking] ${message}`)

  if (!initialized || !Sentry) {
    return null
  }

  return Sentry.captureMessage(message, {
    level: context.level || 'info',
    extra: context.extra,
    tags: context.tags,
  })
}

/**
 * Set user context for error tracking
 * 
 * @param {Object} user - User object
 * @param {number|string} user.id - User ID
 * @param {string} user.email - User email
 * @param {string} user.username - Username
 * @param {Object} user.extra - Additional user data
 */
function setUser(user) {
  if (!initialized || !Sentry || !user) {
    return
  }

  Sentry.setUser({
    id: user.id?.toString(),
    email: user.email,
    username: user.username,
    ...user.extra,
  })
}

/**
 * Clear user context (e.g., after logout)
 */
function clearUser() {
  if (!initialized || !Sentry) {
    return
  }

  Sentry.setUser(null)
}

/**
 * Add breadcrumb for context
 * 
 * @param {Object} breadcrumb - Breadcrumb data
 * @param {string} breadcrumb.message - Breadcrumb message
 * @param {string} breadcrumb.category - Category (e.g., 'auth', 'database', 'api')
 * @param {string} breadcrumb.level - Severity level
 * @param {Object} breadcrumb.data - Additional data
 */
function addBreadcrumb(breadcrumb) {
  if (!initialized || !Sentry) {
    return
  }

  Sentry.addBreadcrumb({
    message: breadcrumb.message,
    category: breadcrumb.category,
    level: breadcrumb.level || 'info',
    data: breadcrumb.data,
  })
}

/**
 * Express middleware for request tracing
 * Attaches Sentry request handler
 */
function requestHandler() {
  if (!initialized || !Sentry) {
    return (req, res, next) => next()
  }

  return Sentry.Handlers.requestHandler()
}

/**
 * Express middleware for error handling
 * Should be used AFTER all routes but BEFORE other error handlers
 */
function errorHandler() {
  if (!initialized || !Sentry) {
    return (err, req, res, next) => next(err)
  }

  return Sentry.Handlers.errorHandler()
}

/**
 * Express middleware for performance tracing
 * Attaches Sentry tracing handler
 */
function tracingHandler() {
  if (!initialized || !Sentry) {
    return (req, res, next) => next()
  }

  return Sentry.Handlers.tracingHandler()
}

/**
 * Start a performance transaction
 * 
 * @param {string} name - Transaction name
 * @param {string} op - Operation type (e.g., 'http.server', 'db.query')
 * @returns {Object|null} Transaction object
 */
function startTransaction(name, op) {
  if (!initialized || !Sentry) {
    return null
  }

  return Sentry.startTransaction({ name, op })
}

/**
 * Create a span for performance tracking
 * 
 * @param {Object} transaction - Parent transaction
 * @param {string} op - Operation name
 * @param {string} description - Description
 * @returns {Object|null} Span object
 */
function startSpan(transaction, op, description) {
  if (!initialized || !Sentry || !transaction) {
    return null
  }

  return transaction.startChild({ op, description })
}

/**
 * Flush pending events (useful before shutdown)
 * 
 * @param {number} timeout - Timeout in milliseconds (default: 2000)
 * @returns {Promise<boolean>} True if successful
 */
async function flush(timeout = 2000) {
  if (!initialized || !Sentry) {
    return true
  }

  try {
    await Sentry.flush(timeout)
    return true
  } catch (err) {
    logger.error({ err }, '[ErrorTracking] Failed to flush Sentry events')
    return false
  }
}

/**
 * Get Sentry instance (for advanced usage)
 * @returns {Object|null} Sentry instance or null if not initialized
 */
function getSentry() {
  return Sentry
}

/**
 * Check if error tracking is enabled
 * @returns {boolean}
 */
function isEnabled() {
  return initialized && Sentry !== null
}

module.exports = {
  init,
  captureError,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  requestHandler,
  errorHandler,
  tracingHandler,
  startTransaction,
  startSpan,
  flush,
  getSentry,
  isEnabled,
}
