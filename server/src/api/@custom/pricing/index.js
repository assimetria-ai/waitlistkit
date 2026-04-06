const express = require('express')
const router = express.Router()
const { authenticate, requireAdmin } = require('../../../lib/@system/Helpers/auth')
const PricingPlanRepo = require('../../../db/repos/@custom/PricingPlanRepo')

// ── Public ────────────────────────────────────────────────────────────────────

// GET /api/pricing/plans — list active plans (public, no auth required)
router.get('/pricing/plans', async (req, res, next) => {
  try {
    const plans = await PricingPlanRepo.findActive()
    res.json({ plans })
  } catch (err) {
    next(err)
  }
})

// ── Admin ─────────────────────────────────────────────────────────────────────

// GET /api/admin/pricing/plans — list all plans (including inactive)
router.get('/admin/pricing/plans', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const plans = await PricingPlanRepo.findAll()
    res.json({ plans })
  } catch (err) {
    next(err)
  }
})

// POST /api/admin/pricing/plans — create a plan
router.post('/admin/pricing/plans', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const {
      name, slug, description,
      price_monthly, price_yearly, currency,
      features, limits,
      stripe_price_id_monthly, stripe_price_id_yearly,
      is_active, is_popular, sort_order,
    } = req.body

    if (!name || !slug || price_monthly == null || price_yearly == null) {
      return res.status(400).json({ message: 'name, slug, price_monthly and price_yearly are required' })
    }

    const plan = await PricingPlanRepo.create({
      name, slug, description,
      price_monthly, price_yearly, currency,
      features, limits,
      stripe_price_id_monthly, stripe_price_id_yearly,
      is_active, is_popular, sort_order,
    })
    res.status(201).json({ plan })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'A plan with that slug already exists' })
    }
    next(err)
  }
})

// PATCH /api/admin/pricing/plans/:id — update a plan
router.patch('/admin/pricing/plans/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const plan = await PricingPlanRepo.update(Number(req.params.id), req.body)
    if (!plan) return res.status(404).json({ message: 'Plan not found' })
    res.json({ plan })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'A plan with that slug already exists' })
    }
    next(err)
  }
})

// DELETE /api/admin/pricing/plans/:id — delete a plan
router.delete('/admin/pricing/plans/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const deleted = await PricingPlanRepo.delete(Number(req.params.id))
    if (!deleted) return res.status(404).json({ message: 'Plan not found' })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
