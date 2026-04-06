import { api } from '../@system/api.js'

export const clipsApi = {
  // List clips — supports type, tags (array), search, limit, offset
  list({ type, tags, search, limit, offset } = {}) {
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (tags && tags.length) params.set('tags', tags.join(','))
    if (search) params.set('search', search)
    if (limit != null) params.set('limit', String(limit))
    if (offset != null) params.set('offset', String(offset))
    const qs = params.toString()
    return api.get(`/clips${qs ? `?${qs}` : ''}`)
  },

  // All distinct tags for the current user
  tags() {
    return api.get('/clips/tags')
  },

  create(data) {
    return api.post('/clips', data)
  },

  update(id, data) {
    return api.patch(`/clips/${id}`, data)
  },

  remove(id) {
    return api.delete(`/clips/${id}`)
  },
}
