/**
 * @custom — LinkedInAccountRepo
 *
 * Database operations for the linkedin_accounts table.
 * Handles CRUD, token storage, and refresh for connected LinkedIn profiles.
 */

const db = require('../../../lib/@system/PostgreSQL')

const LinkedInAccountRepo = {
  /**
   * Find a LinkedIn account by its LinkedIn profile ID.
   * @param {string} linkedinId - LinkedIn's unique user identifier (sub)
   * @returns {Promise<Object|null>}
   */
  async findByLinkedInId(linkedinId) {
    return db.oneOrNone('SELECT * FROM linkedin_accounts WHERE linkedin_id = $1', [linkedinId])
  },

  /**
   * Find all LinkedIn accounts for a given user.
   * @param {number} userId
   * @returns {Promise<Array>}
   */
  async findByUserId(userId) {
    return db.any(
      'SELECT id, linkedin_id, profile_name, profile_url, profile_image, headline, follower_count, is_active, last_synced_at, created_at FROM linkedin_accounts WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )
  },

  /**
   * Find a single active LinkedIn account for a user.
   * @param {number} userId
   * @returns {Promise<Object|null>}
   */
  async findActiveByUserId(userId) {
    return db.oneOrNone(
      'SELECT * FROM linkedin_accounts WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1',
      [userId]
    )
  },

  /**
   * Create or update (upsert) a LinkedIn account connection.
   * If the linkedin_id already exists, updates the tokens and profile info.
   *
   * @param {Object} opts
   * @param {number} opts.userId
   * @param {string} opts.linkedinId
   * @param {string} opts.accessToken
   * @param {string} [opts.refreshToken]
   * @param {Date} [opts.tokenExpiresAt]
   * @param {string} [opts.profileName]
   * @param {string} [opts.profileUrl]
   * @param {string} [opts.profileImage]
   * @param {string} [opts.headline]
   * @returns {Promise<Object>} The created/updated record
   */
  async upsert({
    userId,
    linkedinId,
    accessToken,
    refreshToken = null,
    tokenExpiresAt = null,
    profileName = null,
    profileUrl = null,
    profileImage = null,
    headline = null,
  }) {
    return db.one(
      `INSERT INTO linkedin_accounts (user_id, linkedin_id, access_token, refresh_token, token_expires_at, profile_name, profile_url, profile_image, headline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (linkedin_id) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         access_token = EXCLUDED.access_token,
         refresh_token = COALESCE(EXCLUDED.refresh_token, linkedin_accounts.refresh_token),
         token_expires_at = EXCLUDED.token_expires_at,
         profile_name = COALESCE(EXCLUDED.profile_name, linkedin_accounts.profile_name),
         profile_url = COALESCE(EXCLUDED.profile_url, linkedin_accounts.profile_url),
         profile_image = COALESCE(EXCLUDED.profile_image, linkedin_accounts.profile_image),
         headline = COALESCE(EXCLUDED.headline, linkedin_accounts.headline),
         is_active = true,
         updated_at = now()
       RETURNING *`,
      [userId, linkedinId, accessToken, refreshToken, tokenExpiresAt, profileName, profileUrl, profileImage, headline]
    )
  },

  /**
   * Update tokens after a refresh.
   * @param {number} id - linkedin_accounts.id
   * @param {Object} opts
   * @param {string} opts.accessToken
   * @param {string} [opts.refreshToken]
   * @param {Date} [opts.tokenExpiresAt]
   * @returns {Promise<Object>}
   */
  async updateTokens(id, { accessToken, refreshToken = null, tokenExpiresAt = null }) {
    return db.one(
      `UPDATE linkedin_accounts SET
         access_token = $2,
         refresh_token = COALESCE($3, refresh_token),
         token_expires_at = $4,
         updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, accessToken, refreshToken, tokenExpiresAt]
    )
  },

  /**
   * Disconnect (deactivate) a LinkedIn account.
   * @param {number} id
   * @param {number} userId - For ownership validation
   * @returns {Promise<Object|null>}
   */
  async disconnect(id, userId) {
    return db.oneOrNone(
      `UPDATE linkedin_accounts SET is_active = false, updated_at = now()
       WHERE id = $1 AND user_id = $2
       RETURNING id, linkedin_id, profile_name, is_active`,
      [id, userId]
    )
  },

  /**
   * Delete a LinkedIn account entirely.
   * @param {number} id
   * @param {number} userId - For ownership validation
   * @returns {Promise<Object|null>}
   */
  async remove(id, userId) {
    return db.oneOrNone(
      'DELETE FROM linkedin_accounts WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    )
  },

  /**
   * Update the last_synced_at timestamp.
   * @param {number} id
   * @returns {Promise<void>}
   */
  async touchLastSynced(id) {
    return db.none('UPDATE linkedin_accounts SET last_synced_at = now() WHERE id = $1', [id])
  },
}

module.exports = LinkedInAccountRepo
