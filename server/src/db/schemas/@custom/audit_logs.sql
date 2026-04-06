-- @custom audit_logs table — who changed what, when
CREATE TABLE IF NOT EXISTS audit_logs (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  actor_email   TEXT,                                        -- snapshot of email at time of action
  action        TEXT NOT NULL,                               -- e.g. 'create', 'update', 'delete', 'login'
  resource_type TEXT NOT NULL,                               -- e.g. 'user', 'brand', 'collaborator'
  resource_id   TEXT,                                        -- stringified PK of the affected resource
  old_data      JSONB,                                       -- snapshot before the change (null for creates)
  new_data      JSONB,                                       -- snapshot after the change (null for deletes)
  ip_address    TEXT,
  user_agent    TEXT,
  metadata      JSONB,                                       -- extra context (request id, route, etc.)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id       ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action        ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id   ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at    ON audit_logs(created_at DESC);
