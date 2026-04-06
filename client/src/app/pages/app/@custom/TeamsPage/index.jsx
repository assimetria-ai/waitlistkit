// @custom — teams management page
// Allows users to view, create, and switch between teams/workspaces
import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Home,
  Settings,
  Shield,
  CreditCard,
  Activity,
  Users,
  Plus,
  Building2,
  ChevronRight,
  Crown,
  UserPlus,
} from 'lucide-react'
import { Header } from '../../../components/@system/Header'
import { Sidebar, SidebarSection, SidebarItem } from '../../../components/@system/Sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/@system/Card'
import { FormField, Input, Textarea } from '../../../components/@system/Form'
import { Button } from '../../../components/@system/ui/button'
import { Modal } from '../../../components/@system/Modal'
import { Badge } from '../../../components/@system/Badge'
import { useAuthContext } from '../../../store/@system/auth'
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

// ─── Team Card ────────────────────────────────────────────────────────────────

function TeamCard({ team, onSelect }) {
  return (
    <div
      onClick={() => onSelect(team)}
      className="group relative rounded-lg border border-border bg-card p-5 transition-all hover:border-primary hover:shadow-md cursor-pointer"
    >
      <div className="flex items-start gap-4">
        {team.team_avatar ? (
          <img
            src={team.team_avatar}
            alt={team.team_name}
            className="h-12 w-12 rounded-lg object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold truncate">{team.team_name}</h3>
            {team.role === 'owner' && (
              <Crown className="h-4 w-4 text-yellow-500" title="Owner" />
            )}
            <Badge variant={team.role === 'owner' ? 'default' : 'secondary'} className="capitalize">
              {team.role}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">/{team.slug}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyTeams({ onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Building2 className="mx-auto h-12 w-12 text-muted-foreground/40" />
      <p className="mt-4 text-base font-medium text-foreground">No teams yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Create your first team to collaborate with others.
      </p>
      <Button variant="default" size="sm" className="mt-5 gap-2" onClick={onCreate}>
        <Plus className="h-4 w-4" />
        Create your first team
      </Button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function TeamsPage() {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const location = useLocation()

  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Create team modal
  const [createOpen, setCreateOpen] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    fetchTeams()
  }, [])

  async function fetchTeams() {
    setLoading(true)
    setError('')
    try {
      const data = await teamsApi.list()
      setTeams(data.teams)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTeam(e) {
    e.preventDefault()
    if (!teamName.trim()) {
      setCreateError('Team name is required')
      return
    }

    setCreating(true)
    setCreateError('')

    try {
      const result = await teamsApi.create({
        name: teamName.trim(),
        description: teamDescription.trim() || undefined,
      })

      // Add to teams list
      setTeams((prev) => [
        { ...result.team, team_name: result.team.name, slug: result.team.slug, role: 'owner' },
        ...prev,
      ])

      // Close modal
      setCreateOpen(false)
      setTeamName('')
      setTeamDescription('')

      // Navigate to team page
      navigate(`/app/teams/${result.team.id}`)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create team')
    } finally {
      setCreating(false)
    }
  }

  function handleSelectTeam(team) {
    navigate(`/app/teams/${team.team_id}`)
  }

  function resetCreateModal() {
    setCreateOpen(false)
    setTeamName('')
    setTeamDescription('')
    setCreateError('')
  }

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
            {NAV_ITEMS.map(({ icon: Icon, label, to }) => (
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

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
          {/* Page header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">Teams</h1>
              <p className="mt-1 text-muted-foreground">
                Manage your teams and workspaces.
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Team
            </Button>
          </div>

          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

          {/* Teams grid */}
          <Card>
            <CardHeader>
              <CardTitle>My Teams</CardTitle>
              <CardDescription>
                Teams you're a member of. Click to view team details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading teams…</p>
              ) : teams.length === 0 ? (
                <EmptyTeams onCreate={() => setCreateOpen(true)} />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {teams.map((team) => (
                    <TeamCard key={team.team_id || team.id} team={team} onSelect={handleSelectTeam} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info card */}
          <Card className="mt-6 border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">Collaborate with your team</p>
                  <p className="mt-1 text-xs text-blue-700">
                    Invite members to your teams, manage roles, and control access permissions.
                    Each team has its own workspace and settings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Create team modal */}
      <Modal
        open={createOpen}
        onClose={resetCreateModal}
        title="Create New Team"
        description="Create a workspace for your team to collaborate."
      >
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <FormField label="Team Name">
            <Input
              placeholder="Acme Inc"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              autoFocus
              required
            />
          </FormField>
          <FormField label="Description (optional)">
            <Textarea
              placeholder="What is this team for?"
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
              rows={3}
            />
          </FormField>
          {createError && <p className="text-sm text-destructive">{createError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetCreateModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating} className="gap-2">
              <Building2 className="h-4 w-4" />
              {creating ? 'Creating…' : 'Create Team'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
