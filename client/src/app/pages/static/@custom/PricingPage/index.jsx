import { useEffect, useState } from 'react'
import { Check, Star, Zap } from 'lucide-react'
import { Button } from '../../../components/@system/ui/button'
import { usePricingPage } from '../../../hooks/@custom/usePricingPage'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PricingPlan {
  id: number
  name: string
  slug: string
  description: string | null
  price_monthly: number
  price_yearly: number
  currency: string
  features
  limits: Record<string, number>
  is_popular: boolean
  sort_order: number
}

type BillingCycle = 'monthly' | 'yearly'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount)
}

function yearlySavings(plan: PricingPlan): number {
  if (plan.price_monthly === 0) return 0
  const monthlyCostPerYear = plan.price_monthly * 12
  return Math.round(((monthlyCostPerYear - plan.price_yearly) / monthlyCostPerYear) * 100)
}

// Seed plans displayed when the API is not yet available
const SEED_PLANS = [
  {
    id: 1, name: 'Free', slug: 'free', description: 'Get started at no cost.',
    price_monthly: 0, price_yearly: 0, currency: 'usd',
    features: ['5 published pages', 'Basic templates', 'Brix subdomain', 'Community support'],
    limits: { pages: 5 }, is_popular: false, sort_order: 0,
  },
  {
    id: 2, name: 'Starter', slug: 'starter', description: 'For creators ready to grow.',
    price_monthly: 19, price_yearly: 190, currency: 'usd',
    features: ['25 published pages', 'All templates', '1 custom domain', 'Email support', 'Analytics dashboard'],
    limits: { pages: 25, custom_domains: 1 }, is_popular: false, sort_order: 1,
  },
  {
    id: 3, name: 'Pro', slug: 'pro', description: 'For growing brands that need power.',
    price_monthly: 49, price_yearly: 490, currency: 'usd',
    features: ['Unlimited pages', 'All templates', '5 custom domains', 'Priority support', 'Analytics + A/B testing', 'Team access (up to 3 seats)'],
    limits: { pages: -1, custom_domains: 5, team_seats: 3 }, is_popular: true, sort_order: 2,
  },
  {
    id: 4, name: 'Agency', slug: 'agency', description: 'For agencies managing multiple brands.',
    price_monthly: 149, price_yearly: 1490, currency: 'usd',
    features: ['Unlimited pages', 'Unlimited custom domains', 'White-label option', 'Dedicated support', 'Unlimited team seats', 'Client management portal'],
    limits: { pages: -1, custom_domains: -1, team_seats: -1 }, is_popular: false, sort_order: 3,
  },
]

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, billing }: { plan: PricingPlan; billing: BillingCycle }) {
  const price = billing === 'monthly' ? plan.price_monthly : plan.price_yearly
  const isFree = price === 0
  const savings = billing === 'yearly' ? yearlySavings(plan) : 0

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-shadow ${
        plan.is_popular
          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-1 ring-primary/30'
          : 'border-border bg-card shadow-sm hover:shadow-md'
      }`}
    >
      {/* Popular badge */}
      {plan.is_popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-md">
            <Star className="h-3 w-3" />
            Most Popular
          </span>
        </div>
      )}

      {/* Plan name + description */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
        {plan.description && (
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
        )}
      </div>

      {/* Price */}
      <div className="mb-6">
        {isFree ? (
          <p className="text-4xl font-extrabold text-foreground">Free</p>
        ) : (
          <div className="flex items-end gap-1.5">
            <span className="text-4xl font-extrabold text-foreground">
              {formatPrice(billing === 'monthly' ? plan.price_monthly : Math.round(plan.price_yearly / 12), plan.currency)}
            </span>
            <span className="mb-1.5 text-sm text-muted-foreground">/ month</span>
          </div>
        )}

        {billing === 'yearly' && !isFree && plan.price_yearly > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Billed {formatPrice(plan.price_yearly, plan.currency)} / year
            {savings > 0 && (
              <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-green-100 border border-green-200 px-1.5 py-0.5 text-green-700 font-medium">
                Save {savings}%
              </span>
            )}
          </p>
        )}
      </div>

      {/* CTA */}
      <Button
        className="w-full mb-6"
        variant={plan.is_popular ? 'default' : 'outline'}
      >
        {isFree ? 'Get Started Free' : `Get ${plan.name}`}
      </Button>

      {/* Features list */}
      <ul className="space-y-2.5 flex-1">
        {(plan.features ?? []).map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PricingPage() {
  const { fetchPlans: fetchPlansHook } = usePricingPage()
  const [plans, setPlans] = useState<PricingPlan[]>(SEED_PLANS)
  const [billing, setBilling] = useState<BillingCycle>('monthly')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadPlans() {
      try {
        const result = await fetchPlansHook()
        if (!cancelled && result.length > 0) setPlans(result)
      } catch {
        // Keep seed plans displayed
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPlans()
    return () => { cancelled = true }
  }, [])

  const hasYearlyOption = plans.some(p => p.price_yearly > 0)

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-16 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm font-medium text-primary">
            <Zap className="h-3.5 w-3.5" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
            Choose the plan that fits your growth
          </h1>
          <p className="text-lg text-muted-foreground">
            Start free, upgrade as you scale. No hidden fees. Cancel any time.
          </p>
        </div>

        {/* Billing toggle */}
        {hasYearlyOption && (
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted p-1">
              <button
                onClick={() => setBilling('monthly')}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                  billing === 'monthly'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all ${
                  billing === 'yearly'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Yearly
                <span className="rounded-full bg-green-100 border border-green-200 px-2 py-0.5 text-xs text-green-700 font-semibold">
                  Save up to 20%
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Plans grid */}
        {loading && plans === SEED_PLANS ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            Loading plans…
          </div>
        ) : (
          <div className={`grid gap-6 ${plans.length <= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'} items-start`}>
            {plans.map(plan => (
              <PlanCard key={plan.id} plan={plan} billing={billing} />
            ))}
          </div>
        )}

        {/* FAQ / reassurance strip */}
        <div className="rounded-2xl border border-border bg-muted/30 px-8 py-6 text-center space-y-2 max-w-2xl mx-auto">
          <p className="text-sm font-semibold text-foreground">All plans include:</p>
          <p className="text-sm text-muted-foreground">
            SSL certificate · 99.9% uptime SLA · GDPR-compliant hosting · No credit card required for Free plan
          </p>
        </div>
      </main>
    </div>
  )
}
