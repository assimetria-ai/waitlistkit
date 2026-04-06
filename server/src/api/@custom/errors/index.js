const crypto = require('crypto')
const express = require('express')
const router = express.Router()
const { authenticate, requireAdmin } = require('../../../lib/@system/Helpers/auth')
const ErrorEventRepo = require('../../../db/repos/@custom/ErrorEventRepo')

function timingSafeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  const maxLen = Math.max(bufA.length, bufB.length)
  const paddedA = Buffer.alloc(maxLen)
  const paddedB = Buffer.alloc(maxLen)
  bufA.copy(paddedA)
  bufB.copy(paddedB)
  return crypto.timingSafeEqual(paddedA, paddedB) && bufA.length === bufB.length
}

// GET /api/errors/stats
router.get('/errors/stats', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { environment } = req.query
    const stats = await ErrorEventRepo.getStats(environment || null)
    res.json({ stats })
  } catch (err) {
    next(err)
  }
})

// GET /api/errors
router.get('/errors', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status, level, environment, limit = '50', offset = '0' } = req.query
    const [events, total] = await Promise.all([
      ErrorEventRepo.findAll({ status, level, environment, limit: parseInt(limit), offset: parseInt(offset) }),
      ErrorEventRepo.count({ status, level, environment }),
    ])
    res.json({ events, total })
  } catch (err) {
    next(err)
  }
})

// GET /api/errors/:id
router.get('/errors/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const event = await ErrorEventRepo.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Error event not found' })
    res.json({ event })
  } catch (err) {
    next(err)
  }
})

// POST /api/errors  — ingest an error event (SDK/webhook endpoint)
// Uses a shared DSN secret instead of user auth for flexibility
router.post('/errors', async (req, res, next) => {
  try {
    const dsn = req.headers['x-sentry-dsn'] ?? req.headers['x-error-dsn']
    const expectedDsn = process.env.ERROR_TRACKING_DSN
    if (!expectedDsn || !timingSafeCompare(dsn ?? '', expectedDsn)) {
      return res.status(401).json({ message: 'Invalid DSN' })
    }

    const { fingerprint, title, message, level, platform, environment, release, stack_trace, extra } = req.body
    if (!fingerprint || !title) {
      return res.status(400).json({ message: 'fingerprint and title are required' })
    }

    const event = await ErrorEventRepo.upsertByFingerprint({
      fingerprint,
      title,
      message,
      level,
      platform,
      environment,
      release,
      stack_trace,
      extra,
    })

    res.status(201).json({ event })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/errors/:id/status
router.patch('/errors/:id/status', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body
    const allowed = ['unresolved', 'resolved', 'ignored']
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${allowed.join(', ')}` })
    }
    const event = await ErrorEventRepo.updateStatus(req.params.id, status)
    if (!event) return res.status(404).json({ message: 'Error event not found' })
    res.json({ event })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/errors/:id — soft delete
router.delete('/errors/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const event = await ErrorEventRepo.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Error event not found' })
    const deleted = await ErrorEventRepo.softDelete(event.id)
    res.json({ message: 'Error event deleted', event: deleted })
  } catch (err) {
    next(err)
  }
})

// GET /api/errors/deleted — list soft-deleted error events (admin only)
router.get('/errors/deleted', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { limit = '50', offset = '0' } = req.query
    const events = await ErrorEventRepo.findDeleted({ limit: parseInt(limit), offset: parseInt(offset) })
    res.json({ events })
  } catch (err) {
    next(err)
  }
})

// POST /api/errors/:id/restore — restore a soft-deleted error event
router.post('/errors/:id/restore', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const event = await ErrorEventRepo.findByIdIncludingDeleted(req.params.id)
    if (!event) return res.status(404).json({ message: 'Error event not found' })
    if (!event.deleted_at) return res.status(400).json({ message: 'Error event is not deleted' })
    const restored = await ErrorEventRepo.restore(event.id)
    res.json({ event: restored })
  } catch (err) {
    next(err)
  }
})

module.exports = router
