-- Create audit_logs table for comprehensive audit trail
-- Supports user actions, data changes, security events, and compliance tracking

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(100),
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);

-- GIN index for JSONB details column (for searching within details)
CREATE INDEX idx_audit_logs_details ON audit_logs USING GIN (details);

-- Comment the table
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for user actions, data changes, and system events';
COMMENT ON COLUMN audit_logs.user_id IS 'User performing the action (NULL for system actions)';
COMMENT ON COLUMN audit_logs.action IS 'Action performed (e.g., auth.login, user.update, data.delete)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (e.g., user, post, subscription)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the resource affected';
COMMENT ON COLUMN audit_logs.details IS 'Additional context (before/after data, metadata, etc.)';
COMMENT ON COLUMN audit_logs.status IS 'Status of the action (success, failure, pending)';
