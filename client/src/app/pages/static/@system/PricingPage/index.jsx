// @system — public pricing page powered by live Stripe prices
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Loader2, AlertCircle, Zap, Star, Building2 } from 'lucide-react'
import { Header } from '../../../components/@system/Header'
import { Footer } from '../../../components/@system/Footer'
import { Button } from '../../../components/@system/ui/button'
import { Badge } from '../../../components/@system/Badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/@system/Card'
import { useAuthContext } from '../../../store/@system/auth'
import { info } from '@/config'
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

      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12 md:py-16 sm:px-6 lg:px-8">
        {/* ── Heading ── */}
        <div className="mb-8 sm:mb-10 md:mb-12 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
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
          <div className={`grid gap-4 sm:gap-6 ${plans.length === 1 ? 'max-w-sm mx-auto' : plans.length === 2 ? 'sm:grid-cols-2 max-w-2xl mx-auto' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
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
                      <Badge className="px-2.5 sm:px-3 py-0.5 text-xs">Most Popular</Badge>
                    </div>
                  )}

                  <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                    <div className="flex items-center gap-2 mb-2">
                      <TierIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      <CardTitle className="text-base sm:text-lg">{plan.name}</CardTitle>
                    </div>
                    {plan.description && (
                      <CardDescription className="text-xs sm:text-sm">{plan.description}</CardDescription>
                    )}
                    <div className="mt-3 sm:mt-4">
                      <span className="text-3xl sm:text-4xl font-bold">{formatAmount(plan.amount, plan.currency)}</span>
                      <span className="ml-1 text-muted-foreground text-xs sm:text-sm">{formatInterval(plan.interval, plan.intervalCount)}</span>
                    </div>
                    {plan.trialDays && (
                      <p className="text-xs text-muted-foreground mt-1 sm:mt-1.5">
                        {plan.trialDays}-day free trial — no credit card required
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col px-4 sm:px-6">
                    {/* Feature list */}
                    <ul className="space-y-1.5 sm:space-y-2 mb-5 sm:mb-6 flex-1">
                      {features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-xs sm:text-sm">
                          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary mt-0.5 shrink-0" />
                          <span className="leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full"
                      size="default"
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
        <div className="mt-10 sm:mt-12 md:mt-16 text-center space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground px-4">
          <p>All plans include a 30-day money-back guarantee.</p>
          <p>
            Payments are securely processed by Stripe. We never store your card details.
          </p>
          <p>
            Questions?{' '}
            <a href={`mailto:${info.supportEmail}`} className="underline hover:text-foreground">
              Contact us
            </a>
          </p>
          {!isAuthenticated && (
            <p className="pt-2">
              Already have an account?{' '}
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
