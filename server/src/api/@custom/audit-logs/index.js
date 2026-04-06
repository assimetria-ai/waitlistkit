const express = require('express')
const router = express.Router()
const { authenticate, requireAdmin } = require('../../../lib/@system/Helpers/auth')
const AuditLogRepo = require('../../../db/repos/@custom/AuditLogRepo')

// GET /api/audit-logs
router.get('/audit-logs', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const {
      user_id,
      action,
      resource_type,
      resource_id,
      from,
      to,
      limit = '50',
      offset = '0',
    } = req.query

    const [logs, total] = await Promise.all([
      AuditLogRepo.findAll({
        user_id: user_id ? parseInt(user_id) : undefined,
        action,
        resource_type,
        resource_id,
        from,
        to,
        limit: parseInt(limit),
        offset: parseInt(offset),
      }),
      AuditLogRepo.count({
        user_id: user_id ? parseInt(user_id) : undefined,
        action,
        resource_type,
        resource_id,
        from,
        to,
      }),
    ])

    res.json({ logs, total })
  } catch (err) {
    next(err)
  }
})

// GET /api/audit-logs/:id
router.get('/audit-logs/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const log = await AuditLogRepo.findById(req.params.id)
    if (!log) return res.status(404).json({ message: 'Audit log entry not found' })
    res.json({ log })
  } catch (err) {
    next(err)
  }
})

// GET /api/audit-logs/resource/:type/:id
router.get('/audit-logs/resource/:type/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { limit = '50' } = req.query
    const logs = await AuditLogRepo.findByResource(req.params.type, req.params.id, { limit: parseInt(limit) })
    res.json({ logs })
  } catch (err) {
    next(err)
  }
})

// GET /api/audit-logs/user/:userId
router.get('/audit-logs/user/:userId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { limit = '50' } = req.query
    const logs = await AuditLogRepo.findByUser(parseInt(req.params.userId), { limit: parseInt(limit) })
    res.json({ logs })
  } catch (err) {
    next(err)
  }
})

// POST /api/audit-logs — internal ingestion (admin only)
router.post('/audit-logs', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { action, resource_type, resource_id, old_data, new_data, metadata } = req.body
    if (!action || !resource_type) {
      return res.status(400).json({ message: 'action and resource_type are required' })
    }

    const log = await AuditLogRepo.create({
      user_id: req.user?.id ?? null,
      actor_email: req.user?.email ?? null,
      action,
      resource_type,
      resource_id,
      old_data,
      new_data,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      metadata,
    })

    res.status(201).json({ log })
  } catch (err) {
    next(err)
  }
})

module.exports = router
