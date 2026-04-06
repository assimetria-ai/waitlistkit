// @system — UX Components Showcase
// Demonstrates all available UX patterns and components
// Useful for developers and designers to see what's available

import { useState } from 'react'
import { 
  Sparkles, 
  Users, 
  DollarSign, 
  Activity,
  Plus,
  FileText,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
} from 'lucide-react'
import { DashboardLayout, StatCard, StatCardGrid, RecentActivityList, QuickActions, DataTable, WelcomeCard } from '../../../components/@system/Dashboard'
import { Button } from '../../../components/@system/ui/button'
import { EmptyState } from '../../../components/@system/EmptyState'
import { HelpWidget } from '../../../components/@system/HelpWidget'
import { FeedbackWidget } from '../../../components/@system/FeedbackWidget'
import { FeatureSpotlight } from '../../../components/@system/FeatureSpotlight'
import { OnboardingWizard } from '../../../components/@system/Onboarding/OnboardingWizard'
import { GuidedTour } from '../../../components/@system/Onboarding/GuidedTour'
import { CommandPalette } from '../../../components/@system/CommandPalette'
import { AnnouncementBanner } from '../../../components/@system/AnnouncementBanner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/@system/Card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/@system/Tabs'
import { Alert } from '../../../components/@system/Alert'

// Mock data for showcase
const MOCK_STATS = [
  {
    label: 'Total Users',
    value: '2,543',
    trend: 12,
    description: 'vs last month',
    icon: Users,
  },
  {
    label: 'Revenue',
    value: '$45,231',
    trend: 8,
    description: 'vs last month',
    icon: DollarSign,
  },
  {
    label: 'Active Projects',
    value: '127',
    trend: -3,
    description: 'vs last month',
    icon: Activity,
  },
  {
    label: 'Conversion Rate',
    value: '3.24%',
    trend: 5,
    description: 'vs last month',
    icon: Sparkles,
  },
]

const MOCK_ACTIVITY = [
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

const MOCK_QUICK_ACTIONS = [
  {
    id: 'create-user',
    icon: Users,
    label: 'Add User',
    onClick: () => console.log('Add user'),
  },
  {
    id: 'create-invoice',
    icon: FileText,
    label: 'New Invoice',
    onClick: () => console.log('New invoice'),
  },
  {
    id: 'view-reports',
    icon: Activity,
    label: 'View Reports',
    onClick: () => console.log('View reports'),
  },
]

const MOCK_TABLE_DATA = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', plan: 'Premium' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'active', plan: 'Free' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'inactive', plan: 'Premium' },
]

