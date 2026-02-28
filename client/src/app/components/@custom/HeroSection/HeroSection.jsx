// @custom — Hero section component for landing page
// Customize headline, subtitle, badge text, and CTA labels per product.
// Override info.ts to change the default name/tagline.
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '../../@system/ui/button'
import { info } from '../../../../config/@system/info'
import { useAuthContext } from '../../../store/@system/auth'

export function HeroSection({
  badge = 'Now in production',
  headline = info.name,
  subtitle = info.tagline,
  ctaLabel = 'Get Started Free',
  ctaHref = '/auth?tab=register',
  secondaryLabel = 'Sign In',
  secondaryHref = '/auth',
  dashboardLabel = 'Go to Dashboard',
}) {
  const { isAuthenticated } = useAuthContext()

  return (
    <section className="relative container mx-auto px-4 py-14 sm:py-20 lg:py-24 text-center overflow-hidden">
      {/* Decorative background gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 flex items-start justify-center"
      >
        <div className="h-[300px] w-[500px] sm:h-[500px] sm:w-[800px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Badge */}
      {badge && (
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs sm:px-4 sm:py-1.5 sm:text-sm text-muted-foreground mb-6 sm:mb-8">
          <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary shrink-0" />
          {badge}
        </div>
      )}

      {/* Headline */}
      <h1 className="text-3xl font-bold tracking-tight sm:text-5xl lg:text-7xl text-foreground">
        {headline}
      </h1>

      {/* Subtitle */}
      <p className="mt-4 sm:mt-6 text-base sm:text-xl text-muted-foreground max-w-xl sm:max-w-2xl mx-auto leading-relaxed">
        {subtitle}
      </p>

      {/* CTA buttons */}
      <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full max-w-xs sm:max-w-none mx-auto">
        {isAuthenticated ? (
          <Link to="/app" className="w-full sm:w-auto">
            <Button size="lg" className="gap-2 w-full sm:min-w-[180px]">
              {dashboardLabel} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <>
            <Link to={ctaHref} className="w-full sm:w-auto">
              <Button size="lg" className="gap-2 w-full sm:min-w-[180px]">
                {ctaLabel} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to={secondaryHref} className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:min-w-[140px]">
                {secondaryLabel}
              </Button>
            </Link>
          </>
        )}
      </div>
    </section>
  )
}
