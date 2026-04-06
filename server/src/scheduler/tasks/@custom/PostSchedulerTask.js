'use strict'

/**
 * @custom PostSchedulerTask — Background worker for publishing scheduled posts
 *
 * Runs every 1 minute. Finds posts where scheduled_for <= now() and status = 'scheduled',
 * claims them (optimistic locking), publishes via LinkedIn API, and handles failures/retries.
 *
 * Retry strategy:
 *   - Exponential backoff: retry_count * 5 minutes between attempts
 *   - Max 3 retries (configurable per post via max_retries column)
 *   - Stuck 'publishing' posts reset after 10 minutes (worker crash safety)
 */

const { BaseTask } = require('../@system')
const logger = require('../../../lib/@system/Logger')
const PostRepo = require('../../../db/repos/@custom/PostRepo')
const LinkedInPublisher = require('../../../lib/@custom/LinkedInPublisher')
const db = require('../../../lib/@system/PostgreSQL')

class PostSchedulerTask extends BaseTask {
  constructor() {
    super('post_scheduler')
  }

  getSchedule() {
    return '* * * * *' // Every minute
  }

  async execute() {
    logger.info('[PostScheduler] tick — checking for due posts')

    // Safety: reset any stuck 'publishing' posts from crashed workers
    const resetResult = await PostRepo.resetStuckPublishing(10)
    if (resetResult.rowCount > 0) {
      logger.warn({ count: resetResult.rowCount }, '[PostScheduler] reset stuck publishing posts')
    }

    // 1. Find posts due for publishing
    const duePosts = await PostRepo.findDueForPublishing(10)

    // 2. Find failed posts eligible for retry
    const retryPosts = await PostRepo.findRetryable(5)

    const allPosts = [...duePosts, ...retryPosts]

    if (allPosts.length === 0) {
      logger.debug('[PostScheduler] no posts to publish')
      return
    }

    logger.info({ due: duePosts.length, retry: retryPosts.length }, '[PostScheduler] processing posts')

    // Process each post sequentially to avoid rate limits
    for (const post of allPosts) {
      await this._publishPost(post)
    }

    // Log queue stats
    const stats = await PostRepo.getQueueStats()
    logger.info({ stats }, '[PostScheduler] queue stats after run')
  }

  /**
   * Attempt to publish a single post.
   * Claims the post first (optimistic locking), then publishes via LinkedIn.
   */
  async _publishPost(post) {
    // Claim the post (prevents duplicate publishing)
    const claimed = await PostRepo.claimForPublishing(post.id)
    if (!claimed) {
      logger.debug({ postId: post.id }, '[PostScheduler] post already claimed, skipping')
      return
    }

    try {
      // Look up the LinkedIn account for this post
      const linkedinAccount = await this._getLinkedInAccount(post)

      if (!linkedinAccount) {
        // No LinkedIn account linked — mark failed with helpful error
        await PostRepo.markFailed(post.id, 'No LinkedIn account linked. Connect a LinkedIn account to publish.')
        logger.warn({ postId: post.id }, '[PostScheduler] no LinkedIn account for post')
        return
      }

      // Publish to LinkedIn
      const { linkedinPostId } = await LinkedInPublisher.publishPost({
        accessToken: linkedinAccount.access_token,
        linkedinId: linkedinAccount.linkedin_id,
        content: post.content
      })

      // Success!
      await PostRepo.markPublished(post.id, linkedinPostId)
      logger.info({ postId: post.id, linkedinPostId }, '[PostScheduler] post published successfully')

    } catch (err) {
      // Publish failed — mark with error for retry
      const errorMsg = err.message || 'Unknown publishing error'
      await PostRepo.markFailed(post.id, errorMsg)

      const updatedPost = await PostRepo.findById(post.id)
      const retriesLeft = (updatedPost?.max_retries || 3) - (updatedPost?.retry_count || 0)

      if (retriesLeft > 0) {
        logger.warn(
          { postId: post.id, error: errorMsg, retriesLeft },
          '[PostScheduler] post publish failed, will retry'
        )
      } else {
        logger.error(
          { postId: post.id, error: errorMsg },
          '[PostScheduler] post publish permanently failed (no retries left)'
        )
      }
    }
  }

  /**
   * Get the LinkedIn account for a post.
   * Uses post.linkedin_account_id if set, otherwise falls back to
   * the user's first active LinkedIn account.
   */
  async _getLinkedInAccount(post) {
    if (post.linkedin_account_id) {
      return db.oneOrNone(
        `SELECT * FROM linkedin_accounts
         WHERE id = $1 AND is_active = true`,
        [post.linkedin_account_id]
      )
    }

    // Fallback: user's first active LinkedIn account
    return db.oneOrNone(
      `SELECT * FROM linkedin_accounts
       WHERE user_id = $1 AND is_active = true
       ORDER BY created_at ASC
       LIMIT 1`,
      [post.user_id]
    )
  }
}

module.exports = PostSchedulerTask
