import { useEffect, useState } from 'react'
import {
  List,
  Users,
  Star,
  Mail,
  Plus,
  Gift,
  Download,
  BarChart2,
  Crown,
} from 'lucide-react'
import { Header } from '../../../components/@system/Header/Header'
import { PageLayout } from '../../../components/@system/layout/PageLayout'
import { Button } from '../../../components/@system/ui/button'
import { api } from '../../../lib/@system/api'
import { cn } from '../../../lib/@system/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WaitlistStats {
  total_subscribers: number
  total_referrals: number
  avg_position: number
  invited: number
}

type WaitlistStatus = 'active' | 'paused'

interface Waitlist {
  id: number
  name: string
  subscriber_count: number
  status: WaitlistStatus
  created_at: string
  slug: string
}

type PriorityBadge = 'vip' | 'normal'

interface Subscriber {
  id: number
  position: number
  email: string
  referral_count: number
  referral_source: string | null
  joined_at: string
  priority: PriorityBadge
  invited: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

// ─── Mock data (used as fallback when API is unavailable) ────────────────────

const MOCK_STATS: WaitlistStats = {
  total_subscribers: 1_284,
  total_referrals: 347,
  avg_position: 642,
  invited: 88,
}

const MOCK_WAITLISTS: Waitlist[] = [
  {
    id: 1,
    name: 'WaitlistKit Beta',
    subscriber_count: 842,
    status: 'active',
    created_at: new Date(Date.now() - 14 * 24 * 3600_000).toISOString(),
    slug: 'waitlistkit-beta',
  },
  {
    id: 2,
    name: 'Pro Launch',
    subscriber_count: 442,
    status: 'active',
    created_at: new Date(Date.now() - 5 * 24 * 3600_000).toISOString(),
    slug: 'pro-launch',
  },
  {
    id: 3,
    name: 'Early Access Closed',
    subscriber_count: 300,
    status: 'paused',
    created_at: new Date(Date.now() - 60 * 24 * 3600_000).toISOString(),
    slug: 'early-access',
  },
]

const MOCK_SUBSCRIBERS: Subscriber[] = [
  {
    id: 1,
    position: 1,
    email: 'alex@example.com',
    referral_count: 12,
    referral_source: 'twitter',
    joined_at: new Date(Date.now() - 10 * 24 * 3600_000).toISOString(),
    priority: 'vip',
    invited: false,
  },
  {
    id: 2,
    position: 2,
    email: 'morgan@example.com',
    referral_count: 8,
    referral_source: 'producthunt',
    joined_at: new Date(Date.now() - 9 * 24 * 3600_000).toISOString(),
    priority: 'vip',
    invited: false,
  },
  {
    id: 3,
    position: 3,
    email: 'taylor@example.com',
    referral_count: 5,
    referral_source: 'direct',
    joined_at: new Date(Date.now() - 8 * 24 * 3600_000).toISOString(),
    priority: 'normal',
    invited: true,
  },
  {
    id: 4,
    position: 4,
    email: 'jordan@example.com',
    referral_count: 3,
    referral_source: 'linkedin',
    joined_at: new Date(Date.now() - 7 * 24 * 3600_000).toISOString(),
    priority: 'normal',
    invited: false,
  },
  {
    id: 5,
    position: 5,
    email: 'casey@example.com',
    referral_count: 1,
    referral_source: null,
    joined_at: new Date(Date.now() - 6 * 24 * 3600_000).toISOString(),
    priority: 'normal',
    invited: false,
  },
  {
    id: 6,
    position: 6,
    email: 'riley@example.com',
    referral_count: 0,
    referral_source: null,
    joined_at: new Date(Date.now() - 5 * 24 * 3600_000).toISOString(),
    priority: 'normal',
    invited: false,
  },
  {
    id: 7,
    position: 7,
    email: 'drew@example.com',
    referral_count: 2,
    referral_source: 'twitter',
    joined_at: new Date(Date.now() - 4 * 24 * 3600_000).toISOString(),
    priority: 'normal',
    invited: false,
  },
  {
    id: 8,
    position: 8,
    email: 'sam@example.com',
    referral_count: 0,
    referral_source: 'direct',
    joined_at: new Date(Date.now() - 3 * 24 * 3600_000).toISOString(),
    priority: 'normal',
    invited: false,
  },
]

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  accent?: boolean
}

function StatCard({ label, value, icon: Icon, accent }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-background p-5 shadow-sm',
        accent && 'border-primary/30 bg-primary/5',
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg',
            accent ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-3xl font-bold">{value.toLocaleString()}</p>
    </div>
  )
}

// ─── Waitlist Card ────────────────────────────────────────────────────────────

interface WaitlistCardProps {
  waitlist: Waitlist
  onInvite: (id: number) => void
}

