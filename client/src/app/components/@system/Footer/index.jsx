// @system — Landing page footer: link columns, social icons, legal bar
// @custom — Customise FOOTER_LINKS and SOCIAL_LINKS below per product
import { Link } from 'react-router-dom'
import { Twitter, Github, Linkedin, Youtube, Mail } from 'lucide-react'
import { info } from '@/config'

// ── Link columns ─────────────────────────────────────────────────────────────
const FOOTER_LINKS = [
  {
    label: 'Product',
    links: [
      { title: 'Features', href: '/#features' },
      { title: 'Pricing', href: '/#pricing' },
      { title: 'Changelog', href: '/changelog' },
      { title: 'Roadmap', href: '/roadmap' },
    ] },
  {
    label: 'Resources',
    links: [
      { title: 'Documentation', href: '/docs' },
      { title: 'API Reference', href: '/docs/api' },
      { title: 'Blog', href: '/blog' },
      { title: 'Support', href: `mailto:${info.supportEmail}`, external: true },
    ] },
  {
    label: 'Company',
    links: [
      { title: 'About', href: '/about' },
      { title: 'Careers', href: '/careers' },
      { title: 'Contact', href: `mailto:${info.supportEmail}`, external: true },
    ] },
  {
    label: 'Legal',
    links: [
      { title: 'Privacy Policy', href: '/privacy' },
      { title: 'Terms of Service', href: '/terms' },
      { title: 'Cookie Policy', href: '/cookies' },
    ] },
]

// ── Social links ─────────────────────────────────────────────────────────────
const SOCIAL_LINKS = [
  { label: 'Twitter / X', href: 'https://twitter.com', icon: Twitter },
  { label: 'GitHub', href: 'https://github.com', icon: Github },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: Linkedin },
  { label: 'YouTube', href: 'https://youtube.com', icon: Youtube },
  { label: 'Email', href: `mailto:${info.supportEmail}`, icon: Mail },
]

// ── Component ─────────────────────────────────────────────────────────────────
export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t bg-muted/20">
      {/* ── Main columns ───────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 py-8 sm:py-10 md:py-14 grid grid-cols-2 gap-6 sm:gap-8 md:gap-10 md:grid-cols-4 lg:grid-cols-5">
        {/* Brand column */}
        <div className="col-span-2 md:col-span-4 lg:col-span-1 flex flex-col gap-3 sm:gap-4">
          <Link to="/" className="font-bold text-base sm:text-lg text-foreground hover:opacity-80 transition-opacity">
            {info.name}
          </Link>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-[280px] sm:max-w-[220px]">
            {info.tagline}
          </p>

          {/* Social icons */}
          <div className="flex items-center gap-2 sm:gap-3 mt-1">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target={href.startsWith('mailto') ? undefined : '_blank'}
                rel={href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {FOOTER_LINKS.map((col) => (
          <div key={col.label} className="flex flex-col gap-2 sm:gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-1">
              {col.label}
            </h3>
            <ul className="space-y-1.5 sm:space-y-2">
              {col.links.map(({ title, href, external }) => (
                <li key={title}>
                  {external ? (
                    <a
                      href={href}
                      className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors inline-block"
                      target={href.startsWith('mailto') ? undefined : '_blank'}
                      rel={href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                    >
                      {title}
                    </a>
                  ) : (
                    <Link
                      to={href}
                      className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors inline-block"
                    >
                      {title}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Legal bar ──────────────────────────────────────────────────────── */}
      <div className="border-t">
        <div className="container mx-auto px-4 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 text-xs text-muted-foreground">
          <p className="text-center sm:text-left">© {year} {info.name}. All rights reserved.</p>
          <div className="flex items-center gap-3 sm:gap-5 flex-wrap justify-center">
            <Link to="/privacy" className="hover:text-foreground transition-colors whitespace-nowrap">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors whitespace-nowrap">
              Terms of Service
            </Link>
            <Link to="/cookies" className="hover:text-foreground transition-colors whitespace-nowrap">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
