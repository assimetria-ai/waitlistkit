/**
 * MemberList Component
 * Displays and manages team members
 */

import React, { useState, useEffect } from 'react'
import { teamsApi } from '../../../lib/@custom/teams'
import { Card } from '../Card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Spinner } from '../../Spinner'

export function MemberList({ teamId, userRole, onInviteMember }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState({})

  useEffect(() => {
    if (teamId) {
      loadMembers()
    }
  }, [teamId])

  async function loadMembers() {
    try {
      setLoading(true)
      const data = await teamsApi.listMembers(teamId)
      setMembers(data.members || [])
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveMember(userId) {
    if (!confirm('Are you sure you want to remove this member?')) {
      return
    }

    try {
      setActionLoading({ ...actionLoading, [userId]: 'removing' })
      await teamsApi.removeMember(teamId, userId)
      await loadMembers()
    } catch (err) {
      alert(err.message || 'Failed to remove member')
    } finally {
      setActionLoading({ ...actionLoading, [userId]: null })
    }
  }

  async function handleUpdateRole(userId, newRole) {
    try {
      setActionLoading({ ...actionLoading, [userId]: 'updating' })
      await teamsApi.updateMemberRole(teamId, userId, newRole)
      await loadMembers()
    } catch (err) {
      alert(err.message || 'Failed to update role')
    } finally {
      setActionLoading({ ...actionLoading, [userId]: null })
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

  function canManageMember(memberRole) {
    // Owner and admin can manage members with lower roles
    const roleHierarchy = { viewer: 1, member: 2, admin: 3, owner: 4 }
    return roleHierarchy[userRole] > roleHierarchy[memberRole]
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
        <Button onClick={loadMembers} className="mt-2">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Team Members ({members.length})
        </h3>
        {(userRole === 'admin' || userRole === 'owner') && onInviteMember && (
          <Button onClick={onInviteMember} size="sm">
            + Invite Member
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {members.map((member) => (
          <Card key={member.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">
                    {member.name ? member.name[0].toUpperCase() : member.email[0].toUpperCase()}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {member.name || member.email}
                    </span>
                    <Badge className={getRoleBadgeColor(member.role)}>
                      {member.role}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-500">{member.email}</span>
                </div>
              </div>

              {canManageMember(member.role) && (
                <div className="flex items-center gap-2">
                  {actionLoading[member.user_id] ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.user_id, e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="member">Member</option>
                        {userRole === 'owner' && (
                          <option value="admin">Admin</option>
                        )}
                      </select>

                      <button
                        onClick={() => handleRemoveMember(member.user_id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Remove member"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
