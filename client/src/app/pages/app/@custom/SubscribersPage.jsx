// @custom — Global subscribers view across all waitlists
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Search, Loader2, Download } from 'lucide-react'
import { PageLayout } from '../../../components/@system/layout/PageLayout'

export function SubscribersPage() {
  const navigate = useNavigate()
  const [subscribers, setSubscribers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetch('/api/waitlists/subscribers/all', { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load subscribers')
        return r.json()
      })
      .then((data) => {
        setSubscribers(data.subscribers ?? [])
        setFiltered(data.subscribers ?? [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let result = subscribers
    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(
        (s) =>
          s.email.toLowerCase().includes(q) ||
          s.waitlist_name.toLowerCase().includes(q),
      )
    }
    setFiltered(result)
  }, [query, statusFilter, subscribers])

  const handleExport = () => {
    if (!filtered.length) return
    const headers = ['Email', 'Waitlist', 'Position', 'Referrals', 'Status', 'Joined']
    const rows = filtered.map((s) => [
      s.email,
      s.waitlist_name,
      s.position,
      s.referral_count,
      s.status,
      new Date(s.created_at).toLocaleDateString(),
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'all-subscribers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PageLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Subscribers</h1>
          <p className="text-muted-foreground mt-1 text-sm">All subscribers across your waitlists</p>
        </div>
        <button
          onClick={handleExport}
          disabled={!filtered.length}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by email or waitlist..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All statuses</option>
          <option value="waiting">Waiting</option>
          <option value="invited">Invited</option>
          <option value="joined">Joined</option>
        </select>
        {(query || statusFilter !== 'all') && (
          <button
            onClick={() => { setQuery(''); setStatusFilter('all') }}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold mb-1">
            {subscribers.length === 0 ? 'No subscribers yet' : 'No results found'}
          </p>
          <p className="text-sm text-muted-foreground">
            {subscribers.length === 0
              ? 'Share your waitlist join links to start collecting signups.'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="p-4 border-b">
            <span className="text-sm text-muted-foreground">
              {filtered.length} subscriber{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Waitlist</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Referrals</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{sub.email}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/app/waitlists/${sub.waitlist_id}`)}
                        className="text-primary hover:underline text-xs"
                      >
                        {sub.waitlist_name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{sub.position}</td>
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
        </div>
      )}
    </PageLayout>
  )
}
