// @custom — teams management API
// Handles workspace/team creation, member management, and team switching

const express = require('express')
const router = express.Router()
const { authenticate } = require('../../../lib/@system/Helpers/auth')
const { generateInviteToken } = require('../../../lib/@system/Helpers/tokens')
const TeamRepo = require('../../../db/repos/@custom/TeamRepo')
const PermissionRepo = require('../../../db/repos/@custom/PermissionRepo')
const logger = require('../../../lib/@system/Logger')

// Middleware to check team permission
const requireTeamPermission = (permission) => async (req, res, next) => {
  try {
    const team_id = parseInt(req.params.team_id || req.params.id, 10)
    const hasPermission = await PermissionRepo.checkUserPermission(req.user.id, permission, team_id)
    
    if (!hasPermission) {
      return res.status(403).json({ message: `Missing permission: ${permission}` })
    }
    
    next()
  } catch (err) {
    next(err)
  }
}

// ─── Teams ────────────────────────────────────────────────────────────────────

// GET /teams — list teams the user belongs to
router.get('/teams', authenticate, async (req, res, next) => {
  try {
    const teams = await TeamRepo.findMembersByUser(req.user.id)
    res.json({ teams })
  } catch (err) {
    next(err)
  }
})

// POST /teams — create a new team
router.post('/teams', authenticate, async (req, res, next) => {
  try {
    const { name, description, avatar_url } = req.body

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Team name is required' })
    }

    // Generate URL-friendly slug
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    
    // Ensure slug uniqueness
    let slug = baseSlug
    let counter = 1
    while (await TeamRepo.findBySlug(slug)) {
      slug = `${baseSlug}-${counter++}`
    }

    const team = await TeamRepo.create({
      name: name.trim(),
      slug,
      description: description?.trim(),
      avatar_url,
      owner_id: req.user.id,
    })

    // Add creator as owner member
    await TeamRepo.addMember({
      team_id: team.id,
      user_id: req.user.id,
      role: 'owner',
    })

    logger.info({ teamId: team.id, userId: req.user.id, slug }, 'team created')
    res.status(201).json({ team })
  } catch (err) {
    next(err)
  }
})

// GET /teams/:id — get team details
router.get('/teams/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params
    const team = await TeamRepo.findById(id)

    if (!team) {
      return res.status(404).json({ message: 'Team not found' })
    }

    // Check if user is a member
    const member = await TeamRepo.findMember(team.id, req.user.id)
    if (!member) {
      return res.status(403).json({ message: 'You are not a member of this team' })
    }

    // Get member count
    const member_count = await TeamRepo.countMembers(team.id)

    res.json({ team: { ...team, member_count, my_role: member.role } })
  } catch (err) {
    next(err)
  }
})

// PATCH /teams/:id — update team details
router.patch('/teams/:id', authenticate, requireTeamPermission('team.settings.manage'), async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, description, avatar_url, settings } = req.body

    const team = await TeamRepo.update(id, {
      name,
      description,
      avatar_url,
      settings,
    })

    logger.info({ teamId: id, updatedBy: req.user.id }, 'team updated')
    res.json({ team })
  } catch (err) {
    next(err)
  }
})

// DELETE /teams/:id — soft delete team
router.delete('/teams/:id', authenticate, requireTeamPermission('team.delete'), async (req, res, next) => {
  try {
    const { id } = req.params

    const team = await TeamRepo.softDelete(id)
    logger.info({ teamId: id, deletedBy: req.user.id }, 'team soft-deleted')

    res.json({ team })
  } catch (err) {
    next(err)
  }
})

// ─── Team Members ─────────────────────────────────────────────────────────────

// GET /teams/:team_id/members — list team members
router.get('/teams/:team_id/members', authenticate, requireTeamPermission('members.view'), async (req, res, next) => {
  try {
    const { team_id } = req.params
    const { limit, offset } = req.query

    const members = await TeamRepo.findMembersByTeam(team_id, {
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0,
    })

    const total = await TeamRepo.countMembers(team_id)

    res.json({ members, total })
  } catch (err) {
    next(err)
  }
})

