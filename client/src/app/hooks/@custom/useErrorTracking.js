// @custom — hook for the error tracking page
import { api } from '../../lib/@system/api'

export function useErrorTracking() {
  const fetchErrorData = async (activeTab, levelFilter, page, pageSize) => {
    const params = new URLSearchParams()
    if (activeTab !== 'all') params.set('status', activeTab)
    if (levelFilter) params.set('level', levelFilter)
    params.set('limit', String(pageSize))
    params.set('offset', String(page * pageSize))

    const [statsRes, eventsRes] = await Promise.all([
      api.get('/errors/stats'),
      api.get(`/errors?${params.toString()}`),
    ])

    return {
      stats: statsRes.stats,
      events: eventsRes.events ?? [],
      total: eventsRes.total ?? 0,
    }
  }

  const fetchStats = async () => {
    const res = await api.get('/errors/stats')
    return res.stats
  }

  const updateErrorStatus = async (id, status) => {
    await api.patch(`/errors/${id}/status`, { status })
  }

  return { fetchErrorData, fetchStats, updateErrorStatus }
}
