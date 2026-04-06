// @custom — team detail page
// Shows team members, invitations, and settings
import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Home,
  Settings,
  Shield,
  CreditCard,
  Activity,
  Users,
  Plus,
  Building2,
  ArrowLeft,
  Trash2,
  Mail,
  Crown,
  ChevronDown,
  Menu,
} from 'lucide-react'
import { Header } from '../../../components/@system/Header'
import { Sidebar, SidebarSection, SidebarItem } from '../../../components/@system/Sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/@system/Card'
import { FormField, Input } from '../../../components/@system/Form'
import { Button } from '../../../components/@system/ui/button'
import { Modal } from '../../../components/@system/Modal'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/@system/Table'
import { ResponsiveTableWrapper } from '../../../components/@system/Table'
import { Badge } from '../../../components/@system/Badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/@system/Tabs'
import { useAuthContext } from '../../../store/@system/auth'
import { useMobileSidebar } from '../../../hooks/@system/useMobileSidebar'
import { useInviteToken } from '../../../hooks/@system/useInviteToken'
import { InviteTokenBanner } from '../../../components/@system/InviteTokenBanner'
import { teamsApi } from '../../../lib/@custom/teams'

// ─── Nav ─────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: Home, label: 'Dashboard', to: '/app' },
  { icon: Activity, label: 'Activity', to: '/app/activity' },
  { icon: Building2, label: 'Teams', to: '/app/teams' },
  { icon: CreditCard, label: 'Billing', to: '/app/billing' },
  { icon: Users, label: 'Collaborators', to: '/app/collaborators' },
  { icon: Settings, label: 'Settings', to: '/app/settings' },
]

// ─── Role Badge ───────────────────────────────────────────────────────────────

