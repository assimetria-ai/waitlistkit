// @custom — teams management client API
import { api } from '../@system/api.js'

export const teamsApi = {
  // Teams
  async list() {
    return api.get('/teams')
  },

  async create(params) {
    return api.post('/teams', params)
  },

  async get(id) {
    return api.get(`/teams/${id}`)
  },

  async update(id, params) {
    return api.patch(`/teams/${id}`, params)
  },

  async delete(id) {
    return api.delete(`/teams/${id}`)
  },

  // Members
  async listMembers(team_id, params = {}) {
    const qs = new URLSearchParams()
    if (params.limit) qs.set('limit', params.limit)
    if (params.offset) qs.set('offset', params.offset)
    const query = qs.toString() ? `?${qs.toString()}` : ''
    return api.get(`/teams/${team_id}/members${query}`)
  },

  async removeMember(team_id, user_id) {
    return api.delete(`/teams/${team_id}/members/${user_id}`)
  },

  async updateMemberRole(team_id, user_id, role) {
    return api.patch(`/teams/${team_id}/members/${user_id}/role`, { role })
  },

  // Invitations
  async listInvitations(team_id, params = {}) {
    const qs = new URLSearchParams()
    if (params.status) qs.set('status', params.status)
    if (params.limit) qs.set('limit', params.limit)
    if (params.offset) qs.set('offset', params.offset)
    const query = qs.toString() ? `?${qs.toString()}` : ''
    return api.get(`/teams/${team_id}/invitations${query}`)
  },

  async inviteMember(team_id, params) {
    return api.post(`/teams/${team_id}/invitations`, params)
  },

  async acceptInvitation(token) {
    return api.post(`/invitations/accept/${token}`)
  },

  async revokeInvitation(team_id, token) {
    return api.delete(`/teams/${team_id}/invitations/${token}`)
  },

  // Pending invitations for current user
  async getPendingInvitations() {
    return api.get('/invitations/pending')
  },

  // Permissions
  async getMyPermissions(team_id) {
    return api.get(`/teams/${team_id}/permissions/me`)
  },
}
