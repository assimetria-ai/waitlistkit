// @system — Landing page features section: icon grid (3–6 features)
// @custom — to customise, pass `features` prop or import and wrap with your own data
import { Zap, Shield, BarChart3, CreditCard, Database, Globe } from 'lucide-react'
import { Card, CardContent } from '../Card/Card'


const DEFAULT_FEATURES = [
  {
    icon: Zap,
    title: 'Fast by Default',
    description: 'Vite + React 18 with code-splitting, lazy loading, and optimised builds out of the box.' },
  {
    icon: Shield,
    title: 'Secure Auth',
    description: 'JWT sessions with httpOnly cookies, bcrypt passwords, CORS protection, and role-based access.' },
  {
    icon: BarChart3,
    title: 'Built-in Admin',
    description: 'Admin dashboard with user management, subscription oversight, and analytics at a glance.' },
  {
    icon: CreditCard,
    title: 'Stripe Payments',
    description: 'Checkout sessions, subscription webhooks, and billing portal — wired up and ready to go.' },
  {
    icon: Database,
    title: 'PostgreSQL Ready',
    description: 'Typed repos, migration runner, and connection pooling via pg-promise — production-grade from day one.' },
  {
    icon: Globe,
    title: 'Deploy Anywhere',
    description: 'Docker + Dockerfile, Railway one-click deploy, and Heroku Procfile included out of the box.' },
]


export function FeaturesSection({
  features = DEFAULT_FEATURES,
  heading = 'Everything you need to ship',
  subheading = 'A production-ready template so you can focus on your product.' }) {
  return (
    <section className="container mx-auto px-4 py-12 sm:py-20">
      <div className="text-center mb-10 sm:mb-14">
        <h2 className="text-2xl sm:text-3xl font-bold">{heading}</h2>
        <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">{subheading}</p>
      </div>

      <div className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon, title, description }) => (
          <Card
            key={title}
            className="group transition-shadow hover:shadow-md"
          >
            <CardContent className="pt-6">
              <div className="mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
