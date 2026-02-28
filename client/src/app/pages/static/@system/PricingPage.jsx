// @system — public pricing page powered by live Stripe prices
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Loader2, AlertCircle, Zap, Star, Building2 } from 'lucide-react'
import { Header } from '../../../components/@system/Header/Header'
import { Footer } from '../../../components/@system/Footer/Footer'
import { Button } from '../../../components/@system/ui/button'
import { Badge } from '../../../components/@system/Badge/Badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/@system/Card/Card'
import { useAuthContext } from '../../../store/@system/auth'
import { info } from '@/config/@system/info'
import {
  getPlans,
  createCheckoutSession,
  formatAmount,
  formatInterval } from '../../../api/@system/stripe'

// One icon per plan tier — cycles if more plans than icons
const TIER_ICONS = [Zap, Star, Building2]

// Feature bullets per plan. Keyed by metadata.features (comma-separated) or fallback.
function getPlanFeatures(plan) {
  const raw = plan.metadata?.features
  if (raw) return raw.split(',').map((f) => f.trim()).filter(Boolean)
  return [`${plan.name} access`, 'Email support']
}

export function PricingPage() {
  const { isAuthenticated } = useAuthContext()
  const navigate = useNavigate()

  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(null)

  useEffect(() => {
    getPlans()
      .then((res) => setPlans(res.plans))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load plans'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSelectPlan(priceId) {
    if (!isAuthenticated) {
      navigate(`/auth?tab=register&next=/app/billing`)
      return
    }
    setCheckoutLoading(priceId)
    try {
      await createCheckoutSession(priceId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
      setCheckoutLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        {/* ── Heading ── */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that fits your needs. Upgrade or cancel anytime.
          </p>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-8 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Plans ── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : plans.length === 0 ? (
          <Card className="max-w-sm mx-auto border-dashed text-center">
            <CardContent className="py-10 text-sm text-muted-foreground">
              No plans available yet. Check back soon.
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-6 ${plans.length === 1 ? 'max-w-sm mx-auto' : plans.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
            {plans.map((plan, i) => {
              const TierIcon = TIER_ICONS[i % TIER_ICONS.length]
              const isPopular = plan.metadata?.popular === 'true'
              const features = getPlanFeatures(plan)

              return (
                <Card
                  key={plan.priceId}
                  className={`relative flex flex-col ${isPopular ? 'border-primary shadow-lg ring-1 ring-primary' : ''}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="px-3 py-0.5 text-xs">Most Popular</Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TierIcon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                    </div>
                    {plan.description && (
                      <CardDescription>{plan.description}</CardDescription>
                    )}
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{formatAmount(plan.amount, plan.currency)}</span>
                      <span className="ml-1 text-muted-foreground text-sm">{formatInterval(plan.interval, plan.intervalCount)}</span>
                    </div>
                    {plan.trialDays && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {plan.trialDays}-day free trial — no credit card required
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col">
                    {/* Feature list */}
                    <ul className="space-y-2 mb-6 flex-1">
                      {features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      variant={isPopular ? 'default' : 'outline'}
                      onClick={() => handleSelectPlan(plan.priceId)}
                      disabled={!!checkoutLoading}
                    >
                      {checkoutLoading === plan.priceId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        isAuthenticated ? `Get ${plan.name}` : 'Start Free Trial'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* ── FAQ / Footer notes ── */}
        <div className="mt-16 text-center space-y-2 text-sm text-muted-foreground">
          <p>All plans include a 30-day money-back guarantee.</p>
          <p>
            Payments are securely processed by Stripe. We never store your card details.
          </p>
          <p>
            Questions{' '}
            <a href={`mailto:${info.supportEmail}`} className="underline hover:text-foreground">
              Contact us
            </a>
          </p>
          {!isAuthenticated && (
            <p className="pt-2">
              Already have an account{' '}
              <Link to="/auth" className="underline hover:text-foreground font-medium">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
