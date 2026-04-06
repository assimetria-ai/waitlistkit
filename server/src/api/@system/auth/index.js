// @system — auth API (aliases to sessions for backward compatibility)
// POST   /api/auth/register         — create account
// POST   /api/sessions/register     — alias for /api/auth/register (QA journey path, legacy clients)
// POST   /api/auth/login            — login
// GET    /api/auth/me               — current user
// POST   /api/auth/forgot-password  — request password reset
// POST   /api/auth/reset-password   — reset password with token
const express = require('express')
const router = express.Router()
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const { authenticate, extractAccessToken } = require('../../../lib/@system/Helpers/auth')
const UserRepo = require('../../../db/repos/@system/UserRepo')
const RefreshTokenRepo = require('../../../db/repos/@system/RefreshTokenRepo')
const { signAccessTokenAsync } = require('../../../lib/@system/Helpers/jwt')
const { loginLimiter, registerLimiter } = require('../../../lib/@system/RateLimit')
const { validate } = require('../../../lib/@system/Validation')
const { LoginBody, RegisterBody } = require('../../../lib/@system/Validation/schemas/@system/sessions')
const {
  MAX_ATTEMPTS,
  getLockoutSecondsRemaining,
  incrementFailedAttempts,
  getFailedAttemptCount,
  clearFailedAttempts,
} = require('../../../lib/@system/AccountLockout')

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

function setAccessCookie(res, token) {
  res.cookie('access_token', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ACCESS_TOKEN_TTL_MS,
    path: '/',
  })
}

function setRefreshCookie(res, token) {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: REFRESH_TOKEN_TTL_MS,
    path: '/api/sessions',
  })
}

// POST /api/auth/register
// POST /api/sessions/register — alias (QA journey path, legacy clients)
async function handleRegister(req, res, next) {
  try {
    const { email, password, name } = req.body

    const normalizedEmail = email.toLowerCase()

    const existing = await UserRepo.findByEmail(normalizedEmail)
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' })
    }

    const password_hash = await bcrypt.hash(password, 12)
    const user = await UserRepo.create({ email: normalizedEmail, name: name || null, password_hash })

    const accessToken = await signAccessTokenAsync({ userId: user.id })
    const { token: refreshToken } = await RefreshTokenRepo.create({ userId: user.id })

    setAccessCookie(res, accessToken)
    setRefreshCookie(res, refreshToken)

    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name } })
  } catch (err) {
    next(err)
  }
}
router.post('/auth/register', registerLimiter, validate({ body: RegisterBody }), handleRegister)
router.post('/sessions/register', registerLimiter, validate({ body: RegisterBody }), handleRegister)

// POST /api/auth/login
router.post('/auth/login', loginLimiter, validate({ body: LoginBody }), async (req, res, next) => {
  try {
    const { email, password } = req.body
    const normalizedEmail = email.toLowerCase()

    const lockedFor = await getLockoutSecondsRemaining(normalizedEmail)
    if (lockedFor > 0) {
      const minutes = Math.ceil(lockedFor / 60)
      return res.status(429).json({
        message: `Account temporarily locked. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
        lockedFor,
      })
    }

    const user = await UserRepo.findByEmail(normalizedEmail)
    if (!user) {
      await incrementFailedAttempts(normalizedEmail)
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // OAuth-only users have no password_hash — reject gracefully instead of
    // letting bcrypt.compare throw on null (which causes a 500).
    if (!user.password_hash) {
      await incrementFailedAttempts(normalizedEmail)
      return res.status(401).json({ message: 'This account uses social login. Please sign in with Google or GitHub.' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      await incrementFailedAttempts(normalizedEmail)
      const count = await getFailedAttemptCount(normalizedEmail)
      const remaining = count !== null ? MAX_ATTEMPTS - count : null
      const extra =
        remaining !== null && remaining > 0 && remaining <= 2
          ? ` ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before account lockout.`
          : ''
      return res.status(401).json({ message: `Invalid credentials.${extra}` })
    }

    await clearFailedAttempts(normalizedEmail)

    const accessToken = await signAccessTokenAsync({ userId: user.id })
    const { token: refreshToken } = await RefreshTokenRepo.create({ userId: user.id })

    setAccessCookie(res, accessToken)
    setRefreshCookie(res, refreshToken)

    res.json({ user: { id: user.id, email: user.email, name: user.name } })
  } catch (err) {
    next(err)
  }
})

// GET /api/auth/me
router.get('/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user })
})

// POST /api/auth/forgot-password — generate reset token, store in DB, log link
router.post('/auth/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required' })

    // Always return success to prevent email enumeration
    const normalizedEmail = email.toLowerCase()
    const user = await UserRepo.findByEmail(normalizedEmail)

    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      const db = require('../../../lib/@system/PostgreSQL')
      await db.none(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at)
         VALUES ($1, $2, now() + INTERVAL '1 hour')`,
        [user.id, token],
      )
      // In production: send email with reset link containing ?token=<token>
      console.log(`[auth] Password reset token for ${normalizedEmail}: ${token}`)
    }

    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/reset-password — validate token, update password
router.post('/auth/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' })
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }

    const db = require('../../../lib/@system/PostgreSQL')
    const row = await db.oneOrNone(
      `SELECT id, user_id, used_at, expires_at
       FROM password_reset_tokens
       WHERE token = $1`,
      [token],
    )

    if (!row) return res.status(400).json({ message: 'Invalid or expired reset link' })
    if (row.used_at) return res.status(400).json({ message: 'This reset link has already been used' })
    if (new Date(row.expires_at) < new Date()) {
      return res.status(400).json({ message: 'This reset link has expired. Please request a new one.' })
    }

    const password_hash = await bcrypt.hash(password, 12)
    await db.tx(async (t) => {
      await t.none('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [
        password_hash,
        row.user_id,
      ])
      await t.none('UPDATE password_reset_tokens SET used_at = now() WHERE id = $1', [row.id])
    })

    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
