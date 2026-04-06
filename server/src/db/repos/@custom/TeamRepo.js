// @custom TeamRepo
// Data access layer for teams, team members, and team invitations

const { db } = require('../../index')

class TeamRepo {
  // ─── Teams ───────────────────────────────────────────────────────────────────

  async create({ name, slug, description, avatar_url, owner_id, settings = {} }) {
    return db.one(
      `INSERT INTO teams (name, slug, description, avatar_url, owner_id, settings)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, slug, description, avatar_url, owner_id, JSON.stringify(settings)]
    )
  }

  async findById(id) {
    return db.oneOrNone('SELECT * FROM teams WHERE id = $1 AND deleted_at IS NULL', [id])
  }

  async findBySlug(slug) {
    return db.oneOrNone('SELECT * FROM teams WHERE slug = $1 AND deleted_at IS NULL', [slug])
  }

  async findByOwnerId(owner_id) {
    return db.any('SELECT * FROM teams WHERE owner_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC', [owner_id])
  }

  async findAll({ limit = 50, offset = 0 } = {}) {
    return db.any(
      'SELECT * FROM teams WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    )
  }

  async update(id, { name, description, avatar_url, settings }) {
    const updates = []
    const values = []
    let idx = 1

    if (name !== undefined) {
      updates.push(`name = $${idx++}`)
      values.push(name)
    }
    if (description !== undefined) {
      updates.push(`description = $${idx++}`)
      values.push(description)
    }
    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${idx++}`)
      values.push(avatar_url)
    }
    if (settings !== undefined) {
      updates.push(`settings = $${idx++}`)
      values.push(JSON.stringify(settings))
    }

    if (updates.length === 0) return this.findById(id)

    updates.push(`updated_at = now()`)
    values.push(id)

    return db.one(
      `UPDATE teams SET ${updates.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
      values
    )
  }

  async softDelete(id) {
    return db.one(
      'UPDATE teams SET deleted_at = now(), updated_at = now() WHERE id = $1 RETURNING *',
      [id]
    )
  }

  async restore(id) {
    return db.one(
      'UPDATE teams SET deleted_at = NULL, updated_at = now() WHERE id = $1 RETURNING *',
      [id]
    )
  }

  async count() {
    const result = await db.one('SELECT COUNT(*) as count FROM teams WHERE deleted_at IS NULL')
    return parseInt(result.count, 10)
  }

  // ─── Team Members ────────────────────────────────────────────────────────────

  async addMember({ team_id, user_id, role = 'member', permissions = {} }) {
    return db.one(
      `INSERT INTO team_members (team_id, user_id, role, permissions)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (team_id, user_id) DO UPDATE
       SET role = EXCLUDED.role, permissions = EXCLUDED.permissions, updated_at = now()
       RETURNING *`,
      [team_id, user_id, role, JSON.stringify(permissions)]
    )
  }

  async removeMember(team_id, user_id) {
    return db.result('DELETE FROM team_members WHERE team_id = $1 AND user_id = $2', [team_id, user_id])
  }

  async findMember(team_id, user_id) {
    return db.oneOrNone(
      'SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2',
      [team_id, user_id]
    )
  }

  async findMembersByTeam(team_id, { limit = 50, offset = 0 } = {}) {
    return db.any(
      `SELECT tm.*, u.email, u.name as user_name, u.avatar_url as user_avatar
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = $1
       ORDER BY tm.joined_at ASC
       LIMIT $2 OFFSET $3`,
      [team_id, limit, offset]
    )
  }

  async findMembersByUser(user_id) {
    return db.any(
      `SELECT tm.*, t.name as team_name, t.slug, t.avatar_url as team_avatar
       FROM team_members tm
       JOIN teams t ON t.id = tm.team_id
       WHERE tm.user_id = $1 AND t.deleted_at IS NULL
       ORDER BY tm.joined_at DESC`,
      [user_id]
    )
  }

  async updateMemberRole(team_id, user_id, role) {
    return db.one(
      'UPDATE team_members SET role = $1, updated_at = now() WHERE team_id = $2 AND user_id = $3 RETURNING *',
      [role, team_id, user_id]
    )
  }

  async updateMemberPermissions(team_id, user_id, permissions) {
    return db.one(
      'UPDATE team_members SET permissions = $1, updated_at = now() WHERE team_id = $2 AND user_id = $3 RETURNING *',
      [JSON.stringify(permissions), team_id, user_id]
    )
  }

  async countMembers(team_id) {
    const result = await db.one('SELECT COUNT(*) as count FROM team_members WHERE team_id = $1', [team_id])
    return parseInt(result.count, 10)
  }

  // ─── Team Invitations ────────────────────────────────────────────────────────

  async createInvitation({ team_id, email, name, role, invite_token, invited_by }) {
    return db.one(
      `INSERT INTO team_invitations (team_id, email, name, role, invite_token, invited_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [team_id, email, name, role, invite_token, invited_by]
    )
  }

  async findInvitationByToken(invite_token) {
    return db.oneOrNone(
      `SELECT ti.*, t.name as team_name, t.slug as team_slug
       FROM team_invitations ti
       JOIN teams t ON t.id = ti.team_id
       WHERE ti.invite_token = $1`,
      [invite_token]
    )
  }

  async findInvitationsByTeam(team_id, { status, limit = 50, offset = 0 } = {}) {
    const conditions = ['team_id = $1']
    const values = [team_id]
    let idx = 2

    if (status) {
      conditions.push(`status = $${idx++}`)
      values.push(status)
    }

    values.push(limit, offset)

    return db.any(
      `SELECT * FROM team_invitations
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    )
  }

  async acceptInvitation(invite_token, user_id) {
    return db.tx(async (t) => {
      const invitation = await t.one(
        `UPDATE team_invitations
         SET status = 'accepted', accepted_at = now(), updated_at = now()
         WHERE invite_token = $1 AND status = 'pending'
         RETURNING *`,
        [invite_token]
      )

      await t.none(
        `INSERT INTO team_members (team_id, user_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (team_id, user_id) DO NOTHING`,
        [invitation.team_id, user_id, invitation.role]
      )

      return invitation
    })
  }

  async revokeInvitation(invite_token) {
    return db.one(
      `UPDATE team_invitations
       SET status = 'revoked', updated_at = now()
       WHERE invite_token = $1
       RETURNING *`,
      [invite_token]
    )
  }

  async expireInvitations() {
    return db.result(
      `UPDATE team_invitations
       SET status = 'expired', updated_at = now()
       WHERE status = 'pending' AND expires_at < now()`
    )
  }
}

module.exports = new TeamRepo()
