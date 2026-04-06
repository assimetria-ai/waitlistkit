// @custom — hook for the public pricing page (static)
import { api } from '../../lib/@system/api'

export function usePricingPage() {
  const fetchPlans = async () => {
    const res = await api.get('/pricing/plans')
    return res.plans ?? []
  }

  return { fetchPlans }
}