function WaitlistCard({ waitlist, onInvite }: WaitlistCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{waitlist.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Created {formatDate(waitlist.created_at)}
          </p>
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
            waitlist.status === 'active'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700',
          )}
        >
          {waitlist.status === 'active' ? 'Active' : 'Paused'}
        </span>
      </div>

      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>
          <span className="font-semibold text-foreground">{waitlist.subscriber_count.toLocaleString()}</span>{' '}
          subscribers
        </span>
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="flex-1">
          View
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={() => onInvite(waitlist.id)}
          disabled={waitlist.status === 'paused'}
        >
          Invite
        </Button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function WaitlistKitDashboardPage() {
  const [stats, setStats] = useState<WaitlistStats | null>(null)
  const [waitlists, setWaitlists] = useState<Waitlist[]>([])
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [invitingId, setInvitingId] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, waitlistsRes, subscribersRes] = await Promise.all([
          api.get('/api/waitlists/stats'),
          api.get('/api/waitlists'),
          api.get('/api/waitlists/subscribers?limit=50'),
        ])
        setStats(statsRes.data)
        setWaitlists(waitlistsRes.data)
        setSubscribers(subscribersRes.data)
      } catch {
        // Fallback to mock data during development
        setStats(MOCK_STATS)
        setWaitlists(MOCK_WAITLISTS)
        setSubscribers(MOCK_SUBSCRIBERS)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleInviteWaitlist(waitlistId: number) {
    setInvitingId(waitlistId)
    try {
      await api.post(`/api/waitlists/${waitlistId}/invite`, {})
    } catch {
      // no-op
    } finally {
      setInvitingId(null)
    }
  }

  async function handleInviteSubscriber(subscriberId: number) {
    try {
      await api.post(`/api/waitlists/subscribers/${subscriberId}/invite`, {})
      setSubscribers((prev) =>
        prev.map((s) => (s.id === subscriberId ? { ...s, invited: true } : s)),
      )
    } catch {
      // no-op
    }
  }

  async function handleInviteTop10() {
    const top10 = subscribers.filter((s) => !s.invited).slice(0, 10)
    await Promise.allSettled(top10.map((s) => handleInviteSubscriber(s.id)))
  }

  function handleExportCsv() {
    const header = 'position,email,referral_count,referral_source,joined_at,priority,invited'
    const rows = subscribers.map((s) =>
      [
        s.position,
        s.email,
        s.referral_count,
        s.referral_source ?? '',
        s.joined_at,
        s.priority,
        s.invited,
      ].join(','),
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'waitlist-subscribers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PageLayout>
      <Header />

      <main className="container py-8">
        {/* Page header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Waitlists</h1>
            <p className="mt-1 text-muted-foreground">
              Manage your waitlists, subscribers, and invites.
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Waitlist
          </Button>
        </div>

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Subscribers"
              value={stats?.total_subscribers ?? 0}
              icon={Users}
              accent
            />
            <StatCard label="Referrals" value={stats?.total_referrals ?? 0} icon={Gift} />
            <StatCard
              label="Avg. Position"
              value={stats?.avg_position ?? 0}
              icon={BarChart2}
            />
            <StatCard label="Invited" value={stats?.invited ?? 0} icon={Mail} />
          </div>
        )}

        {/* ── Waitlists ─────────────────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Your Waitlists</h2>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : waitlists.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
              <List className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">No waitlists yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first waitlist to start collecting signups.
              </p>
              <Button className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Create Waitlist
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {waitlists.map((w) => (
                <WaitlistCard
                  key={w.id}
                  waitlist={w}
                  onInvite={handleInviteWaitlist}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Subscribers ───────────────────────────────────────────────── */}
        <section className="mt-12">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Subscribers</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleInviteTop10}
                disabled={loading}
              >
                <Star className="h-4 w-4" />
                Invite Top 10
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleExportCsv}
                disabled={loading}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">#</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Referrals
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Source
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? [...Array(5)].map((_, i) => (
                        <tr key={i} className="border-b border-border">
                          {[...Array(7)].map((__, j) => (
                            <td key={j} className="px-4 py-3">
                              <div className="h-4 animate-pulse rounded bg-muted" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : subscribers.map((sub) => (
                        <tr
                          key={sub.id}
                          className="border-b border-border transition-colors last:border-0 hover:bg-muted/30"
                        >
                          <td className="px-4 py-3 font-mono text-muted-foreground">
                            {sub.position}
                          </td>
                          <td className="px-4 py-3 font-medium">{sub.email}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <Gift className="h-3.5 w-3.5" />
                              {sub.referral_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 capitalize text-muted-foreground">
                            {sub.referral_source ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {timeAgo(sub.joined_at)}
                          </td>
                          <td className="px-4 py-3">
                            {sub.priority === 'vip' ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                <Crown className="h-3 w-3" />
                                VIP
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                Normal
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {sub.invited ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                <Mail className="h-3.5 w-3.5" />
                                Invited
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-3 text-xs"
                                onClick={() => handleInviteSubscriber(sub.id)}
                              >
                                Invite
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </PageLayout>
  )
}
