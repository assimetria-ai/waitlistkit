/**
 * @custom PostRepo — Data access for posts with scheduling support
 */
const db = require('../../../lib/@system/PostgreSQL')

const POST_FIELDS = `
  id, user_id, content, status, scheduled_for, published_at,
  linkedin_account_id, linkedin_post_id, published_linkedin_id,
  schedule_id, retry_count, max_retries, last_error, last_attempted_at,
  queue_position, created_at, updated_at
`

const PostRepo = {
  /**
   * Find posts due for publishing: scheduled_for <= now() AND status = 'scheduled'
   * Returns up to `limit` posts ordered by scheduled_for ASC (oldest first).
   */
  async findDueForPublishing(limit = 10) {
    return db.any(
      `SELECT ${POST_FIELDS}
       FROM posts
       WHERE status = 'scheduled'
         AND scheduled_for IS NOT NULL
         AND scheduled_for <= now()
       ORDER BY scheduled_for ASC
       LIMIT $1`,
      [limit]
    )
  },

  /**
   * Find failed posts eligible for retry: status='failed', retry_count < max_retries,
   * and last_attempted_at > 5 minutes ago (backoff).
   */
  async findRetryable(limit = 5) {
    return db.any(
      `SELECT ${POST_FIELDS}
       FROM posts
       WHERE status = 'failed'
         AND retry_count < max_retries
         AND (last_attempted_at IS NULL OR last_attempted_at < now() - interval '5 minutes' * retry_count)
       ORDER BY last_attempted_at ASC NULLS FIRST
       LIMIT $1`,
      [limit]
    )
  },

  /**
   * Mark a post as in-progress (publishing). Uses optimistic locking on status.
   * Returns the post if successfully claimed, null if already claimed.
   */
  async claimForPublishing(postId) {
    return db.oneOrNone(
      `UPDATE posts
       SET status = 'publishing',
           last_attempted_at = now(),
           updated_at = now()
       WHERE id = $1
         AND status IN ('scheduled', 'failed')
       RETURNING ${POST_FIELDS}`,
      [postId]
    )
  },

  /**
   * Mark post as successfully published.
   */
  async markPublished(postId, linkedinPostId) {
    return db.one(
      `UPDATE posts
       SET status = 'published',
           published_at = now(),
           published_linkedin_id = $2,
           last_error = NULL,
           updated_at = now()
       WHERE id = $1
       RETURNING ${POST_FIELDS}`,
      [postId, linkedinPostId || null]
    )
  },

  /**
   * Mark post as failed with error. Increments retry_count.
   * If retry_count >= max_retries, status stays 'failed' permanently.
   */
  async markFailed(postId, errorMessage) {
    return db.one(
      `UPDATE posts
       SET status = 'failed',
           retry_count = retry_count + 1,
           last_error = $2,
           last_attempted_at = now(),
           updated_at = now()
       WHERE id = $1
       RETURNING ${POST_FIELDS}`,
      [postId, errorMessage]
    )
  },

  /**
   * Get a single post by ID.
   */
  async findById(postId) {
    return db.oneOrNone(
      `SELECT ${POST_FIELDS} FROM posts WHERE id = $1`,
      [postId]
    )
  },

  /**
   * Get queue stats for monitoring.
   */
  async getQueueStats() {
    return db.one(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'scheduled') AS scheduled_count,
         COUNT(*) FILTER (WHERE status = 'publishing') AS publishing_count,
         COUNT(*) FILTER (WHERE status = 'published') AS published_count,
         COUNT(*) FILTER (WHERE status = 'failed' AND retry_count < max_retries) AS retryable_count,
         COUNT(*) FILTER (WHERE status = 'failed' AND retry_count >= max_retries) AS permanently_failed_count,
         MIN(scheduled_for) FILTER (WHERE status = 'scheduled') AS next_scheduled
       FROM posts`
    )
  },

  /**
   * Reset stuck 'publishing' posts back to 'scheduled' (stale > 10 min).
   * Safety net for worker crashes.
   */
  async resetStuckPublishing(timeoutMinutes = 10) {
    return db.result(
      `UPDATE posts
       SET status = 'scheduled',
           updated_at = now()
       WHERE status = 'publishing'
         AND last_attempted_at < now() - interval '1 minute' * $1`,
      [timeoutMinutes]
    )
  }
}

module.exports = PostRepo
