// @system — Landing page: hero + features + CTA + footer
// @custom — to add custom sections (FAQ, HeroSection), create @custom/LandingPage.jsx that wraps or extends this
import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '../../../components/@system/ui/button'
import { Header } from '../../../components/@system/Header'
import { Footer } from '../../../components/@system/Footer'
import { Card, CardContent } from '../../../components/@system/Card'
import { FeaturesSection } from '../../../components/@system/FeaturesSection'
import { OgMeta } from '../../../components/@system/OgMeta'
import { info } from '@/config'

const PLANS = [
  {
    name: 'Starter',
    price: '$0',
    period: 'forever',
    features: ['Up to 3 projects', 'Basic analytics', 'Community support'],
    cta: 'Get Started Free',
    ctaLink: '/auth?tab=register',
    highlighted: false },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    features: ['Unlimited projects', 'Advanced analytics', 'Priority support', 'Custom domain'],
    cta: 'Start Free Trial',
    ctaLink: '/auth?tab=register',
    highlighted: true },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: ['Everything in Pro', 'SLA guarantee', 'Dedicated support', 'On-premise option'],
    cta: 'Contact Sales',
    ctaLink: `mailto:${info.supportEmail}`,
    highlighted: false },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* @system — OG meta tags: title/description/image auto-filled from info config */}
      {/* @custom — pass explicit props to override per-product:                        */}
      {/*   <OgMeta title="MyProduct" description="..." image="https://.../og.png" />   */}
      <OgMeta
        title={info.name}
        description={info.tagline}
        url={info.url}
      />
      <Header />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      {/* @custom — to add a custom hero, create @custom/LandingPage.jsx that includes your HeroSection */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
          {info.tagline}
        </h1>
        <p className="mt-4 sm:mt-5 md:mt-6 text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
          Get started with {info.name} today.
        </p>
        <div className="mt-6 sm:mt-7 md:mt-8 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 max-w-xs sm:max-w-none mx-auto">
          <Link to="/auth?tab=register" className="w-full sm:w-auto">
            <Button size="lg" className="gap-2 w-full sm:w-auto sm:min-w-[180px]">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <FeaturesSection />

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-8 sm:mb-12 md:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Simple, transparent pricing</h2>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
            No hidden fees. Cancel anytime.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={plan.highlighted ? 'border-primary shadow-lg' : ''}
            >
              <CardContent className="pt-5 sm:pt-6 px-4 sm:px-6 space-y-3 sm:space-y-4">
                {plan.highlighted && (
                  <span className="inline-block rounded-full bg-primary px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs font-medium text-primary-foreground">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-xs sm:text-sm text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                </div>
                <ul className="space-y-1.5 sm:space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs sm:text-sm">
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                      <span className="leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to={plan.ctaLink} className="block">
                  <Button
                    className="w-full"
                    size="default"
                    variant={plan.highlighted ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Footer CTA ───────────────────────────────────────────────────── */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-10 sm:py-14 md:py-16 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
            Join thousands of teams already using {info.name}.
          </p>
          <div className="mt-6 sm:mt-7 md:mt-8 flex justify-center">
            <Link to="/auth?tab=register" className="w-full max-w-xs sm:w-auto">
              <Button size="lg" className="gap-2 w-full sm:w-auto sm:min-w-[200px]">
                Create Free Account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  )
}
