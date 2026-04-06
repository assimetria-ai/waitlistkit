// @custom — UX Patterns Showcase Page
// Demonstrates all the reusable UX components: Dashboard, Onboarding, User Settings
// This page serves as both a demo and reference for developers

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Rocket,
  Settings,
  CheckCircle2,
  Users,
  TrendingUp,
  FileText,
  DollarSign,
  Activity as ActivityIcon,
  Zap,
  Target,
} from 'lucide-react'
import { Button } from '../../../components/@system/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/@system/Card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/@system/Tabs'
import {
  DashboardLayout,
  StatCard,
  StatCardGrid,
  RecentActivityList,
  QuickActions,
  DataTable,
  WelcomeCard,
  FiltersBar,
  BulkActions,
} from '../../../components/@system/Dashboard'
import {
  OnboardingWizard,
  GuidedTour,
  ProgressChecklist,
} from '../../../components/@system/Onboarding'
import {
  UserSettings,
  ProfileSettings,
  SecuritySettings,
  NotificationSettings,
  PreferencesSettings,
} from '../../../components/@system/UserSettings'

// Demo data for components
const DEMO_STATS = [
  {
    label: 'Total Users',
    value: '2,543',
    trend: { value: 12.5, direction: 'up' },
    description: 'vs last month',
    icon: Users,
  },
  {
    label: 'Revenue',
    value: '$45,234',
    trend: { value: 8.2, direction: 'up' },
    description: 'this month',
    icon: DollarSign,
  },
  {
    label: 'Active Sessions',
    value: '156',
    trend: { value: 3.1, direction: 'down' },
    description: 'right now',
    icon: ActivityIcon,
  },
  {
    label: 'Conversion Rate',
    value: '3.2%',
    trend: { value: 0.4, direction: 'up' },
    description: 'last 7 days',
    icon: TrendingUp,
  },
]

const DEMO_ACTIVITIES = [
  {
    id: 1,
    icon: Users,
    title: 'New user signed up',
    description: 'john@example.com',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    variant: 'success',
  },
  {
    id: 2,
    icon: DollarSign,
    title: 'Payment received',
    description: '$49.99 from Premium plan',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    variant: 'success',
  },
  {
    id: 3,
    icon: FileText,
    title: 'New document created',
    description: 'Project proposal draft',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    variant: 'default',
  },
]

const DEMO_QUICK_ACTIONS = [
  {
    id: 'create-user',
    icon: Users,
    label: 'Add User',
    onClick: () => alert('Add user action triggered'),
  },
  {
    id: 'create-invoice',
    icon: FileText,
    label: 'New Invoice',
    onClick: () => alert('New invoice action triggered'),
  },
  {
    id: 'view-reports',
    icon: TrendingUp,
    label: 'View Reports',
    onClick: () => alert('View reports action triggered'),
  },
]

const DEMO_CHECKLIST_ITEMS = [
  {
    id: 'profile',
    label: 'Complete your profile',
    description: 'Add your name and profile picture',
    completed: true,
    action: () => alert('Navigate to profile'),
  },
  {
    id: 'verify-email',
    label: 'Verify your email',
    description: 'Check your inbox for verification link',
    completed: true,
    action: () => alert('Resend verification email'),
  },
  {
    id: 'invite-team',
    label: 'Invite team members',
    description: 'Collaborate with your team',
    completed: false,
    action: () => alert('Navigate to team invitations'),
  },
  {
    id: 'first-project',
    label: 'Create your first project',
    description: 'Start building something amazing',
    completed: false,
    action: () => alert('Create new project'),
  },
  {
    id: 'integrate',
    label: 'Connect an integration',
    description: 'Connect your favorite tools',
    completed: false,
    action: () => alert('Navigate to integrations'),
  },
]

const GUIDED_TOUR_STEPS = [
  {
    target: '#dashboard-stats',
    title: 'Dashboard Overview',
    content: 'Track your key metrics at a glance with these stat cards.',
    placement: 'bottom',
  },
  {
    target: '#quick-actions',
    title: 'Quick Actions',
    content: 'Access your most common tasks quickly from here.',
    placement: 'right',
  },
  {
    target: '#recent-activity',
    title: 'Recent Activity',
    content: 'Stay updated with the latest events and changes.',
    placement: 'left',
  },
]

