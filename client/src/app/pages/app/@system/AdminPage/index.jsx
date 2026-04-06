// @system — admin dashboard: user management, subscriptions, email logs, feature flags
import { useEffect, useState, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home, Settings, Shield, CreditCard, Activity, Key, RefreshCw,
  Search, Users, TrendingUp, UserCheck, CalendarDays, ChevronLeft,
  ChevronRight, Mail, Lock, Zap, Globe, MailCheck, MailX, AlertTriangle,
  ToggleLeft, Plus, Trash2, Filter,
} from 'lucide-react'
import { Header } from '../../../components/@system/Header'
import { Sidebar, SidebarSection, SidebarItem } from '../../../components/@system/Sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/@system/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/@system/Table'
import { Button } from '../../../components/@system/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/@system/Tabs'
import { useAuthContext } from '../../../store/@system/auth'
import { api } from '../../../lib/@system/api'
import { AdminUsersTableSkeleton } from '../../../components/@system/Skeleton'


const NAV_ITEMS = [
  { icon: Home, label: 'Dashboard', to: '/app' },
  { icon: Activity, label: 'Activity', to: '/app/activity' },
  { icon: CreditCard, label: 'Billing', to: '/app/billing' },
  { icon: Key, label: 'API Keys', to: '/app/api-keys' },
  { icon: Settings, label: 'Settings', to: '/app/settings' },
]

const PAGE_SIZE = 20

// ── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        checked ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, loading }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">
              {loading ? <span className="inline-block h-7 w-16 animate-pulse rounded bg-muted" /> : value}
            </p>
          </div>
          <div className="rounded-full bg-primary/10 p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Status badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  active:    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  trialing:  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  canceled:  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  past_due:  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
}

function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status ?? '—'}
    </span>
  )
}

