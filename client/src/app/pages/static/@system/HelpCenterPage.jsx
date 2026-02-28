// @system — Help Center / Knowledge Base page
// @custom — update CATEGORIES and ARTICLES with your product's real content
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  BookOpen,
  ChevronRight,
  ArrowRight,
  MessageCircle,
  FileText,
  Zap,
  Shield,
  CreditCard,
  Users,
  Settings,
  LifeBuoy } from 'lucide-react'
import { Header } from '../../../components/@system/Header/Header'
import { Card, CardContent } from '../../../components/@system/Card/Card'
import { Button } from '../../../components/@system/ui/button'
import { info } from '../../../../config/@system/info'
import { cn } from '../../../lib/@system/utils'

// ── Types ─────────────────────────────────────────────────────────────────────



// ── Data — replace with your own content or fetch from API ───────────────────

export const HELP_CATEGORIES = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'New here? Start with the basics.',
    icon },
  {
    id: 'account',
    title: 'Account & Profile',
    description: 'Manage your account settings and profile.',
    icon },
  {
    id: 'billing',
    title: 'Billing & Plans',
    description: 'Subscriptions, invoices, and plan changes.',
    icon },
  {
    id: 'security',
    title: 'Security & Privacy',
    description: 'Keep your account safe and your data private.',
    icon },
  {
    id: 'integrations',
    title: 'Integrations & API',
    description: 'Connect your tools and use our API.',
    icon },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    description: 'Stuck? Find solutions to common issues.',
    icon },
]

