'use strict'

/**
 * Migration 008 — Performance indexes for common query patterns
 *
 * Adds missing indexes identified by auditing all Repo query patterns:
 *
 * 1.  users(stripe_customer_id)                        — UserRepo.findByStripeCustomerId()
 * 2.  subscriptions(status)                            — SubscriptionRepo.findActiveByUserId()
 * 3.  subscriptions(user_id, status) composite         — hot path: filter by user + active status
 * 4.  brands(created_at DESC)                          — BrandRepo.findAll() ORDER BY created_at DESC
 * 5.  collaborators(role)                              — CollaboratorRepo.findAll() role filter
 * 6.  collaborators(created_at DESC)                   — CollaboratorRepo.findAll() ORDER BY
 * 7.  error_events(fingerprint, environment) composite — ErrorEventRepo.findByFingerprint()
 * 8.  api_keys(key_hash, is_active) composite          — ApiKeyRepo.findByKeyHash() auth path
 * 9.  file_uploads(created_at DESC)                    — FileUploadRepo.findByUserId() ORDER BY
 * 10. sessions partial: (user_id, expires_at)
 *       WHERE revoked_at IS NULL                       — SessionRepo.findActiveByUserId()
 * 11. refresh_tokens partial: (token_hash)
 *       WHERE revoked_at IS NULL                       — RefreshTokenRepo.findValid()
 * 12. refresh_tokens partial: (user_id)
 *       WHERE revoked_at IS NULL                       — RefreshTokenRepo.revokeAllForUser()
 */

exports.up = async (db) => {
  await db.none(`
    -- 1. users: lookup by Stripe customer ID
    CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id
      ON users(stripe_customer_id)
      WHERE stripe_customer_id IS NOT NULL;

    -- 2. subscriptions: filter by status
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status
      ON subscriptions(status);

    -- 3. subscriptions: composite for findActiveByUserId()
    --    WHERE user_id = $1 AND status IN ('active', 'trialing')
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
      ON subscriptions(user_id, status);

    -- 4. brands: ORDER BY created_at DESC
    CREATE INDEX IF NOT EXISTS idx_brands_created_at
      ON brands(created_at DESC);

    -- 5. collaborators: role filter
    CREATE INDEX IF NOT EXISTS idx_collaborators_role
      ON collaborators(role);

    -- 6. collaborators: ORDER BY created_at DESC
    CREATE INDEX IF NOT EXISTS idx_collaborators_created_at
      ON collaborators(created_at DESC);

    -- 7. error_events: composite for findByFingerprint(fingerprint, environment)
    CREATE INDEX IF NOT EXISTS idx_error_events_fingerprint_env
      ON error_events(fingerprint, environment);

    -- 8. api_keys: composite for auth path WHERE key_hash = $1 AND is_active = TRUE
    CREATE INDEX IF NOT EXISTS idx_api_keys_hash_active
      ON api_keys(key_hash, is_active)
      WHERE is_active = TRUE;

    -- 9. file_uploads: ORDER BY created_at DESC in findByUserId()
    CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at
      ON file_uploads(created_at DESC);

    -- 10. sessions: partial index for active sessions lookup
    --     WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > now()
    CREATE INDEX IF NOT EXISTS idx_sessions_active
      ON sessions(user_id, expires_at)
      WHERE revoked_at IS NULL;

    -- 11. refresh_tokens: partial index for findValid()
    --     WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()
    CREATE INDEX IF NOT EXISTS idx_rt_hash_active
      ON refresh_tokens(token_hash)
      WHERE revoked_at IS NULL;

    -- 12. refresh_tokens: partial index for revokeAllForUser() / revokeAllForFamily()
    --     WHERE user_id = $1 AND revoked_at IS NULL
    CREATE INDEX IF NOT EXISTS idx_rt_user_active
      ON refresh_tokens(user_id)
      WHERE revoked_at IS NULL;
  `)

  console.log('[008_performance_indexes] applied — 12 indexes created')
}

exports.down = async (db) => {
  await db.none(`
    DROP INDEX IF EXISTS idx_users_stripe_customer_id;
    DROP INDEX IF EXISTS idx_subscriptions_status;
    DROP INDEX IF EXISTS idx_subscriptions_user_status;
    DROP INDEX IF EXISTS idx_brands_created_at;
    DROP INDEX IF EXISTS idx_collaborators_role;
    DROP INDEX IF EXISTS idx_collaborators_created_at;
    DROP INDEX IF EXISTS idx_error_events_fingerprint_env;
    DROP INDEX IF EXISTS idx_api_keys_hash_active;
    DROP INDEX IF EXISTS idx_file_uploads_created_at;
    DROP INDEX IF EXISTS idx_sessions_active;
    DROP INDEX IF EXISTS idx_rt_hash_active;
    DROP INDEX IF EXISTS idx_rt_user_active;
  `)

  console.log('[008_performance_indexes] rolled back')
}
