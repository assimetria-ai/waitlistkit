-- @custom referrals table
-- Tracks referral codes, referrer/referee relationships, and conversion events.

CREATE TABLE IF NOT EXISTS referrals (
  id               SERIAL PRIMARY KEY,
  code             TEXT        NOT NULL UNIQUE,            -- unique referral code (e.g. "ABC123")
  referrer_id      INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id       INTEGER     REFERENCES users(id) ON DELETE SET NULL,  -- set once referee signs up
  status           TEXT        NOT NULL DEFAULT 'pending', -- 'pending' | 'clicked' | 'signed_up' | 'converted' | 'expired' | 'invalidated'
  metadata         JSONB       NOT NULL DEFAULT '{}',      -- arbitrary product-specific data (plan, promo, etc.)
  clicked_at       TIMESTAMPTZ,
  signed_up_at     TIMESTAMPTZ,
  converted_at     TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_code           ON referrals(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id    ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id     ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status         ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at     ON referrals(created_at DESC);
