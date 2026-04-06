/**
 * @custom Migration 026 — Post scheduler enhancements
 * Adds retry tracking, error logging, and queue priority to posts table.
 */
async function up(db) {
  await db.none(`
    -- Retry and error tracking for post publishing
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS max_retries INTEGER NOT NULL DEFAULT 3;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS last_error TEXT;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS last_attempted_at TIMESTAMPTZ;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_linkedin_id TEXT;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS queue_position INTEGER;

    -- Index for the scheduler worker to find publishable posts efficiently
    CREATE INDEX IF NOT EXISTS idx_posts_scheduler_queue
      ON posts(scheduled_for ASC)
      WHERE status = 'scheduled'
        AND scheduled_for IS NOT NULL;

    -- Index for retry-eligible failed posts
    CREATE INDEX IF NOT EXISTS idx_posts_failed_retryable
      ON posts(last_attempted_at ASC)
      WHERE status = 'failed'
        AND retry_count < max_retries;

    COMMENT ON COLUMN posts.retry_count IS 'Number of publish attempts so far';
    COMMENT ON COLUMN posts.max_retries IS 'Maximum publish retries before permanent failure';
    COMMENT ON COLUMN posts.last_error IS 'Last error message from publish attempt';
    COMMENT ON COLUMN posts.last_attempted_at IS 'Timestamp of last publish attempt';
    COMMENT ON COLUMN posts.published_linkedin_id IS 'LinkedIn post URN after successful publish';
  `)
  console.log('  ✓ post scheduler columns added to posts table')
}

async function down(db) {
  await db.none(`
    DROP INDEX IF EXISTS idx_posts_scheduler_queue;
    DROP INDEX IF EXISTS idx_posts_failed_retryable;
    ALTER TABLE posts DROP COLUMN IF EXISTS retry_count;
    ALTER TABLE posts DROP COLUMN IF EXISTS max_retries;
    ALTER TABLE posts DROP COLUMN IF EXISTS last_error;
    ALTER TABLE posts DROP COLUMN IF EXISTS last_attempted_at;
    ALTER TABLE posts DROP COLUMN IF EXISTS published_linkedin_id;
    ALTER TABLE posts DROP COLUMN IF EXISTS queue_position;
  `)
}

module.exports = { up, down }
