/**
 * useTeamInvitations Hook
 * Manages team invitations state and notifications
 */

import { useState, useEffect, useCallback } from 'react'
import { teamsApi } from '../../lib/@custom/teams.js'

export function useTeamInvitations() {
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadInvitations = useCallback(async () => {
    try {
      setLoading(true)
      const data = await teamsApi.getPendingInvitations()
      setInvitations(data.invitations || [])
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load invitations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInvitations()
  }, [loadInvitations])

  const acceptInvitation = useCallback(async (token) => {
    try {
      await teamsApi.acceptInvitation(token)
      // Refresh list after accepting
      await loadInvitations()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [loadInvitations])

  return {
    invitations,
    invitationCount: invitations.length,
    loading,
    error,
    refresh: loadInvitations,
    acceptInvitation,
  }
}
