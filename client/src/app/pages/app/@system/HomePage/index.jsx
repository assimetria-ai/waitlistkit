// @system — main app dashboard page with modern UX components + REAL COST TRACKING
// @custom — add your dashboard widgets/sections in the main content area
import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, DollarSign, Activity as ActivityIcon, TrendingUp, FileText, AlertCircle, Zap } from 'lucide-react'
import { useAuthContext } from '../../../store/@system/auth'
import { HomePageSkeleton } from '../../../components/@system/Skeleton'
import { Button } from '../../../components/@system/ui/button'
import {
  DashboardLayout,
  StatCard,
  StatCardGrid,
  RecentActivityList,
  QuickActions,
  DataTable,
  WelcomeCard,
} from '../../../components/@system/Dashboard'
import { CommandPalette } from '../../../components/@system/CommandPalette'
import { GuidedTour } from '../../../components/@system/Onboarding/GuidedTour'
import { AnnouncementBanner } from '../../../components/@system/AnnouncementBanner'
import { getUsageDashboard, getUsageHistory } from '../../../api/@system/usage'
import { getAdminUsers } from '../../../api/@system/admin'

// @custom — Replace with real actions relevant to your app
const QUICK_ACTIONS = [
  {
    id: 'create-item',
    icon: Plus,
    label: 'New Item',
    onClick: () => {},
  },
  {
    id: 'view-reports',
    icon: TrendingUp,
    label: 'View Reports',
    onClick: () => {},
  },
  {
    id: 'invite-team',
    icon: Users,
    label: 'Invite Team',
    onClick: () => {},
  },
  {
    id: 'api-docs',
    icon: FileText,
    label: 'API Docs',
    onClick: () => {},
  },
]

const USER_TABLE_COLUMNS = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  {
    key: 'created_at',
    label: 'Joined',
    sortable: true,
    render: (value) =>
      value ? new Date(value).toLocaleDateString() : '—',
  },
]

// @custom — Configure guided tour steps for your product
const TOUR_STEPS = [
  {
    selector: '[data-tour="stats"]',
    title: 'Your Key Metrics',
    content: 'Track important numbers at a glance. These update in real-time as your data changes.',
  },
  {
    selector: '[data-tour="quick-actions"]',
    title: 'Quick Actions',
    content: 'Access your most-used features in one click. You can also press ⌘K to search for any action.',
  },
  {
    selector: '[data-tour="activity"]',
    title: 'Recent Activity',
    content: 'Stay on top of everything happening in your account with the activity feed.',
  },
  {
    selector: '[data-tour="data-table"]',
    title: 'Data Tables',
    content: 'Search, sort, and filter your data. Click any row to view details.',
  },
]

// @custom — Configure onboarding tasks for new users
const ONBOARDING_TASKS = [
  {
    id: 'profile',
    title: 'Complete your profile',
    description: 'Add your name and photo',
    route: '/app/settings',
  },
  {
    id: 'billing',
    title: 'Set up billing',
    description: 'Add a payment method',
    route: '/app/billing',
  },
  {
    id: 'invite',
    title: 'Invite your team',
    description: 'Collaborate with teammates',
    route: '/app/teams',
  },
  {
    id: 'api-key',
    title: 'Create an API key',
    description: 'Start integrating',
    route: '/app/api-keys',
  },
]

// Map usage event to activity list item format
function usageEventToActivity(event) {
  return {
    id: event.id,
    icon: Zap,
    title: `${event.service} — ${event.operation || 'request'}`,
    description: event.cost_usd > 0 ? `$${Number(event.cost_usd).toFixed(4)}` : null,
    timestamp: event.created_at,
    variant: 'default',
  }
}

