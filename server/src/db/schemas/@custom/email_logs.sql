-- @custom email_logs table for transactional email tracking
CREATE TABLE IF NOT EXISTS email_logs (
  id            SERIAL PRIMARY KEY,
  to_address    TEXT NOT NULL,
  subject       TEXT NOT NULL,
  template      TEXT,                              -- e.g. 'verification' | 'password_reset' | 'welcome'
  status        TEXT NOT NULL DEFAULT 'sent',      -- 'sent' | 'delivered' | 'bounced' | 'failed'
  message_id    TEXT,                              -- SMTP message ID returned by provider
  provider      TEXT,                              -- e.g. 'smtp' | 'resend' | 'sendgrid' | 'ses'
  error         TEXT,                              -- error message if status = 'failed'
  metadata      JSONB,                             -- extra context (user_id, token_type, etc.)
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_to_address  ON email_logs(to_address);
CREATE INDEX IF NOT EXISTS idx_email_logs_status       ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_template     ON email_logs(template);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at      ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id      ON email_logs(user_id);
