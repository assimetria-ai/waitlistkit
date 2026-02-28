// @custom — collaborators management page
// Allows workspace owners/admins to invite, manage roles, and remove collaborators.
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Settings,
  Shield,
  CreditCard,
  Activity,
  Users,
  Plus,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Clock,
  ChevronDown } from 'lucide-react'
import { Header } from '../../../components/@system/Header/Header'
import { Sidebar, SidebarSection, SidebarItem } from '../../../components/@system/Sidebar/Sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/@system/Card/Card'
import { FormField, Input } from '../../../components/@system/Form/Form'
import { Button } from '../../../components/@system/ui/button'
import { Modal } from '../../../components/@system/Modal/Modal'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/@system/Table/Table'
import { Badge } from '../../../components/@system/Badge/Badge'
import { useAuthContext } from '../../../store/@system/auth'
import {
  collaboratorsApi } from '../../../lib/@custom/collaborators'

// ─── Nav ─────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: Home, label: 'Dashboard', to: '/app' },
  { icon: Activity, label: 'Activity', to: '/app/activity' },
  { icon: CreditCard, label: 'Billing', to: '/app/billing' },
  { icon: Users, label: 'Collaborators', to: '/app/collaborators' },
  { icon: Settings, label: 'Settings', to: '/app/settings' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric' })
}

function statusBadge(status) {
  if (status === 'active') return <Badge variant="success">Active</Badge>
  if (status === 'pending') return <Badge variant="warning">Pending</Badge>
  return <Badge variant="destructive">Revoked</Badge>
}

