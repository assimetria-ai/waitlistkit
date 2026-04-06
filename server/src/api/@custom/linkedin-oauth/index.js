/**
 * @custom — LinkedIn OAuth routes
 *
 * Connects a user's LinkedIn account for publishing and analytics.
 * This is NOT for login (that's @system OAuth). This connects a LinkedIn
 * account to an already-authenticated user for content management.
 *
 * Routes:
 *   GET  /api/linkedin/connect           → Redirect to LinkedIn authorization page
 *   GET  /api/linkedin/callback          → Handle OAuth callback, store tokens
 *   GET  /api/linkedin/accounts          → List connected LinkedIn accounts
 *   POST /api/linkedin/accounts/:id/refresh → Manually refresh tokens
 *   DELETE /api/linkedin/accounts/:id    → Disconnect a LinkedIn account
 */

const express = require('express')
const crypto = require('crypto')
const router = express.Router()
const linkedin = require('../../../lib/@custom/OAuth/linkedin')
const LinkedInAccountRepo = require('../../../db/repos/@custom/LinkedInAccountRepo')
const { authenticate } = require('../../../lib/@system/Helpers/auth')
const logger = require('../../../lib/@system/Logger')
const { oauthLimiter } = require('../../../lib/@system/RateLimit')

function serverUrl() {
  const port = process.env.PORT ?? 4000
  return process.env.SERVER_URL ?? `http://localhost:${port}`
}

function appUrl() {
  return process.env.APP_URL ?? 'http://localhost:5173'
}

// ─── State management for CSRF protection ─────────────────────────────────────
// In-memory state store (for production, use Redis or DB)
const pendingStates = new Map()
const STATE_TTL_MS = 10 * 60 * 1000 // 10 minutes

function generateState(userId) {
  const state = crypto.randomBytes(32).toString('hex')
  pendingStates.set(state, { userId, createdAt: Date.now() })

  // Cleanup expired states
  for (const [key, val] of pendingStates) {
    if (Date.now() - val.createdAt > STATE_TTL_MS) {
      pendingStates.delete(key)
    }
  }
  return state
}

function validateAndConsumeState(state) {
  const entry = pendingStates.get(state)
  if (!entry) return null
  pendingStates.delete(state)
  if (Date.now() - entry.createdAt > STATE_TTL_MS) return null
  return entry.userId
}

// ─── Connect (initiate OAuth flow) ─────────────────────────────────────────────

router.get('/linkedin/connect', authenticate, oauthLimiter, (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  if (!clientId) {
    return res.status(501).json({ message: 'LinkedIn OAuth is not configured' })
  }

  const redirectUri = `${serverUrl()}/api/linkedin/callback`
  const state = generateState(req.user.id)

  const url = linkedin.getAuthUrl({ clientId, redirectUri, state })
  res.redirect(url)
})

// ─── Callback (exchange code for tokens) ────────────────────────────────────────

router.get('/linkedin/callback', oauthLimiter, async (req, res) => {
  const { code, error, state } = req.query

  if (error || !code) {
    logger.error({ error, state }, 'LinkedIn OAuth callback error')
    return res.redirect(`${appUrl()}/app/settings?linkedin=error&reason=access_denied`)
  }

  // Validate CSRF state
  if (!state) {
    logger.warn('LinkedIn OAuth callback missing state parameter')
    return res.redirect(`${appUrl()}/app/settings?linkedin=error&reason=invalid_state`)
  }

  const userId = validateAndConsumeState(state)
  if (!userId) {
    logger.warn({ state }, 'LinkedIn OAuth callback invalid or expired state')
    return res.redirect(`${appUrl()}/app/settings?linkedin=error&reason=invalid_state`)
  }

  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
    const redirectUri = `${serverUrl()}/api/linkedin/callback`

    // Exchange code for tokens
    const tokens = await linkedin.exchangeCode({ code, clientId, clientSecret, redirectUri })

    // Fetch user profile
    const userInfo = await linkedin.getUserInfo(tokens.access_token)

    // Calculate token expiry
    const tokenExpiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null

    // Store/update the LinkedIn account connection
    await LinkedInAccountRepo.upsert({
      userId,
      linkedinId: userInfo.sub,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      tokenExpiresAt,
      profileName: userInfo.name ?? null,
      profileUrl: `https://www.linkedin.com/in/${userInfo.sub}`,
      profileImage: userInfo.picture ?? null,
      headline: null, // userinfo endpoint doesn't return headline
    })

    logger.info({ userId, linkedinId: userInfo.sub }, 'LinkedIn account connected successfully')
    res.redirect(`${appUrl()}/app/settings?linkedin=connected`)
  } catch (err) {
    logger.error({ err, userId }, 'LinkedIn OAuth token exchange failed')
    res.redirect(`${appUrl()}/app/settings?linkedin=error&reason=token_exchange_failed`)
  }
})

// ─── List connected accounts ────────────────────────────────────────────────────

router.get('/linkedin/accounts', authenticate, async (req, res) => {
  try {
    const accounts = await LinkedInAccountRepo.findByUserId(req.user.id)
    res.json({ accounts })
  } catch (err) {
    logger.error({ err, userId: req.user.id }, 'Failed to fetch LinkedIn accounts')
    res.status(500).json({ message: 'Failed to fetch LinkedIn accounts' })
  }
})

// ─── Refresh tokens ─────────────────────────────────────────────────────────────

router.post('/linkedin/accounts/:id/refresh', authenticate, async (req, res) => {
  try {
    const accountId = parseInt(req.params.id, 10)

    // Fetch the account (with tokens) ensuring ownership
    const account = await LinkedInAccountRepo.findActiveByUserId(req.user.id)
    if (!account || account.id !== accountId) {
      return res.status(404).json({ message: 'LinkedIn account not found' })
    }

    if (!account.refresh_token) {
      return res.status(400).json({ message: 'No refresh token available. Please reconnect your LinkedIn account.' })
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET

    const tokens = await linkedin.refreshAccessToken({
      refreshToken: account.refresh_token,
      clientId,
      clientSecret,
    })

    const tokenExpiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null

    await LinkedInAccountRepo.updateTokens(accountId, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      tokenExpiresAt,
    })

    logger.info({ userId: req.user.id, accountId }, 'LinkedIn tokens refreshed')
    res.json({ message: 'Tokens refreshed successfully' })
  } catch (err) {
    logger.error({ err, userId: req.user.id }, 'LinkedIn token refresh failed')
    res.status(500).json({ message: 'Failed to refresh LinkedIn tokens. Please reconnect.' })
  }
})

// ─── Disconnect account ─────────────────────────────────────────────────────────

router.delete('/linkedin/accounts/:id', authenticate, async (req, res) => {
  try {
    const accountId = parseInt(req.params.id, 10)
    const result = await LinkedInAccountRepo.disconnect(accountId, req.user.id)

    if (!result) {
      return res.status(404).json({ message: 'LinkedIn account not found' })
    }

    logger.info({ userId: req.user.id, accountId }, 'LinkedIn account disconnected')
    res.json({ message: 'LinkedIn account disconnected', account: result })
  } catch (err) {
    logger.error({ err, userId: req.user.id }, 'Failed to disconnect LinkedIn account')
    res.status(500).json({ message: 'Failed to disconnect LinkedIn account' })
  }
})

module.exports = router