function roleBadge(role) {
  const styles = {
    owner: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    member: 'bg-blue-100 text-blue-700 border-blue-200',
    viewer: 'bg-gray-100 text-gray-600 border-gray-200',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${styles[role]}`}>
      {role}
    </span>
  )
}

// ─── Role Selector ────────────────────────────────────────────────────────────

function RoleSelect({ value, onChange, disabled, canChangeOwner = false }) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="appearance-none rounded-md border border-border bg-background py-1 pl-3 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 cursor-pointer"
      >
        {canChangeOwner && <option value="owner">Owner</option>}
        <option value="admin">Admin</option>
        <option value="member">Member</option>
        <option value="viewer">Viewer</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function TeamDetailPage() {
  const { user } = useAuthContext()
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { mobileOpen, toggleMobile, closeMobile } = useMobileSidebar()

  const [team, setTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [invitations, setInvitations] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const { clearInviteToken, inviteUrl, captureToken } = useInviteToken('/accept-team-invite')

  // Remove member modal
  const [removeTarget, setRemoveTarget] = useState(null)
  const [removing, setRemoving] = useState(false)

  // Role update
  const [updatingRole, setUpdatingRole] = useState(null)

  useEffect(() => {
    fetchTeamData()
  }, [id])

  async function fetchTeamData() {
    setLoading(true)
    setError('')
    try {
      const [teamData, membersData, invitationsData, permissionsData] = await Promise.all([
        teamsApi.get(id),
        teamsApi.listMembers(id),
        teamsApi.listInvitations(id),
        teamsApi.getMyPermissions(id),
      ])

      setTeam(teamData.team)
      setMembers(membersData.members)
      setInvitations(invitationsData.invitations)
      setPermissions(permissionsData.permissions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team data')
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
      const result = await teamsApi.inviteMember(id, {
        email: inviteEmail.trim(),
        role: inviteRole,
        name: inviteName.trim() || undefined,
      })

      setInvitations((prev) => [result.invitation, ...prev])
      captureToken(result)
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

  async function handleRoleChange(member, role) {
    if (role === member.role) return

    setUpdatingRole(member.user_id)
    try {
      const result = await teamsApi.updateMemberRole(id, member.user_id, role)
      setMembers((prev) =>
        prev.map((m) => (m.user_id === member.user_id ? { ...m, role: result.member.role } : m))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setUpdatingRole(null)
    }
  }

  async function handleRemoveMember() {
    if (!removeTarget) return

    setRemoving(true)
    try {
      await teamsApi.removeMember(id, removeTarget.user_id)
      setMembers((prev) => prev.filter((m) => m.user_id !== removeTarget.user_id))
      setRemoveTarget(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
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

  const canInvite = permissions.includes('members.invite')
  const canRemove = permissions.includes('members.remove')
  const canEditRoles = permissions.includes('members.roles.edit')

  if (loading) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Loading team…</p>
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-destructive">Team not found</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/app/teams')}>
              Back to Teams
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile menu button */}
        <button
          onClick={toggleMobile}
          className="lg:hidden fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <Sidebar mobileOpen={mobileOpen} onMobileClose={closeMobile}>
          <div className="mb-6 px-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Navigation
            </p>
          </div>
          <SidebarSection>
            {NAV_ITEMS.map(({ icon: Icon, label, to }) => (
              <Link to={to} key={to} onClick={closeMobile}>
                <SidebarItem
                  icon={<Icon className="h-4 w-4" />}
                  label={label}
                  active={location.pathname === to}
                />
              </Link>
            ))}
            {user?.role === 'admin' && (
              <Link to="/app/admin" onClick={closeMobile}>
                <SidebarItem
                  icon={<Shield className="h-4 w-4" />}
                  label="Admin"
                  active={location.pathname === '/app/admin'}
                />
              </Link>
            )}
          </SidebarSection>
        </Sidebar>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 max-w-5xl">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 gap-2"
            onClick={() => navigate('/app/teams')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Teams
          </Button>

          {/* Page header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                {team.avatar_url ? (
                  <img
                    src={team.avatar_url}
                    alt={team.name}
                    className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg object-cover shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-lg bg-muted shrink-0">
                    <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold truncate">{team.name}</h1>
                    {roleBadge(team.my_role)}
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    {team.member_count} {team.member_count === 1 ? 'member' : 'members'}
                  </p>
                </div>
              </div>
              {canInvite && (
                <Button onClick={() => setInviteOpen(true)} className="gap-2 w-full sm:w-auto sm:shrink-0">
                  <Plus className="h-4 w-4" />
                  Invite Member
                </Button>
              )}
            </div>
          </div>

          {/* Invite token success banner */}
          <InviteTokenBanner inviteUrl={inviteUrl} onDismiss={clearInviteToken} />

          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

          {/* Tabs */}
          <Tabs defaultValue="members">
            <TabsList>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="invitations">Invitations</TabsTrigger>
            </TabsList>

            <TabsContent value="members">
              <Card>
                <CardHeader>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>People who have access to this team.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveTableWrapper>
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.user_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {member.user_avatar ? (
                                <img
                                  src={member.user_avatar}
                                  alt={member.user_name}
                                  className="h-8 w-8 rounded-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{member.user_name || member.email}</p>
                                {member.user_name && (
                                  <p className="text-xs text-muted-foreground">{member.email}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {canEditRoles && member.role !== 'owner' ? (
                              <RoleSelect
                                value={member.role}
                                onChange={(role) => handleRoleChange(member, role)}
                                disabled={updatingRole === member.user_id}
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                {roleBadge(member.role)}
                                {member.role === 'owner' && <Crown className="h-4 w-4 text-yellow-500" />}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(member.joined_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {canRemove && member.role !== 'owner' && member.user_id !== user.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setRemoveTarget(member)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Remove
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </ResponsiveTableWrapper>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invitations">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Invitations</CardTitle>
                  <CardDescription>
                    Invitations that have been sent but not yet accepted.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {invitations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pending invitations</p>
                  ) : (
                    <ResponsiveTableWrapper>
                      <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Sent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invitations.map((inv) => (
                          <TableRow key={inv.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{inv.name || inv.email}</p>
                                {inv.name && (
                                  <p className="text-xs text-muted-foreground">{inv.email}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{roleBadge(inv.role)}</TableCell>
                            <TableCell>
                              <Badge variant={inv.status === 'pending' ? 'warning' : 'secondary'}>
                                {inv.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(inv.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </ResponsiveTableWrapper>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Invite modal */}
      <Modal
        open={inviteOpen}
        onClose={resetInviteModal}
        title="Invite Team Member"
        description="Send an invitation to join this team."
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
                <option value="admin">Admin — Full team access</option>
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
        title="Remove Team Member"
        description={`Are you sure you want to remove ${removeTarget?.user_name || removeTarget?.email} from this team?`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setRemoveTarget(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRemoveMember} disabled={removing}>
            {removing ? 'Removing…' : 'Remove'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
