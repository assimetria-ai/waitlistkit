// @system — Landing page: hero + features + CTA + footer
// @custom — override info.ts values (name, tagline) and add your own sections below
import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '../../../components/@system/ui/button'
import { Header } from '../../../components/@system/Header/Header'
import { Footer } from '../../../components/@system/Footer/Footer'
import { Card, CardContent } from '../../../components/@system/Card/Card'
import { FeaturesSection } from '../../../components/@system/FeaturesSection'
import { FAQ } from '../../../components/@custom/FAQ'
import { HeroSection } from '../../../components/@custom/HeroSection/HeroSection'
import { OgMeta } from '../../../components/@system/OgMeta/OgMeta'
import { info } from '../../../../config/@system/info'

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
      {/* @custom — override badge/headline/subtitle/CTA labels via props:    */}
      {/*   <HeroSection headline="Ship faster" subtitle="..." ctaLabel="..." /> */}
      <HeroSection />

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <FeaturesSection />

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-12 sm:py-20">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold">Simple, transparent pricing</h2>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground">
            No hidden fees. Cancel anytime.
          </p>
        </div>

        <div className="grid gap-5 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={plan.highlighted ? 'border-primary shadow-lg' : ''}
            >
              <CardContent className="pt-6 space-y-4">
                {plan.highlighted && (
                  <span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={plan.ctaLink} className="block">
                  <Button
                    className="w-full"
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

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <FAQ />

      {/* ── Footer CTA ───────────────────────────────────────────────────── */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12 sm:py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground">
            Join thousands of teams already using {info.name}.
          </p>
          <div className="mt-6 sm:mt-8 flex justify-center">
            <Link to="/auth?tab=register" className="w-full max-w-xs sm:w-auto">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
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
