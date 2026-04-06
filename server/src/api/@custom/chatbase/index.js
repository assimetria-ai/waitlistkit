const express = require('express')
const router = express.Router()
const { authenticate } = require('../../../lib/@system/Helpers/auth')
const ChatbaseRepo = require('../../../db/repos/@custom/ChatbaseRepo')

// GET /api/chatbase/settings — fetch current user's Chatbase settings
router.get('/chatbase/settings', authenticate, async (req, res, next) => {
  try {
    const settings = await ChatbaseRepo.findByUserId(req.user.id)
    // Never expose the raw api_key in responses — mask it
    if (settings && settings.api_key) {
      settings.api_key_set = true
      settings.api_key = settings.api_key.slice(0, 6) + '••••••••'
    } else if (settings) {
      settings.api_key_set = false
    }
    res.json({ settings: settings ?? null })
  } catch (err) {
    next(err)
  }
})

// POST /api/chatbase/settings — save/update Chatbase integration settings
router.post('/chatbase/settings', authenticate, async (req, res, next) => {
  try {
    const { chatbot_id, api_key, config } = req.body

    if (chatbot_id !== undefined && typeof chatbot_id !== 'string') {
      return res.status(400).json({ message: 'chatbot_id must be a string' })
    }

    // Fetch existing settings so we can preserve the stored api_key if not re-submitted
    const existing = await ChatbaseRepo.findByUserId(req.user.id)
    const resolvedApiKey =
      api_key !== undefined && api_key !== ''
        ? api_key
        : existing?.api_key ?? ''

    const settings = await ChatbaseRepo.upsert(req.user.id, {
      chatbot_id: chatbot_id ?? existing?.chatbot_id ?? '',
      api_key: resolvedApiKey,
      config: config ?? existing?.config ?? {},
    })

    // Mask api_key before returning
    settings.api_key_set = Boolean(settings.api_key)
    settings.api_key = settings.api_key
      ? settings.api_key.slice(0, 6) + '••••••••'
      : ''

    res.json({ settings })
  } catch (err) {
    next(err)
  }
})

// POST /api/chatbase/test — verify the Chatbase chatbot ID is reachable
router.post('/chatbase/test', authenticate, async (req, res, next) => {
  try {
    const { chatbot_id } = req.body
    if (!chatbot_id || typeof chatbot_id !== 'string' || !chatbot_id.trim()) {
      return res.status(400).json({ message: 'chatbot_id is required' })
    }

    // Chatbase embed URL pattern — check reachability via HEAD request
    const embedUrl = `https://www.chatbase.co/chatbot-iframe/${chatbot_id.trim()}`
    let reachable = false
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const probe = await fetch(embedUrl, { method: 'HEAD', signal: controller.signal })
      clearTimeout(timeout)
      reachable = probe.ok || probe.status === 405
    } catch (_) {
      reachable = false
    }

    if (!reachable) {
      return res.status(422).json({
        ok: false,
        message: `Could not reach Chatbase chatbot "${chatbot_id}". Double-check the chatbot ID.`,
      })
    }

    res.json({ ok: true, message: 'Chatbot reachable — connection OK' })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/chatbase/settings — remove integration
router.delete('/chatbase/settings', authenticate, async (req, res, next) => {
  try {
    await ChatbaseRepo.delete(req.user.id)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