// DELETE /teams/:team_id/members/:user_id — remove member
router.delete('/teams/:team_id/members/:user_id', authenticate, requireTeamPermission('members.remove'), async (req, res, next) => {
  try {
    const { team_id, user_id } = req.params

    // Prevent removing the last owner
    const member = await TeamRepo.findMember(team_id, user_id)
    if (member && member.role === 'owner') {
      const members = await TeamRepo.findMembersByTeam(team_id)
      const ownerCount = members.filter((m) => m.role === 'owner').length
      
      if (ownerCount <= 1) {
        return res.status(400).json({ message: 'Cannot remove the last owner. Transfer ownership first.' })
      }
    }

    await TeamRepo.removeMember(team_id, user_id)
    logger.info({ teamId: team_id, userId: user_id, removedBy: req.user.id }, 'team member removed')

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// PATCH /teams/:team_id/members/:user_id/role — update member role
router.patch('/teams/:team_id/members/:user_id/role', authenticate, requireTeamPermission('members.roles.edit'), async (req, res, next) => {
  try {
    const { team_id, user_id } = req.params
    const { role } = req.body

    const validRoles = ['owner', 'admin', 'member', 'viewer']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` })
    }

    const member = await TeamRepo.updateMemberRole(team_id, user_id, role)
    logger.info({ teamId: team_id, userId: user_id, role, updatedBy: req.user.id }, 'team member role updated')

    res.json({ member })
  } catch (err) {
    next(err)
  }
})

// ─── Team Invitations ─────────────────────────────────────────────────────────

// GET /teams/:team_id/invitations — list team invitations
router.get('/teams/:team_id/invitations', authenticate, requireTeamPermission('members.view'), async (req, res, next) => {
  try {
    const { team_id } = req.params
    const { status, limit, offset } = req.query

    const invitations = await TeamRepo.findInvitationsByTeam(team_id, {
      status,
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0,
    })

    res.json({ invitations })
  } catch (err) {
    next(err)
  }
})

// POST /teams/:team_id/invitations — invite member to team
router.post('/teams/:team_id/invitations', authenticate, requireTeamPermission('members.invite'), async (req, res, next) => {
  try {
    const { team_id } = req.params
    const { email, name, role = 'member' } = req.body

    if (!email || email.trim().length === 0) {
      return res.status(400).json({ message: 'Email is required' })
    }

    const validRoles = ['admin', 'member', 'viewer']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` })
    }

    // Check if user is already a member
    const { db } = require('../../../db')
    const existingUser = await db.oneOrNone('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])
    if (existingUser) {
      const existingMember = await TeamRepo.findMember(team_id, existingUser.id)
      if (existingMember) {
        return res.status(409).json({ message: 'User is already a team member' })
      }
    }

    const invite_token = generateInviteToken()

    const invitation = await TeamRepo.createInvitation({
      team_id,
      email: email.toLowerCase(),
      name: name?.trim(),
      role,
      invite_token,
      invited_by: req.user.id,
    })

    logger.info(
      { teamId: team_id, email, role, invitedBy: req.user.id },
      'team invitation created'
    )

    res.status(201).json({ invitation, invite_token })
  } catch (err) {
    next(err)
  }
})

// POST /teams/invitations/:token/accept — accept team invitation
router.post('/teams/invitations/:token/accept', authenticate, async (req, res, next) => {
  try {
    const { token } = req.params

    const invitation = await TeamRepo.findInvitationByToken(token)

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' })
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: `Invitation has already been ${invitation.status}` })
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await TeamRepo.expireInvitations()
      return res.status(400).json({ message: 'Invitation has expired' })
    }

    if (invitation.email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ message: 'This invitation was sent to a different email address' })
    }

    const accepted = await TeamRepo.acceptInvitation(token, req.user.id)

    logger.info(
      { teamId: invitation.team_id, userId: req.user.id, invitationId: invitation.id },
      'team invitation accepted'
    )

    res.json({ invitation: accepted, team: { id: invitation.team_id, name: invitation.team_name, slug: invitation.team_slug } })
  } catch (err) {
    next(err)
  }
})

// DELETE /teams/:team_id/invitations/:token — revoke invitation
router.delete('/teams/:team_id/invitations/:token', authenticate, requireTeamPermission('members.invite'), async (req, res, next) => {
  try {
    const { token } = req.params

    const invitation = await TeamRepo.revokeInvitation(token)
    logger.info({ invitationId: invitation.id, revokedBy: req.user.id }, 'team invitation revoked')

    res.json({ invitation })
  } catch (err) {
    next(err)
  }
})

// ─── User Permissions ─────────────────────────────────────────────────────────

// GET /teams/:team_id/permissions/me — get my permissions in this team
router.get('/teams/:team_id/permissions/me', authenticate, async (req, res, next) => {
  try {
    const { team_id } = req.params

    const permissions = await PermissionRepo.getAllPermissionsForUser(req.user.id, team_id)
    const member = await TeamRepo.findMember(team_id, req.user.id)

    res.json({ permissions, role: member?.role })
  } catch (err) {
    next(err)
  }
})

module.exports = router
