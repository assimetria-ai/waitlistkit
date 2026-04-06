import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layout,
  Eye,
  Edit2,
  Plus,
  Globe,
  BarChart2,
  FileText,
  Zap,
} from 'lucide-react'
import { Header } from '../../../components/@system/Header'
import { PageLayout } from '../../../components/@system/PageLayout'
import { Button } from '../../../components/@system/ui/button'
import { useBrixDashboard } from '../../../hooks/@custom/useBrixDashboard'

// ─── Types ────────────────────────────────────────────────────────────────────

type PageStatus = 'published' | 'draft'

interface BrixPage {
  id: number
  name: string
  slug: string
  status: PageStatus
  last_modified: string
  visitors: number
}

interface BrixStats {
  total_pages: number
  published_pages: number
  total_visitors: number
  conversion_rate: number
}

interface Template {
  id: string
  name: string
  description: string
  icon
  badge?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

const TEMPLATES = [
  {
    id: 'product-landing',
    name: 'Product Landing',
    description: 'High-converting single-product page with hero, benefits and CTA.',
    icon: <ShoppingBagIcon />,
    badge: 'Popular',
  },
  {
    id: 'coming-soon',
    name: 'Coming Soon',
    description: 'Build hype before launch with an email capture countdown page.',
    icon: <ZapIcon />,
  },
  {
    id: 'collection-page',
    name: 'Collection Page',
    description: 'Showcase a full product catalogue with filters and grid layout.',
    icon: <GridIcon />,
  },
  {
    id: 'flash-sale',
    name: 'Flash Sale',
    description: 'Urgency-driven layout with countdown timer and bulk discount blocks.',
    icon: <SaleIcon />,
    badge: 'New',
  },
  {
    id: 'brand-story',
    name: 'Brand Story',
    description: 'Long-form storytelling page to build trust and loyalty.',
    icon: <StoryIcon />,
  },
  {
    id: 'bundle-builder',
    name: 'Bundle Builder',
    description: 'Interactive bundle page to upsell complementary products.',
    icon: <BundleIcon />,
  },
]

// ─── Icon placeholders (inline SVG components to avoid extra deps) ────────────

function ShoppingBagIcon() {
  return <Layout className="h-6 w-6 text-primary" />
}
function ZapIcon() {
  return <Zap className="h-6 w-6 text-yellow-500" />
}
function GridIcon() {
  return <BarChart2 className="h-6 w-6 text-blue-500" />
}
function SaleIcon() {
  return <Globe className="h-6 w-6 text-red-500" />
}
function StoryIcon() {
  return <FileText className="h-6 w-6 text-purple-500" />
}
function BundleIcon() {
  return <Eye className="h-6 w-6 text-green-500" />
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  suffix,
}: {
  label: string
  value: string | number
  icon
  suffix?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-start gap-4 shadow-sm">
      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">
          {value}
          {suffix && <span className="text-base font-normal text-muted-foreground ml-0.5">{suffix}</span>}
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PageStatus }) {
  if (status === 'published') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-medium text-green-700">
        <Globe className="h-3 w-3" />
        Published
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      <FileText className="h-3 w-3" />
      Draft
    </span>
  )
}

// ─── Template Card ────────────────────────────────────────────────────────────

function TemplateCard({ template }: { template: Template }) {
  return (
    <div className="group relative rounded-xl border border-border bg-card p-5 flex flex-col gap-3 hover:border-primary/60 hover:shadow-md transition-all cursor-pointer">
      {template.badge && (
        <span className="absolute top-3 right-3 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
          {template.badge}
        </span>
      )}
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
        {template.icon}
      </div>
      <div>
        <h4 className="font-semibold text-foreground">{template.name}</h4>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{template.description}</p>
      </div>
      <div className="mt-auto pt-2">
        <Button variant="outline" size="sm" className="w-full text-xs font-medium group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
          Use template
        </Button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function BrixDashboardPage() {
  const navigate = useNavigate()
  const { fetchDashboardData } = useBrixDashboard()
  const [stats, setStats] = useState<BrixStats | null>(null)
  const [pages, setPages] = useState<BrixPage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      try {
        const { stats: s, pages: p } = await fetchDashboardData()
        if (!cancelled) {
          setStats(s)
          setPages(p)
        }
      } catch {
        // leave empty — show empty states below
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [])

  return (
    <PageLayout>
      <Header />

      <main className="container py-8 space-y-10">
        {/* ── Page Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Layout className="h-6 w-6 text-primary" />
              Brix Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your pages, track performance and launch new stores.
            </p>
          </div>
          <Button className="flex items-center gap-2 font-semibold shadow-sm">
            <Plus className="h-4 w-4" />
            Create New Page
          </Button>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Pages"
            value={loading ? '—' : (stats?.total_pages ?? 0)}
            icon={<FileText className="h-4 w-4" />}
          />
          <StatCard
            label="Published Pages"
            value={loading ? '—' : (stats?.published_pages ?? 0)}
            icon={<Globe className="h-4 w-4" />}
          />
          <StatCard
            label="Total Visitors"
            value={loading ? '—' : (stats ? stats.total_visitors.toLocaleString() : '0')}
            icon={<BarChart2 className="h-4 w-4" />}
          />
          <StatCard
            label="Conversion Rate"
            value={loading ? '—' : (stats?.conversion_rate ?? 0)}
            suffix={stats ? '%' : undefined}
            icon={<Zap className="h-4 w-4" />}
          />
        </div>

        {/* ── Pages Table ── */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Your Pages</h2>

          <div className="rounded-xl border border-border overflow-hidden shadow-sm">
            {loading && pages.length === 0 ? (
              <div className="flex items-center justify-center py-14 text-sm text-muted-foreground gap-2">
                <Layout className="h-4 w-4 animate-pulse" />
                Loading pages...
              </div>
            ) : pages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-3 text-muted-foreground">
                <FileText className="h-10 w-10 opacity-40" />
                <p className="text-sm font-medium">No pages yet</p>
                <p className="text-xs">Click "Create New Page" to get started.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <th className="px-5 py-3 text-left">Page Name</th>
                    <th className="px-5 py-3 text-left hidden sm:table-cell">Status</th>
                    <th className="px-5 py-3 text-left hidden md:table-cell">Last Modified</th>
                    <th className="px-5 py-3 text-right hidden md:table-cell">Visitors</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page) => (
                    <tr
                      key={page.id}
                      className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">{page.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">/{page.slug}</p>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <StatusBadge status={page.status} />
                      </td>
                      <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">
                        {timeAgo(page.last_modified)}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-muted-foreground hidden md:table-cell">
                        {page.visitors.toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                            <Eye className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Preview</span>
                          </button>
                          <button
                            onClick={() => navigate(`/app/pages/${page.id}/edit`)}
                            className="flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* ── Templates ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Start from a Template</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Pick a conversion-optimised layout and customise it in minutes.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TEMPLATES.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </section>
      </main>
    </PageLayout>
  )
}
