// @custom — hook for the email tracking page
import { api } from '../../lib/@system/api'

export function useEmailTracking() {
  const fetchEmailData = async (activeTab, search, page, pageSize) => {
    const params = new URLSearchParams()
    if (activeTab !== 'all') params.set('status', activeTab)
    if (search) params.set('search', search)
    params.set('limit', String(pageSize))
    params.set('offset', String(page * pageSize))

    const [statsRes, logsRes, templatesRes] = await Promise.all([
      api.get('/email-logs/stats'),
      api.get(`/email-logs?${params.toString()}`),
      api.get('/email-logs/templates'),
    ])

    return {
      stats: statsRes.stats,
      logs: logsRes.logs ?? [],
      total: logsRes.total ?? 0,
      templates: templatesRes.templates ?? [],
    }
  }

  return { fetchEmailData }
}
