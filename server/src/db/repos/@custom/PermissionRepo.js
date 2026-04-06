// @custom PermissionRepo
// Data access layer for permissions management

const { db } = require('../../index')

class PermissionRepo {
  // ─── Permissions ─────────────────────────────────────────────────────────────

  async findAll() {
    return db.any('SELECT * FROM permissions ORDER BY category, name')
  }

  async findByCategory(category) {
    return db.any('SELECT * FROM permissions WHERE category = $1 ORDER BY name', [category])
  }

  async findByName(name) {
    return db.oneOrNone('SELECT * FROM permissions WHERE name = $1', [name])
  }

  // ─── Role Permissions ────────────────────────────────────────────────────────

  async getRolePermissions(role) {
    return db.any(
      `SELECT p.*
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role = $1
       ORDER BY p.category, p.name`,
      [role]
    )
  }

  async hasRolePermission(role, permission_name) {
    const result = await db.oneOrNone(
      `SELECT 1
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role = $1 AND p.name = $2`,
      [role, permission_name]
    )
    return !!result
  }

  // ─── User Permissions ────────────────────────────────────────────────────────

  async getUserPermissions(user_id, team_id = null) {
    return db.any(
      `SELECT p.*, up.granted
       FROM user_permissions up
       JOIN permissions p ON p.id = up.permission_id
       WHERE up.user_id = $1 AND (up.team_id = $2 OR up.team_id IS NULL)
       ORDER BY p.category, p.name`,
      [user_id, team_id]
    )
  }

  async grantUserPermission(user_id, permission_name, team_id = null) {
    return db.one(
      `INSERT INTO user_permissions (user_id, team_id, permission_id, granted)
       SELECT $1, $2, id, true
       FROM permissions
       WHERE name = $3
       ON CONFLICT (user_id, team_id, permission_id)
       DO UPDATE SET granted = true, updated_at = now()
       RETURNING *`,
      [user_id, team_id, permission_name]
    )
  }

  async revokeUserPermission(user_id, permission_name, team_id = null) {
    return db.one(
      `INSERT INTO user_permissions (user_id, team_id, permission_id, granted)
       SELECT $1, $2, id, false
       FROM permissions
       WHERE name = $3
       ON CONFLICT (user_id, team_id, permission_id)
       DO UPDATE SET granted = false, updated_at = now()
       RETURNING *`,
      [user_id, team_id, permission_name]
    )
  }

  async checkUserPermission(user_id, permission_name, team_id = null) {
    // Check user-specific override first
    const override = await db.oneOrNone(
      `SELECT up.granted
       FROM user_permissions up
       JOIN permissions p ON p.id = up.permission_id
       WHERE up.user_id = $1 AND p.name = $2 AND (up.team_id = $3 OR up.team_id IS NULL)
       ORDER BY up.team_id NULLS LAST
       LIMIT 1`,
      [user_id, permission_name, team_id]
    )

    if (override !== null) {
      return override.granted
    }

    // Fall back to role-based permission
    // Get user's role in team (if team_id provided)
    if (team_id) {
      const member = await db.oneOrNone(
        'SELECT role FROM team_members WHERE user_id = $1 AND team_id = $2',
        [user_id, team_id]
      )

      if (member) {
        return this.hasRolePermission(member.role, permission_name)
      }
    }

    // Check global user role
    const user = await db.oneOrNone('SELECT role FROM users WHERE id = $1', [user_id])
    if (user && user.role) {
      return this.hasRolePermission(user.role, permission_name)
    }

    return false
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  async getAllPermissionsForUser(user_id, team_id = null) {
    const permissions = new Set()

    // Get role-based permissions
    if (team_id) {
      const member = await db.oneOrNone(
        'SELECT role FROM team_members WHERE user_id = $1 AND team_id = $2',
        [user_id, team_id]
      )

      if (member) {
        const rolePerms = await this.getRolePermissions(member.role)
        rolePerms.forEach((p) => permissions.add(p.name))
      }
    } else {
      const user = await db.oneOrNone('SELECT role FROM users WHERE id = $1', [user_id])
      if (user && user.role) {
        const rolePerms = await this.getRolePermissions(user.role)
        rolePerms.forEach((p) => permissions.add(p.name))
      }
    }

    // Apply user-specific overrides
    const userPerms = await this.getUserPermissions(user_id, team_id)
    userPerms.forEach((p) => {
      if (p.granted) {
        permissions.add(p.name)
      } else {
        permissions.delete(p.name)
      }
    })

    return Array.from(permissions)
  }
}

module.exports = new PermissionRepo()
