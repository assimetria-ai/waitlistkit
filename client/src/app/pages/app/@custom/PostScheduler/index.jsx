/**
 * @custom PostScheduler — Create/edit LinkedIn posts with date/time picker
 * Brand: #0891B2 primary, #6366F1 accent, Inter + Space Grotesk fonts
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  Clock,
  Send,
  Save,
  ArrowLeft,
  Sparkles,
  Bold,
  List,
  Hash,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { DashboardLayout } from '../../../components/@system/Dashboard/DashboardLayout'
import { cn } from '../../../lib/@system/utils'
import { usePostScheduler } from '../../../hooks/@custom/usePostScheduler'

// ─── Constants ────────────────────────────────────────────────────
const MAX_CONTENT_LENGTH = 3000
const OPTIMAL_TIMES = [
  { label: 'Early Morning', time: '07:00', desc: 'Best for EU audience' },
  { label: 'Morning', time: '09:00', desc: 'Peak LinkedIn activity' },
  { label: 'Lunch', time: '12:00', desc: 'Good engagement window' },
  { label: 'Afternoon', time: '15:00', desc: 'Second peak' },
  { label: 'Evening', time: '18:00', desc: 'After-work browsing' },
]
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa']

// ─── Mini Calendar Component ──────────────────────────────────────
function MiniCalendar({ selected, onSelect }) {
  const [viewDate, setViewDate] = useState(selected ? new Date(selected) : new Date())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const isSelected = (d) => {
    if (!selected || !d) return false
    const s = new Date(selected)
    return s.getFullYear() === year && s.getMonth() === month && s.getDate() === d
  }
  const isPast = (d) => {
    if (!d) return false
    const dt = new Date(year, month, d)
    return dt < today
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="p-1 rounded hover:bg-slate-100 text-slate-500"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {MONTHS[month]} {year}
        </span>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="p-1 rounded hover:bg-slate-100 text-slate-500"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {DAYS_SHORT.map((d) => (
          <div key={d} className="text-[10px] font-medium text-slate-400 py-1">{d}</div>
        ))}
        {cells.map((d, i) => (
          <button
            key={i}
            type="button"
            disabled={!d || isPast(d)}
            onClick={() => {
              if (d && !isPast(d)) {
                const dt = new Date(year, month, d)
                onSelect(dt)
              }
            }}
            className={cn(
              'w-8 h-8 text-xs rounded-full flex items-center justify-center transition-colors',
              !d && 'invisible',
              d && isPast(d) && 'text-slate-300 cursor-not-allowed',
              d && !isPast(d) && 'hover:bg-cyan-50 text-slate-700 cursor-pointer',
              isSelected(d) && 'bg-[#0891B2] text-white hover:bg-[#0891B2]',
            )}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────
export function PostScheduler() {
  const navigate = useNavigate()
  const params = useParams()
  const [searchParams] = useSearchParams()
  const editId = params.id || searchParams.get('id')
  const { fetchPost, savePost: savePostHook } = usePostScheduler()

  const [content, setContent] = useState('')
  const [status, setStatus] = useState('draft')
  const [scheduledDate, setScheduledDate] = useState(null)
  const [scheduledTime, setScheduledTime] = useState('09:00')
  const [showCalendar, setShowCalendar] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [hashtags, setHashtags] = useState('')

  // Load post for editing
  useEffect(() => {
    if (!editId) return
    setLoading(true)
    fetchPost(editId)
      .then((post) => {
        if (post) {
          setContent(post.content || '')
          setStatus(post.status || 'draft')
          if (post.scheduled_for) {
            const d = new Date(post.scheduled_for)
            setScheduledDate(d)
            setScheduledTime(
              `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
            )
          }
        }
      })
      .catch((e) => setError('Failed to load post'))
      .finally(() => setLoading(false))
  }, [editId])

  const charCount = content.length
  const charPct = Math.min((charCount / MAX_CONTENT_LENGTH) * 100, 100)

  const buildScheduledFor = useCallback(() => {
    if (!scheduledDate) return null
    const [h, m] = scheduledTime.split(':').map(Number)
    const dt = new Date(scheduledDate)
    dt.setHours(h, m, 0, 0)
    return dt.toISOString()
  }, [scheduledDate, scheduledTime])

  const handleSave = async (saveStatus) => {
    if (!content.trim()) {
      setError('Post content is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const body = {
        content: hashtags ? `${content}\n\n${hashtags}` : content,
        status: saveStatus,
        scheduled_for: saveStatus === 'scheduled' ? buildScheduledFor() : null,
      }
      await savePostHook(editId, body)
      navigate('/app/posts')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardLayout.Content>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-[#0891B2] border-t-transparent rounded-full" />
          </div>
        </DashboardLayout.Content>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <DashboardLayout.Header
        title={editId ? 'Edit Post' : 'Create Post'}
        description="Write and schedule your LinkedIn post"
        actions={
          <button
            onClick={() => navigate('/app/posts')}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Posts
          </button>
        }
      />
      <DashboardLayout.Content>
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Editor Panel ─────────────── */}
          <div className="lg:col-span-2 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
                <button onClick={() => setError(null)} className="ml-auto">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Content area */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 bg-slate-50/50">
                <button type="button" className="p-1.5 rounded hover:bg-slate-200 text-slate-500" title="Bold">
                  <Bold className="w-4 h-4" />
                </button>
                <button type="button" className="p-1.5 rounded hover:bg-slate-200 text-slate-500" title="List">
                  <List className="w-4 h-4" />
                </button>
                <button type="button" className="p-1.5 rounded hover:bg-slate-200 text-slate-500" title="Hashtag">
                  <Hash className="w-4 h-4" />
                </button>
                <div className="flex-1" />
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-[#6366F1] bg-indigo-50 hover:bg-indigo-100 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Assist
                </button>
              </div>

              {/* Textarea */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
                placeholder="What do you want to share with your LinkedIn network?"
                rows={10}
                className="w-full px-4 py-3 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />

              {/* Character count bar */}
              <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between">
                <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      charPct > 90 ? 'bg-red-400' : charPct > 70 ? 'bg-amber-400' : 'bg-[#0891B2]'
                    )}
                    style={{ width: `${charPct}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">
                  {charCount.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Hashtags */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Hashtags
              </label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#linkedin #contentcreation #growthhacking"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0891B2]/30 focus:border-[#0891B2]"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </button>
              <button
                onClick={() => handleSave('scheduled')}
                disabled={saving || !scheduledDate}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#0891B2' }}
              >
                <Send className="w-4 h-4" />
                {saving ? 'Saving...' : 'Schedule Post'}
              </button>
            </div>
          </div>

          {/* ── Sidebar ──────────────────── */}
          <div className="space-y-4">
            {/* Date picker */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3
                className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                <CalendarIcon className="w-4 h-4 text-[#0891B2]" />
                Schedule Date
              </h3>
              <MiniCalendar
                selected={scheduledDate}
                onSelect={(d) => {
                  setScheduledDate(d)
                  setShowCalendar(false)
                }}
              />
              {scheduledDate && (
                <div className="mt-2 text-xs text-slate-500 text-center">
                  Selected: {scheduledDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  <button
                    type="button"
                    onClick={() => setScheduledDate(null)}
                    className="ml-2 text-red-400 hover:text-red-600"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Time picker */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3
                className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                <Clock className="w-4 h-4 text-[#0891B2]" />
                Schedule Time
              </h3>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0891B2]/30 focus:border-[#0891B2]"
              />

              {/* Optimal time suggestions */}
              <div className="mt-3 space-y-1.5">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Suggested Times</p>
                {OPTIMAL_TIMES.map((t) => (
                  <button
                    key={t.time}
                    type="button"
                    onClick={() => setScheduledTime(t.time)}
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors',
                      scheduledTime === t.time
                        ? 'bg-cyan-50 text-[#0891B2]'
                        : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <span className="font-medium">{t.label}</span>
                    <span className="text-slate-400">{t.time}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Post preview */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3
                className="text-sm font-semibold text-slate-800 mb-3"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Preview
              </h3>
              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap min-h-[80px]">
                {content || 'Your post preview will appear here...'}
                {hashtags && (
                  <div className="mt-2 text-[#6366F1]">{hashtags}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout.Content>
    </DashboardLayout>
  )
}
