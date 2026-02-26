// @system — Email API
// Admin-only endpoints for sending test emails and inspecting email-service health.
//
// POST /api/email/test          — send a test email to the authenticated admin
// GET  /api/email/provider      — return active transport/provider info
// GET  /api/email/verify        — verify connectivity to the active email provider
// GET  /api/email/quota         — SES sending quota (ses provider only)

'use strict'

const express = require('express')
const router = express.Router()
const { authenticate, requireAdmin } = require('../../../lib/@system/Helpers/auth')
const Email = require('../../../lib/@system/Email')

// ── GET /api/email/provider ───────────────────────────────────────────────────

router.get('/email/provider', authenticate, requireAdmin, (req, res) => {
  const { provider } = Email.getTransport()
  const from = process.env.EMAIL_FROM ?? process.env.SES_FROM_EMAIL ?? null
  const appUrl = process.env.APP_URL ?? null

  res.json({
    provider,
    from,
    appUrl,
    smtpHost: provider === 'smtp' ? (process.env.SMTP_HOST ?? null) : null,
    sesRegion: provider === 'ses' ? (process.env.AWS_REGION ?? null) : null,
  })
})

// ── GET /api/email/verify ─────────────────────────────────────────────────────

router.get('/email/verify', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { provider, smtpTransporter } = Email.getTransport()
    let result

    if (provider === 'resend') {
      const resendAdapter = require('../../../lib/@system/Email/adapters/resend')
      result = await resendAdapter.verify()
    } else if (provider === 'smtp') {
      const smtpAdapter = require('../../../lib/@system/Email/adapters/smtp')
      result = await smtpAdapter.verify(smtpTransporter)
    } else if (provider === 'ses') {
      // SES: attempt a lightweight SDK call (GetSendingQuota) as a connectivity check
      try {
        const SES = require('../../../lib/@system/AWS/SES')
        await SES.getSendingQuota()
        result = { valid: true }
      } catch (err) {
        result = { valid: false, reason: err.message }
      }
    } else {
      result = { valid: false, reason: 'No provider configured (console mode)' }
    }

    res.json({ provider, ...result })
  } catch (err) {
    next(err)
  }
})

// ── GET /api/email/quota ──────────────────────────────────────────────────────

router.get('/email/quota', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { provider } = Email.getTransport()
    if (provider !== 'ses') {
      return res.status(400).json({ message: 'Quota is only available for the ses provider' })
    }

    const SES = require('../../../lib/@system/AWS/SES')
    const quota = await SES.getSendingQuota()
    res.json({ quota })
  } catch (err) {
    next(err)
  }
})

// ── POST /api/email/test ──────────────────────────────────────────────────────

router.post('/email/test', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { template = 'notification', to } = req.body

    // Default recipient: the authenticated admin's own email
    const recipient = to ?? req.user?.email
    if (!recipient) {
      return res.status(400).json({ message: 'No recipient — pass { to: "email" } or ensure user has an email' })
    }

    const appName = process.env.APP_NAME ?? 'App'
    let result

    switch (template) {
      case 'verification':
        result = await Email.sendVerificationEmail({
          to: recipient,
          name: req.user?.name ?? 'Admin',
          token: 'test-token-000',
          userId: req.user?.id,
        })
        break

      case 'password_reset':
        result = await Email.sendPasswordResetEmail({
          to: recipient,
          name: req.user?.name ?? 'Admin',
          token: 'test-token-000',
          userId: req.user?.id,
        })
        break

      case 'welcome':
        result = await Email.sendWelcomeEmail({
          to: recipient,
          name: req.user?.name ?? 'Admin',
          userId: req.user?.id,
        })
        break

      case 'invitation':
        result = await Email.sendInvitationEmail({
          to: recipient,
          inviterName: req.user?.name ?? 'Admin',
          orgName: appName,
          token: 'test-token-000',
          userId: req.user?.id,
        })
        break

      case 'magic_link':
        result = await Email.sendMagicLinkEmail({
          to: recipient,
          name: req.user?.name ?? 'Admin',
          token: 'test-token-000',
          userId: req.user?.id,
        })
        break

      case 'notification':
      default:
        result = await Email.sendNotificationEmail({
          to: recipient,
          subject: `Test notification from ${appName}`,
          title: 'Email service is working',
          body: `This is a test email sent from the ${appName} admin panel to confirm your email service is configured correctly.`,
          ctaLabel: 'Go to dashboard',
          ctaUrl: process.env.APP_URL ?? 'http://localhost:5173',
          userId: req.user?.id,
        })
        break
    }

    res.json({
      success: true,
      to: recipient,
      template,
      messageId: result.messageId,
      provider: result.provider,
      devMode: result.devMode ?? false,
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
