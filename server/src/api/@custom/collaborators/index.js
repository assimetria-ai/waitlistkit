// @custom — collaborators management API
// GET    /collaborators           — list all collaborators
// POST   /collaborators           — invite a new collaborator
// PATCH  /collaborators/:id/role  — update collaborator role
// DELETE /collaborators/:id       — remove collaborator
const express = require('express')
const router = express.Router()
const { authenticate } = require('../../../lib/@system/Helpers/auth')
const { generateInviteToken } = require('../../../lib/@system/Helpers/tokens')
const CollaboratorRepo = require('../../../db/repos/@custom/CollaboratorRepo')
const logger = require('../../../lib/@system/Logger')
const { validate } = require('../../../lib/@system/Validation')
const {
  ListCollaboratorsQuery,
  InviteCollaboratorBody,
  UpdateCollaboratorRoleBody,
  CollaboratorIdParams,
  PaginationQuery,
} = require('../../../lib/@custom/Validation/schemas/collaborators')

const VALID_ROLES = ['admin', 'member', 'viewer']

// GET /collaborators — list collaborators (filtered by ownership)
// SECURITY: Only return collaborators invited by the current user
// Admins can see all collaborators by passing ?all=true
router.get('/collaborators', authenticate, validate({ query: ListCollaboratorsQuery }), async (req, res, next) => {
  try {
    const { status, role, limit, offset, all } = req.query
    const isAdmin = req.user.role === 'admin'
    
    // SECURITY: Regular users can only see their own invited collaborators
    // Admins can see all if ?all=true is passed
    const invited_by = (isAdmin && all === 'true') ? undefined : req.user.id
    
    const collaborators = await CollaboratorRepo.findAll({
      invited_by,
      status: status || undefined,
      role: role || undefined,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    })
    const total = await CollaboratorRepo.count({
      invited_by,
      status: status || undefined,
      role: role || undefined,
    })
    res.json({ collaborators, total })
  } catch (err) {
    next(err)
  }
})

// POST /collaborators — invite a collaborator by email
router.post('/collaborators', authenticate, validate({ body: InviteCollaboratorBody }), async (req, res, next) => {
  try {
    const { email, role, name } = req.body

    const existing = await CollaboratorRepo.findByEmail(email)
    if (existing && existing.status !== 'revoked') {
      return res.status(409).json({ message: 'A collaborator with this email already exists' })
    }

    const invite_token = generateInviteToken()

    let collaborator
    if (existing && existing.status === 'revoked') {
      // Re-invite a previously revoked collaborator
      collaborator = await CollaboratorRepo.create({
        email: email.toLowerCase(),
        name: name ?? existing.name ?? null,
        role,
        invited_by: req.user.id,
        invite_token,
      })
    } else {
      collaborator = await CollaboratorRepo.create({
        email: email.toLowerCase(),
        name: name ?? null,
        role,
        invited_by: req.user.id,
        invite_token,
      })
    }

    logger.info(
      { collaboratorId: collaborator.id, email, role, invitedBy: req.user.id },
      'collaborator invited'
    )

    res.status(201).json({ collaborator, invite_token })
  } catch (err) {
    next(err)
  }
})

// PATCH /collaborators/:id/role — update a collaborator's role
// SECURITY: Only allow updating collaborators invited by the current user
// Admins can update any collaborator
router.patch('/collaborators/:id/role', authenticate, validate({ params: CollaboratorIdParams, body: UpdateCollaboratorRoleBody }), async (req, res, next) => {
  try {
    const { id } = req.params
    const { role } = req.body
    const isAdmin = req.user.role === 'admin'

    const collaborator = await CollaboratorRepo.findById(id)
    if (!collaborator) return res.status(404).json({ message: 'Collaborator not found' })
    
    // SECURITY: Check ownership - user must have invited this collaborator (unless admin)
    if (!isAdmin && collaborator.invited_by !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only update collaborators you invited' })
    }
    
    if (collaborator.status === 'revoked') {
      return res.status(400).json({ message: 'Cannot update role of a revoked collaborator' })
    }

    const updated = await CollaboratorRepo.updateRole(id, role)
    logger.info({ collaboratorId: id, role, updatedBy: req.user.id }, 'collaborator role updated')

    res.json({ collaborator: updated })
  } catch (err) {
    next(err)
  }
})

// DELETE /collaborators/:id — soft delete (revoke + mark deleted)
// SECURITY: Only allow deleting collaborators invited by the current user
// Admins can delete any collaborator
router.delete('/collaborators/:id', authenticate, validate({ params: CollaboratorIdParams }), async (req, res, next) => {
  try {
    const { id } = req.params
    const isAdmin = req.user.role === 'admin'

    const collaborator = await CollaboratorRepo.findById(id)
    if (!collaborator) return res.status(404).json({ message: 'Collaborator not found' })
    
    // SECURITY: Check ownership - user must have invited this collaborator (unless admin)
    if (!isAdmin && collaborator.invited_by !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only delete collaborators you invited' })
    }

    const deleted = await CollaboratorRepo.softDelete(id)
    logger.info({ collaboratorId: id, removedBy: req.user.id }, 'collaborator soft-deleted')

    res.json({ collaborator: deleted })
  } catch (err) {
    next(err)
  }
})

// GET /collaborators/deleted — list soft-deleted collaborators
// SECURITY: Only return deleted collaborators invited by the current user
// Admins can see all deleted collaborators
router.get('/collaborators/deleted', authenticate, validate({ query: PaginationQuery }), async (req, res, next) => {
  try {
    const { limit, offset } = req.query
    const isAdmin = req.user.role === 'admin'
    
    // SECURITY: Regular users can only see their own deleted collaborators
    const invited_by = isAdmin ? undefined : req.user.id
    
    const collaborators = await CollaboratorRepo.findDeleted({
      invited_by,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    })
    res.json({ collaborators })
  } catch (err) {
    next(err)
  }
})

// POST /collaborators/:id/restore — restore a soft-deleted collaborator
// SECURITY: Only allow restoring collaborators invited by the current user
// Admins can restore any collaborator
router.post('/collaborators/:id/restore', authenticate, validate({ params: CollaboratorIdParams }), async (req, res, next) => {
  try {
    const { id } = req.params
    const isAdmin = req.user.role === 'admin'

    const collaborator = await CollaboratorRepo.findByIdIncludingDeleted(id)
    if (!collaborator) return res.status(404).json({ message: 'Collaborator not found' })
    if (!collaborator.deleted_at) return res.status(400).json({ message: 'Collaborator is not deleted' })
    
    // SECURITY: Check ownership - user must have invited this collaborator (unless admin)
    if (!isAdmin && collaborator.invited_by !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only restore collaborators you invited' })
    }

    const restored = await CollaboratorRepo.restore(id)
    logger.info({ collaboratorId: id, restoredBy: req.user.id }, 'collaborator restored')

    res.json({ collaborator: restored })
  } catch (err) {
    next(err)
  }
})

module.exports = router
