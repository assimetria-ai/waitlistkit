// @custom — File Sharing API
//
// POST   /api/files/:fileId/share           — share a file with an email
// GET    /api/files/:fileId/shares           — list shares for a file
// GET    /api/files/:fileId/access           — get emails with access to a file
// PATCH  /api/files/:fileId/visibility       — toggle public/private
// DELETE /api/files/shares/:shareId          — revoke a share
// PATCH  /api/files/shares/:shareId          — update share permission
// GET    /api/files/shared-with-me           — files shared with current user
// GET    /api/files/shared/:token            — access a file via share token (public)

'use strict'

const express = require('express')
const router = express.Router()
const { authenticate } = require('../../../lib/@system/Helpers/auth')
const FileUploadRepo = require('../../../db/repos/@custom/FileUploadRepo')
const FileShareRepo = require('../../../db/repos/@custom/FileShareRepo')
const S3 = require('../../../lib/@system/AWS/S3')
const logger = require('../../../lib/@system/Logger')
const { validate } = require('../../../lib/@system/Validation')
const {
  FileIdParams,
  ShareFileBody,
  UpdateShareBody,
  ShareIdParams,
  ShareTokenParams,
  UpdateVisibilityBody,
} = require('../../../lib/@custom/Validation/schemas/storage')

// ── POST /api/files/:fileId/share — share file with email ─────────────────────

