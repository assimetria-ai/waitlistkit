import { useEffect, useState, useCallback } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  Filter,
  Mail,
  MailCheck,
  MailX,
  RefreshCw,
  Search,
  Users,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Header } from '../../../components/@system/Header/Header'
import { PageLayout } from '../../../components/@system/layout/PageLayout'
import { cn } from '../../../lib/@system/utils'
import { api } from '../../../lib/@system/api'

// ─── Types ───────────────────────────────────────────────────────────────────

type EmailStatus = 'sent' | 'delivered' | 'bounced' | 'failed'

interface EmailLog {
  id: number
  to_address: string
  subject: string
  template: string | null
  status: EmailStatus
  message_id: string | null
  provider: string | null
  error: string | null
  metadata: Record<string, unknown> | null
  user_id: number | null
  sent_at: string
  created_at: string
}

interface EmailStats {
  total: string
  sent: string
  delivered: string
  bounced: string
  failed: string
  last_24h: string
  last_7d: string
  unique_recipients: string
}

interface TemplateBreakdown {
  template: string
  total: string
  failed: string
  bounced: string
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

function statusBadge(status: EmailStatus) {
  const map: Record<EmailStatus, string> = {
    sent:      'text-blue-600 bg-blue-50 border-blue-200',
    delivered: 'text-green-600 bg-green-50 border-green-200',
    bounced:   'text-yellow-600 bg-yellow-50 border-yellow-200',
    failed:    'text-red-600 bg-red-50 border-red-200',
  }
  return map[status] ?? 'text-muted-foreground bg-muted'
}

function statusIcon(status: EmailStatus) {
  if (status === 'delivered') return <MailCheck className="h-4 w-4 text-green-500" />
  if (status === 'failed')    return <MailX className="h-4 w-4 text-red-500" />
  if (status === 'bounced')   return <AlertTriangle className="h-4 w-4 text-yellow-500" />
  return <Mail className="h-4 w-4 text-blue-500" />
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function EmailDetailModal({ log, onClose }: { log: EmailLog; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', statusBadge(log.status))}>
                {log.status}
              </span>
              {log.template && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {log.template}
                </span>
              )}
            </div>
            <h2 className="text-base font-semibold text-foreground break-words">{log.subject}</h2>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">To</p>
              <p className="font-medium break-all">{log.to_address}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Sent</p>
              <p className="font-medium">{timeAgo(log.sent_at)}</p>
            </div>
            {log.provider && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Provider</p>
                <p className="font-medium">{log.provider}</p>
              </div>
            )}
            {log.message_id && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-0.5">Message ID</p>
                <p className="font-mono text-xs break-all">{log.message_id}</p>
              </div>
            )}
          </div>

          {log.error && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Error</p>
              <p className="text-sm bg-red-50 text-red-700 rounded-md px-3 py-2 break-words">{log.error}</p>
            </div>
          )}

          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Metadata</p>
              <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Template Breakdown ───────────────────────────────────────────────────────

