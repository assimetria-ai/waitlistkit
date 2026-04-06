/**
 * TeamList Component
 * Displays a list of teams the user belongs to
 */

import React, { useState, useEffect } from 'react'
import { teamsApi } from '../../../lib/@custom/teams'
import { Card } from '../Card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Spinner } from '../../Spinner'

export function TeamList({ onTeamSelect, onCreateTeam }) {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadTeams()
  }, [])

  async function loadTeams() {
    try {
      setLoading(true)
      const data = await teamsApi.list()
      setTeams(data.teams || [])
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  function getRoleBadgeColor(role) {
    const colors = {
      owner: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      member: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800',
    }
    return colors[role] || colors.viewer
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">{error}</p>
        <Button onClick={loadTeams} className="mt-2">
          Try Again
        </Button>
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
        <p className="text-gray-600 mb-4">
          Create your first team to start collaborating with others.
        </p>
        {onCreateTeam && (
          <Button onClick={onCreateTeam}>Create Team</Button>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Your Teams</h2>
        {onCreateTeam && (
          <Button onClick={onCreateTeam} size="sm">
            + New Team
          </Button>
        )}
      </div>

      {teams.map((team) => (
        <Card
          key={team.id}
          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onTeamSelect?.(team)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{team.name}</h3>
                <Badge className={getRoleBadgeColor(team.role)}>
                  {team.role}
                </Badge>
              </div>
              
              {team.description && (
                <p className="text-gray-600 text-sm mb-2">
                  {team.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {team.member_count && (
                  <span>{team.member_count} member{team.member_count !== 1 ? 's' : ''}</span>
                )}
                <span>Created {new Date(team.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <button 
              className="text-gray-400 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation()
                onTeamSelect?.(team)
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </Card>
      ))}
    </div>
  )
}
