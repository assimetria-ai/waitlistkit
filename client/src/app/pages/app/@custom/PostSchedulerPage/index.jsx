// @custom — post scheduler page (create/edit)
// Handles creating new posts (/app/posts/new) and editing existing ones (/app/posts/:id/edit)

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import {
  Calendar,
  Save,
  Send,
  ArrowLeft,
  FileText,
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LayoutDashboard,
} from 'lucide-react'
import { Header } from '../../../components/@system/Header'
import { Sidebar, SidebarSection, SidebarItem } from '../../../components/@system/Sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/@system/Card'
import { FormField, Input, Textarea } from '../../../components/@system/Form'
import { Button } from '../../../components/@system/ui/button'
import { usePostSchedulerPage } from '../../../hooks/@custom/usePostSchedulerPage'
import { cn } from '../../../lib/@system/utils'

// ─── Nav ──────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/app' },
  { icon: Calendar, label: 'Calendar', to: '/app/calendar' },
  { icon: FileText, label: 'Posts', to: '/app/posts' },
]

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', description: 'Save without publishing' },
  { value: 'scheduled', label: 'Scheduled', description: 'Publish at a set time' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert ISO string to value for datetime-local input (local time) */
function toDatetimeLocal(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

/** Format ISO string for display */
function formatDateTime(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PostSchedulerPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { fetchPost: fetchPostPage, savePost: savePostPage } = usePostSchedulerPage()

  const isEdit = !!id

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('draft')
  const [scheduledFor, setScheduledFor] = useState('')
  const [contentError, setContentError] = useState('')

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

  // Load existing post when editing
  useEffect(() => {
    if (!isEdit) return

    let cancelled = false
    setLoading(true)
    setError('')

    fetchPostPage(id)
      .then((post) => {
        if (cancelled) return
        setContent(post.content ?? '')
        setStatus(post.status === 'scheduled' ? 'scheduled' : 'draft')
        setScheduledFor(toDatetimeLocal(post.scheduled_for))
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message || 'Failed to load post')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, isEdit])

  function validate() {
    if (!content.trim()) {
      setContentError('Post content is required')
      return false
    }
    setContentError('')
    return true
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    setError('')

    const body = {
      content: content.trim(),
      status,
      scheduled_for:
        status === 'scheduled' && scheduledFor ? new Date(scheduledFor).toISOString() : null,
    }

    try {
      await savePostPage(isEdit ? id : null, body)
      navigate('/app/posts')
    } catch (err) {
      setError(err.message || 'Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  const charCount = content.length
  const scheduleOk =
    status !== 'scheduled' || (scheduledFor && new Date(scheduledFor) > new Date())

  // ── Loading skeleton ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0891B2]" />
        </div>
      </div>
    )
  }

  // ── Main render ────────────────────────────────────────────────────────────

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
          <div className="mx-auto max-w-2xl">
            {/* Back link */}
            <Link
              to="/app/posts"
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Posts
            </Link>

            {/* Page heading */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif" }}>
                {isEdit ? 'Edit Post' : 'New Post'}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {isEdit
                  ? 'Update your scheduled content.'
                  : 'Write and schedule your LinkedIn content.'}
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-5 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* ── Content card ─────────────────────────────────────────── */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-[#0891B2]" />
                    Post Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField error={contentError}>
                    <Textarea
                      placeholder="Write your LinkedIn post here…"
                      value={content}
                      onChange={(e) => {
                        setContent(e.target.value)
                        if (contentError) setContentError('')
                      }}
                      rows={9}
                      className="resize-y text-sm leading-relaxed"
                      error={!!contentError}
                    />
                  </FormField>
                  <p
                    className={cn(
                      'mt-2 text-xs',
                      charCount > 3000 ? 'font-medium text-destructive' : 'text-muted-foreground',
                    )}
                  >
                    {charCount.toLocaleString()} / 3,000 characters
                  </p>
                </CardContent>
              </Card>

              {/* ── Scheduling card ──────────────────────────────────────── */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4 text-[#6366F1]" />
                    Scheduling
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status toggle */}
                  <div className="grid grid-cols-2 gap-3">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatus(opt.value)}
                        className={cn(
                          'flex flex-col items-start rounded-lg border p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          status === opt.value
                            ? opt.value === 'scheduled'
                              ? 'border-[#6366F1] bg-[#6366F1]/5 ring-1 ring-[#6366F1]'
                              : 'border-[#0891B2] bg-[#0891B2]/5 ring-1 ring-[#0891B2]'
                            : 'border-border hover:border-muted-foreground/50',
                        )}
                      >
                        <span className="text-sm font-semibold">{opt.label}</span>
                        <span className="mt-0.5 text-xs text-muted-foreground">
                          {opt.description}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Date/time picker — only shown for "scheduled" */}
                  {status === 'scheduled' && (
                    <div className="space-y-3 rounded-lg border border-[#6366F1]/20 bg-[#6366F1]/5 p-4">
                      <FormField label="Date & Time">
                        <Input
                          type="datetime-local"
                          value={scheduledFor}
                          onChange={(e) => setScheduledFor(e.target.value)}
                          min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                        />
                      </FormField>

                      {/* Timezone indicator */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Globe className="h-3.5 w-3.5" />
                        <span>
                          Timezone:{' '}
                          <span className="font-medium text-foreground">{tz}</span>
                        </span>
                      </div>

                      {/* Validation feedback */}
                      {scheduledFor && !scheduleOk && (
                        <p className="flex items-center gap-1.5 text-xs text-destructive">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Scheduled time must be in the future
                        </p>
                      )}
                      {scheduledFor && scheduleOk && (
                        <p className="flex items-center gap-1.5 text-xs text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Will publish {formatDateTime(scheduledFor)}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Form actions ─────────────────────────────────────────── */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/app/posts')}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !scheduleOk}
                  className="gap-2 bg-[#0891B2] hover:bg-[#0891B2]/90"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : status === 'scheduled' ? (
                    <Send className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving
                    ? 'Saving…'
                    : isEdit
                      ? 'Update Post'
                      : status === 'scheduled'
                        ? 'Schedule Post'
                        : 'Save Draft'}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