const TABLE_COLUMNS = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (value) => (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        value === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
      }`}>
        {value}
      </span>
    ),
  },
  { key: 'plan', label: 'Plan', sortable: true },
]

const TOUR_STEPS = [
  {
    selector: '[data-tour="dashboard"]',
    title: 'Dashboard Components',
    content: 'This section showcases all available dashboard components.',
  },
  {
    selector: '[data-tour="stats"]',
    title: 'Stat Cards',
    content: 'Display key metrics with optional trend indicators.',
  },
  {
    selector: '[data-tour="feedback"]',
    title: 'User Feedback',
    content: 'Collect feedback with the floating feedback widget.',
  },
]

export function UXShowcasePage() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showFeatureSpotlight, setShowFeatureSpotlight] = useState(false)
  const [tourActive, setTourActive] = useState(false)

  return (
    <DashboardLayout>
      {/* Help and Feedback widgets */}
      <HelpWidget />
      <FeedbackWidget />

      {/* Command palette */}
      <CommandPalette />

      {/* Guided tour */}
      <GuidedTour
        steps={TOUR_STEPS}
        isActive={tourActive}
        onComplete={() => setTourActive(false)}
        onSkip={() => setTourActive(false)}
        storageKey="ux-showcase-tour"
      />

      {/* Feature spotlight modal */}
      <FeatureSpotlight
        isOpen={showFeatureSpotlight}
        onClose={() => setShowFeatureSpotlight(false)}
        feature={{
          title: 'New Feature Spotlight',
          description: 'Highlight new features to your users with beautiful modals. Great for onboarding and feature announcements.',
          badge: 'New',
          cta: {
            label: 'Try it now',
            onClick: () => console.log('Feature CTA clicked'),
          },
        }}
      />

      <DashboardLayout.Content>
        {/* Announcement banner */}
        <AnnouncementBanner
          id="ux-showcase-banner"
          message="🎨 Welcome to the UX Showcase! This page demonstrates all available UI patterns."
          variant="gradient"
          action={{ label: 'Take a tour', onClick: () => setTourActive(true) }}
        />

        <DashboardLayout.Header
          title="UX Components Showcase"
          description="Explore all available UX patterns and components for building your product"
          actions={
            <Button size="sm" variant="outline" onClick={() => setTourActive(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Start Tour
            </Button>
          }
        />

        <Tabs defaultValue="dashboard">
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
            <TabsTrigger value="feedback">Feedback & Help</TabsTrigger>
            <TabsTrigger value="states">States & Alerts</TabsTrigger>
          </TabsList>

          {/* Dashboard Components */}
          <TabsContent value="dashboard" data-tour="dashboard">
            <div className="space-y-6">
              {/* Stat Cards */}
              <DashboardLayout.Section 
                title="Stat Cards" 
                description="Display key metrics with trend indicators"
                data-tour="stats"
              >
                <StatCardGrid>
                  {MOCK_STATS.map((stat) => (
                    <StatCard key={stat.label} {...stat} />
                  ))}
                </StatCardGrid>
              </DashboardLayout.Section>

              {/* Activity & Actions */}
              <div className="grid gap-6 lg:grid-cols-2">
                <DashboardLayout.Section title="Recent Activity">
                  <RecentActivityList items={MOCK_ACTIVITY} />
                </DashboardLayout.Section>

                <DashboardLayout.Section title="Quick Actions">
                  <QuickActions actions={MOCK_QUICK_ACTIONS} />
                </DashboardLayout.Section>
              </div>

              {/* Data Table */}
              <DashboardLayout.Section 
                title="Data Table" 
                description="Sortable, searchable tables with mobile support"
              >
                <DataTable
                  title="Users"
                  data={MOCK_TABLE_DATA}
                  columns={TABLE_COLUMNS}
                  searchPlaceholder="Search users..."
                />
              </DashboardLayout.Section>

              {/* Welcome Card */}
              <DashboardLayout.Section title="Welcome Card">
                <WelcomeCard
                  user={{ name: 'Demo User', email: 'demo@example.com' }}
                  tasks={[
                    { id: '1', title: 'Complete profile', description: 'Add your details', completed: true },
                    { id: '2', title: 'Set up billing', description: 'Add payment method', completed: false },
                    { id: '3', title: 'Invite team', description: 'Collaborate together', completed: false },
                  ]}
                  onTaskClick={(task) => console.log('Task clicked:', task)}
                />
              </DashboardLayout.Section>
            </div>
          </TabsContent>

          {/* Onboarding Components */}
          <TabsContent value="onboarding">
            <div className="space-y-6">
              <DashboardLayout.Section 
                title="Onboarding Wizard" 
                description="Multi-step wizard for new user onboarding"
              >
                <Card>
                  <CardContent className="pt-6">
                    {showOnboarding ? (
                      <OnboardingWizard />
                    ) : (
                      <div className="text-center py-12">
                        <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Onboarding Wizard</h3>
                        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                          Guide new users through setup with a step-by-step wizard
                        </p>
                        <Button onClick={() => setShowOnboarding(true)}>
                          Preview Wizard
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </DashboardLayout.Section>

              <DashboardLayout.Section 
                title="Feature Spotlight" 
                description="Highlight new features to users"
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Feature Spotlight</h3>
                      <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                        Beautiful modals to announce new features and updates
                      </p>
                      <Button onClick={() => setShowFeatureSpotlight(true)}>
                        Show Spotlight
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </DashboardLayout.Section>

              <DashboardLayout.Section 
                title="Guided Tour" 
                description="Interactive product tours with tooltips"
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Guided Tour</h3>
                      <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                        Step-by-step tooltips guide users through your app
                      </p>
                      <Button onClick={() => setTourActive(true)}>
                        Start Tour
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </DashboardLayout.Section>
            </div>
          </TabsContent>

          {/* Feedback & Help */}
          <TabsContent value="feedback" data-tour="feedback">
            <div className="space-y-6">
              <DashboardLayout.Section 
                title="Help Widget" 
                description="Floating help button with search and articles"
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Info className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">In-App Help</h3>
                      <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                        Floating help widget in the bottom-right corner. Click it to search help articles and contact support.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Look for the help icon →
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </DashboardLayout.Section>

              <DashboardLayout.Section 
                title="Feedback Widget" 
                description="Collect user feedback and bug reports"
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">User Feedback</h3>
                      <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                        Floating feedback widget in the bottom-left corner. Users can send bug reports, feature requests, and feedback.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Look for the feedback icon ←
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </DashboardLayout.Section>

              <DashboardLayout.Section 
                title="Command Palette" 
                description="Quick search and navigation (⌘K)"
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Info className="h-12 w-12 text-primary mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Command Palette</h3>
                      <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                        Press <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">⌘K</kbd> or{' '}
                        <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+K</kbd>{' '}
                        to open the command palette
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </DashboardLayout.Section>
            </div>
          </TabsContent>

          {/* States & Alerts */}
          <TabsContent value="states">
            <div className="space-y-6">
              <DashboardLayout.Section title="Empty States">
                <EmptyState
                  icon={FileText}
                  title="No data yet"
                  description="This is what users see when there's nothing to display"
                  action={<Button size="sm">Create First Item</Button>}
                />
              </DashboardLayout.Section>

              <DashboardLayout.Section title="Alert Messages">
                <div className="space-y-3">
                  <Alert variant="default">
                    <Info className="h-4 w-4" />
                    <div>
                      <h4 className="font-medium">Info Alert</h4>
                      <p className="text-sm mt-1">This is an informational message.</p>
                    </div>
                  </Alert>

                  <Alert variant="success">
                    <CheckCircle className="h-4 w-4" />
                    <div>
                      <h4 className="font-medium">Success Alert</h4>
                      <p className="text-sm mt-1">Your action was completed successfully.</p>
                    </div>
                  </Alert>

                  <Alert variant="warning">
                    <AlertCircle className="h-4 w-4" />
                    <div>
                      <h4 className="font-medium">Warning Alert</h4>
                      <p className="text-sm mt-1">Please review this carefully.</p>
                    </div>
                  </Alert>

                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <div>
                      <h4 className="font-medium">Error Alert</h4>
                      <p className="text-sm mt-1">Something went wrong.</p>
                    </div>
                  </Alert>
                </div>
              </DashboardLayout.Section>

              <DashboardLayout.Section title="Loading States">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="Loading..." value="—" loading />
                  <StatCard label="Loading..." value="—" loading />
                  <StatCard label="Loading..." value="—" loading />
                  <StatCard label="Loading..." value="—" loading />
                </div>
              </DashboardLayout.Section>
            </div>
          </TabsContent>
        </Tabs>

        {/* Documentation footer */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Component Documentation</CardTitle>
            <CardDescription>
              All components are mobile-responsive and follow accessibility best practices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2 text-sm">Dashboard Components</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• DashboardLayout</li>
                  <li>• StatCard & StatCardGrid</li>
                  <li>• RecentActivityList</li>
                  <li>• QuickActions</li>
                  <li>• DataTable & MobileTable</li>
                  <li>• WelcomeCard</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-sm">Onboarding</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• OnboardingWizard</li>
                  <li>• GuidedTour</li>
                  <li>• FeatureSpotlight</li>
                  <li>• AnnouncementBanner</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-sm">User Settings</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• UserSettings (tabbed)</li>
                  <li>• ProfileSettings</li>
                  <li>• SecuritySettings</li>
                  <li>• NotificationSettings</li>
                  <li>• PreferencesSettings</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-sm">Utilities</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• ErrorBoundary</li>
                  <li>• EmptyState</li>
                  <li>• HelpWidget</li>
                  <li>• FeedbackWidget</li>
                  <li>• CommandPalette</li>
                  <li>• Skeleton loaders</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout.Content>
    </DashboardLayout>
  )
}