export function UXPatternsPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showGuidedTour, setShowGuidedTour] = useState(false)

  return (
    <DashboardLayout>
      <DashboardLayout.Content>
        {/* Page Header */}
        <DashboardLayout.Header
          title="UX Patterns Showcase"
          description="Comprehensive demonstration of all available UX components and patterns"
          actions={
            <Button onClick={() => navigate('/app')}>
              Back to Dashboard
            </Button>
          }
        />

        {/* Overview Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Available UX Patterns
            </CardTitle>
            <CardDescription>
              This template includes pre-built, reusable components for common UX patterns.
              All components are fully customizable and responsive.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex gap-3 p-4 rounded-lg border">
                <LayoutDashboard className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm mb-1">Dashboard Components</h3>
                  <p className="text-xs text-muted-foreground">
                    Stats, charts, tables, activity feeds, and quick actions
                  </p>
                </div>
              </div>
              <div className="flex gap-3 p-4 rounded-lg border">
                <Rocket className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm mb-1">Onboarding Flows</h3>
                  <p className="text-xs text-muted-foreground">
                    Multi-step wizards, guided tours, and progress checklists
                  </p>
                </div>
              </div>
              <div className="flex gap-3 p-4 rounded-lg border">
                <Settings className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm mb-1">User Settings</h3>
                  <p className="text-xs text-muted-foreground">
                    Profile, security, notifications, preferences, and more
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Component Showcase */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="gap-2">
              <Rocket className="h-4 w-4" />
              Onboarding
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="space-y-8">
              {/* Welcome Card */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Welcome Card</h2>
                <WelcomeCard
                  userName="Demo User"
                  message="Welcome back! Here's what you can do:"
                  actions={[
                    { label: 'Take a tour', onClick: () => setShowGuidedTour(true) },
                    { label: 'View docs', onClick: () => alert('Navigate to docs') },
                  ]}
                  onDismiss={() => alert('Welcome card dismissed')}
                />
              </section>

              {/* Stat Cards */}
              <section id="dashboard-stats">
                <h2 className="text-xl font-semibold mb-4">Stat Cards</h2>
                <StatCardGrid>
                  {DEMO_STATS.map((stat) => (
                    <StatCard key={stat.label} {...stat} />
                  ))}
                </StatCardGrid>
              </section>

              {/* Quick Actions & Activity */}
              <div className="grid gap-6 lg:grid-cols-2">
                <section id="quick-actions">
                  <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                  <Card>
                    <CardContent className="pt-6">
                      <QuickActions actions={DEMO_QUICK_ACTIONS} />
                    </CardContent>
                  </Card>
                </section>

                <section id="recent-activity">
                  <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                  <Card>
                    <CardContent className="pt-6">
                      <RecentActivityList items={DEMO_ACTIVITIES} limit={3} />
                    </CardContent>
                  </Card>
                </section>
              </div>

              {/* Data Table */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Data Table with Filters & Bulk Actions</h2>
                <Card>
                  <CardContent className="pt-6">
                    <DataTable
                      columns={[
                        { key: 'name', label: 'Name', sortable: true },
                        { key: 'email', label: 'Email', sortable: true },
                        {
                          key: 'status',
                          label: 'Status',
                          render: (value) => (
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                value === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {value}
                            </span>
                          ),
                        },
                        { key: 'plan', label: 'Plan' },
                      ]}
                      data={[
                        { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', plan: 'Premium' },
                        { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'active', plan: 'Free' },
                        { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'inactive', plan: 'Premium' },
                      ]}
                      searchable
                      paginated
                      selectable
                    />
                  </CardContent>
                </Card>
              </section>
            </div>
          </TabsContent>

          {/* Onboarding Tab */}
          <TabsContent value="onboarding" className="space-y-6">
            <div className="space-y-8">
              {/* Onboarding Wizard */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Multi-Step Onboarding Wizard</h2>
                <Card>
                  <CardHeader>
                    <CardDescription>
                      Guide new users through a step-by-step setup process with progress tracking
                      and state persistence.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => setShowOnboarding(true)}>
                      Launch Onboarding Wizard
                    </Button>
                  </CardContent>
                </Card>
              </section>

              {/* Progress Checklist */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Progress Checklist</h2>
                <Card>
                  <CardHeader>
                    <CardDescription>
                      Help users complete important setup tasks with an interactive checklist.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProgressChecklist
                      items={DEMO_CHECKLIST_ITEMS}
                      title="Get Started"
                      description="Complete these tasks to get the most out of your account"
                      onComplete={() => alert('All tasks completed! 🎉')}
                    />
                  </CardContent>
                </Card>
              </section>

              {/* Guided Tour */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Guided Tour</h2>
                <Card>
                  <CardHeader>
                    <CardDescription>
                      Walk users through your interface with contextual tooltips and highlights.
                      Switch to the Dashboard tab and click the button below to see it in action.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => {
                        setActiveTab('dashboard')
                        setTimeout(() => setShowGuidedTour(true), 300)
                      }}
                    >
                      Start Guided Tour (on Dashboard)
                    </Button>
                  </CardContent>
                </Card>
              </section>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>User Settings Components</CardTitle>
                  <CardDescription>
                    Pre-built settings panels for common user preferences. Each component can be
                    used standalone or combined in a tabbed settings page.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button variant="outline" onClick={() => navigate('/app/settings?tab=profile')}>
                      View Profile Settings
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/app/settings?tab=security')}>
                      View Security Settings
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/app/settings?tab=notifications')}>
                      View Notification Settings
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Components include: Profile, Security (2FA, sessions), Notifications,
                    Preferences, Keyboard Shortcuts, Data Export, and Connected Accounts.
                  </p>
                </CardContent>
              </Card>

              {/* Component Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Component Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProfileSettings />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Guided Tour */}
        {showGuidedTour && (
          <GuidedTour
            steps={GUIDED_TOUR_STEPS}
            onComplete={() => {
              setShowGuidedTour(false)
              alert('Tour completed! 🎉')
            }}
            onSkip={() => setShowGuidedTour(false)}
          />
        )}

        {/* Onboarding Wizard Modal */}
        {showOnboarding && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-background border rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <OnboardingWizard
                onComplete={() => {
                  setShowOnboarding(false)
                  alert('Onboarding completed! 🎉')
                }}
                onSkip={() => setShowOnboarding(false)}
              />
            </div>
          </div>
        )}
      </DashboardLayout.Content>
    </DashboardLayout>
  )
}