export function HomePage() {
  const { user, loading } = useAuthContext()
  const navigate = useNavigate()
  const [tourActive, setTourActive] = useState(false)

  // Cost/usage stats
  const [usageData, setUsageData] = useState(null)
  const [usageLoading, setUsageLoading] = useState(true)
  const [usageError, setUsageError] = useState(null)

  // Recent activity (usage events)
  const [activityItems, setActivityItems] = useState([])
  const [activityLoading, setActivityLoading] = useState(true)

  // Recent users (admin only)
  const [recentUsers, setRecentUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (!user || loading) return

    async function loadUsageData() {
      try {
        setUsageLoading(true)
        const data = await getUsageDashboard()
        setUsageData(data)
        setUsageError(null)
      } catch (err) {
        console.error('Failed to load usage data:', err)
        setUsageError(err.message)
      } finally {
        setUsageLoading(false)
      }
    }

    async function loadActivity() {
      try {
        setActivityLoading(true)
        const data = await getUsageHistory({ limit: 10 })
        const items = (data?.events ?? []).map(usageEventToActivity)
        setActivityItems(items)
      } catch (err) {
        console.error('Failed to load activity:', err)
        setActivityItems([])
      } finally {
        setActivityLoading(false)
      }
    }

    loadUsageData()
    loadActivity()
  }, [user, loading])

  useEffect(() => {
    if (!isAdmin || loading) return

    async function loadRecentUsers() {
      try {
        setUsersLoading(true)
        const data = await getAdminUsers({ limit: 10, page: 1 })
        setRecentUsers(data?.users ?? [])
      } catch (err) {
        console.error('Failed to load recent users:', err)
        setRecentUsers([])
      } finally {
        setUsersLoading(false)
      }
    }

    loadRecentUsers()
  }, [isAdmin, loading])

  // Build stats from real cost data
  const stats = usageData
    ? [
        {
          label: 'Today\'s Cost',
          value: `$${usageData.today.cost.toFixed(2)}`,
          trend: usageData.yesterday.change,
          description: 'vs yesterday',
          icon: DollarSign,
        },
        {
          label: 'This Month',
          value: `$${usageData.thisMonth.cost.toFixed(2)}`,
          trend: usageData.lastMonth.change,
          description: usageData.limits?.monthly
            ? `${usageData.thisMonth.percentUsed}% of $${usageData.limits.monthly} limit`
            : 'this month',
          icon: TrendingUp,
        },
        ...(usageData.topServices.slice(0, 2).map(service => ({
          label: service.service.charAt(0).toUpperCase() + service.service.slice(1),
          value: `$${service.cost.toFixed(2)}`,
          trend: null,
          description: `${service.requests} requests`,
          icon: ActivityIcon,
        }))),
      ]
    : [
        {
          label: 'Today\'s Cost',
          value: '—',
          trend: null,
          description: 'Loading...',
          icon: DollarSign,
        },
        {
          label: 'This Month',
          value: '—',
          trend: null,
          description: 'Loading...',
          icon: TrendingUp,
        },
      ]

  // @custom — Replace with real completion logic from your API
  const tasks = ONBOARDING_TASKS.map((task) => ({
    ...task,
    completed: user?.onboardingCompleted ? true : false,
  }))

  const handleTaskClick = useCallback(
    (task) => {
      if (task.route) navigate(task.route)
    },
    [navigate]
  )

  if (loading) {
    return <HomePageSkeleton />
  }

  return (
    <DashboardLayout>
      {/* Announcement banner — @custom: change message/variant as needed */}
      <AnnouncementBanner
        id="welcome-v1"
        message="Real-time cost tracking is now live. Monitor your usage across all services."
        variant="gradient"
        action={{ label: 'Learn more', href: '/app/billing' }}
      />

      {/* Command palette — available globally via ⌘K */}
      <CommandPalette />

      {/* Guided tour — starts on demand */}
      <GuidedTour
        steps={TOUR_STEPS}
        isActive={tourActive}
        onComplete={() => setTourActive(false)}
        onSkip={() => setTourActive(false)}
        storageKey="dashboard-tour-completed"
      />

      <DashboardLayout.Content>
        {/* Welcome card with onboarding checklist for new users */}
        {!user?.onboardingCompleted && (
          <div className="mb-6">
            <WelcomeCard
              user={user}
              tasks={tasks}
              onTaskClick={handleTaskClick}
              onDismiss={() => {}}
            />
          </div>
        )}

        {/* Cost limit warning */}
        {usageData?.limits?.monthly && usageData.thisMonth.percentUsed > 80 && (
          <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/50 dark:bg-orange-900/20">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-500 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Approaching monthly cost limit
                </h3>
                <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                  You've used {usageData.thisMonth.percentUsed}% of your ${usageData.limits.monthly} monthly limit.
                  {' '}
                  <a href="/app/billing" className="font-medium underline">Adjust limits</a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Page header */}
        <DashboardLayout.Header
          title={`Welcome back${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
          description="Here's what's happening with your account today."
          actions={
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTourActive(true)}
                className="text-muted-foreground"
              >
                Take a tour
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/app/billing')}>
                <DollarSign className="h-4 w-4 mr-2" />
                View Usage
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Item
              </Button>
            </>
          }
        />

        {/* Stats grid with REAL cost data */}
        <StatCardGrid data-tour="stats">
          {usageLoading ? (
            <div className="col-span-4 text-center text-muted-foreground py-8">
              Loading cost data...
            </div>
          ) : usageError ? (
            <div className="col-span-4 text-center text-muted-foreground py-8">
              {usageError}
            </div>
          ) : (
            stats.map((stat) => <StatCard key={stat.label} {...stat} />)
          )}
        </StatCardGrid>

        {/* Cost trends chart */}
        {usageData?.trends && (
          <div className="mt-6">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="text-lg font-semibold mb-4">7-Day Cost Trend</h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {usageData.trends.map((day, i) => {
                  const maxCost = Math.max(...usageData.trends.map(d => d.cost), 1)
                  const height = (day.cost / maxCost) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-primary/10 rounded-t relative" style={{ height: `${height}%` }}>
                        <div className="absolute inset-0 bg-primary rounded-t hover:bg-primary/80 transition-colors" />
                      </div>
                      <span className="text-xs text-muted-foreground mt-2">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className="text-xs font-medium">${day.cost.toFixed(2)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Recent activity — real usage events */}
          <div data-tour="activity">
            {activityLoading ? (
              <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
                Loading activity...
              </div>
            ) : activityItems.length > 0 ? (
              <RecentActivityList items={activityItems} />
            ) : (
              <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
                <p className="font-medium">No activity yet</p>
                <p className="text-sm mt-1">Activity will appear here as you use the app.</p>
              </div>
            )}
          </div>

          {/* Quick actions — @custom: update with real actions for your product */}
          <div data-tour="quick-actions">
            <QuickActions actions={QUICK_ACTIONS} />
          </div>
        </div>

        {/* Data table — admin: real users; non-admin: empty state */}
        <div className="mt-6" data-tour="data-table">
          {isAdmin ? (
            <DataTable
              title="Recent Users"
              description="Latest signups and account activity"
              data={recentUsers}
              columns={USER_TABLE_COLUMNS}
              loading={usersLoading}
              onRowClick={(row) => navigate(`/app/admin/users/${row.id}`)}
              searchPlaceholder="Search users..."
              emptyMessage="No users yet."
            />
          ) : (
            <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
              {/* @custom — replace with product-specific content */}
              <p className="font-medium">Nothing here yet</p>
              <p className="text-sm mt-1">Your data will appear here as you get started.</p>
            </div>
          )}
        </div>
      </DashboardLayout.Content>
    </DashboardLayout>
  )
}
