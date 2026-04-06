/**
 * @custom EngagementAnalyticsPage — Charts and metrics for post performance
 * Tracks impressions, likes, comments, shares, CTR. Follower growth, best posts,
 * optimal posting times. Weekly/monthly summaries. CSV export.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  MousePointerClick,
  Users,
  Calendar,
  Download,
  RefreshCw,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Award,
  Filter,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts'
import { DashboardLayout } from '../../../components/@system/Dashboard/DashboardLayout'
import { cn } from '../../../lib/@system/utils'

// ─── Constants ────────────────────────────────────────────────────
const BRAND = {
  primary: '#0891B2',
  primaryLight: '#ecfeff',
  primaryDark: '#0e7490',
}

const PERIODS = [
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
  { id: '12m', label: 'Last 12 months' },
]

const CHART_COLORS = ['#0891B2', '#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc']
const PIE_COLORS = ['#0891B2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

// ─── Mock Data Generator ──────────────────────────────────────────
function generateMockData(period) {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365
  const now = new Date()
  const data = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const base = Math.floor(Math.random() * 500) + 200
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      impressions: base + Math.floor(Math.random() * 1000),
      likes: Math.floor(base * 0.08) + Math.floor(Math.random() * 20),
      comments: Math.floor(base * 0.03) + Math.floor(Math.random() * 10),
      shares: Math.floor(base * 0.01) + Math.floor(Math.random() * 5),
      clicks: Math.floor(base * 0.05) + Math.floor(Math.random() * 15),
      followers: 1200 + Math.floor(i * 2.5) + Math.floor(Math.random() * 10),
    })
  }
  return data
}

function generateBestPosts() {
  return [
    { id: 1, title: '5 Lessons from 10 Years in Tech', impressions: 12450, likes: 342, comments: 89, shares: 45, date: '2026-03-10' },
    { id: 2, title: 'Why I Quit My Job to Build a Startup', impressions: 9870, likes: 278, comments: 67, shares: 34, date: '2026-03-08' },
    { id: 3, title: 'The Future of AI in Marketing', impressions: 8234, likes: 198, comments: 45, shares: 28, date: '2026-03-05' },
    { id: 4, title: 'How to Network Without Being Annoying', impressions: 7650, likes: 187, comments: 52, shares: 22, date: '2026-03-03' },
    { id: 5, title: 'My Morning Routine for Productivity', impressions: 6890, likes: 156, comments: 38, shares: 19, date: '2026-03-01' },
  ]
}

function generateHourlyData() {
  return Array.from({ length: 24 }, (_, h) => ({
    hour: `${h.toString().padStart(2, '0')}:00`,
    engagement: Math.floor(Math.random() * 100) + (h >= 8 && h <= 10 ? 80 : h >= 12 && h <= 14 ? 60 : h >= 17 && h <= 19 ? 70 : 20),
  }))
}

function generateEngagementBreakdown() {
  return [
    { name: 'Likes', value: 45 },
    { name: 'Comments', value: 25 },
    { name: 'Shares', value: 12 },
    { name: 'Clicks', value: 18 },
  ]
}

// ─── Component ────────────────────────────────────────────────────
export default function EngagementAnalyticsPage() {
  const [period, setPeriod] = useState('30d')
  const [chartData, setChartData] = useState([])
  const [bestPosts, setBestPosts] = useState([])
  const [hourlyData, setHourlyData] = useState([])
  const [breakdown, setBreakdown] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    // Simulate API call
    const timer = setTimeout(() => {
      setChartData(generateMockData(period))
      setBestPosts(generateBestPosts())
      setHourlyData(generateHourlyData())
      setBreakdown(generateEngagementBreakdown())
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [period])

  // Calculate summary metrics
  const metrics = useMemo(() => {
    if (!chartData.length) return null
    const total = (key) => chartData.reduce((s, d) => s + d[key], 0)
    const avg = (key) => Math.round(total(key) / chartData.length)
    const lastFollowers = chartData[chartData.length - 1]?.followers || 0
    const firstFollowers = chartData[0]?.followers || 0
    const followerGrowth = lastFollowers - firstFollowers
    const totalImpressions = total('impressions')
    const totalClicks = total('clicks')
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00'

    return {
      impressions: totalImpressions,
      likes: total('likes'),
      comments: total('comments'),
      shares: total('shares'),
      clicks: totalClicks,
      ctr,
      followers: lastFollowers,
      followerGrowth,
      avgImpressions: avg('impressions'),
      avgLikes: avg('likes'),
    }
  }, [chartData])

  // CSV Export
  const exportCSV = useCallback(() => {
    if (!chartData.length) return
    const headers = ['Date', 'Impressions', 'Likes', 'Comments', 'Shares', 'Clicks', 'Followers']
    const rows = chartData.map(d => [d.date, d.impressions, d.likes, d.comments, d.shares, d.clicks, d.followers])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `engagement-analytics-${period}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [chartData, period])

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Engagement Analytics</h1>
            <p className="text-sm text-slate-500 mt-1">Track your LinkedIn post performance and audience growth</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={e => setPeriod(e.target.value)}
              className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2"
            >
              {PERIODS.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-20 mb-3" />
                <div className="h-8 bg-slate-200 rounded w-28" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard icon={Eye} label="Impressions" value={metrics?.impressions} change={12.5} />
              <MetricCard icon={Heart} label="Likes" value={metrics?.likes} change={8.3} />
              <MetricCard icon={MessageSquare} label="Comments" value={metrics?.comments} change={-2.1} />
              <MetricCard icon={Share2} label="Shares" value={metrics?.shares} change={15.7} />
              <MetricCard icon={MousePointerClick} label="Clicks" value={metrics?.clicks} change={5.4} />
              <MetricCard icon={TrendingUp} label="CTR" value={`${metrics?.ctr}%`} change={1.8} isPercent />
              <MetricCard icon={Users} label="Followers" value={metrics?.followers} change={metrics?.followerGrowth} isAbsolute />
              <MetricCard icon={BarChart3} label="Avg. Impressions" value={metrics?.avgImpressions} change={6.2} />
            </div>

            {/* Impressions Chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Impressions Over Time</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="impressions"
                      stroke={BRAND.primary}
                      fill={BRAND.primaryLight}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Engagement Breakdown + Optimal Posting */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Engagement Breakdown */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Engagement Breakdown</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={breakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {breakdown.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Optimal Posting Times */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={18} style={{ color: BRAND.primary }} />
                  <h3 className="text-lg font-semibold text-slate-900">Optimal Posting Times</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} interval={2} />
                      <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                      <Bar dataKey="engagement" fill={BRAND.primary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Best times: 8-10 AM, 12-2 PM, 5-7 PM (based on your audience activity)
                </p>
              </div>
            </div>

            {/* Engagement Over Time (multi-line) */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Engagement Metrics Over Time</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                    <Legend />
                    <Line type="monotone" dataKey="likes" stroke="#0891B2" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="comments" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="shares" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="clicks" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Follower Growth */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} style={{ color: BRAND.primary }} />
                <h3 className="text-lg font-semibold text-slate-900">Follower Growth</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                    <Area type="monotone" dataKey="followers" stroke="#10b981" fill="#d1fae5" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Best Performing Posts */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award size={18} style={{ color: BRAND.primary }} />
                <h3 className="text-lg font-semibold text-slate-900">Best Performing Posts</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-2 font-medium text-slate-500">Post</th>
                      <th className="text-right py-3 px-2 font-medium text-slate-500">Impressions</th>
                      <th className="text-right py-3 px-2 font-medium text-slate-500">Likes</th>
                      <th className="text-right py-3 px-2 font-medium text-slate-500">Comments</th>
                      <th className="text-right py-3 px-2 font-medium text-slate-500">Shares</th>
                      <th className="text-right py-3 px-2 font-medium text-slate-500">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bestPosts.map((post, i) => (
                      <tr key={post.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                              style={{ backgroundColor: BRAND.primary }}
                            >
                              {i + 1}
                            </span>
                            <span className="font-medium text-slate-900 truncate max-w-xs">{post.title}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-2 text-slate-700">{post.impressions.toLocaleString()}</td>
                        <td className="text-right py-3 px-2 text-slate-700">{post.likes}</td>
                        <td className="text-right py-3 px-2 text-slate-700">{post.comments}</td>
                        <td className="text-right py-3 px-2 text-slate-700">{post.shares}</td>
                        <td className="text-right py-3 px-2 text-slate-500">{post.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

// ─── Metric Card ──────────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, change, isPercent, isAbsolute }) {
  const positive = typeof change === 'number' ? change > 0 : false
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-500">{label}</span>
        <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.primaryLight }}>
          <Icon size={16} style={{ color: BRAND.primary }} />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-1">{displayValue}</div>
      {change !== undefined && (
        <div className={cn('flex items-center gap-1 text-xs font-medium', positive ? 'text-emerald-600' : 'text-red-500')}>
          {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {isAbsolute
            ? `${positive ? '+' : ''}${change}`
            : `${positive ? '+' : ''}${change}%`
          }
          <span className="text-slate-400 font-normal ml-1">vs prev period</span>
        </div>
      )}
    </div>
  )
}
