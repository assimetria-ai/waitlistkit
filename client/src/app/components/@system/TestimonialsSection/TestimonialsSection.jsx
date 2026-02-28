// @system — Testimonials section for landing page
// @custom — Replace TESTIMONIALS data with real quotes from your customers
import { Star } from 'lucide-react'
import { Card, CardContent } from '../Card/Card'

const TESTIMONIALS = [
  {
    quote:
      'This template saved us weeks of setup work. We shipped our MVP in record time and the auth system just worked out of the box.',
    name: 'Sarah Chen',
    role: 'CTO',
    company: 'Orbit Labs',
    avatar: 'SC',
    rating: 5 },
  {
    quote:
      'The admin dashboard alone is worth it. We used to spend days building internal tools — now it comes pre-built and customisable.',
    name: 'Marcus Reid',
    role: 'Founder',
    company: 'Stacknova',
    avatar: 'MR',
    rating: 5 },
  {
    quote:
      "Best developer experience I've had with a SaaS boilerplate. Everything is clean, typed, and easy to extend. Highly recommend.",
    name: 'Priya Nair',
    role: 'Lead Engineer',
    company: 'Flowdash',
    avatar: 'PN',
    rating: 5 },
  {
    quote:
      'Went from idea to paying customers in under two weeks. The billing integration and subscription flows were already there — we just plugged in our product.',
    name: 'Tom Eriksson',
    role: 'Product Manager',
    company: 'Cruxly',
    avatar: 'TE',
    rating: 5 },
  {
    quote:
      'I evaluated five templates before this one. Nothing else came close in terms of code quality and the breadth of features included at this price point.',
    name: 'Aisha Mensah',
    role: 'Full-Stack Developer',
    company: 'Freelance',
    avatar: 'AM',
    rating: 5 },
  {
    quote:
      "Our team onboarded in a single afternoon. The folder structure is logical, the docs are clear, and there's a sensible default for everything.",
    name: 'Daniel Park',
    role: 'Engineering Manager',
    company: 'Veloxi',
    avatar: 'DP',
    rating: 5 },
]

function StarRating({ count }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < count ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  )
}

function Avatar({ initials }) {
  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {initials}
    </div>
  )
}

export function TestimonialsSection() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center mb-14">
        <h2 className="text-3xl font-bold">Loved by builders worldwide</h2>
        <p className="mt-3 text-muted-foreground">
          See what teams say after shipping with our template.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map(({ quote, name, role, company, avatar, rating }) => (
          <Card key={name} className="transition-shadow hover:shadow-md">
            <CardContent className="pt-6 flex flex-col gap-4 h-full">
              <StarRating count={rating} />
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                &ldquo;{quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-2 border-t">
                <Avatar initials={avatar} />
                <div>
                  <p className="text-sm font-semibold leading-tight">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    {role} · {company}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
