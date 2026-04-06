/**
 * @custom LinkedInPublisher — Publish posts to LinkedIn via API
 *
 * Uses LinkedIn's Marketing API (v2) to create shares/posts.
 * Requires a valid OAuth2 access token per LinkedIn account.
 */
const logger = require('../@system/Logger')

const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2'

class LinkedInPublisher {
  /**
   * Publish a text post to LinkedIn.
   *
   * @param {Object} params
   * @param {string} params.accessToken  - LinkedIn OAuth2 access token
   * @param {string} params.linkedinId   - LinkedIn member URN (e.g. 'urn:li:person:xxxxx')
   * @param {string} params.content      - Post text content
   * @returns {Promise<{linkedinPostId: string}>}
   */
  static async publishPost({ accessToken, linkedinId, content }) {
    if (!accessToken) throw new Error('LinkedIn access token is required')
    if (!linkedinId) throw new Error('LinkedIn member ID is required')
    if (!content) throw new Error('Post content is required')

    // LinkedIn UGC Post API
    const authorUrn = linkedinId.startsWith('urn:li:') ? linkedinId : `urn:li:person:${linkedinId}`

    const body = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    }

    logger.info({ authorUrn, contentLength: content.length }, '[LinkedInPublisher] publishing post')

    const response = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202401'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorBody = await response.text()
      const errorMsg = `LinkedIn API error ${response.status}: ${errorBody}`
      logger.error({ status: response.status, body: errorBody }, '[LinkedInPublisher] publish failed')
      throw new Error(errorMsg)
    }

    const data = await response.json()
    const linkedinPostId = data.id || data['X-LinkedIn-Id'] || null

    logger.info({ linkedinPostId }, '[LinkedInPublisher] post published successfully')

    return { linkedinPostId }
  }

  /**
   * Validate that an access token is still valid.
   * Returns true if the token can access the profile.
   */
  static async validateToken(accessToken) {
    try {
      const response = await fetch(`${LINKEDIN_API_BASE}/userinfo`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      return response.ok
    } catch (err) {
      logger.warn({ err: err.message }, '[LinkedInPublisher] token validation failed')
      return false
    }
  }
}

module.exports = LinkedInPublisher
