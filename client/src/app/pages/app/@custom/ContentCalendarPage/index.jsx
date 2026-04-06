/**
 * @custom ContentCalendarPage — Calendar view for scheduled posts
 * Supports month/week/day views, drag-and-drop rescheduling, and status filtering.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  GripVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  X,
  Edit3,
  Trash2,
  Move,
} from 'lucide-react'
import { DashboardLayout } from '../../../components/@system/Dashboard/DashboardLayout'
import { cn } from '../../../lib/@system/utils'
import { useContentCalendar } from '../../../hooks/@custom/useContentCalendar'

// ─── Constants ────────────────────────────────────────────────────
const VIEWS = ['month', 'week', 'day']
const STATUSES = ['all', 'draft', 'scheduled', 'published', 'failed']
const STATUS_COLORS = {
  draft: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' },
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  published: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  failed: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
}
const STATUS_ICONS = {
  draft: FileText,
  scheduled: Clock,
  published: CheckCircle,
  failed: AlertCircle,
}
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// ─── Date helpers ─────────────────────────────────────────────────
function startOfDay(d) { const r = new Date(d); r.setHours(0,0,0,0); return r }
function endOfDay(d) { const r = new Date(d); r.setHours(23,59,59,999); return r }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function isSameDay(a, b) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate() }
function getMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  const start = addDays(first, -first.getDay())
  const days = []
  for (let i = 0; i < 42; i++) days.push(addDays(start, i))
  return days
}
function getWeekDays(date) {
  const d = new Date(date)
  const start = addDays(d, -d.getDay())
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}
function getHours() { return Array.from({ length: 24 }, (_, i) => i) }
function formatTime(date) {
  const d = new Date(date)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function formatDate(date) {
  return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

// ─── Post Card (draggable) ────────────────────────────────────────
function PostCard({ post, onEdit, onDelete, onDragStart, compact = false }) {
  const colors = STATUS_COLORS[post.status] || STATUS_COLORS.draft
  const Icon = STATUS_ICONS[post.status] || FileText
  const preview = post.content?.substring(0, compact ? 40 : 80) || 'Untitled'

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ id: post.id }))
        onDragStart?.(post)
      }}
      className={cn(
        'group relative rounded-md border px-2 py-1.5 text-xs cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md',
        colors.bg, colors.text
      )}
    >
      <div className="flex items-start gap-1.5">
        <GripVertical className="h-3 w-3 mt-0.5 opacity-0 group-hover:opacity-50 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', colors.dot)} />
            <span className="font-medium truncate">{preview}</span>
          </div>
          {post.scheduled_for && (
            <div className="flex items-center gap-1 text-[10px] opacity-70">
              <Clock className="h-2.5 w-2.5" />
              {formatTime(post.scheduled_for)}
            </div>
          )}
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onEdit?.(post) }} className="p-0.5 hover:bg-white/50 rounded" title="Edit">
            <Edit3 className="h-3 w-3" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete?.(post) }} className="p-0.5 hover:bg-white/50 rounded text-red-500" title="Delete">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Drop Zone ────────────────────────────────────────────────────
function DropZone({ date, hour, children, onDrop, className }) {
  const [over, setOver] = useState(false)
  return (
    <div
      className={cn('min-h-[28px] transition-colors', over && 'bg-blue-50 ring-1 ring-blue-300 ring-inset', className)}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        try {
          const data = JSON.parse(e.dataTransfer.getData('text/plain'))
          const target = new Date(date)
          if (hour !== undefined) target.setHours(hour, 0, 0, 0)
          else target.setHours(9, 0, 0, 0)
          onDrop?.(data.id, target.toISOString())
        } catch {}
      }}
    >
      {children}
    </div>
  )
}

// ─── Post Modal (create/edit) ─────────────────────────────────────
function PostModal({ post, date, onSave, onClose }) {
  const [content, setContent] = useState(post?.content || '')
  const [status, setStatus] = useState(post?.status || 'draft')
  const [scheduledFor, setScheduledFor] = useState(
    post?.scheduled_for ? new Date(post.scheduled_for).toISOString().slice(0, 16) : 
    date ? new Date(date).toISOString().slice(0, 16) : ''
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      await onSave({
        id: post?.id,
        content,
        status: scheduledFor ? 'scheduled' : status,
        scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
      })
      onClose()
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{post ? 'Edit Post' : 'New Post'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="Write your post content..."
              autoFocus
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Schedule For</label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!content.trim() || saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : post ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Month View ───────────────────────────────────────────────────
function MonthView({ date, posts, onDrop, onEdit, onDelete, onDragStart, onCreateAt }) {
  const days = getMonthGrid(date.getFullYear(), date.getMonth())
  const today = startOfDay(new Date())

  return (
    <div className="grid grid-cols-7 border-l border-t flex-1">
      {DAYS.map((d) => (
        <div key={d} className="border-r border-b px-2 py-1.5 text-xs font-medium text-muted-foreground bg-gray-50 text-center">
          {d}
        </div>
      ))}
      {days.map((day, i) => {
        const isCurrentMonth = day.getMonth() === date.getMonth()
        const isToday = isSameDay(day, today)
        const dayPosts = posts.filter((p) => {
          const d = p.scheduled_for ? new Date(p.scheduled_for) : new Date(p.created_at)
          return isSameDay(d, day)
        })
        return (
          <DropZone
            key={i}
            date={day}
            onDrop={onDrop}
            className={cn(
              'border-r border-b p-1 min-h-[90px] flex flex-col',
              !isCurrentMonth && 'bg-gray-50/50 opacity-50'
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={cn(
                'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                isToday && 'bg-blue-600 text-white',
                !isToday && 'text-muted-foreground'
              )}>
                {day.getDate()}
              </span>
              <button
                onClick={() => onCreateAt(day)}
                className="opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 p-0.5 hover:bg-gray-200 rounded text-muted-foreground"
                title="Add post"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-1 flex-1 overflow-y-auto max-h-[80px]">
              {dayPosts.map((p) => (
                <PostCard key={p.id} post={p} compact onEdit={onEdit} onDelete={onDelete} onDragStart={onDragStart} />
              ))}
            </div>
          </DropZone>
        )
      })}
    </div>
  )
}

// ─── Week View ────────────────────────────────────────────────────
function WeekView({ date, posts, onDrop, onEdit, onDelete, onDragStart, onCreateAt }) {
  const days = getWeekDays(date)
  const today = startOfDay(new Date())
  const hours = getHours()

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b sticky top-0 bg-white z-10">
        <div className="border-r p-2 text-xs text-muted-foreground" />
        {days.map((d, i) => (
          <div key={i} className={cn(
            'border-r p-2 text-center',
            isSameDay(d, today) && 'bg-blue-50'
          )}>
            <div className="text-xs text-muted-foreground">{DAYS[d.getDay()]}</div>
            <div className={cn(
              'text-sm font-semibold w-7 h-7 flex items-center justify-center mx-auto rounded-full',
              isSameDay(d, today) && 'bg-blue-600 text-white'
            )}>
              {d.getDate()}
            </div>
          </div>
        ))}
      </div>
      {/* Time grid */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)]">
        {hours.map((h) => (
          <div key={h} className="contents">
            <div className="border-r border-b p-1 text-[10px] text-muted-foreground text-right pr-2">
              {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
            </div>
            {days.map((d, di) => {
              const hourPosts = posts.filter((p) => {
                const pd = p.scheduled_for ? new Date(p.scheduled_for) : new Date(p.created_at)
                return isSameDay(pd, d) && pd.getHours() === h
              })
              return (
                <DropZone
                  key={`${h}-${di}`}
                  date={d}
                  hour={h}
                  onDrop={onDrop}
                  className="border-r border-b min-h-[48px] p-0.5"
                >
                  <div className="space-y-0.5">
                    {hourPosts.map((p) => (
                      <PostCard key={p.id} post={p} compact onEdit={onEdit} onDelete={onDelete} onDragStart={onDragStart} />
                    ))}
                  </div>
                </DropZone>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Day View ─────────────────────────────────────────────────────
function DayView({ date, posts, onDrop, onEdit, onDelete, onDragStart, onCreateAt }) {
  const today = startOfDay(new Date())
  const isToday = isSameDay(date, today)
  const hours = getHours()

  return (
    <div className="flex-1 overflow-auto">
      <div className="border-b p-3 bg-gray-50 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-lg font-bold w-10 h-10 flex items-center justify-center rounded-full',
            isToday && 'bg-blue-600 text-white'
          )}>
            {date.getDate()}
          </span>
          <div>
            <div className="font-medium">{DAYS[date.getDay()]}</div>
            <div className="text-sm text-muted-foreground">{MONTHS[date.getMonth()]} {date.getFullYear()}</div>
          </div>
        </div>
      </div>
      <div className="divide-y">
        {hours.map((h) => {
          const hourPosts = posts.filter((p) => {
            const pd = p.scheduled_for ? new Date(p.scheduled_for) : new Date(p.created_at)
            return isSameDay(pd, date) && pd.getHours() === h
          })
          return (
            <DropZone key={h} date={date} hour={h} onDrop={onDrop} className="flex min-h-[56px]">
              <div className="w-16 shrink-0 p-2 text-xs text-muted-foreground text-right border-r">
                {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
              </div>
              <div className="flex-1 p-1 space-y-1">
                {hourPosts.map((p) => (
                  <PostCard key={p.id} post={p} onEdit={onEdit} onDelete={onDelete} onDragStart={onDragStart} />
                ))}
              </div>
            </DropZone>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Calendar Page ───────────────────────────────────────────
export function ContentCalendarPage() {
  const { fetchPosts: fetchPostsHook, savePost, deletePost: deletePostHook, reschedulePost } = useContentCalendar()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState('month')
  const [statusFilter, setStatusFilter] = useState('all')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // { post?, date? }
  const [dragging, setDragging] = useState(null)

  // Calculate date range for API query
  const getDateRange = useCallback(() => {
    const d = currentDate
    if (view === 'month') {
      const first = new Date(d.getFullYear(), d.getMonth(), 1)
      const start = addDays(first, -first.getDay())
      const end = addDays(start, 42)
      return { start: start.toISOString(), end: end.toISOString() }
    }
    if (view === 'week') {
      const start = addDays(d, -d.getDay())
      const end = addDays(start, 7)
      return { start: startOfDay(start).toISOString(), end: endOfDay(end).toISOString() }
    }
    return { start: startOfDay(d).toISOString(), end: endOfDay(d).toISOString() }
  }, [currentDate, view])

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const { start, end } = getDateRange()
      const params = new URLSearchParams({ start, end })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const result = await fetchPostsHook(params.toString())
      setPosts(result || [])
    } catch (err) {
      console.error('Failed to fetch posts:', err)
    } finally {
      setLoading(false)
    }
  }, [getDateRange, statusFilter])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  // Navigation
  const navigate = (dir) => {
    const d = new Date(currentDate)
    if (view === 'month') d.setMonth(d.getMonth() + dir)
    else if (view === 'week') d.setDate(d.getDate() + 7 * dir)
    else d.setDate(d.getDate() + dir)
    setCurrentDate(d)
  }
  const goToToday = () => setCurrentDate(new Date())

  // Title
  const title = useMemo(() => {
    if (view === 'month') return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    if (view === 'week') {
      const days = getWeekDays(currentDate)
      return `${formatDate(days[0])} — ${formatDate(days[6])}, ${days[6].getFullYear()}`
    }
    return `${DAYS[currentDate.getDay()]}, ${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`
  }, [currentDate, view])

  // CRUD handlers
  const handleSave = async (data) => {
    await savePost(data)
    fetchPosts()
  }
  const handleDelete = async (post) => {
    if (!window.confirm('Delete this post?')) return
    await deletePostHook(post.id)
    fetchPosts()
  }
  const handleDrop = async (postId, scheduledFor) => {
    await reschedulePost(postId, scheduledFor)
    fetchPosts()
  }

  const viewProps = {
    date: currentDate,
    posts,
    onDrop: handleDrop,
    onEdit: (post) => setModal({ post }),
    onDelete: handleDelete,
    onDragStart: setDragging,
    onCreateAt: (date) => setModal({ date }),
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold">Content Calendar</h1>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border rounded-md px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* View toggle */}
            <div className="flex border rounded-md overflow-hidden">
              {VIEWS.map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium transition-colors',
                    view === v ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50 text-muted-foreground'
                  )}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1">
              <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-md" title="Previous">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={goToToday} className="px-2.5 py-1.5 text-xs font-medium border rounded-md hover:bg-gray-50">
                Today
              </button>
              <button onClick={() => navigate(1)} className="p-1.5 hover:bg-gray-100 rounded-md" title="Next">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <span className="text-sm font-medium text-muted-foreground hidden sm:inline">{title}</span>

            {/* New post */}
            <button
              onClick={() => setModal({ date: currentDate })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              New Post
            </button>
          </div>
        </div>

        {/* Mobile title */}
        <div className="sm:hidden px-4 py-2 text-sm font-medium text-muted-foreground border-b">{title}</div>

        {/* Calendar body */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {view === 'month' && <MonthView {...viewProps} />}
              {view === 'week' && <WeekView {...viewProps} />}
              {view === 'day' && <DayView {...viewProps} />}
            </>
          )}
        </div>

        {/* Post counts summary */}
        <div className="flex items-center gap-4 px-4 py-2 border-t bg-gray-50 text-xs text-muted-foreground">
          {Object.entries(STATUS_COLORS).map(([status, colors]) => {
            const count = posts.filter((p) => p.status === status).length
            return (
              <div key={status} className="flex items-center gap-1.5">
                <span className={cn('h-2 w-2 rounded-full', colors.dot)} />
                <span>{status}: {count}</span>
              </div>
            )
          })}
          <span className="ml-auto">Total: {posts.length}</span>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <PostModal
          post={modal.post}
          date={modal.date}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </DashboardLayout>
  )
}

export default ContentCalendarPage
