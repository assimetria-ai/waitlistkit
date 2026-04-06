// @system — Template dashboard page
// Composes stats cards, recent activity, and quick actions using @system components.
// @custom — Replace STATS, ACTIVITY_ITEMS, and QUICK_ACTIONS with real product data.

import { useNavigate } from 'react-router-dom'
import {
  Users, TrendingUp, DollarSign, Activity,
  Plus, Settings, FileText, Bell,
  CheckCircle, AlertCircle, Info,
} from 'lucide-react'
import {
  DashboardLayout,
  StatCard,
  StatCardGrid,
  RecentActivityList,
  QuickActions,
} from '../app/components/@system/Dashboard'
import { useAuthContext } from '../app/store/@system/auth'

// @custom — Replace with real metric data from your API
const STATS = [
  {
    label: 'Total Users',
    value: '1,248',
    trend: { value: 12, direction: 'up' },
    description: 'vs last month',
    icon: Users,
  },
  {
    label: 'Revenue',
    value: '$4,320',
    trend: { value: 8, direction: 'up' },
    description: 'vs last month',
    icon: DollarSign,
  },
  {
    label: 'Active Sessions',
    value: '342',
    trend: { value: 3, direction: 'down' },
    description: 'right now',
    icon: Activity,
  },
  {
    label: 'Growth',
    value: '+18%',
    trend: { value: 18, direction: 'up' },
    description: 'month over month',
    icon: TrendingUp,
  },
]

// @custom — Replace with real activity events from your API
const ACTIVITY_ITEMS = [
  {
    id: 1,
    icon: CheckCircle,
    title: 'New user registered',
    description: 'alice@example.com signed up',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    variant: 'success',
  },
  {
    id: 2,
    icon: DollarSign,
    title: 'Payment received',
    description: '$49 — Pro plan',
    timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    variant: 'success',
  },
  {
    id: 3,
    icon: AlertCircle,
    title: 'Failed login attempt',
    description: 'bob@example.com — 3 attempts',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    variant: 'warning',
  },
  {
    id: 4,
    icon: Info,
    title: 'System health check',
    description: 'All services operational',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    variant: 'default',
  },
]

// @custom — Replace with actions relevant to your product
const QUICK_ACTIONS = [
  { id: 'new', icon: Plus, label: 'New Item', description: 'Create something new', onClick: () => {} },
  { id: 'reports', icon: FileText, label: 'Reports', description: 'View analytics', onClick: () => {} },
  { id: 'notifications', icon: Bell, label: 'Alerts', description: 'Manage notifications', onClick: () => {} },
  { id: 'settings', icon: Settings, label: 'Settings', description: 'Configure account', onClick: () => {} },
]

export function Dashboard() {
  const { user } = useAuthContext()
  const navigate = useNavigate()

  return (
    <DashboardLayout>
      <DashboardLayout.Content>
        <DashboardLayout.Header
          title={`Welcome back${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
          description="Here's what's happening today."
          actions={
            <button
              onClick={() => navigate('/app/settings')}
              className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
          }
        />

        {/* Stats */}
        <StatCardGrid>
          {STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </StatCardGrid>

        {/* Activity + Quick Actions */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <RecentActivityList
            items={ACTIVITY_ITEMS}
            emptyMessage="No recent activity"
          />
          <QuickActions actions={QUICK_ACTIONS} />
        </div>
      </DashboardLayout.Content>
    </DashboardLayout>
  )
}