router.post('/files/:fileId/share', authenticate, validate({ params: FileIdParams, body: ShareFileBody }), async (req, res, next) => {
  try {
    const fileId = req.params.fileId
    const { email, permission, expires_in_hours } = req.body

    // Verify file exists and user owns it
    const file = await FileUploadRepo.findById(fileId)
    if (!file) return res.status(404).json({ message: 'File not found' })
    if (file.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ message: 'Only the file owner can share' })
    }

    // Check if already shared with this email
    const existing = await FileShareRepo.hasAccess(fileId, { email })
    if (existing) {
      return res.status(409).json({ message: 'File already shared with this email', share: existing })
    }

    const expires_at = expires_in_hours
      ? new Date(Date.now() + expires_in_hours * 60 * 60 * 1000)
      : null

    const share = await FileShareRepo.create({
      file_id: fileId,
      shared_by: req.user.id,
      shared_with_email: email,
      permission,
      expires_at,
    })

    // Generate access_url from token
    const access_url = `/api/files/shared/${share.token}`

    // Update file's access_url if not set
    if (!file.access_url) {
      await FileUploadRepo.setAccessUrl(fileId, access_url)
    }

    logger.info({ userId: req.user.id, fileId, sharedWith: email }, 'file shared')

    return res.status(201).json({
      share: {
        id: share.id,
        file_id: share.file_id,
        shared_with_email: share.shared_with_email,
        permission: share.permission,
        token: share.token,
        access_url,
        expires_at: share.expires_at,
        created_at: share.created_at,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ── GET /api/files/:fileId/shares — list shares for a file ────────────────────

router.get('/files/:fileId/shares', authenticate, validate({ params: FileIdParams }), async (req, res, next) => {
  try {
    const fileId = req.params.fileId

    const file = await FileUploadRepo.findById(fileId)
    if (!file) return res.status(404).json({ message: 'File not found' })
    if (file.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    const shares = await FileShareRepo.findByFileId(fileId)

    return res.json({ shares })
  } catch (err) {
    next(err)
  }
})

// ── GET /api/files/:fileId/access — get emails with access ────────────────────

router.get('/files/:fileId/access', authenticate, validate({ params: FileIdParams }), async (req, res, next) => {
  try {
    const fileId = req.params.fileId

    const file = await FileUploadRepo.findById(fileId)
    if (!file) return res.status(404).json({ message: 'File not found' })
    if (file.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    const emailsWithAccess = await FileShareRepo.getEmailsWithAccess(fileId)

    return res.json({
      file_id: fileId,
      is_public: file.is_public,
      owner_id: file.user_id,
      emails_with_access: emailsWithAccess,
    })
  } catch (err) {
    next(err)
  }
})

// ── PATCH /api/files/:fileId/visibility — toggle public/private ───────────────

router.patch('/files/:fileId/visibility', authenticate, validate({ params: FileIdParams, body: UpdateVisibilityBody }), async (req, res, next) => {
  try {
    const fileId = req.params.fileId
    const { is_public } = req.body

    const file = await FileUploadRepo.findById(fileId)
    if (!file) return res.status(404).json({ message: 'File not found' })
    if (file.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    const updated = await FileUploadRepo.setPublic(fileId, is_public)
    logger.info({ userId: req.user.id, fileId, is_public }, 'file visibility updated')

    return res.json({
      file: {
        ...updated,
        public_url: is_public ? S3.getPublicUrl(updated.key, updated.bucket) : null,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ── DELETE /api/files/shares/:shareId — revoke a share ────────────────────────

router.delete('/files/shares/:shareId', authenticate, validate({ params: ShareIdParams }), async (req, res, next) => {
  try {
    const shareId = req.params.shareId

    // Verify user owns the file that was shared
    const share = await require('../../../lib/@system/PostgreSQL').oneOrNone(
      'SELECT fs.*, fu.user_id AS file_owner_id FROM file_shares fs JOIN file_uploads fu ON fu.id = fs.file_id WHERE fs.id = $1',
      [shareId],
    )
    if (!share) return res.status(404).json({ message: 'Share not found' })
    if (share.file_owner_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ message: 'Only the file owner can revoke shares' })
    }

    const revoked = await FileShareRepo.revoke(shareId)
    if (!revoked) return res.status(400).json({ message: 'Share already revoked' })

    logger.info({ userId: req.user.id, shareId, fileId: share.file_id }, 'share revoked')

    return res.json({ message: 'Share revoked', share: revoked })
  } catch (err) {
    next(err)
  }
})

// ── PATCH /api/files/shares/:shareId — update permission ──────────────────────

router.patch('/files/shares/:shareId', authenticate, validate({ params: ShareIdParams, body: UpdateShareBody }), async (req, res, next) => {
  try {
    const shareId = req.params.shareId
    const { permission } = req.body

    const share = await require('../../../lib/@system/PostgreSQL').oneOrNone(
      'SELECT fs.*, fu.user_id AS file_owner_id FROM file_shares fs JOIN file_uploads fu ON fu.id = fs.file_id WHERE fs.id = $1',
      [shareId],
    )
    if (!share) return res.status(404).json({ message: 'Share not found' })
    if (share.file_owner_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ message: 'Only the file owner can update shares' })
    }

    const updated = await FileShareRepo.updatePermission(shareId, permission)
    if (!updated) return res.status(400).json({ message: 'Share is revoked' })

    return res.json({ share: updated })
  } catch (err) {
    next(err)
  }
})

// ── GET /api/files/shared-with-me — files shared with current user ────────────

router.get('/files/shared-with-me', authenticate, async (req, res, next) => {
  try {
    const { limit = '50', offset = '0' } = req.query

    // Query by both email and user_id for maximum coverage
    const byEmail = req.user.email
      ? await FileShareRepo.findByEmail(req.user.email, {
          limit: parseInt(limit, 10),
          offset: parseInt(offset, 10),
        })
      : []

    const byUserId = await FileShareRepo.findByUserId(req.user.id, {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    })

    // De-duplicate by share ID
    const seen = new Set()
    const shares = [...byEmail, ...byUserId].filter((s) => {
      if (seen.has(s.id)) return false
      seen.add(s.id)
      return true
    })

    return res.json({ shares })
  } catch (err) {
    next(err)
  }
})

// ── GET /api/files/shared/:token — access file via share token (no auth) ──────

router.get('/files/shared/:token', validate({ params: ShareTokenParams }), async (req, res, next) => {
  try {
    const { token } = req.params

    const share = await FileShareRepo.findByToken(token)
    if (!share) return res.status(404).json({ message: 'Shared file not found or link expired' })

    // Return file metadata + public URL based on permission
    const publicUrl = S3.getPublicUrl(share.key, share.bucket)

    const response = {
      file: {
        id: share.file_id,
        filename: share.filename,
        content_type: share.content_type,
        size_bytes: share.size_bytes,
        is_public: share.is_public,
      },
      permission: share.permission,
      shared_by: share.shared_by,
      expires_at: share.expires_at,
    }

    // Only include URL for download/edit permissions or public files
    if (share.permission !== 'view' || share.is_public) {
      response.file.url = publicUrl
    }

    return res.json(response)
  } catch (err) {
    next(err)
  }
})

module.exports = router
