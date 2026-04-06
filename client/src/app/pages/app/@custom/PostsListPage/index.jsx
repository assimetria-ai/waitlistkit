// @custom — posts list page
// Shows all posts with status filter tabs, edit/delete actions, and pagination

import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Plus,
  Calendar,
  FileText,
  LayoutDashboard,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  FileEdit,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { Header } from '../../../components/@system/Header'
import { Sidebar, SidebarSection, SidebarItem } from '../../../components/@system/Sidebar'
import { Card } from '../../../components/@system/Card'
import { Button } from '../../../components/@system/ui/button'
import { Modal } from '../../../components/@system/Modal'
import { usePostsPage } from '../../../hooks/@custom/usePostsPage'
import { cn } from '../../../lib/@system/utils'

// ─── Nav ──────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/app' },
  { icon: Calendar, label: 'Calendar', to: '/app/calendar' },
  { icon: FileText, label: 'Posts', to: '/app/posts' },
]

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'failed', label: 'Failed' },
]

const PAGE_SIZE = 10

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG = {
  draft: {
    icon: FileEdit,
    label: 'Draft',
    className: 'bg-muted text-muted-foreground',
  },
  scheduled: {
    icon: Clock,
    label: 'Scheduled',
    className: 'bg-[#6366F1]/10 text-[#6366F1]',
  },
  published: {
    icon: CheckCircle2,
    label: 'Published',
    className: 'bg-emerald-100 text-emerald-700',
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    className: 'bg-destructive/10 text-destructive',
  },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
  const Icon = cfg.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        cfg.className,
      )}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function PostRow({ post, onDelete }) {
  const navigate = useNavigate()
  const preview =
    (post.content?.slice(0, 140) ?? '') + (post.content?.length > 140 ? '…' : '')

  return (
    <div className="group flex flex-col gap-3 border-b border-border p-4 last:border-0 transition-colors hover:bg-muted/30 sm:flex-row sm:items-start sm:gap-4">
      {/* Content area */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={post.status} />
          {post.status === 'scheduled' && post.scheduled_for && (
            <span className="text-xs text-muted-foreground">
              {formatDate(post.scheduled_for)}
            </span>
          )}
          {post.status === 'published' && post.published_at && (
            <span className="text-xs text-muted-foreground">
              Published {formatDate(post.published_at)}
            </span>
          )}
        </div>

        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-foreground">
          {preview || <span className="italic text-muted-foreground">No content</span>}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Created {formatDate(post.created_at)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => navigate(`/app/posts/${post.id}/edit`)}
        >
          <Edit2 className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(post)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
    </div>
  )
}

function EmptyState({ statusFilter, onNew }) {
  const label = statusFilter
    ? STATUS_CONFIG[statusFilter]?.label?.toLowerCase() ?? statusFilter
    : null

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
      <p className="mt-4 text-sm font-medium text-foreground">
        {label ? `No ${label} posts` : 'No posts yet'}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {label
          ? `Posts with "${label}" status will appear here.`
          : 'Create your first post to get started.'}
      </p>
      {!statusFilter && (
        <Button
          size="sm"
          className="mt-5 gap-2 bg-[#0891B2] hover:bg-[#0891B2]/90"
          onClick={onNew}
        >
          <Plus className="h-4 w-4" />
          Create your first post
        </Button>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PostsListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { fetchPosts: apiFetchPosts, deletePost: apiDeletePost } = usePostsPage()

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { posts: data, total: count } = await apiFetchPosts(statusFilter, PAGE_SIZE, (page - 1) * PAGE_SIZE)
      setPosts(data)
      setTotal(count)
    } catch (err) {
      setError(err.message || 'Failed to load posts')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page, apiFetchPosts])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  function openDelete(post) {
    setDeleteError('')
    setDeleteTarget(post)
  }

  function closeDelete() {
    setDeleteTarget(null)
    setDeleteError('')
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    try {
      await apiDeletePost(deleteTarget.id)
      setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setTotal((t) => Math.max(0, t - 1))
      closeDelete()
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete post')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar>
          <div className="mb-6 px-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Navigation
            </p>
          </div>
          <SidebarSection>
            {NAV_ITEMS.map(({ icon: Icon, label, to }) => (
              <Link to={to} key={to}>
                <SidebarItem
                  icon={<Icon className="h-4 w-4" />}
                  label={label}
                  active={
                    to === '/app'
                      ? location.pathname === '/app'
                      : location.pathname.startsWith(to)
                  }
                />
              </Link>
            ))}
          </SidebarSection>
        </Sidebar>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-3xl">
            {/* Page header */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1
                  className="text-2xl font-bold"
                  style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}
                >
                  Posts
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your scheduled and published content.
                </p>
              </div>
              <Button
                className="shrink-0 gap-2 bg-[#0891B2] hover:bg-[#0891B2]/90"
                onClick={() => navigate('/app/posts/new')}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Post</span>
                <span className="sm:hidden">New</span>
              </Button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-4 flex items-center justify-between gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                  onClick={fetchPosts}
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </Button>
              </div>
            )}

            {/* Status filter tabs */}
            <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg border bg-muted/40 p-1">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={cn(
                    'shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    statusFilter === tab.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Posts list */}
            <Card className="overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-7 w-7 animate-spin text-[#0891B2]" />
                </div>
              ) : posts.length === 0 ? (
                <EmptyState
                  statusFilter={statusFilter}
                  onNew={() => navigate('/app/posts/new')}
                />
              ) : (
                posts.map((post) => (
                  <PostRow key={post.id} post={post} onDelete={openDelete} />
                ))
              )}
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages} &middot; {total} post{total !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteTarget}
        onClose={closeDelete}
        title="Delete Post?"
        description="This action cannot be undone. The post will be permanently removed."
        size="sm"
      >
        {/* Post preview */}
        <p className="mb-4 line-clamp-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          {deleteTarget?.content?.slice(0, 120) || 'Empty post'}
        </p>

        {deleteError && (
          <p className="mb-3 flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {deleteError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={closeDelete} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="gap-2"
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            {deleting ? 'Deleting…' : 'Delete Post'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
