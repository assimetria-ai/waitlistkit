const express = require('express')
const compression = require('compression')
const cookieParser = require('cookie-parser')
const path = require('path')
const fs = require('fs')
const pinoHttp = require('pino-http')
const morgan = require('morgan')

const logger = require('./lib/@system/Logger')
const { cors, csrf, securityHeaders, attachDatabase } = require('./lib/@system/Middleware')
const { apiLimiter } = require('./lib/@system/RateLimit')
const systemRoutes = require('./routes/@system')
const customRoutes = require('./routes/@custom')

const app = express()

// Shallow health check endpoints registered before all middleware (including CORS) so
// that infrastructure load-balancer probes with no Origin header bypass CORS.
// These return 200 immediately WITHOUT checking the database.
//
// - /health  : standard REST convention (load-balancer / uptime monitors)
// - /healthz : Kubernetes/GKE convention
//
// /api/health is intentionally NOT listed here — it is handled by the health route
// (api/@system/health) which queries the DB and returns 503 when it is unreachable.
// Railway uses /api/health as its healthcheckPath (railway.json) so Railway will
// detect DB failures and stop routing traffic to a broken instance.
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }))
app.get('/healthz', (_req, res) => res.status(200).json({ status: 'ok' }))

app.use(securityHeaders)
app.use(cors)
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())
app.use(csrf)

if (process.env.NODE_ENV === 'production') {
  // Structured JSON HTTP request logging (ingested by log aggregator)
  app.use(pinoHttp({ logger }))
} else if (process.env.NODE_ENV !== 'test') {
  // Human-readable HTTP request logging for development
  app.use(morgan('dev'))
}

// General rate limiting for all API routes (baseline DoS protection)
app.use('/api', apiLimiter)

// Attach database repositories to req.db for routes that need them
app.use('/api', attachDatabase)

// Routes
app.use('/api', systemRoutes)
app.use('/api', customRoutes)

// API 404 catch-all (only for /api routes)
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Not found' })
})

// robots.txt — must be served before the SPA catch-all
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send('User-agent: *\nAllow: /\n')
})

// Serve client static files in production
const clientDistDir = path.resolve(__dirname, '../../client/dist')
if (fs.existsSync(clientDistDir)) {
  app.use(express.static(clientDistDir))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistDir, 'index.html'))
  })
} else {
  app.get('*', (_req, res) => {
    res.status(503).type('text').send('Client not built yet. Run: cd client && npm run build')
  })
}

// Error handler
app.use((err, req, res, _next) => {
  logger.error({ err, req: { method: req.method, url: req.url } }, err.message ?? 'Internal server error')

  // Stripe SDK errors have a `type` field (e.g. StripeCardError, StripeInvalidRequestError).
  // Never expose raw Stripe messages to clients — they contain internal details such as
  // price/customer IDs, live-vs-test mode hints, and API key hints.
  if (err.type && err.type.startsWith('Stripe')) {
    const status = err.statusCode ?? 400

    // Card errors carry a user-safe decline message (e.g. "Your card has insufficient funds.")
    if (err.type === 'StripeCardError') {
      return res.status(status).json({ message: err.message ?? 'Your card was declined. Please check your payment details.' })
    }

    // Authentication errors mean a misconfigured API key — generic message for users
    if (err.type === 'StripeAuthenticationError') {
      return res.status(500).json({ message: 'Payment service is temporarily unavailable. Please try again later.' })
    }

    // Rate limit — tell the user to slow down
    if (err.type === 'StripeRateLimitError') {
      return res.status(429).json({ message: 'Too many requests. Please wait a moment and try again.' })
    }

    // All other Stripe errors (StripeInvalidRequestError, StripeAPIError, StripeConnectionError, etc.)
    return res.status(status >= 400 && status < 600 ? status : 400).json({
      message: 'Something went wrong with the payment service. Please try again or contact support.',
    })
  }

  const status = err.status ?? err.statusCode ?? 500
  const safeMessage = (err.message ?? 'Internal server error').replace(/\/(?:Users|home)\/[^\s/]+(?:\/[^\s]*)*/g, '[path]')
  res.status(status).json({ message: safeMessage })
})

module.exports = app
