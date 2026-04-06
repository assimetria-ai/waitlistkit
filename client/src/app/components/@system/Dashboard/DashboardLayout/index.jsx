// @system — Standard dashboard layout with responsive sidebar and header
// Provides consistent layout structure for all app pages
// Mobile: hamburger menu with drawer sidebar
// Desktop: persistent sidebar
//
// Usage:
// <DashboardLayout>
//   <DashboardLayout.Header
//     title="Dashboard"
//     description="Welcome back!"
//     actions={<Button>Action</Button>}
//   />
//   <DashboardLayout.Content>
//     {/* Your dashboard content */}
//   </DashboardLayout.Content>
// </DashboardLayout>

import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Settings, Shield, CreditCard, LayoutDashboard, Menu, Users, FileText, BarChart3, Zap, Lock, History, TrendingUp, Plug } from 'lucide-react'
import { Button } from '../ui/button'
import { Header } from '../Header'
import { Sidebar, SidebarLogo, SidebarSection, SidebarItem } from '../Sidebar'
import { info } from '@/config'
import { useAuthContext } from '@/app/store/@system/auth'
import { cn } from '@/app/lib/@system/utils'

const DEFAULT_NAV_ITEMS = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', to: '/app' },
      { icon: BarChart3, label: 'Analytics', to: '/app/analytics' },
      { icon: Users, label: 'Users', to: '/app/users' },
    ],
  },
  {
    label: 'Product',
    items: [
      { icon: Zap, label: 'Features', to: '/app/features' },
      { icon: Lock, label: 'Access Control', to: '/app/access-control' },
      { icon: History, label: 'Changelog', to: '/app/changelog' },
    ],
  },
  {
    label: 'Billing',
    items: [
      { icon: CreditCard, label: 'Subscriptions', to: '/app/subscriptions' },
      { icon: TrendingUp, label: 'Revenue', to: '/app/revenue' },
      { icon: FileText, label: 'Invoices', to: '/app/invoices' },
    ],
  },
  {
    label: 'System',
    items: [
      { icon: Plug, label: 'Integrations', to: '/app/integrations' },
      { icon: Settings, label: 'Settings', to: '/app/settings' },
    ],
  },
]

/**
 * @typedef {Object} NavItem
 * @property {React.ComponentType} icon - Lucide icon component
 * @property {string} label - Navigation label
 * @property {string} to - Route path
 * @property {boolean} [adminOnly] - Show only for admin users
 */

/**
 * @typedef {Object} NavSection
 * @property {string} label - Section heading
 * @property {NavItem[]} items - Items in this section
 */

/**
 * DashboardLayout — Main layout container with responsive sidebar
 * @param {Object} props
 * @param {React.ReactNode} props.children - Layout content
 * @param {NavSection[]} [props.navItems] - Navigation sections (defaults to standard sections)
 * @param {boolean} [props.showSidebar=true] - Toggle sidebar visibility
 */
export function DashboardLayout({ children, navItems = DEFAULT_NAV_ITEMS, showSidebar = true }) {
  const { user } = useAuthContext()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile hamburger button */}
        {showSidebar && (
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}

        {/* Sidebar */}
        {showSidebar && (
          <Sidebar
            mobileOpen={mobileMenuOpen}
            onMobileClose={() => setMobileMenuOpen(false)}
          >
            <SidebarLogo name={info.name} />
            {navItems.map(({ label: sectionLabel, items }) => (
              <SidebarSection key={sectionLabel} label={sectionLabel}>
                {items.map(({ icon: Icon, label, to, adminOnly }) => {
                  if (adminOnly && user?.role !== 'admin') return null
                  return (
                    <Link
                      to={to}
                      key={to}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <SidebarItem
                        icon={<Icon className="h-4 w-4" />}
                        label={label}
                        active={location.pathname === to}
                      />
                    </Link>
                  )
                })}
              </SidebarSection>
            ))}
            {user?.role === 'admin' && (
              <SidebarSection label="Admin">
                <Link to="/app/admin" onClick={() => setMobileMenuOpen(false)}>
                  <SidebarItem
                    icon={<Shield className="h-4 w-4" />}
                    label="Admin"
                    active={location.pathname === '/app/admin'}
                  />
                </Link>
              </SidebarSection>
            )}
          </Sidebar>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

/**
 * DashboardLayout.Header — Page header with title and optional actions
 * Responsive: stacks on mobile, horizontal on desktop
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} [props.description] - Optional description text
 * @param {React.ReactNode} [props.actions] - Optional action buttons
 * @param {string} [props.className] - Additional CSS classes
 */
DashboardLayout.Header = function DashboardHeader({ title, description, actions, className }) {
  return (
    <div className={cn(
      'flex flex-col gap-4 mb-6',
      'sm:flex-row sm:items-start sm:justify-between',
      className
    )}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  )
}

/**
 * DashboardLayout.Content — Scrollable content area with responsive padding
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.noPadding] - Remove default padding
 */
DashboardLayout.Content = function DashboardContent({ children, className, noPadding = false }) {
  return (
    <div className={cn(
      !noPadding && 'p-4 sm:p-6 lg:p-8',
      className
    )}>
      {children}
    </div>
  )
}

/**
 * DashboardLayout.Section — Content section with optional title
 * Responsive heading sizes and spacing
 * @param {Object} props
 * @param {React.ReactNode} props.children - Section content
 * @param {string} [props.title] - Section title
 * @param {string} [props.description] - Section description
 * @param {React.ReactNode} [props.actions] - Optional section actions
 * @param {string} [props.className] - Additional CSS classes
 */
DashboardLayout.Section = function DashboardSection({ children, title, description, actions, className, ...rest }) {
  return (
    <section className={cn('mb-6 sm:mb-8', className)} {...rest}>
      {(title || actions) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
          {title && (
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">{title}</h2>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          )}
          {actions && (
            <div className="flex items-center gap-2 flex-wrap">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  )
}
