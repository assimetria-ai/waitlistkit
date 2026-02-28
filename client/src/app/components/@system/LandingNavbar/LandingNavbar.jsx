// @system — Landing page navbar: logo + nav links + login/signup CTAs + mobile menu
// @custom — to override nav links or add brand logo, extend in components/@custom/LandingNavbar/
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Zap } from 'lucide-react'
import { Button } from '../ui/button'
import { useAuthContext } from '@/app/store/@system/auth'
import { info } from '@/config/@system/info'
import { cn } from '@/app/lib/@system/utils'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
]

export function LandingNavbar({ className }) {
  const { isAuthenticated } = useAuthContext()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleNavClick(href) {
    setMobileOpen(false)
    if (href.startsWith('#')) {
      const el = document.querySelector(href)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      navigate(href)
    }
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-200',
        scrolled
          ? 'border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm'
          : 'bg-background',
        className,
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        {/* ── Logo ─────────────────────────────────────────────── */}
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-foreground hover:opacity-80 transition-opacity"
          aria-label={`${info.name} home`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" />
          </span>
          <span className="text-lg tracking-tight">{info.name}</span>
        </Link>

        {/* ── Desktop nav ───────────────────────────────────────── */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map(({ label, href }) => (
            <button
              key={label}
              onClick={() => handleNavClick(href)}
              className="px-4 py-2 text-sm font-medium text-muted-foreground rounded-md hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {label}
            </button>
          ))}
        </nav>

        {/* ── Desktop CTAs ──────────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <Link to="/app">
              <Button size="sm">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  Log In
                </Button>
              </Link>
              <Link to="/auth?tab=register">
                <Button size="sm">Sign Up Free</Button>
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile hamburger ─────────────────────────────────── */}
        <button
          className="flex md:hidden items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* ── Mobile drawer ─────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container py-4 flex flex-col gap-1" aria-label="Mobile navigation">
            {NAV_LINKS.map(({ label, href }) => (
              <button
                key={label}
                onClick={() => handleNavClick(href)}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-muted-foreground rounded-md hover:text-foreground hover:bg-accent transition-colors"
              >
                {label}
              </button>
            ))}

            <div className="mt-3 pt-3 border-t border-border flex flex-col gap-2">
              {isAuthenticated ? (
                <Link to="/app" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full" size="sm">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full" size="sm">
                      Log In
                    </Button>
                  </Link>
                  <Link to="/auth?tab=register" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full" size="sm">
                      Sign Up Free
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