export const HELP_ARTICLES = [
  // Getting Started
  {
    id: '1',
    slug: 'quick-start',
    title: 'Quick start guide',
    excerpt: 'Get up and running in under 5 minutes. Create your account, set up your workspace, and launch your first project.',
    categoryId: 'getting-started',
    readingTime: 3,
    tags: ['setup', 'onboarding'],
    content: `
## Quick Start Guide

Welcome to ${info.name}! This guide will walk you through creating your account and launching your first project.

### Step 1 — Create your account

Navigate to the [register page](/auth?tab=register) and fill in your details. You'll receive a verification email — click the link inside to activate your account.

### Step 2 — Set up your workspace

Once logged in, you'll land on your dashboard. Click **New Project** to create your first workspace. Give it a name and choose a plan that fits your needs.

### Step 3 — Invite your team

Go to **Settings → Team** to invite collaborators. Team members receive an email invitation and can join immediately.

### Step 4 — You're ready

That's it. Explore the dashboard, connect your integrations, and start building.
    `.trim() },
  {
    id: '2',
    slug: 'dashboard-overview',
    title: 'Dashboard overview',
    excerpt: 'Understand each section of your dashboard and how to navigate the interface efficiently.',
    categoryId: 'getting-started',
    readingTime: 4,
    tags: ['dashboard', 'navigation'],
    content: `
## Dashboard Overview

Your dashboard is the central hub for all your activity.

### Navigation sidebar

The left sidebar contains your main navigation:

- **Home** — your activity feed and quick stats
- **Projects** — all your active projects
- **API Keys** — manage your API credentials
- **Settings** — account and workspace settings

### Stats panel

The top panel shows key metrics at a glance: total projects, usage this month, and recent activity.

### Quick actions

Use the **+ New** button in the top-right to quickly create a new project, invite a team member, or generate an API key.
    `.trim() },
  // Account
  {
    id: '3',
    slug: 'update-profile',
    title: 'How to update your profile',
    excerpt: 'Change your name, email address, avatar, and notification preferences from your account settings.',
    categoryId: 'account',
    readingTime: 2,
    tags: ['profile', 'settings'],
    content: `
## Updating Your Profile

Go to **Settings → Profile** to update your personal information.

### Name and email

Click the **Edit** button next to your name or email. Changes to your email address require re-verification — you will receive a confirmation link at the new address.

### Avatar

Click on your avatar thumbnail and upload a new image (JPG, PNG, or GIF, max 2 MB).

### Notifications

Under **Settings → Notifications**, toggle email alerts for activity summaries, security events, and product updates.
    `.trim() },
  {
    id: '4',
    slug: 'delete-account',
    title: 'How to delete your account',
    excerpt: 'Permanently delete your account and all associated data. This action cannot be undone.',
    categoryId: 'account',
    readingTime: 2,
    tags: ['account', 'deletion'],
    content: `
## Deleting Your Account

Go to **Settings → Account → Danger Zone** and click **Delete Account**.

You will be asked to type your email address to confirm. Once confirmed, all your data — projects, API keys, billing records — will be permanently deleted within 30 days.

**Note:** If you have an active paid subscription, cancel it first to avoid further charges.
    `.trim() },
  // Billing
  {
    id: '5',
    slug: 'upgrade-plan',
    title: 'How to upgrade your plan',
    excerpt: 'Move from Starter to Pro or Enterprise in just a few clicks. Your new features activate immediately.',
    categoryId: 'billing',
    readingTime: 3,
    tags: ['billing', 'upgrade', 'plans'],
    content: `
## Upgrading Your Plan

Go to **Settings → Billing → Change Plan**.

### Choosing a plan

- **Starter (Free)** — up to 3 projects, community support
- **Pro ($29/mo)** — unlimited projects, priority support, custom domain
- **Enterprise** — custom pricing, SLA, dedicated support

### Payment

We accept all major credit cards. Payment is processed securely via Stripe. You will receive a receipt by email after each charge.

### Prorating

When you upgrade mid-cycle, we prorate the difference and apply it immediately. Your new limits activate right away.
    `.trim() },
  {
    id: '6',
    slug: 'cancel-subscription',
    title: 'How to cancel your subscription',
    excerpt: 'Cancel anytime from your billing settings. You keep access until the end of your billing period.',
    categoryId: 'billing',
    readingTime: 2,
    tags: ['billing', 'cancel'],
    content: `
## Cancelling Your Subscription

Go to **Settings → Billing → Cancel Plan**.

Your subscription will not renew at the next billing date, but you keep full access until the end of the current period.

### Refunds

We offer a 14-day money-back guarantee on all paid plans. Contact support within 14 days of your last payment to request a refund.
    `.trim() },
  // Security
  {
    id: '7',
    slug: 'enable-2fa',
    title: 'Enable two-factor authentication',
    excerpt: 'Add an extra layer of security to your account with an authenticator app or SMS.',
    categoryId: 'security',
    readingTime: 3,
    tags: ['2fa', 'security', 'authentication'],
    content: `
## Enabling Two-Factor Authentication

Go to **Settings → Security → Two-Factor Authentication** and click **Enable**.

### Authenticator app (recommended)

1. Download an authenticator app (Google Authenticator, Authy, 1Password).
2. Scan the QR code displayed on screen.
3. Enter the 6-digit code from the app to confirm setup.

### Backup codes

After enabling 2FA, download your backup codes and store them safely. Each code can be used once if you lose access to your authenticator app.

### Disabling 2FA

Go to **Settings → Security** and click **Disable 2FA**. You will be asked to enter a code from your authenticator app to confirm.
    `.trim() },
  // Integrations
  {
    id: '8',
    slug: 'api-keys',
    title: 'Generating and using API keys',
    excerpt: 'Create API keys to integrate with external tools and automate your workflows programmatically.',
    categoryId: 'integrations',
    readingTime: 4,
    tags: ['api', 'keys', 'integration'],
    content: `
## API Keys

Go to **API Keys** in your dashboard sidebar to manage your keys.

### Creating a key

Click **New Key**, give it a descriptive name (e.g. "Production server"), and copy the key immediately — it will not be shown again.

### Using the key

Include your API key in the \`Authorization\` header:

\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

### Rotating keys

To rotate a key, create a new one, update your integrations, and then delete the old key.

### Rate limits

API keys are subject to rate limits based on your plan. Pro and Enterprise plans have higher limits. See our [API docs](/docs) for details.
    `.trim() },
  // Troubleshooting
  {
    id: '9',
    slug: 'cant-login',
    title: "Can't log in to your account",
    excerpt: "Forgot your password or locked out? Here's how to regain access quickly.",
    categoryId: 'troubleshooting',
    readingTime: 3,
    tags: ['login', 'password', 'access'],
    content: `
## Can't Log In

### Forgot your password

Go to the [forgot password page](/forgot-password), enter your email, and check your inbox for a reset link. The link expires after 1 hour.

### Account locked

After multiple failed login attempts, your account may be temporarily locked. Wait 15 minutes and try again, or use the password reset flow.

### Email not verified

If you see "Email not verified", check your inbox for the original verification email and click the link. If it expired, log in and request a new one from the banner that appears.

### Still stuck?

Contact us at [${info.supportEmail}](mailto:${info.supportEmail}) and we'll help you recover access.
    `.trim() },
]

// ── Search logic ──────────────────────────────────────────────────────────────

function searchArticles(articles, query){
  if (!query.trim()) return articles
  const q = query.toLowerCase()
  return articles.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q) ||
      (a.tags ?? []).some((t) => t.toLowerCase().includes(q)),
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SearchBar({
  value,
  onChange }) {
  return (
    <div className="relative max-w-xl mx-auto">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
      <input
        type="search"
        placeholder="Search articles…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border bg-card pl-12 pr-4 py-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground"
        aria-label="Search help articles"
      />
    </div>
  )
}

function CategoryGrid({ categories, onSelect }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map(({ id, title, description, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          className="text-left group"
          aria-label={`Browse ${title}`}
        >
          <Card className="h-full transition-shadow group-hover:shadow-md group-hover:border-primary/40">
            <CardContent className="pt-6 flex flex-col gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base group-hover:text-primary transition-colors">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-primary font-medium mt-auto">
                Browse articles <ChevronRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </button>
      ))}
    </div>
  )
}

