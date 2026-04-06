// @system — health check endpoint
// Returns 200 when the server + DB are healthy; 503 on degraded state.
// Internal component details (db/redis) are NOT exposed publicly to avoid
// leaking infrastructure topology to unauthenticated callers.
const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()
const db = require('../../../lib/@system/PostgreSQL')
const { isReady } = require('../../../lib/@system/Redis')

// Resolve version once at startup: prefer a VERSION file, fall back to package.json
function resolveVersion() {
  try {
    const versionFile = path.resolve(__dirname, '../../../../../../VERSION')
    return fs.readFileSync(versionFile, 'utf8').trim()
  } catch (_) {
    // Fall back to package.json version
    try {
      const pkg = require('../../../../../../package.json')
      return pkg.version || 'unknown'
    } catch (_) {
      return 'unknown'
    }
  }
}

const APP_VERSION = resolveVersion()

// GET /api/health
router.get('/health', async (_req, res) => {
  const checks = { server: 'ok', db: 'ok', redis: 'ok' }

  try {
    await db.one('SELECT 1')
  } catch (_err) {
    checks.db = 'error'
  }

  if (!isReady()) {
    checks.redis = 'unavailable'
  }

  const healthy = checks.db !== 'error'

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    db: healthy ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    uptime: Math.floor(process.uptime()),
    checks,
  })
})

// Reject non-GET methods explicitly before auth/csrf middleware intercepts
router.all('/health', (_req, res) => res.status(404).json({ message: 'Not found' }))

module.exports = router
