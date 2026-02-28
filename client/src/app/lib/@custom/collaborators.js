// @custom — collaborators management client
import { api } from '../@system/api'





export const collaboratorsApi = {
  async list(params){
    const qs = new URLSearchParams()
    if (params?.status) qs.set('status', params.status)
    if (params?.role) qs.set('role', params.role)
    const query = qs.toString() ? `?${qs.toString()}` : ''
    return api.get(`/collaborators${query}`)
  },

  async invite(params){
    return api.post('/collaborators', params)
  },

  async updateRole(id, role) {
    return api.patch(`/collaborators/${id}/role`, { role })
  },

  async remove(id) {
    return api.delete(`/collaborators/${id}`)
  } }
