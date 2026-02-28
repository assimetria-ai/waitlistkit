// @system — top nav header with auth-aware user menu + mobile hamburger
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Settings, Shield, Menu, X } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Button } from '../ui/button'
import { useAuthContext } from '@/app/store/@system/auth'
import { info } from '@/config/@system/info'
import { cn } from '@/app/lib/@system/utils'

export function Header({ className }) {
  const { user, isAuthenticated, logout } = useAuthContext()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className={cn('border-b border-border bg-background', className)}>
      <div className="container flex h-16 items-center justify-between">
        {/* Brand */}
        <Link to="/" className="font-semibold text-foreground hover:opacity-80 transition-opacity">
          {info.name}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <Link to="/app">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>

              {/* User dropdown */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    {(user.name ?? user.email).charAt(0).toUpperCase()}
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className="z-50 min-w-[180px] rounded-md border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95"
                  >
                    <div className="px-3 py-2 text-sm">
                      <p className="font-medium truncate">{user.name ?? 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <DropdownMenu.Separator className="h-px bg-border my-1" />

                    <DropdownMenu.Item
                      onSelect={() => navigate('/app/settings')}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-none"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </DropdownMenu.Item>

                    {user.role === 'admin' && (
                      <DropdownMenu.Item
                        onSelect={() => navigate('/app/admin')}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground outline-none"
                      >
                        <Shield className="h-4 w-4" />
                        Admin
                      </DropdownMenu.Item>
                    )}

                    <DropdownMenu.Separator className="h-px bg-border my-1" />

                    <DropdownMenu.Item
                      onSelect={handleLogout}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-sm cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 outline-none"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth?tab=register">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-border bg-background px-4 py-4 flex flex-col gap-3">
          {isAuthenticated && user ? (
            <>
              <div className="px-1 pb-2 border-b border-border">
                <p className="font-medium text-sm">{user.name ?? 'User'}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Link to="/app" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  Dashboard
                </Button>
              </Link>
              <Link to="/app/settings" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
              {user.role === 'admin' && (
                <Link to="/app/admin" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                    <Shield className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link to="/auth?tab=register" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