function ArticleRow({ article }) {
  return (
    <Link
      to={`/help/${article.slug}`}
      className="flex items-start justify-between gap-4 py-4 border-b last:border-b-0 hover:bg-muted/40 -mx-4 px-4 rounded-lg transition-colors group"
    >
      <div className="flex items-start gap-3 min-w-0">
        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">{article.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{article.excerpt}</p>
        </div>
      </div>
      <span className="text-xs text-muted-foreground flex-shrink-0">{article.readingTime} min</span>
    </Link>
  )
}

function PopularArticles({ articles }) {
  const popular = articles.slice(0, 5)
  return (
    <section className="mt-16">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Popular articles</h2>
      </div>
      <Card>
        <CardContent className="pt-2 pb-2">
          {popular.map((a) => (
            <ArticleRow key={a.id} article={a} />
          ))}
        </CardContent>
      </Card>
    </section>
  )
}

function SearchResults({ articles, query }) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-16">
        <Search className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium">No results for "{query}"</p>
        <p className="text-sm text-muted-foreground mt-2">
          Try different keywords or{' '}
          <a href={`mailto:${info.supportEmail}`} className="text-primary underline underline-offset-4">
            contact support
          </a>
          .
        </p>
      </div>
    )
  }

  return (
    <section className="mt-10">
      <p className="text-sm text-muted-foreground mb-4">
        {articles.length} result{articles.length !== 1 ? 's' : ''} for "{query}"
      </p>
      <Card>
        <CardContent className="pt-2 pb-2">
          {articles.map((a) => (
            <ArticleRow key={a.id} article={a} />
          ))}
        </CardContent>
      </Card>
    </section>
  )
}

function CategoryArticleList({
  categoryId,
  onBack }) {
  const category = HELP_CATEGORIES.find((c) => c.id === categoryId)
  const articles = HELP_ARTICLES.filter((a) => a.categoryId === categoryId)

  if (!category) return null

  const Icon = category.icon

  return (
    <section className="mt-8">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        ← All categories
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{category.title}</h2>
          <p className="text-sm text-muted-foreground">{category.description}</p>
        </div>
      </div>

      {articles.length === 0 ? (
        <p className="text-sm text-muted-foreground">No articles in this category yet.</p>
      ) : (
        <Card>
          <CardContent className="pt-2 pb-2">
            {articles.map((a) => (
              <ArticleRow key={a.id} article={a} />
            ))}
          </CardContent>
        </Card>
      )}
    </section>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function HelpCenterPage() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)

  const searchResults = useMemo(
    () => searchArticles(HELP_ARTICLES, query),
    [query],
  )

  const isSearching = query.trim().length > 0

  const categoriesWithCount = HELP_CATEGORIES.map((c) => ({
    ...c,
    articleCount: HELP_ARTICLES.filter((a) => a.categoryId === c.id).length }))

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ── Hero / Search ───────────────────────────────────────────────────── */}
      <section className="bg-muted/40 border-b">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-3">How can we help?</h1>
          <p className="text-muted-foreground mb-8">
            Search our knowledge base or browse categories below.
          </p>
          <SearchBar value={query} onChange={(v) => { setQuery(v); setSelectedCategory(null) }} />
        </div>
      </section>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {isSearching ? (
          <SearchResults articles={searchResults} query={query} />
        ) : selectedCategory ? (
          <CategoryArticleList
            categoryId={selectedCategory}
            onBack={() => setSelectedCategory(null)}
          />
        ) : (
          <>
            {/* Categories */}
            <section>
              <h2 className="text-xl font-semibold mb-6">Browse by category</h2>
              <CategoryGrid categories={categoriesWithCount} onSelect={setSelectedCategory} />
            </section>

            {/* Popular articles */}
            <PopularArticles articles={HELP_ARTICLES} />
          </>
        )}
      </main>

      {/* ── Contact CTA ─────────────────────────────────────────────────────── */}
      <section className={cn('border-t bg-muted/30 mt-8', isSearching && searchResults.length === 0 ? 'mt-0' : '')}>
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-xl border bg-card p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Still need help?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Our support team is available Monday–Friday, 9am–6pm UTC.
                </p>
              </div>
            </div>
            <a href={`mailto:${info.supportEmail}`}>
              <Button className="gap-2 flex-shrink-0">
                Contact Support <ArrowRight className="h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {info.name}. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="/" className="hover:text-foreground">Home</a>
            <a href="/privacy" className="hover:text-foreground">Privacy</a>
            <a href="/terms" className="hover:text-foreground">Terms</a>
            <a href={`mailto:${info.supportEmail}`} className="hover:text-foreground">Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
