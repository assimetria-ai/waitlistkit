// @system — API key management client
import { api } from './api'



export const apiKeysApi = {
  async list(){
    const data = await api.get('/api-keys')
    return data.apiKeys
  },

  async create(params){
    const data = await api.post('/api-keys', params)
    const { key: rawKey, ...apiKey } = data.apiKey
    return { apiKey, rawKey }
  },

  async revoke(id){
    await api.delete(`/api-keys/${id}`)
  } }