function roleBadge(role) {
  const styles = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    member: 'bg-blue-100 text-blue-700 border-blue-200',
    viewer: 'bg-gray-100 text-gray-600 border-gray-200' }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${styles[role]}`}>
      {role}
    </span>
  )
}

// ─── Role Selector ────────────────────────────────────────────────────────────

function RoleSelect({
  value,
  onChange,
  disabled }) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="appearance-none rounded-md border border-border bg-background py-1 pl-3 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 cursor-pointer"
      >
        <option value="admin">Admin</option>
        <option value="member">Member</option>
        <option value="viewer">Viewer</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyCollaborators({ onInvite }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
      <p className="mt-3 text-sm font-medium text-foreground">No collaborators yet</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Invite team members to collaborate on your workspace.
      </p>
      <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={onInvite}>
        <Plus className="h-4 w-4" />
        Invite your first collaborator
      </Button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function CollaboratorsPage() {
  const { user } = useAuthContext()
  const location = useLocation()

  const [collaborators, setCollaborators] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteToken, setInviteToken] = useState(null)

  // Remove confirmation modal
  const [removeTarget, setRemoveTarget] = useState(null)
  const [removing, setRemoving] = useState(false)

  // Role update (inline, per-row)
  const [updatingRole, setUpdatingRole] = useState(null)

  useEffect(() => {
    fetchCollaborators()
  }, [])

  async function fetchCollaborators() {
    setLoading(true)
    setError('')
    try {
      const data = await collaboratorsApi.list()
      setCollaborators(data.collaborators)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collaborators')
    } finally {
      setLoading(false)
    }
  }

  async function handleInvite(e) {
    e.preventDefault()
    if (!inviteEmail.trim()) {
      setInviteError('Email is required')
      return
    }
    setInviting(true)
    setInviteError('')
    try {
      const result = await collaboratorsApi.invite({
        email: inviteEmail.trim(),
        role: inviteRole,
        name: inviteName.trim() || undefined })
      setCollaborators((prev) => [result.collaborator, ...prev])
      setTotal((t) => t + 1)
      setInviteToken(result.invite_token)
      setInviteOpen(false)
      setInviteEmail('')
      setInviteName('')
      setInviteRole('member')
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  async function handleRoleChange(collaborator, role) {
    if (role === collaborator.role) return
    setUpdatingRole(collaborator.id)
    try {
      const result = await collaboratorsApi.updateRole(collaborator.id, role)
      setCollaborators((prev) =>
        prev.map((c) => (c.id === collaborator.id ? result.collaborator : c))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setUpdatingRole(null)
    }
  }

  async function handleRemove() {
    if (!removeTarget) return
    setRemoving(true)
    try {
      await collaboratorsApi.remove(removeTarget.id)
      setCollaborators((prev) =>
        prev.map((c) =>
          c.id === removeTarget.id ? { ...c, status: 'revoked' } : c
        )
      )
      setRemoveTarget(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove collaborator')
    } finally {
      setRemoving(false)
    }
  }

  function resetInviteModal() {
    setInviteOpen(false)
    setInviteEmail('')
    setInviteName('')
    setInviteRole('member')
    setInviteError('')
  }

  const activeCount = collaborators.filter((c) => c.status === 'active').length
  const pendingCount = collaborators.filter((c) => c.status === 'pending').length

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar>
          <div className="mb-6 px-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Navigation
            </p>
          </div>
          <SidebarSection>
            {NAV_ITEMS.map(({ icon, label, to }) => (
              <Link to={to} key={to}>
                <SidebarItem
                  icon={<Icon className="h-4 w-4" />}
                  label={label}
                  active={location.pathname === to}
                />
              </Link>
            ))}
            {user?.role === 'admin' && (
              <Link to="/app/admin">
                <SidebarItem
                  icon={<Shield className="h-4 w-4" />}
                  label="Admin"
                  active={location.pathname === '/app/admin'}
                />
              </Link>
            )}
          </SidebarSection>
        </Sidebar>

        <main className="flex-1 overflow-auto p-8 max-w-5xl">
          {/* Page header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">Collaborators</h1>
              <p className="mt-1 text-muted-foreground">
                Manage who has access to your workspace.
              </p>
            </div>
            <Button onClick={() => setInviteOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Invite
            </Button>
          </div>

          {/* Invite token success banner */}
          {inviteToken && (
            <div className="mb-6 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-700">Invitation created</p>
                  <p className="mt-0.5 text-xs text-blue-600">
                    Share this invite link with your collaborator:
                  </p>
                  <div className="mt-3 flex items-center rounded-md border border-blue-300 bg-white px-3 py-2 font-mono text-xs break-all">
                    <span className="flex-1 select-all">
                      {`${window.location.origin}/accept-invite?token=${inviteToken}`}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setInviteToken(null)}
                  className="text-xs text-blue-600 underline hover:no-underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

          {/* Summary stats */}
          {!loading && collaborators.length > 0 && (
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-green-500" />
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <p className="mt-1 text-2xl font-bold">{activeCount}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <p className="mt-1 text-2xl font-bold">{pendingCount}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <p className="mt-1 text-2xl font-bold">{total}</p>
              </div>
            </div>
          )}

          {/* Collaborators table */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Collaborators with active or pending invitations to your workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : collaborators.length === 0 ? (
                <EmptyCollaborators onInvite={() => setInviteOpen(true)} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Collaborator</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Invited</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collaborators.map((collab) => (
                      <TableRow key={collab.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {collab.name ?? collab.email}
                            </p>
                            {collab.name && (
                              <p className="text-xs text-muted-foreground">{collab.email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{statusBadge(collab.status)}</TableCell>
                        <TableCell>
                          {collab.status === 'revoked' ? (
                            roleBadge(collab.role)
                          ) : (
                            <RoleSelect
                              value={collab.role}
                              onChange={(role) => handleRoleChange(collab, role)}
                              disabled={updatingRole === collab.id}
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(collab.accepted_at)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(collab.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          {collab.status !== 'revoked' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setRemoveTarget(collab)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Remove
                            </Button>
                          )}
                          {collab.status === 'revoked' && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <UserX className="h-3.5 w-3.5" />
                              Removed
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Role guide */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Role permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-border p-3">
                  <p className="text-sm font-semibold text-purple-700">Admin</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Full access. Can invite/remove collaborators and manage settings.
                  </p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-sm font-semibold text-blue-700">Member</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Standard access. Can view and interact with workspace content.
                  </p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-sm font-semibold text-gray-600">Viewer</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Read-only access. Cannot make changes to workspace data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Invite modal */}
      <Modal
        open={inviteOpen}
        onClose={resetInviteModal}
        title="Invite Collaborator"
        description="Send an invitation to a team member. They'll receive an invite link to join your workspace."
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <FormField label="Email address">
            <Input
              type="email"
              placeholder="colleague@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              autoFocus
              required
            />
          </FormField>
          <FormField label="Name (optional)">
            <Input
              placeholder="Their name"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
            />
          </FormField>
          <FormField label="Role">
            <div className="relative inline-flex w-full items-center">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full appearance-none rounded-md border border-border bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="admin">Admin — Full access</option>
                <option value="member">Member — Standard access</option>
                <option value="viewer">Viewer — Read only</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </FormField>
          {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetInviteModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={inviting} className="gap-2">
              <Mail className="h-4 w-4" />
              {inviting ? 'Inviting…' : 'Send Invite'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove confirmation modal */}
      <Modal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title="Remove Collaborator"
        description={`Are you sure you want to remove ${removeTarget?.name ?? removeTarget?.email}? They will lose access to the workspace immediately.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setRemoveTarget(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRemove} disabled={removing}>
            {removing ? 'Removing…' : 'Remove'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
