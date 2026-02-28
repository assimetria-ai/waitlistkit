// @system — Billing page with Stripe checkout integration
import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import {
  Home,
  Settings,
  Shield,
  CreditCard,
  Activity,
  Key,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw } from 'lucide-react'
import { Header } from '../../../components/@system/Header/Header'
import { Sidebar, SidebarLogo, SidebarSection, SidebarItem } from '../../../components/@system/Sidebar/Sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/@system/Card/Card'
import { Button } from '../../../components/@system/ui/button'
import { Badge } from '../../../components/@system/Badge/Badge'
import { useAuthContext } from '../../../store/@system/auth'
import { info } from '@/config/@system/info'
import {
  getMySubscription,
  getPlans,
  createCheckoutSession,
  createPortalSession,
  cancelSubscription,
  uncancelSubscription,
  formatAmount,
  formatInterval } from '../../../api/@system/stripe'

const NAV_ITEMS = [
  { icon, label: 'Dashboard', to: '/app' },
  { icon, label: 'Activity', to: '/app/activity' },
  { icon, label: 'Billing', to: '/app/billing' },
  { icon, label: 'API Keys', to: '/app/api-keys' },
  { icon, label: 'Settings', to: '/app/settings' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function statusBadgeVariant(status) {
  switch (status) {
    case 'active':    return 'default'
    case 'trialing':  return 'secondary'
    case 'past_due':  return 'destructive'
    case 'cancelled': return 'destructive'
    default:          return 'outline'
  }
}

function statusLabel(status, cancelAtPeriodEnd) {
  if (status === 'active' && cancelAtPeriodEnd) return 'Cancelling'
  switch (status) {
    case 'active':    return 'Active'
    case 'trialing':  return 'Trial'
    case 'past_due':  return 'Past Due'
    case 'cancelled': return 'Cancelled'
    default:          return 'Inactive'
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function BillingPage() {
  const { user } = useAuthContext()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const [subscription, setSubscription] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(searchParams.get('checkout') === 'success')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [subRes, plansRes] = await Promise.all([getMySubscription(), getPlans()])
      setSubscription(subRes.subscription)
      setPlans(plansRes.plans)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing info')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Strip ?checkout=success from the URL after showing the banner
  useEffect(() => {
    if (showSuccess) {
      const next = new URLSearchParams(searchParams)
      next.delete('checkout')
      setSearchParams(next, { replace: true })
    }
  }, [showSuccess]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCheckout(priceId) {
    setActionLoading(priceId)
    setError('')
    try {
      await createCheckoutSession(priceId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
      setActionLoading(null)
    }
  }

  async function handlePortal() {
    setActionLoading('portal')
    setError('')
    try {
      await createPortalSession()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal')
      setActionLoading(null)
    }
  }

  async function handleCancel() {
    if (!confirm('Cancel your subscription? You will keep access until the end of the billing period.')) return
    setActionLoading('cancel')
    setError('')
    try {
      await cancelSubscription()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleUncancel() {
    setActionLoading('uncancel')
    setError('')
    try {
      await uncancelSubscription()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reverse cancellation')
    } finally {
      setActionLoading(null)
    }
  }

  const hasActiveSub = subscription && ['active', 'trialing'].includes(subscription.status)

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <Sidebar>
          <SidebarLogo name={info.name} />
          <SidebarSection>
            {NAV_ITEMS.map(({ icon, label, to }) => (
              <Link to={to} key={to}>
                <SidebarItem icon={<Icon className="h-4 w-4" />} label={label} active={location.pathname === to} />
              </Link>
            ))}
            {user?.role === 'admin' && (
              <Link to="/app/admin">
                <SidebarItem icon={<Shield className="h-4 w-4" />} label="Admin" active={location.pathname === '/app/admin'} />
              </Link>
            )}
          </SidebarSection>
        </Sidebar>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-auto p-8 max-w-3xl">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">Billing</h1>
              <p className="mt-1 text-muted-foreground">Manage your subscription and payment details.</p>
            </div>
            <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* ── Banners ── */}
          {showSuccess && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-green-800 dark:text-green-200">Payment successful!</p>
                <p className="mt-0.5 text-sm text-green-700 dark:text-green-300">
                  Your subscription is now active. It may take a moment to reflect below.
                </p>
              </div>
              <button onClick={() => setShowSuccess(false)} className="text-green-500 hover:text-green-700" aria-label="Dismiss">
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading billing info…
            </div>
          ) : (
            <>
              {/* ── Current subscription ── */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Current Plan</CardTitle>
                    {subscription && (
                      <Badge variant={statusBadgeVariant(subscription.status)}>
                        {statusLabel(subscription.status, subscription.cancel_at_period_end)}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>Your active Stripe subscription.</CardDescription>
                </CardHeader>
                <CardContent>
                  {subscription ? (
                    <div className="space-y-4">
                      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                        <div>
                          <dt className="text-muted-foreground">Subscription ID</dt>
                          <dd className="mt-0.5 font-mono text-xs break-all">{subscription.stripe_subscription_id}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Status</dt>
                          <dd className="mt-0.5 capitalize">{subscription.status}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Period start</dt>
                          <dd className="mt-0.5">{formatDate(subscription.current_period_start)}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">{subscription.cancel_at_period_end ? 'Access until' : 'Renews'}</dt>
                          <dd className="mt-0.5">{formatDate(subscription.current_period_end)}</dd>
                        </div>
                      </dl>

                      {subscription.cancel_at_period_end && (
                        <p className="rounded bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          Your subscription will not renew after {formatDate(subscription.current_period_end)}.
                        </p>
                      )}

                      {subscription.status === 'past_due' && (
                        <p className="text-sm text-destructive">
                          Your last payment failed. Update your payment method to avoid interruption.
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 border-t pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePortal}
                          disabled={!!actionLoading}
                          className="gap-2"
                        >
                          {actionLoading === 'portal' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                          Manage Billing
                        </Button>

                        {hasActiveSub && !subscription.cancel_at_period_end && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancel}
                            disabled={!!actionLoading}
                            className="text-destructive hover:text-destructive gap-2"
                          >
                            {actionLoading === 'cancel' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Cancel Plan
                          </Button>
                        )}

                        {hasActiveSub && subscription.cancel_at_period_end && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleUncancel}
                            disabled={!!actionLoading}
                            className="gap-2"
                          >
                            {actionLoading === 'uncancel' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Keep My Plan
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">You don't have an active subscription.</p>
                      <Button asChild size="sm">
                        <Link to="/pricing">View Plans</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Available plans — only shown when no active subscription ── */}
              {!hasActiveSub && plans.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Choose a Plan</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {plans.map((plan) => (
                      <Card key={plan.priceId} className="relative">
                        {plan.metadata?.popular === 'true' && (
                          <div className="absolute -top-2.5 left-4">
                            <Badge>Most Popular</Badge>
                          </div>
                        )}
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{plan.name}</CardTitle>
                          {plan.description && <CardDescription className="text-xs">{plan.description}</CardDescription>}
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <span className="text-2xl font-bold">{formatAmount(plan.amount, plan.currency)}</span>
                            <span className="text-muted-foreground text-sm">{formatInterval(plan.interval, plan.intervalCount)}</span>
                          </div>
                          {plan.trialDays && (
                            <p className="text-xs text-muted-foreground">{plan.trialDays}-day free trial included</p>
                          )}
                          <Button
                            className="w-full gap-2"
                            size="sm"
                            onClick={() => handleCheckout(plan.priceId)}
                            disabled={!!actionLoading}
                          >
                            {actionLoading === plan.priceId
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <ExternalLink className="h-4 w-4" />}
                            Get {plan.name}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Footer ── */}
              <p className="mt-10 text-xs text-muted-foreground">
                Payments are securely processed by Stripe. We never store your card details.
              </p>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
