// @custom — hook for the Brix dashboard page
import { api } from '../../lib/@system/api'

export function useBrixDashboard() {
  const fetchDashboardData = async () => {
    const [statsRes, pagesRes] = await Promise.all([
      api.get('/brix/stats'),
      api.get('/brix/pages'),
    ])
    return {
      stats: statsRes.stats,
      pages: pagesRes.pages ?? [],
    }
  }

  return { fetchDashboardData }
}
