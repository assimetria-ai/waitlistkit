-- @custom permissions table
-- Defines granular permissions for role-based and user-specific access control.
-- Permissions can be assigned at team level or overridden per user.

CREATE TABLE IF NOT EXISTS permissions (
  id            SERIAL PRIMARY KEY,
  name          TEXT UNIQUE NOT NULL,           -- e.g., 'billing.manage', 'members.invite'
  description   TEXT,
  category      TEXT NOT NULL,                   -- e.g., 'billing', 'members', 'content'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);

-- Role permissions (defines default permissions for each role)
CREATE TABLE IF NOT EXISTS role_permissions (
  id            SERIAL PRIMARY KEY,
  role          TEXT NOT NULL,                   -- 'owner' | 'admin' | 'member' | 'viewer'
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- User permission overrides (grant/revoke specific permissions for individual users)
CREATE TABLE IF NOT EXISTS user_permissions (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id       INTEGER REFERENCES teams(id) ON DELETE CASCADE,  -- null = global permission
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted       BOOLEAN NOT NULL DEFAULT true,  -- true = grant, false = revoke
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, team_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_team_id ON user_permissions(team_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions(permission_id);

-- Seed default permissions
INSERT INTO permissions (name, description, category) VALUES
  -- Team management
  ('team.settings.manage', 'Manage team settings and details', 'team'),
  ('team.delete', 'Delete the team', 'team'),
  
  -- Member management
  ('members.invite', 'Invite new team members', 'members'),
  ('members.remove', 'Remove team members', 'members'),
  ('members.roles.edit', 'Change member roles', 'members'),
  ('members.view', 'View team members list', 'members'),
  
  -- Billing
  ('billing.view', 'View billing and subscription details', 'billing'),
  ('billing.manage', 'Manage billing, payment methods, and subscriptions', 'billing'),
  
  -- Content
  ('content.create', 'Create new content/resources', 'content'),
  ('content.edit', 'Edit existing content/resources', 'content'),
  ('content.delete', 'Delete content/resources', 'content'),
  ('content.view', 'View content/resources', 'content'),
  
  -- API Keys
  ('api_keys.create', 'Create API keys', 'api'),
  ('api_keys.view', 'View API keys', 'api'),
  ('api_keys.delete', 'Delete API keys', 'api'),
  
  -- Audit logs
  ('audit.view', 'View audit logs', 'audit')
ON CONFLICT (name) DO NOTHING;

-- Seed default role permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'owner', id FROM permissions
ON CONFLICT DO NOTHING;  -- Owner gets all permissions

INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions WHERE category IN ('members', 'content', 'api', 'audit')
ON CONFLICT DO NOTHING;  -- Admin gets most permissions except team deletion and billing

INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions WHERE name IN ('team.settings.manage', 'billing.view')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'member', id FROM permissions WHERE category = 'content' OR name IN ('members.view', 'api_keys.view')
ON CONFLICT DO NOTHING;  -- Member can manage content and view members

INSERT INTO role_permissions (role, permission_id)
SELECT 'viewer', id FROM permissions WHERE name IN ('content.view', 'members.view')
ON CONFLICT DO NOTHING;  -- Viewer can only view
