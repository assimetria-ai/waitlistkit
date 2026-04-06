/**
 * @custom PostsList — List view for all LinkedIn posts (draft, scheduled, published, failed).
 * Brand: #0891B2 primary, #6366F1 accent, Inter + Space Grotesk fonts.
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus,
  Search,
  Filter,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Edit3,
  Trash2,
  Copy,
  MoreVertical,
  ChevronDown,
  ArrowUpDown,
  Eye,
  Send,
  Loader2,
  X,
  List,
  LayoutGrid,
} from 'lucide-react'
import { DashboardLayout } from '../../../components/@system/Dashboard/DashboardLayout'
import { cn } from '../../../lib/@system/utils'
import { usePostsList } from '../../../hooks/@custom/usePostsList'

// ─── Brand Tokens ─────────────────────────────────────────────────
const BRAND = {
  primary: '#0891B2',
  accent: '#6366F1',
  primaryLight: '#0891B210',
  accentLight: '#6366F110',
}

// ─── Status Configuration ─────────────────────────────────────────
const STATUSES = [
  { id: 'all', label: 'All Posts', icon: List },
  { id: 'draft', label: 'Drafts', icon: FileText },
  { id: 'scheduled', label: 'Scheduled', icon: Clock },
  { id: 'published', label: 'Published', icon: CheckCircle },
  { id: 'failed', label: 'Failed', icon: AlertCircle },
]

const STATUS_STYLES = {
  draft: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    dot: 'bg-slate-400',
    label: 'Draft',
  },
  scheduled: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    dot: 'bg-cyan-500',
    label: 'Scheduled',
  },
  published: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
    label: 'Published',
  },
  failed: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
    label: 'Failed',
  },
}

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest first' },
  { id: 'oldest', label: 'Oldest first' },
  { id: 'scheduled', label: 'Scheduled date' },
]

// ─── Helpers ──────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function truncate(text, maxLen = 120) {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const d = new Date(dateStr)
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}d ago`
  return formatDate(dateStr)
}

// ─── StatusBadge ──────────────────────────────────────────────────
function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.draft
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
        style.bg,
        style.text
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', style.dot)} />
      {style.label}
    </span>
  )
}

// ─── ActionMenu ───────────────────────────────────────────────────
function ActionMenu({ post, onEdit, onDuplicate, onDelete, onView }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
            <button
              onClick={() => {
                onView(post)
                setOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Eye size={14} />
              Preview
            </button>
            <button
              onClick={() => {
                onEdit(post)
                setOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Edit3 size={14} />
              Edit
            </button>
            <button
              onClick={() => {
                onDuplicate(post)
                setOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Copy size={14} />
              Duplicate
            </button>
            <hr className="my-1 border-slate-100" />
            <button
              onClick={() => {
                onDelete(post)
                setOpen(false)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Preview Modal ────────────────────────────────────────────────
function PreviewModal({ post, onClose }) {
  if (!post) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3
            className="text-lg font-semibold text-slate-900"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Post Preview
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <StatusBadge status={post.status} />
            {post.scheduled_for && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock size={12} />
                {formatDate(post.scheduled_for)} at {formatTime(post.scheduled_for)}
              </span>
            )}
          </div>
          <div className="bg-slate-50 rounded-xl p-4 whitespace-pre-wrap text-sm text-slate-800 leading-relaxed">
            {post.content || '(empty post)'}
          </div>
          {post.published_at && (
            <p className="mt-3 text-xs text-slate-400">
              Published {formatDate(post.published_at)} at{' '}
              {formatTime(post.published_at)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Delete Confirm Modal ─────────────────────────────────────────
function DeleteConfirmModal({ post, onConfirm, onCancel }) {
  if (!post) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <h3
          className="text-lg font-semibold text-slate-900 mb-2"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          Delete Post
        </h3>
        <p className="text-sm text-slate-600 mb-1">
          Are you sure you want to delete this post?
        </p>
        <p className="text-xs text-slate-400 mb-5">
          {truncate(post.content, 80)}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(post.id)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────
export function PostsList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { fetchPosts: apiFetchPosts, duplicatePost: apiDuplicatePost, deletePost: apiDeletePost } = usePostsList()

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('status') || 'all'
  )
  const [sortBy, setSortBy] = useState('newest')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' | 'grid'
  const [previewPost, setPreviewPost] = useState(null)
  const [deletePost, setDeletePost] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // ─── Fetch Posts ──────────────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const posts = await apiFetchPosts(statusFilter)
      setPosts(posts)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, apiFetchPosts])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Sync filter to URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    setSearchParams(params, { replace: true })
  }, [statusFilter, setSearchParams])

  // ─── Filtered + Sorted Posts ──────────────────────────────────
  const filteredPosts = useMemo(() => {
    let result = [...posts]

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((p) =>
        (p.content || '').toLowerCase().includes(q)
      )
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at) - new Date(a.created_at)
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at) - new Date(b.created_at)
      }
      if (sortBy === 'scheduled') {
        const aDate = a.scheduled_for
          ? new Date(a.scheduled_for)
          : new Date('9999-12-31')
        const bDate = b.scheduled_for
          ? new Date(b.scheduled_for)
          : new Date('9999-12-31')
        return aDate - bDate
      }
      return 0
    })

    return result
  }, [posts, search, sortBy])

  // ─── Actions ──────────────────────────────────────────────────
  const handleEdit = (post) => {
    navigate(`/app/posts/${post.id}/edit`)
  }

  const handleDuplicate = async (post) => {
    try {
      await apiDuplicatePost(post.content)
      fetchPosts()
    } catch (err) {
      console.error('Duplicate failed:', err)
    }
  }

  const handleDelete = async (postId) => {
    setDeleting(true)
    try {
      await apiDeletePost(postId)
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      setDeletePost(null)
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(false)
    }
  }

  // ─── Status Counts ────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const counts = { all: posts.length, draft: 0, scheduled: 0, published: 0, failed: 0 }
    posts.forEach((p) => {
      if (counts[p.status] !== undefined) counts[p.status]++
    })
    return counts
  }, [posts])

  // ─── Render ───────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-2xl font-bold text-slate-900"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Posts
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your LinkedIn content
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/app/calendar')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <CalendarIcon size={16} />
              Calendar
            </button>
            <button
              onClick={() => navigate('/app/posts/new')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ backgroundColor: BRAND.primary }}
            >
              <Plus size={16} />
              New Post
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
          {STATUSES.map((s) => {
            const Icon = s.icon
            const active = statusFilter === s.id
            return (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  active
                    ? 'text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
                style={active ? { backgroundColor: BRAND.primary } : {}}
              >
                <Icon size={14} />
                {s.label}
                <span
                  className={cn(
                    'ml-1 text-xs px-1.5 py-0.5 rounded-full',
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {statusCounts[s.id] || 0}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search + Sort bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': BRAND.primary + '40' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ArrowUpDown size={14} />
                {SORT_OPTIONS.find((o) => o.id === sortBy)?.label}
                <ChevronDown size={14} />
              </button>
              {showSortDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSortDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setSortBy(opt.id)
                          setShowSortDropdown(false)
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm',
                          sortBy === opt.id
                            ? 'font-medium'
                            : 'text-slate-700 hover:bg-slate-50'
                        )}
                        style={
                          sortBy === opt.id ? { color: BRAND.primary } : {}
                        }
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* View toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-slate-900'
                    : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2
              size={24}
              className="animate-spin"
              style={{ color: BRAND.primary }}
            />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertCircle size={32} className="mx-auto text-red-400 mb-3" />
            <p className="text-sm text-slate-600">{error}</p>
            <button
              onClick={fetchPosts}
              className="mt-3 text-sm font-medium hover:underline"
              style={{ color: BRAND.primary }}
            >
              Try again
            </button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={40} className="mx-auto text-slate-300 mb-3" />
            <h3
              className="text-lg font-semibold text-slate-900 mb-1"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              {search ? 'No posts match your search' : 'No posts yet'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {search
                ? 'Try a different search term'
                : 'Create your first LinkedIn post to get started'}
            </p>
            {!search && (
              <button
                onClick={() => navigate('/app/posts/new')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                style={{ backgroundColor: BRAND.primary }}
              >
                <Plus size={16} />
                Create Post
              </button>
            )}
          </div>
        ) : viewMode === 'list' ? (
          /* ─── List View ──────────────────────────────────────── */
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-start gap-4 p-4 hover:bg-slate-50/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <StatusBadge status={post.status} />
                    <span className="text-xs text-slate-400">
                      {timeAgo(post.created_at)}
                    </span>
                  </div>
                  <p
                    className="text-sm text-slate-800 leading-relaxed cursor-pointer hover:text-slate-900"
                    onClick={() => handleEdit(post)}
                  >
                    {truncate(post.content, 180)}
                  </p>
                  {post.scheduled_for && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                      <Clock size={12} />
                      Scheduled for {formatDate(post.scheduled_for)} at{' '}
                      {formatTime(post.scheduled_for)}
                    </div>
                  )}
                  {post.published_at && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                      <CheckCircle size={12} />
                      Published {formatDate(post.published_at)}
                    </div>
                  )}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleEdit(post)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                    title="Edit"
                  >
                    <Edit3 size={15} />
                  </button>
                  <ActionMenu
                    post={post}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={setDeletePost}
                    onView={setPreviewPost}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ─── Grid View ──────────────────────────────────────── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center justify-between mb-3">
                  <StatusBadge status={post.status} />
                  <ActionMenu
                    post={post}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={setDeletePost}
                    onView={setPreviewPost}
                  />
                </div>
                <p
                  className="text-sm text-slate-800 leading-relaxed mb-3 cursor-pointer hover:text-slate-900 line-clamp-4"
                  onClick={() => handleEdit(post)}
                >
                  {post.content || '(empty post)'}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{timeAgo(post.created_at)}</span>
                  {post.scheduled_for && (
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {formatDate(post.scheduled_for)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results count */}
        {!loading && filteredPosts.length > 0 && (
          <p className="text-xs text-slate-400 mt-4 text-center">
            Showing {filteredPosts.length} of {posts.length} posts
          </p>
        )}
      </div>

      {/* Modals */}
      {previewPost && (
        <PreviewModal post={previewPost} onClose={() => setPreviewPost(null)} />
      )}
      {deletePost && (
        <DeleteConfirmModal
          post={deletePost}
          onConfirm={handleDelete}
          onCancel={() => setDeletePost(null)}
        />
      )}
    </DashboardLayout>
  )
}

export default PostsList
