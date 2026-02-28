// @system — admin dashboard: user management, subscriptions, stats
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Settings, Shield, CreditCard, Activity, Key, RefreshCw } from 'lucide-react'
import { Header } from '../../../components/@system/Header/Header'
import { Sidebar, SidebarSection, SidebarItem } from '../../../components/@system/Sidebar/Sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/@system/Card/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/@system/Table/Table'
import { Button } from '../../../components/@system/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/@system/Tabs/Tabs'
import { useAuthContext } from '../../../store/@system/auth'
import { api } from '../../../lib/@system/api'
import { AdminUsersTableSkeleton } from '../../../components/@system/Skeleton/Skeleton'


const NAV_ITEMS = [
  { icon: Home, label: 'Dashboard', to: '/app' },
  { icon: Activity, label: 'Activity', to: '/app/activity' },
  { icon: CreditCard, label: 'Billing', to: '/app/billing' },
  { icon: Key, label: 'API Keys', to: '/app/api-keys' },
  { icon: Settings, label: 'Settings', to: '/app/settings' },
]

export function AdminPage() {
  const { user } = useAuthContext()
  const location = useLocation()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function fetchUsers() {
    setLoading(true)
    setError('')
    try {
      const { users } = await api.get('/admin/users')
      setUsers(users)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric' })
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
            {NAV_ITEMS.map(({ icon, label, to }) => (
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

        <main className="flex-1 overflow-auto p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin</h1>
              <p className="mt-1 text-muted-foreground">Manage users, subscriptions, and platform settings.</p>
            </div>
          </div>

          <Tabs defaultValue="users">
            <TabsList className="mb-6">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="settings">Platform</TabsTrigger>
            </TabsList>

            {/* ── Users tab ── */}
            <TabsContent value="users">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Users ({users.length})</CardTitle>
                    <CardDescription>All registered users.</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchUsers}
                    disabled={loading}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  {error && (
                    <p className="text-sm text-destructive mb-4">{error}</p>
                  )}
                  {loading ? (
                    <AdminUsersTableSkeleton />
                  ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
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
                            {u.created_at ? formatDate(u.created_at) : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                      {!loading && users.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No users found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Subscriptions tab ── */}
            <TabsContent value="subscriptions">
              <Card>
                <CardHeader>
                  <CardTitle>Subscriptions</CardTitle>
                  <CardDescription>
                    Active and cancelled subscriptions. Connect Stripe to populate.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    {/* @custom — populate via /admin/subscriptions endpoint */}
                    No subscription data yet.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Platform tab ── */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                  <CardDescription>
                    Global settings that apply to all users.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="font-medium">Maintenance Mode</p>
                      <p className="text-sm text-muted-foreground">Temporarily disable public access.</p>
                    </div>
                    <Button variant="outline" size="sm">Disabled</Button>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="font-medium">New User Registration</p>
                      <p className="text-sm text-muted-foreground">Allow new accounts to be created.</p>
                    </div>
                    <Button variant="outline" size="sm">Enabled</Button>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    {/* @custom — wire these toggles to real feature flags */}
                    Platform settings are read-only placeholders. Implement feature flags to make them functional.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
