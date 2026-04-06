// @custom — hook for the HashtagResearchPage
import { api } from '../../lib/@system/api'

export function useHashtagResearch() {
  const fetchHashtags = async ({ search, industry, topic, trending, sort, order, limit = 50 } = {}) => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (industry) params.set('industry', industry)
    if (topic) params.set('topic', topic)
    if (trending) params.set('trending', 'true')
    params.set('sort', sort || 'reach')
    params.set('order', order || 'desc')
    params.set('limit', String(limit))
    return api.get(`/hashtags?${params}`)
  }

  const fetchSets = async () => {
    return api.get('/hashtag-sets')
  }

  const fetchSet = async (id) => {
    return api.get(`/hashtag-sets/${id}`)
  }

  const saveSet = async (data) => {
    return api.post('/hashtag-sets', data)
  }

  const deleteSet = async (id) => {
    return api.delete(`/hashtag-sets/${id}`)
  }

  const fetchSuggestions = async (topic) => {
    return api.get(`/hashtags/suggest?topic=${encodeURIComponent(topic)}`)
  }

  return { fetchHashtags, fetchSets, fetchSet, saveSet, deleteSet, fetchSuggestions }
}
