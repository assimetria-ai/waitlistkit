/**
 * @custom AnalyticsDashboardPage — Overview analytics dashboard
 * High-level KPIs, 30-day trend chart, top posts table, and posting schedule.
 * All data fetched from real API on mount.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  BarChart3,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Users,
  Calendar,
  Clock,
  ArrowUpRight,
  Activity,
  Target,
  Zap,
  FileText,
  RefreshCw,
  ChevronRight,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { DashboardLayout } from '../../../components/@system/Dashboard/DashboardLayout'
import { cn } from '../../../lib/@system/utils'
import { useAnalyticsDashboard } from '../../../hooks/@custom/useAnalyticsDashboard'

// ─── Constants ────────────────────────────────────────────────────
const BRAND = {
  primary: '#0891B2',
  primaryLight: '#ecfeff',
  primaryDark: '#0e7490',
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ─── Component ────────────────────────────────────────────────────
export { AnalyticsDashboardPage }
export default function AnalyticsDashboardPage() {
  const { fetchAnalytics } = useAnalyticsDashboard()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [overview, setOverview] = useState(null)
  const [trendData, setTrendData] = useState([])
  const [topPosts, setTopPosts] = useState([])
  const [optimalTimes, setOptimalTimes] = useState([])
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async (signal) => {
    try {
      const start = new Date()
      start.setDate(start.getDate() - 29)
      const startStr = start.toISOString().split('T')[0]

      const { overview: ov, accountTrends, posts, optimalTimes: times } = await fetchAnalytics(startStr)

      if (signal?.aborted) return
      setOverview(ov)
      setTrendData(
        (accountTrends || []).map((d) => ({
          date: new Date(d.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          impressions: parseInt(d.account_impressions) || 0,
          engagement: parseInt(d.account_engagements) || 0,
          followers: parseInt(d.followers_gained) || 0,
        }))
      )
      setTopPosts(posts || [])
      setOptimalTimes(times || [])
      setError(null)
    } catch (err) {
      if (!signal?.aborted) setError(err.message || 'Failed to load analytics')
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetchAll(controller.signal).finally(() => setLoading(false))
    return () => controller.abort()
  }, [fetchAll])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchAll().finally(() => setRefreshing(false))
  }, [fetchAll])

  // Build KPI row from real overview data
  const kpis = useMemo(() => {
    if (!overview) return null
    const { engagement, posts, followers } = overview
    const avgReach = posts.published > 0
      ? Math.round(engagement.total_impressions / posts.published)
      : 0
    return {
      impressions: engagement.total_impressions,
      totalEngagement: engagement.total_likes + engagement.total_comments + engagement.total_shares,
      newFollowers: followers.net_30d,
      engagementRate: parseFloat(engagement.avg_engagement_rate || 0).toFixed(1),
      postsPublished: posts.published,
      scheduledPosts: posts.scheduled,
      avgReach,
    }
  }, [overview])

  // Build day-of-week chart from optimal_times
  const dayOfWeekData = useMemo(() => {
    const dayMap = {}
    DAY_NAMES.forEach((d) => { dayMap[d] = { day: d, engagement: 0, count: 0 } })
    optimalTimes.forEach((t) => {
      const idx = parseInt(t.day_of_week)
      const name = DAY_NAMES[idx]
      if (name) {
        dayMap[name].engagement += parseFloat(t.avg_engagement_rate) || 0
        dayMap[name].count += 1
      }
    })
    return Object.values(dayMap).map((d) => ({
      day: d.day,
      engagement: d.count > 0 ? parseFloat((d.engagement / d.count).toFixed(2)) : 0,
    }))
  }, [optimalTimes])

  const bestTime = useMemo(() => {
    if (!optimalTimes.length) return null
    const t = optimalTimes[0]
    const day = DAY_NAMES[parseInt(t.day_of_week)] ?? '—'
    const h = parseInt(t.hour_of_day)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${day} ${hour} ${ampm}`
  }, [optimalTimes])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Overview of your content performance</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-24 mb-3" />
                <div className="h-8 bg-slate-200 rounded w-20 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-32" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            {kpis ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={Eye} label="Total Impressions" value={kpis.impressions.toLocaleString()} />
                <KpiCard icon={Heart} label="Total Engagement" value={kpis.totalEngagement.toLocaleString()} />
                <KpiCard icon={Users} label="New Followers (30d)" value={`+${kpis.newFollowers}`} />
                <KpiCard icon={Target} label="Avg. Engagement Rate" value={`${kpis.engagementRate}%`} />
              </div>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No data yet"
                description="Publish your first post to see analytics here."
              />
            )}

            {/* 30-Day Trend Chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900">30-Day Performance</h2>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BRAND.primary }} />
                    Impressions
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Engagement
                  </span>
                </div>
              </div>
              {trendData.length === 0 ? (
                <EmptyState icon={Activity} title="No trend data" description="Data will appear once you start publishing." compact />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="gradImpressions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={BRAND.primary} stopOpacity={0.15} />
                        <stop offset="100%" stopColor={BRAND.primary} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradEngagement" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={6} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={45} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} labelStyle={{ fontWeight: 600, marginBottom: 4 }} />
                    <Area type="monotone" dataKey="impressions" stroke={BRAND.primary} fill="url(#gradImpressions)" strokeWidth={2} />
                    <Area type="monotone" dataKey="engagement" stroke="#10b981" fill="url(#gradEngagement)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Quick Stats */}
            {kpis && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h2 className="text-base font-semibold text-slate-900 mb-4">Quick Stats</h2>
                <div className="space-y-4">
                  <QuickStat icon={FileText} label="Posts Published" value={kpis.postsPublished} subtitle="this month" />
                  <QuickStat icon={Calendar} label="Scheduled" value={kpis.scheduledPosts} subtitle="upcoming" />
                  <QuickStat icon={Clock} label="Best Time" value={bestTime ?? '—'} subtitle={bestTime ? 'highest engagement' : 'not enough data'} />
                  <QuickStat icon={Zap} label="Avg. Reach" value={kpis.avgReach > 0 ? kpis.avgReach.toLocaleString() : '—'} subtitle="per post" />
                  <QuickStat icon={MessageSquare} label="Total Comments" value={overview?.engagement?.total_comments?.toLocaleString() ?? '0'} subtitle="all time" />
                </div>
              </div>
            )}

            {/* Top Performing Posts */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900">Top Performing Posts</h2>
              </div>
              {topPosts.length === 0 ? (
                <EmptyState icon={FileText} title="No published posts yet" description="Publish posts to see performance rankings." compact />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Post</th>
                        <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Impressions</th>
                        <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Eng. Rate</th>
                        <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Likes</th>
                        <th className="text-right py-2 px-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPosts.map((post, i) => (
                        <tr key={post.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                style={{ backgroundColor: i < 3 ? BRAND.primary : '#94a3b8' }}
                              >
                                {i + 1}
                              </span>
                              <span className="font-medium text-slate-900 truncate max-w-xs">
                                {post.content ? post.content.slice(0, 60) + (post.content.length > 60 ? '…' : '') : `Post #${post.id}`}
                              </span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-2 text-slate-700">{parseInt(post.impressions || 0).toLocaleString()}</td>
                          <td className="text-right py-3 px-2">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: parseFloat(post.engagement_rate) >= 6 ? '#ecfdf5' : parseFloat(post.engagement_rate) >= 4 ? '#ecfeff' : '#fef3c7',
                                color: parseFloat(post.engagement_rate) >= 6 ? '#059669' : parseFloat(post.engagement_rate) >= 4 ? '#0891b2' : '#d97706',
                              }}
                            >
                              {parseFloat(post.engagement_rate || 0).toFixed(1)}%
                            </span>
                          </td>
                          <td className="text-right py-3 px-2 text-slate-700">{parseInt(post.likes || 0)}</td>
                          <td className="text-right py-3 px-2 text-slate-700">{parseInt(post.comments || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Engagement by Day of Week */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Avg. Engagement Rate by Day of Week</h2>
              {optimalTimes.length === 0 ? (
                <EmptyState icon={BarChart3} title="Not enough data" description="Publish posts on multiple days to see this chart." compact />
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={dayOfWeekData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={40} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(v) => [`${v}%`, 'Avg. Eng. Rate']} />
                    <Bar dataKey="engagement" fill={BRAND.primary} radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

// ─── Sub-components ───────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-500">{label}</span>
        <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.primaryLight }}>
          <Icon size={16} style={{ color: BRAND.primary }} />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
  )
}

function QuickStat({ icon: Icon, label, value, subtitle }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: BRAND.primaryLight }}>
        <Icon size={14} style={{ color: BRAND.primary }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-sm font-semibold text-slate-900">{value}</div>
      </div>
      <span className="text-xs text-slate-400">{subtitle}</span>
    </div>
  )
}

function EmptyState({ icon: Icon, title, description, compact = false }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center text-slate-400', compact ? 'py-8' : 'py-16')}>
      <Icon size={compact ? 28 : 40} className="mb-3 opacity-40" />
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {description && <p className="text-xs mt-1">{description}</p>}
    </div>
  )
}
