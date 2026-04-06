/**
 * TeamDetailPage
 * Detailed view of a single team with members and invitations
 */

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { teamsApi } from '../../lib/@custom/teams'
import { MemberList, InvitationManager } from '../../components/@system/Teams'
import { Card } from '../../components/@system/Card'
import { Button } from '../../components/@system/ui/button'
import { Badge } from '../../components/@system/ui/badge'
import { Spinner } from '../../components/@system/Spinner'
import { Tabs } from '../../components/@system/Tabs'

export function TeamDetailPage() {
  const { teamId } = useParams()
  const navigate = useNavigate()
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('members')
  const [showInvite, setShowInvite] = useState(false)

  useEffect(() => {
    if (teamId) {
      loadTeam()
    }
  }, [teamId])

  async function loadTeam() {
    try {
      setLoading(true)
      const data = await teamsApi.get(teamId)
      setTeam(data.team)
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load team')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteTeam() {
    if (!confirm('Are you sure you want to delete this team? This cannot be undone.')) {
      return
    }

    try {
      await teamsApi.delete(teamId)
      navigate('/app/teams')
    } catch (err) {
      alert(err.message || 'Failed to delete team')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center p-8">
          <Spinner />
        </div>
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error || 'Team not found'}</p>
          <Button onClick={() => navigate('/app/teams')} className="mt-2">
            Back to Teams
          </Button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'members', label: 'Members' },
    { id: 'invitations', label: 'Invitations' },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/app/teams')}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Teams
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{team.name}</h1>
              <Badge className={
                team.user_role === 'owner' ? 'bg-purple-100 text-purple-800' :
                team.user_role === 'admin' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }>
                {team.user_role}
              </Badge>
            </div>
            {team.description && (
              <p className="text-gray-600">{team.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
              <span>{team.member_count} member{team.member_count !== 1 ? 's' : ''}</span>
              <span>Created {new Date(team.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Content */}
      <div>
        {activeTab === 'members' && (
          <MemberList
            teamId={teamId}
            userRole={team.user_role}
            onInviteMember={() => setActiveTab('invitations')}
          />
        )}

        {activeTab === 'invitations' && (
          <InvitationManager
            teamId={teamId}
            userRole={team.user_role}
          />
        )}

        {activeTab === 'settings' && (
          <TeamSettings
            team={team}
            onUpdate={loadTeam}
            onDelete={handleDeleteTeam}
          />
        )}
      </div>
    </div>
  )
}

function TeamSettings({ team, onUpdate, onDelete }) {
  const [formData, setFormData] = useState({
    name: team.name,
    description: team.description || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      await teamsApi.update(team.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
      })

      setSuccess(true)
      onUpdate?.()
    } catch (err) {
      setError(err.message || 'Failed to update team')
    } finally {
      setLoading(false)
    }
  }

  const canManageSettings = team.user_role === 'admin' || team.user_role === 'owner'
  const canDeleteTeam = team.user_role === 'owner'

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Team Settings</h3>
        
        {!canManageSettings && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <p className="text-yellow-800">
              Only admins and owners can modify team settings.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Team Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={!canManageSettings}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!canManageSettings}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              Team updated successfully!
            </div>
          )}

          {canManageSettings && (
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </form>
      </Card>

      {canDeleteTeam && (
        <Card className="p-6 border-red-200">
          <h3 className="text-lg font-semibold mb-2 text-red-800">Danger Zone</h3>
          <p className="text-gray-600 mb-4">
            Once you delete a team, there is no going back. Please be certain.
          </p>
          <Button
            onClick={onDelete}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete Team
          </Button>
        </Card>
      )}
    </div>
  )
}
