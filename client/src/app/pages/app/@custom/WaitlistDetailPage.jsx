// @custom — Waitlist detail: subscriber table, stats, invite controls
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  Share2,
  Mail,
  Download,
  Loader2,
  Copy,
  Check,
} from 'lucide-react'
import { PageLayout } from '../../../components/@system/layout/PageLayout'

export function WaitlistDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [waitlist, setWaitlist] = useState(null)
  const [subscribers, setSubscribers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviting, setInviting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const PER_PAGE = 50

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [wlRes, subRes, statsRes] = await Promise.all([
        fetch(`/api/waitlists/${id}`, { credentials: 'include' }),
        fetch(`/api/waitlists/${id}/subscribers?limit=${PER_PAGE}&offset=0`, { credentials: 'include' }),
        fetch(`/api/waitlists/${id}/stats`, { credentials: 'include' }),
      ])
      if (!wlRes.ok) throw new Error('Waitlist not found')
      const wlData = await wlRes.json()
      setWaitlist(wlData.waitlist)

      if (subRes.ok) {
        const subData = await subRes.json()
        setSubscribers(subData.subscribers ?? [])
        setHasMore((subData.total ?? 0) > PER_PAGE)
      }
      if (statsRes.ok) {
        const sData = await statsRes.json()
        setStats(sData)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const loadMore = async () => {
    const nextPage = page + 1
    const offset = (nextPage - 1) * PER_PAGE
    const res = await fetch(`/api/waitlists/${id}/subscribers?limit=${PER_PAGE}&offset=${offset}`, {
      credentials: 'include',
    })
    if (res.ok) {
      const data = await res.json()
      setSubscribers((prev) => [...prev, ...(data.subscribers ?? [])])
      setHasMore((data.total ?? 0) > nextPage * PER_PAGE)
      setPage(nextPage)
    }
  }

  const handleInviteTop = async (n) => {
    if (!waitlist) return
    setInviting(true)
    try {
      const r = await fetch(`/api/waitlists/${waitlist.id}/invite`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: n }),
      })
      if (!r.ok) throw new Error('Invite failed')
      const d = await r.json()
      alert(`${d.invited ?? n} subscribers invited!`)
      await fetchData()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Invite failed')
    } finally {
      setInviting(false)
    }
  }

  const handleExportCsv = () => {
    if (!subscribers.length) return
    const headers = ['Position', 'Email', 'Referrals', 'Status', 'Joined']
    const rows = subscribers.map((s) => [
      s.position,
      s.email,
      s.referral_count,
      s.status,
      new Date(s.created_at).toLocaleDateString(),
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${waitlist?.slug ?? 'waitlist'}-subscribers.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyLink = () => {
    if (!waitlist) return
    const joinUrl = `${window.location.origin}/join/${waitlist.slug}`
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    )
  }

  if (error || !waitlist) {
    return (
      <PageLayout>
        <div className="text-center py-20">
          <p className="text-destructive mb-4">{error || 'Waitlist not found'}</p>
          <Link to="/app/waitlists" className="text-sm underline text-muted-foreground">
            Back to Waitlists
          </Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/app/waitlists')}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Waitlists
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{waitlist.name}</h1>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  waitlist.status === 'active'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {waitlist.status}
              </span>
            </div>
            {waitlist.description && (
              <p className="text-sm text-muted-foreground mt-1">{waitlist.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium hover:bg-muted transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Join Link'}
            </button>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium hover:bg-muted transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Subscribers', value: stats?.total_subscribers ?? 0, icon: Users },
          { label: 'Invited', value: stats?.invited_count ?? 0, icon: Mail },
          { label: 'Referrals', value: stats?.referral_count ?? 0, icon: Share2 },
          { label: 'Avg Position', value: stats?.avg_position ? Math.round(stats.avg_position) : '—', icon: Users },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm font-medium text-muted-foreground">Invite:</span>
        {[10, 50, 100].map((n) => (
          <button
            key={n}
            onClick={() => handleInviteTop(n)}
            disabled={inviting}
            className="px-3 py-1.5 rounded-md border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
          >
            {inviting ? <Loader2 className="h-3.5 w-3.5 animate-spin inline" /> : `Top ${n}`}
          </button>
        ))}
      </div>

      {/* Subscribers Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Subscribers</h2>
          <span className="text-sm text-muted-foreground">{stats?.total_subscribers ?? 0} total</span>
        </div>
        {subscribers.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No subscribers yet. Share your join link to get started.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">#</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Referrals</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {subscribers.map((sub) => (
                    <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{sub.position}</td>
                      <td className="px-4 py-3 font-medium">{sub.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{sub.referral_count}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            sub.status === 'invited'
                              ? 'bg-blue-100 text-blue-700'
                              : sub.status === 'joined'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hasMore && (
              <div className="p-4 border-t text-center">
                <button
                  onClick={loadMore}
                  className="text-sm text-primary hover:underline"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  )
}
