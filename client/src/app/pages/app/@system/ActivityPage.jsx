// @system — activity feed page: shows audit log / user events
// @custom — replace the empty state with real activity data from your API
import { Link, useLocation } from 'react-router-dom'
import { Home, Settings, Shield, CreditCard, Activity, Key } from 'lucide-react'
import { Header } from '../../../components/@system/Header/Header'
import { Sidebar, SidebarSection, SidebarItem } from '../../../components/@system/Sidebar/Sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/@system/Card/Card'
import { EmptyState } from '../../../components/@system/EmptyState/EmptyState'
import { useAuthContext } from '../../../store/@system/auth'

const NAV_ITEMS = [
  { icon, label: 'Dashboard', to: '/app' },
  { icon, label: 'Activity', to: '/app/activity' },
  { icon, label: 'Billing', to: '/app/billing' },
  { icon, label: 'API Keys', to: '/app/api-keys' },
  { icon, label: 'Settings', to: '/app/settings' },
]

export function ActivityPage() {
  const { user } = useAuthContext()
  const location = useLocation()

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
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

        {/* ── Main content ── */}
        <main className="flex-1 overflow-auto p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Activity</h1>
            <p className="mt-1 text-muted-foreground">
              A log of all actions and events on your account.
            </p>
          </div>

          {/* ── Activity log — @custom: replace with real events from API ── */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>All activity across your account, newest first.</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Activity}
                title="No activity yet"
                description="Events will appear here once you start using the app — logins, changes, and other account actions."
              />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
