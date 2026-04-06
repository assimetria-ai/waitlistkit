// @custom — hook for the pricing plans admin page
import { useState, useEffect, useCallback } from 'react'
import { api } from '../../lib/@system/api'

export function usePricingPlans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPlans = useCallback(async () => {
    try {
      const res = await api.get('/admin/pricing/plans')
      setPlans(res.plans)
    } catch {
      // keep empty list
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  const savePlan = useCallback(async (planId, payload) => {
    if (planId) {
      const res = await api.patch(`/admin/pricing/plans/${planId}`, payload)
      return res.plan
    } else {
      const res = await api.post('/admin/pricing/plans', payload)
      return res.plan
    }
  }, [])

  const deletePlan = useCallback(async (id) => {
    await api.delete(`/admin/pricing/plans/${id}`)
  }, [])

  const toggleActive = useCallback(async (plan) => {
    const res = await api.patch(`/admin/pricing/plans/${plan.id}`, { is_active: !plan.is_active })
    return res.plan
  }, [])

  const movePlan = useCallback(async (planId, otherId, newOrder, otherOrder) => {
    await Promise.all([
      api.patch(`/admin/pricing/plans/${planId}`, { sort_order: otherOrder }),
      api.patch(`/admin/pricing/plans/${otherId}`, { sort_order: newOrder }),
    ])
  }, [])

  return { plans, setPlans, loading, fetchPlans, savePlan, deletePlan, toggleActive, movePlan }
}
