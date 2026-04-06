// @custom — hook for the analytics dashboard page
import { api } from '../../lib/@system/api'

export function useAnalyticsDashboard() {
  const fetchAnalytics = async (startStr) => {
    const [overviewRes, trendsRes, perfRes] = await Promise.all([
      api.get('/api/analytics/overview'),
      api.get(`/api/analytics/engagement/trends?interval=day&start=${startStr}`),
      api.get('/api/analytics/performance?sort_by=engagement_rate&limit=5'),
    ])

    return {
      overview: overviewRes.overview,
      accountTrends: trendsRes.account_trends || [],
      posts: perfRes.posts || [],
      optimalTimes: perfRes.optimal_times || [],
    }
  }

  return { fetchAnalytics }
}
