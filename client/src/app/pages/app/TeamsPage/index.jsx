/**
 * TeamsPage
 * Main page for viewing and managing teams
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TeamList, CreateTeamModal, PendingInvitations } from '../../components/@system/Teams'
import { useTeamInvitations } from '../../hooks/@custom/useTeamInvitations'

export function TeamsPage() {
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { invitationCount, refresh: refreshInvitations } = useTeamInvitations()

  function handleTeamSelect(team) {
    navigate(`/app/teams/${team.id}`)
  }

  function handleTeamCreated(team) {
    navigate(`/app/teams/${team.id}`)
  }

  function handleInvitationAccepted() {
    // Refresh invitations list
    refreshInvitations()
    // Could also refresh teams list here if needed
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Teams</h1>
        <p className="text-gray-600">
          Manage your teams and collaborate with others.
        </p>
      </div>

      {/* Pending Invitations Section */}
      {invitationCount > 0 && (
        <div className="mb-8">
          <PendingInvitations onInvitationAccepted={handleInvitationAccepted} />
        </div>
      )}

      {/* Teams List */}
      <TeamList
        onTeamSelect={handleTeamSelect}
        onCreateTeam={() => setShowCreateModal(true)}
      />

      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTeamCreated={handleTeamCreated}
      />
    </div>
  )
}
