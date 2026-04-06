// @system — user profile / settings page
// Now uses the unified UserSettings component with all UX features
import { useState, useEffect } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Home, Settings, Shield, CreditCard, Activity, Key } from 'lucide-react'
import { Header } from '../../../components/@system/Header'
import { Sidebar, SidebarSection, SidebarItem } from '../../../components/@system/Sidebar'
import { UserSettings } from '../../../components/@system/UserSettings'
import { useAuthContext } from '../../../store/@system/auth'
import { SettingsPageSkeleton } from '../../../components/@system/Skeleton'

const NAV_ITEMS = [
  { icon: Home, label: 'Dashboard', to: '/app' },
  { icon: Activity, label: 'Activity', to: '/app/activity' },
  { icon: CreditCard, label: 'Billing', to: '/app/billing' },
  { icon: Key, label: 'API Keys', to: '/app/api-keys' },
  { icon: Settings, label: 'Settings', to: '/app/settings' },
]

export function SettingsPage() {
  const { user, loading: authLoading, updateUser } = useAuthContext()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  // Tab state driven by ?tab= query param
  const activeTab = searchParams.get('tab') ?? 'profile'

  function handleTabChange(tab) {
    setSearchParams({ tab }, { replace: true })
  }

  async function handleSettingsUpdate(updates) {
    try {
      await updateUser(updates)
      return { success: true }
    } catch (error) {
      console.error('Failed to update settings:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save settings' 
      }
    }
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

        {authLoading ? (
          <SettingsPageSkeleton />
        ) : (
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-4xl">
              <div className="mb-8">
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="mt-1 text-muted-foreground">
                  Manage your account preferences and security settings.
                </p>
              </div>

              <UserSettings
                defaultTab={activeTab}
                user={user}
                onUpdate={handleSettingsUpdate}
                onTabChange={handleTabChange}
              />
            </div>
          </main>
        )}
      </div>
    </div>
  )
}
