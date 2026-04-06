// @system — Component exports
// Central export file for all reusable system components

// Layout & Navigation
export { DashboardLayout } from './Dashboard/DashboardLayout'
export { PageLayout } from './layout'
export { Sidebar, SidebarLogo, SidebarSection, SidebarItem } from './Sidebar'
export { Breadcrumbs, BreadcrumbItem, BreadcrumbsFromPath } from './Breadcrumbs'

// UI Components
export { Button } from './ui/button'
export { Switch } from './ui/switch'
export { Badge } from './ui/badge'
export { Card } from './Card'
export { Alert } from './Alert'
export { Modal, ConfirmModal } from './Modal'
export { Avatar, AvatarGroup } from './Avatar'
export {
  Dropdown,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
  DropdownSubmenu,
} from './Dropdown'

// Form Components
export { Input } from './Form'
export { Textarea } from './Textarea'
export { FileUpload } from './FileUpload'
export { MobileForm } from './MobileForm'
export { MobileModal } from './MobileModal'

// Feedback & Status
export { Spinner } from './Loading'
export { Skeleton } from './Skeleton'
export { EmptyState } from './EmptyState'
export { Toaster } from './Toast'
export { ProgressBar, CircularProgress } from './ProgressBar'

// Navigation
export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs'
export { Pagination, SimplePagination } from './Pagination'
export { CommandPalette, useCommandPalette } from './CommandPalette'

// Dashboard Components
export { StatCard } from './Dashboard/StatCard'
export { WelcomeCard } from './Dashboard/WelcomeCard'
export { QuickActions } from './Dashboard/QuickActions'
export { RecentActivityList } from './Dashboard/RecentActivityList'
export { DataTable } from './Dashboard/DataTable'
export { MobileTable } from './Dashboard/MobileTable'
export { FiltersBar } from './Dashboard/FiltersBar'
export { BulkActions } from './Dashboard/BulkActions'
export { MetricCard, MetricGroup, CompactMetric } from './MetricCard'

// User Settings
export {
  UserSettings,
  SettingsSection,
  SettingsRow,
} from './UserSettings/UserSettings'
export { ProfileSettings } from './UserSettings/ProfileSettings'
export { SecuritySettings } from './UserSettings/SecuritySettings'
export { NotificationSettings } from './UserSettings/NotificationSettings'
export { PreferencesSettings } from './UserSettings/PreferencesSettings'

// Onboarding
export { OnboardingWizard } from './Onboarding/OnboardingWizard'
export { GuidedTour } from './Onboarding/GuidedTour'
export { ProgressChecklist } from './Onboarding/ProgressChecklist'

// Auth & Security
export { ProtectedRoute } from './ProtectedRoute'
export { TwoFactorSetup } from './TwoFactor'
export { OAuthButtons } from './OAuthButtons'

// Marketing Components
export { FeaturesSection } from './FeaturesSection'
export { TestimonialsSection } from './TestimonialsSection'
export { Footer } from './Footer'
export { AnnouncementBanner } from './AnnouncementBanner'

// Tables
export { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption } from './Table'
export { ResponsiveTableWrapper, ResponsiveTableCell, ResponsiveTableHead } from './Table'

// Misc
export { NotificationCenter } from './NotificationCenter'
export { BottomSheet } from './BottomSheet'
