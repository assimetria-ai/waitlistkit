// @custom — clip library API
// GET    /clips         — list clips (tag/type/search filter, pagination)
// GET    /clips/tags    — all distinct tags for the current user
// POST   /clips         — create a new clip record
// PATCH  /clips/:id     — update clip metadata (name, description, tags, color)
// DELETE /clips/:id     — soft-delete a clip
const express = require('express')
const router = express.Router()
const { authenticate } = require('../../../lib/@system/Helpers/auth')
const ClipRepo = require('../../../db/repos/@custom/ClipRepo')
const logger = require('../../../lib/@system/Logger')

// GET /clips/tags — must be before /:id to avoid param conflict
router.get('/clips/tags', authenticate, async (req, res, next) => {
  try {
    const tags = await ClipRepo.allTags(req.user.id)
    res.json({ tags })
  } catch (err) {
    next(err)
  }
})

// GET /clips
router.get('/clips', authenticate, async (req, res, next) => {
  try {
    const { type, search, limit = '50', offset = '0' } = req.query

    // tags param: comma-separated string → array
    const tags = req.query.tags
      ? String(req.query.tags).split(',').map((t) => t.trim()).filter(Boolean)
      : undefined

    const filters = {
      user_id: req.user.id,
      type: type || undefined,
      tags,
      search: search || undefined,
      limit: Math.min(parseInt(limit, 10) || 50, 100),
      offset: parseInt(offset, 10) || 0,
    }

    const [clips, total] = await Promise.all([
      ClipRepo.findAll(filters),
      ClipRepo.count(filters),
    ])

    res.json({ clips, total })
  } catch (err) {
    next(err)
  }
})

// POST /clips
router.post('/clips', authenticate, async (req, res, next) => {
  try {
    const { name, description, file_key, file_url, thumbnail_url, duration, size_bytes, mime_type, type, tags, color } = req.body

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'name is required' })
    }

    const VALID_TYPES = ['video', 'audio', 'image']
    if (type && !VALID_TYPES.includes(type)) {
      return res.status(400).json({ message: `type must be one of: ${VALID_TYPES.join(', ')}` })
    }

    const clip = await ClipRepo.create({
      user_id: req.user.id,
      name: String(name).trim(),
      description: description ?? null,
      file_key: file_key ?? null,
      file_url: file_url ?? null,
      thumbnail_url: thumbnail_url ?? null,
      duration: duration != null ? Number(duration) : null,
      size_bytes: size_bytes != null ? Number(size_bytes) : null,
      mime_type: mime_type ?? null,
      type: type ?? 'video',
      tags: Array.isArray(tags) ? tags.map(String) : [],
      color: color ?? null,
    })

    logger.info({ clipId: clip.id, userId: req.user.id }, 'clip created')
    res.status(201).json({ clip })
  } catch (err) {
    next(err)
  }
})

// PATCH /clips/:id
router.patch('/clips/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params
    const existing = await ClipRepo.findById(id)

    if (!existing) return res.status(404).json({ message: 'Clip not found' })
    if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' })
    }

    const { name, description, tags, color } = req.body
    const updated = await ClipRepo.update(id, {
      name: name !== undefined ? String(name).trim() : undefined,
      description: description !== undefined ? description : undefined,
      tags: Array.isArray(tags) ? tags.map(String) : undefined,
      color: color !== undefined ? color : undefined,
    })

    logger.info({ clipId: id, userId: req.user.id }, 'clip updated')
    res.json({ clip: updated })
  } catch (err) {
    next(err)
  }
})

// DELETE /clips/:id
router.delete('/clips/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params
    const existing = await ClipRepo.findById(id)

    if (!existing) return res.status(404).json({ message: 'Clip not found' })
    if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' })
    }

    await ClipRepo.softDelete(id)
    logger.info({ clipId: id, userId: req.user.id }, 'clip deleted')
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