function TemplateBreakdownPanel({ templates }: { templates: TemplateBreakdown[] }) {
  if (templates.length === 0) return null
  return (
    <div className="rounded-lg border border-border overflow-hidden mb-6">
      <div className="bg-muted/40 border-b border-border px-4 py-2.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">By Template</p>
      </div>
      <div className="divide-y divide-border">
        {templates.map((t) => (
          <div key={t.template} className="flex items-center gap-3 px-4 py-2.5 text-sm">
            <span className="flex-1 font-medium text-foreground">{t.template}</span>
            <span className="text-muted-foreground">{parseInt(t.total).toLocaleString()} sent</span>
            {parseInt(t.failed) > 0 && (
              <span className="text-red-600 text-xs">{t.failed} failed</span>
            )}
            {parseInt(t.bounced) > 0 && (
              <span className="text-yellow-600 text-xs">{t.bounced} bounced</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: EmailStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Sent', value: 'sent' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Bounced', value: 'bounced' },
  { label: 'Failed', value: 'failed' },
]

const PAGE_SIZE = 25

// ─── Main Page ────────────────────────────────────────────────────────────────

export function EmailTrackingPage() {
  const [stats, setStats] = useState<EmailStats | null>(null)
  const [templates, setTemplates] = useState<TemplateBreakdown[]>([])
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<EmailStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null)
  const [page, setPage] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTab !== 'all') params.set('status', activeTab)
      if (search) params.set('search', search)
      params.set('limit', String(PAGE_SIZE))
      params.set('offset', String(page * PAGE_SIZE))

      const [statsRes, logsRes, templatesRes] = await Promise.all([
        api.get<{ stats: EmailStats }>('/email-logs/stats'),
        api.get<{ logs: EmailLog[]; total: number }>(`/email-logs?${params.toString()}`),
        api.get<{ templates: TemplateBreakdown[] }>('/email-logs/templates'),
      ])

      setStats(statsRes.stats)
      setLogs(logsRes.logs)
      setTotal(logsRes.total)
      setTemplates(templatesRes.templates)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [activeTab, search, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  return (
    <PageLayout>
      <Header />
      <main className="container py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Email Tracking
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Monitor transactional email delivery</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/app/emails/preview"
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview Templates
            </Link>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total sent" value={parseInt(stats.total).toLocaleString()} icon={<Mail className="h-4 w-4" />} />
            <StatCard label="Last 24h" value={parseInt(stats.last_24h).toLocaleString()} icon={<Clock className="h-4 w-4" />} />
            <StatCard label="Failed" value={parseInt(stats.failed).toLocaleString()} icon={<MailX className="h-4 w-4" />} />
            <StatCard label="Unique recipients" value={parseInt(stats.unique_recipients).toLocaleString()} icon={<Users className="h-4 w-4" />} />
          </div>
        )}

        {/* Template breakdown */}
        {templates.length > 0 && <TemplateBreakdownPanel templates={templates} />}

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {/* Status tabs */}
          <div className="flex rounded-lg border border-border bg-muted/40 p-0.5 gap-0.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setActiveTab(tab.value); setPage(0) }}
                className={cn(
                  'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                  activeTab === tab.value
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
                {tab.value === 'failed' && stats && parseInt(stats.failed) > 0 && (
                  <span className="ml-1.5 rounded-full bg-red-100 text-red-700 text-xs px-1.5 py-0.5">
                    {stats.failed}
                  </span>
                )}
                {tab.value === 'bounced' && stats && parseInt(stats.bounced) > 0 && (
                  <span className="ml-1.5 rounded-full bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5">
                    {stats.bounced}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search email or subject…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring w-52"
              />
            </div>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setSearchInput(''); setPage(0) }}
                className="rounded-md p-1.5 hover:bg-muted text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          <p className="text-sm text-muted-foreground ml-auto">
            {total.toLocaleString()} {total === 1 ? 'email' : 'emails'}
          </p>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Loading emails…
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Mail className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No emails found</p>
              <p className="text-xs mt-1">Emails will appear here as they are sent</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <th className="px-4 py-3 text-left w-6"></th>
                  <th className="px-4 py-3 text-left">Recipient</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Subject</th>
                  <th className="px-4 py-3 text-left w-28 hidden md:table-cell">Template</th>
                  <th className="px-4 py-3 text-left w-24 hidden sm:table-cell">Status</th>
                  <th className="px-4 py-3 text-right w-28 hidden md:table-cell">Sent</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">{statusIcon(log.status)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground truncate max-w-[180px]">{log.to_address}</p>
                      <p className="text-xs text-muted-foreground sm:hidden truncate mt-0.5">{log.subject}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-foreground truncate max-w-[240px]">{log.subject}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {log.template ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border', statusBadge(log.status))}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">
                      {timeAgo(log.sent_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString()}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * PAGE_SIZE >= total}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Detail modal */}
      {selectedLog && (
        <EmailDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </PageLayout>
  )
}