// ── Settings section ─────────────────────────────────────────────────────────
function SettingsSection({ title, icon: Icon, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-1 border-b">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function SettingsRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-lg px-1 py-3 hover:bg-muted/30 transition-colors">
      <div>
        <p className="font-medium text-sm">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export function AdminPage() {
  const { user } = useAuthContext()
  const location = useLocation()

  function formatDate(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric' })
  }

  // ── Analytics state ────────────────────────────────────────────────────────
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState('')

  async function fetchStats() {
    setStatsLoading(true)
    setStatsError('')
    try {
      const data = await api.get('/admin/users/stats')
      setStats(data)
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      setStatsLoading(false)
    }
  }

  // ── Users state ────────────────────────────────────────────────────────────
  const [users, setUsers] = useState([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState('')
  const [search, setSearch] = useState('')
  const [usersPage, setUsersPage] = useState(1)
  const [roleUpdating, setRoleUpdating] = useState(null) // userId being updated

  const fetchUsers = useCallback(async (page = 1, searchVal = '') => {
    setUsersLoading(true)
    setUsersError('')
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
      if (searchVal.length >= 2) qs.set('search', searchVal)
      const data = await api.get(`/admin/users?${qs}`)
      setUsers(data.users ?? [])
      setUsersTotal(data.total ?? data.users?.length ?? 0)
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setUsersLoading(false)
    }
  }, [])

  async function handleRoleToggle(u) {
    const newRole = u.role === 'admin' ? 'user' : 'admin'
    setRoleUpdating(u.id)
    try {
      await api.patch(`/admin/users/${u.id}/role`, { role: newRole })
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x))
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setRoleUpdating(null)
    }
  }

  // ── Subscriptions state ────────────────────────────────────────────────────
  const [subscriptions, setSubscriptions] = useState([])
  const [subsLoading, setSubsLoading] = useState(false)
  const [subsError, setSubsError] = useState('')
  const [subsPage, setSubsPage] = useState(1)
  const [subsStatusFilter, setSubsStatusFilter] = useState('')

  async function fetchSubscriptions(page = 1, status = '') {
    setSubsLoading(true)
    setSubsError('')
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
      if (status) qs.set('status', status)
      const data = await api.get(`/admin/subscriptions?${qs}`)
      setSubscriptions(data.subscriptions ?? [])
    } catch (err) {
      setSubsError(err instanceof Error ? err.message : 'Failed to load subscriptions')
    } finally {
      setSubsLoading(false)
    }
  }

  // ── Email logs state ────────────────────────────────────────────────────────
  const [emailLogs, setEmailLogs] = useState([])
  const [emailLogsTotal, setEmailLogsTotal] = useState(0)
  const [emailLogsLoading, setEmailLogsLoading] = useState(false)
  const [emailLogsError, setEmailLogsError] = useState('')
  const [emailLogsPage, setEmailLogsPage] = useState(1)
  const [emailStatusFilter, setEmailStatusFilter] = useState('')
  const [emailStats, setEmailStats] = useState(null)

  async function fetchEmailLogs(page = 1, status = '') {
    setEmailLogsLoading(true)
    setEmailLogsError('')
    try {
      const qs = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String((page - 1) * PAGE_SIZE) })
      if (status) qs.set('status', status)
      const [logsData, statsData] = await Promise.all([
        api.get(`/email-logs?${qs}`),
        api.get('/email-logs/stats'),
      ])
      setEmailLogs(logsData.logs ?? [])
      setEmailLogsTotal(logsData.total ?? 0)
      setEmailStats(statsData.stats ?? null)
    } catch (err) {
      setEmailLogsError(err instanceof Error ? err.message : 'Failed to load email logs')
    } finally {
      setEmailLogsLoading(false)
    }
  }

  // ── Feature flags state ────────────────────────────────────────────────────
  const [featureFlags, setFeatureFlags] = useState([])
  const [flagsLoading, setFlagsLoading] = useState(false)
  const [flagsError, setFlagsError] = useState('')
  const [flagUpdating, setFlagUpdating] = useState(null)
  const [flagCategoryFilter, setFlagCategoryFilter] = useState('')
  const [showAddFlag, setShowAddFlag] = useState(false)
  const [newFlag, setNewFlag] = useState({ key: '', label: '', description: '', category: 'general' })

  async function fetchFeatureFlags(category = '') {
    setFlagsLoading(true)
    setFlagsError('')
    try {
      const qs = category ? `?category=${category}` : ''
      const data = await api.get(`/admin/feature-flags${qs}`)
      setFeatureFlags(data.flags ?? [])
    } catch (err) {
      setFlagsError(err instanceof Error ? err.message : 'Failed to load feature flags')
    } finally {
      setFlagsLoading(false)
    }
  }

  async function handleFlagToggle(flag) {
    setFlagUpdating(flag.key)
    try {
      await api.patch(`/admin/feature-flags/${flag.key}`, { enabled: !flag.enabled })
      setFeatureFlags(prev => prev.map(f => f.key === flag.key ? { ...f, enabled: !f.enabled } : f))
    } catch (err) {
      setFlagsError(err instanceof Error ? err.message : 'Failed to toggle flag')
    } finally {
      setFlagUpdating(null)
    }
  }

  async function handleAddFlag() {
    if (!newFlag.key || !newFlag.label) return
    try {
      const data = await api.post('/admin/feature-flags', newFlag)
      setFeatureFlags(prev => [...prev, data.flag])
      setNewFlag({ key: '', label: '', description: '', category: 'general' })
      setShowAddFlag(false)
    } catch (err) {
      setFlagsError(err instanceof Error ? err.message : 'Failed to create flag')
    }
  }

  async function handleDeleteFlag(key) {
    try {
      await api.delete(`/admin/feature-flags/${key}`)
      setFeatureFlags(prev => prev.filter(f => f.key !== key))
    } catch (err) {
      setFlagsError(err instanceof Error ? err.message : 'Failed to delete flag')
    }
  }

  // ── Initial loads ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchStats()
    fetchUsers(1, '')
    fetchSubscriptions(1, '')
    fetchEmailLogs(1, '')
    fetchFeatureFlags()
  }, [fetchUsers])

  // ── Search with debounce ───────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setUsersPage(1)
      fetchUsers(1, search)
    }, 350)
    return () => clearTimeout(timer)
  }, [search, fetchUsers])

  const usersTotalPages = Math.max(1, Math.ceil((usersTotal || users.length) / PAGE_SIZE))

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
            <Link to="/app/admin">
              <SidebarItem
                icon={<Shield className="h-4 w-4" />}
                label="Admin"
                active={location.pathname === '/app/admin'}
              />
            </Link>
          </SidebarSection>
        </Sidebar>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Admin</h1>
              <p className="mt-1 text-muted-foreground">Manage users, subscriptions, and platform settings.</p>
            </div>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="emails">Email Logs</TabsTrigger>
              <TabsTrigger value="flags">Feature Flags</TabsTrigger>
            </TabsList>

            {/* ── Overview tab ── */}
            <TabsContent value="overview">
              <div className="space-y-6">
                {statsError && (
                  <p className="text-sm text-destructive">{statsError}</p>
                )}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    icon={Users}
                    label="Total Users"
                    value={stats?.total?.toLocaleString() ?? '—'}
                    loading={statsLoading}
                  />
                  <StatCard
                    icon={UserCheck}
                    label="New Today"
                    value={stats?.today?.toLocaleString() ?? '—'}
                    loading={statsLoading}
                  />
                  <StatCard
                    icon={TrendingUp}
                    label="This Week"
                    value={stats?.thisWeek?.toLocaleString() ?? '—'}
                    loading={statsLoading}
                  />
                  <StatCard
                    icon={CalendarDays}
                    label="This Month"
                    value={stats?.thisMonth?.toLocaleString() ?? '—'}
                    loading={statsLoading}
                  />
                </div>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Growth Metrics</CardTitle>
                      <CardDescription>User registration trends.</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchStats}
                      disabled={statsLoading}
                      className="gap-2"
                    >
                      <RefreshCw className={`h-3 w-3 ${statsLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-5 animate-pulse rounded bg-muted" />
                        ))}
                      </div>
                    ) : stats ? (
                      <div className="space-y-3">
                        {[
                          { label: 'Today vs this week', a: stats.today, b: stats.thisWeek },
                          { label: 'This week vs this month', a: stats.thisWeek, b: stats.thisMonth },
                          { label: 'This month vs total', a: stats.thisMonth, b: stats.total },
                        ].map(({ label, a, b }) => {
                          const pct = b > 0 ? Math.round((a / b) * 100) : 0
                          return (
                            <div key={label}>
                              <div className="mb-1 flex justify-between text-sm">
                                <span className="text-muted-foreground">{label}</span>
                                <span className="font-medium">{pct}%</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary transition-all"
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No data available.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── Users tab ── */}
            <TabsContent value="users">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle>Users ({usersTotal || users.length})</CardTitle>
                    <CardDescription>All registered users.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search users…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="h-8 w-48 rounded-md border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchUsers(usersPage, search)}
                      disabled={usersLoading}
                      className="gap-2"
                    >
                      <RefreshCw className={`h-3 w-3 ${usersLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {usersError && (
                    <p className="text-sm text-destructive mb-4">{usersError}</p>
                  )}
                  {usersLoading ? (
                    <AdminUsersTableSkeleton />
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((u) => (
                            <TableRow key={u.id}>
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                #{u.id}
                              </TableCell>
                              <TableCell className="font-medium">{u.name ?? '—'}</TableCell>
                              <TableCell>{u.email}</TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                    u.role === 'admin'
                                      ? 'bg-primary/10 text-primary'
                                      : 'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {u.role}
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {formatDate(u.created_at)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={roleUpdating === u.id || u.id === user?.id}
                                  onClick={() => handleRoleToggle(u)}
                                  className="text-xs h-7"
                                >
                                  {roleUpdating === u.id
                                    ? 'Saving…'
                                    : u.role === 'admin' ? 'Demote' : 'Make Admin'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {!usersLoading && users.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                {search.length >= 2 ? 'No users match your search.' : 'No users found.'}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>

                      {/* Pagination */}
                      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                        <span>Page {usersPage} of {usersTotalPages}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            disabled={usersPage <= 1}
                            onClick={() => {
                              const p = usersPage - 1
                              setUsersPage(p)
                              fetchUsers(p, search)
                            }}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            disabled={usersPage >= usersTotalPages || users.length < PAGE_SIZE}
                            onClick={() => {
                              const p = usersPage + 1
                              setUsersPage(p)
                              fetchUsers(p, search)
                            }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Subscriptions tab ── */}
            <TabsContent value="subscriptions">
              <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle>Subscriptions</CardTitle>
                    <CardDescription>Active and historical subscriptions.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={subsStatusFilter}
                      onChange={e => {
                        setSubsStatusFilter(e.target.value)
                        setSubsPage(1)
                        fetchSubscriptions(1, e.target.value)
                      }}
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">All statuses</option>
                      <option value="active">Active</option>
                      <option value="trialing">Trialing</option>
                      <option value="canceled">Canceled</option>
                      <option value="past_due">Past due</option>
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchSubscriptions(subsPage, subsStatusFilter)}
                      disabled={subsLoading}
                      className="gap-2"
                    >
                      <RefreshCw className={`h-3 w-3 ${subsLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {subsError && (
                    <p className="text-sm text-destructive mb-4">{subsError}</p>
                  )}
                  {subsLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-10 animate-pulse rounded bg-muted" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Started</TableHead>
                            <TableHead>Ends / Renews</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subscriptions.map((s) => (
                            <TableRow key={s.id}>
                              <TableCell>
                                <div className="font-medium text-sm">{s.name ?? s.email}</div>
                                <div className="text-xs text-muted-foreground">{s.email}</div>
                              </TableCell>
                              <TableCell className="text-sm">{s.plan_id ?? s.price_id ?? '—'}</TableCell>
                              <TableCell><StatusBadge status={s.status} /></TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {formatDate(s.created_at)}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {formatDate(s.current_period_end ?? s.canceled_at)}
                              </TableCell>
                            </TableRow>
                          ))}
                          {!subsLoading && subscriptions.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                No subscriptions found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>

                      {/* Pagination */}
                      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                        <span>Page {subsPage}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            disabled={subsPage <= 1}
                            onClick={() => {
                              const p = subsPage - 1
                              setSubsPage(p)
                              fetchSubscriptions(p, subsStatusFilter)
                            }}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            disabled={subscriptions.length < PAGE_SIZE}
                            onClick={() => {
                              const p = subsPage + 1
                              setSubsPage(p)
                              fetchSubscriptions(p, subsStatusFilter)
                            }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Email Logs tab ── */}
            <TabsContent value="emails">
              <div className="space-y-4">
                {/* Email stats cards */}
                {emailStats && (
                  <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                    <StatCard icon={Mail} label="Total Emails" value={Number(emailStats.total ?? 0).toLocaleString()} loading={emailLogsLoading} />
                    <StatCard icon={MailCheck} label="Delivered" value={Number(emailStats.delivered ?? 0).toLocaleString()} loading={emailLogsLoading} />
                    <StatCard icon={MailX} label="Failed" value={Number(emailStats.failed ?? 0).toLocaleString()} loading={emailLogsLoading} />
                    <StatCard icon={AlertTriangle} label="Bounced" value={Number(emailStats.bounced ?? 0).toLocaleString()} loading={emailLogsLoading} />
                  </div>
                )}

                <Card>
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle>Email Logs</CardTitle>
                      <CardDescription>Transactional email delivery history.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={emailStatusFilter}
                        onChange={e => {
                          setEmailStatusFilter(e.target.value)
                          setEmailLogsPage(1)
                          fetchEmailLogs(1, e.target.value)
                        }}
                        className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">All statuses</option>
                        <option value="sent">Sent</option>
                        <option value="delivered">Delivered</option>
                        <option value="failed">Failed</option>
                        <option value="bounced">Bounced</option>
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchEmailLogs(emailLogsPage, emailStatusFilter)}
                        disabled={emailLogsLoading}
                        className="gap-2"
                      >
                        <RefreshCw className={`h-3 w-3 ${emailLogsLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {emailLogsError && (
                      <p className="text-sm text-destructive mb-4">{emailLogsError}</p>
                    )}
                    {emailLogsLoading ? (
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-10 animate-pulse rounded bg-muted" />
                        ))}
                      </div>
                    ) : (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Recipient</TableHead>
                              <TableHead>Subject</TableHead>
                              <TableHead>Template</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Provider</TableHead>
                              <TableHead>Sent</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {emailLogs.map((log) => (
                              <TableRow key={log.id}>
                                <TableCell className="text-sm font-medium">{log.to_address}</TableCell>
                                <TableCell className="text-sm max-w-[200px] truncate">{log.subject}</TableCell>
                                <TableCell>
                                  {log.template ? (
                                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                                      {log.template}
                                    </span>
                                  ) : '—'}
                                </TableCell>
                                <TableCell>
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                    log.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                    log.status === 'sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                    log.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                    log.status === 'bounced' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    'bg-muted text-muted-foreground'
                                  }`}>
                                    {log.status}
                                  </span>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{log.provider ?? '—'}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {log.sent_at ? formatDate(log.sent_at) : formatDate(log.created_at)}
                                </TableCell>
                              </TableRow>
                            ))}
                            {!emailLogsLoading && emailLogs.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                  No email logs found.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>

                        {/* Pagination */}
                        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                          <span>{emailLogsTotal} total emails</span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0"
                              disabled={emailLogsPage <= 1}
                              onClick={() => {
                                const p = emailLogsPage - 1
                                setEmailLogsPage(p)
                                fetchEmailLogs(p, emailStatusFilter)
                              }}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="px-2">Page {emailLogsPage}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0"
                              disabled={emailLogs.length < PAGE_SIZE}
                              onClick={() => {
                                const p = emailLogsPage + 1
                                setEmailLogsPage(p)
                                fetchEmailLogs(p, emailStatusFilter)
                              }}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── Feature Flags tab ── */}
            <TabsContent value="flags">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle>Feature Flags</CardTitle>
                      <CardDescription>Toggle platform features on or off. Changes are persisted immediately.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={flagCategoryFilter}
                        onChange={e => {
                          setFlagCategoryFilter(e.target.value)
                          fetchFeatureFlags(e.target.value)
                        }}
                        className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">All categories</option>
                        {[...new Set(featureFlags.map(f => f.category))].sort().map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddFlag(!showAddFlag)}
                        className="gap-2"
                      >
                        <Plus className="h-3 w-3" />
                        Add Flag
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchFeatureFlags(flagCategoryFilter)}
                        disabled={flagsLoading}
                        className="gap-2"
                      >
                        <RefreshCw className={`h-3 w-3 ${flagsLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {flagsError && (
                      <p className="text-sm text-destructive mb-4">{flagsError}</p>
                    )}

                    {/* Add flag form */}
                    {showAddFlag && (
                      <div className="mb-6 p-4 border rounded-lg bg-muted/30 space-y-3">
                        <p className="text-sm font-medium">New Feature Flag</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="key (e.g. dark_mode)"
                            value={newFlag.key}
                            onChange={e => setNewFlag(prev => ({ ...prev, key: e.target.value }))}
                            className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          <input
                            type="text"
                            placeholder="Label (e.g. Dark Mode)"
                            value={newFlag.label}
                            onChange={e => setNewFlag(prev => ({ ...prev, label: e.target.value }))}
                            className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          <input
                            type="text"
                            placeholder="Description (optional)"
                            value={newFlag.description}
                            onChange={e => setNewFlag(prev => ({ ...prev, description: e.target.value }))}
                            className="h-8 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          <select
                            value={newFlag.category}
                            onChange={e => setNewFlag(prev => ({ ...prev, category: e.target.value }))}
                            className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <option value="general">general</option>
                            <option value="auth">auth</option>
                            <option value="email">email</option>
                            <option value="billing">billing</option>
                            <option value="beta">beta</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleAddFlag} disabled={!newFlag.key || !newFlag.label}>
                            Create
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setShowAddFlag(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {flagsLoading ? (
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="h-14 animate-pulse rounded bg-muted" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {featureFlags.map((flag) => (
                          <div
                            key={flag.key}
                            className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-muted/30 transition-colors border-b last:border-0"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{flag.label}</p>
                                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  {flag.category}
                                </span>
                              </div>
                              {flag.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>
                              )}
                              <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{flag.key}</p>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              <Toggle
                                checked={flag.enabled}
                                onChange={() => handleFlagToggle(flag)}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteFlag(flag.key)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {featureFlags.length === 0 && (
                          <p className="text-center text-muted-foreground py-8">
                            No feature flags configured. Click "Add Flag" to create one.
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
