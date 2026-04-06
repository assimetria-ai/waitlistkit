/**
 * @custom — LinkedIn OAuth2 helpers
 *
 * Implements the Authorization Code flow for LinkedIn using native fetch (Node 18+).
 * No passport dependency needed.
 *
 * LinkedIn API v2 scopes:
 *   - openid, profile, email: Basic profile info
 *   - w_member_social: Post on behalf of user
 *
 * Flow:
 *   1. getAuthUrl()        → redirect user to LinkedIn authorization page
 *   2. exchangeCode(code)  → exchange authorization code for tokens
 *   3. getUserInfo(token)  → fetch the authenticated user's LinkedIn profile
 *   4. refreshToken(token) → refresh an expired access token
 */

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization'
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo'
const LINKEDIN_PROFILE_URL = 'https://api.linkedin.com/v2/me'

// OpenID Connect scopes + posting capability
const SCOPE = 'openid profile email w_member_social'

/**
 * Builds the LinkedIn OAuth2 authorization URL.
 *
 * @param {Object} opts
 * @param {string} opts.clientId - LinkedIn app Client ID
 * @param {string} opts.redirectUri - Registered callback URL
 * @param {string} [opts.state] - CSRF state parameter
 * @returns {string} Authorization URL
 */
function getAuthUrl({ clientId, redirectUri, state }) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SCOPE,
    ...(state ? { state } : {}),
  })
  return `${LINKEDIN_AUTH_URL}?${params}`
}

/**
 * Exchanges an authorization code for access + refresh tokens.
 *
 * @param {Object} opts
 * @param {string} opts.code - Authorization code from callback
 * @param {string} opts.clientId
 * @param {string} opts.clientSecret
 * @param {string} opts.redirectUri
 * @returns {Promise<Object>} Token response { access_token, expires_in, refresh_token, refresh_token_expires_in }
 */
async function exchangeCode({ code, clientId, clientSecret, redirectUri }) {
  const res = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  })

  const data = await res.json()
  if (!res.ok || data.error) {
    throw new Error(data.error_description ?? data.error ?? 'LinkedIn token exchange failed')
  }
  return data
}

/**
 * Refreshes an expired LinkedIn access token.
 *
 * @param {Object} opts
 * @param {string} opts.refreshToken
 * @param {string} opts.clientId
 * @param {string} opts.clientSecret
 * @returns {Promise<Object>} New token response { access_token, expires_in, refresh_token, refresh_token_expires_in }
 */
async function refreshAccessToken({ refreshToken, clientId, clientSecret }) {
  const res = await fetch(LINKEDIN_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  const data = await res.json()
  if (!res.ok || data.error) {
    throw new Error(data.error_description ?? data.error ?? 'LinkedIn token refresh failed')
  }
  return data
}

/**
 * Fetches the authenticated user's profile using OpenID Connect userinfo endpoint.
 * Returns { sub, name, email, picture, email_verified }
 *
 * @param {string} accessToken
 * @returns {Promise<Object>} User profile
 */
async function getUserInfo(accessToken) {
  const res = await fetch(LINKEDIN_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  if (!res.ok || data.error) {
    throw new Error(data.error_description ?? data.message ?? 'Failed to fetch LinkedIn user info')
  }
  return data
}

/**
 * Fetches the user's basic LinkedIn profile (v2/me endpoint).
 * Returns { id, localizedFirstName, localizedLastName, vanityName, ... }
 *
 * @param {string} accessToken
 * @returns {Promise<Object>} LinkedIn profile
 */
async function getProfile(accessToken) {
  const res = await fetch(LINKEDIN_PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  if (!res.ok || data.error) {
    throw new Error(data.message ?? 'Failed to fetch LinkedIn profile')
  }
  return data
}

module.exports = { getAuthUrl, exchangeCode, refreshAccessToken, getUserInfo, getProfile }
