// @custom — clip library page with tag-based search
// Displays user's media clips (video/audio/image) with tag filters and text search.
import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Settings,
  Activity,
  CreditCard,
  Film,
  Music,
  Image,
  Search,
  Tag,
  Plus,
  Trash2,
  X,
  Clock,
  Upload,
  Library,
  ChevronDown,
  Play,
} from 'lucide-react'
import { Header } from '../../../components/@system/Header'
import { Sidebar, SidebarSection, SidebarItem } from '../../../components/@system/Sidebar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/@system/Card'
import { Button } from '../../../components/@system/ui/button'
import { FormField, Input } from '../../../components/@system/Form'
import { Modal } from '../../../components/@system/Modal'
import { useAuthContext } from '../../../store/@system/auth'
import { cn } from '../../../lib/@system/utils'
import { clipsApi } from '../../../lib/@custom/clips'

// ─── Nav ─────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: Home, label: 'Dashboard', to: '/app' },
  { icon: Library, label: 'Clip Library', to: '/app/library' },
  { icon: Activity, label: 'Activity', to: '/app/activity' },
  { icon: CreditCard, label: 'Billing', to: '/app/billing' },
  { icon: Settings, label: 'Settings', to: '/app/settings' },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_TABS = [
  { label: 'All', value: '' },
  { label: 'Video', value: 'video', icon: Film },
  { label: 'Audio', value: 'audio', icon: Music },
  { label: 'Image', value: 'image', icon: Image },
]

const PAGE_SIZE = 24

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(seconds) {
  if (seconds == null) return null
  const s = Math.round(seconds)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

function formatBytes(bytes) {
  if (!bytes) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function typeIcon(type, className = 'h-4 w-4') {
  if (type === 'audio') return <Music className={className} />
  if (type === 'image') return <Image className={className} />
  return <Film className={className} />
}

// ─── Tag Pill ─────────────────────────────────────────────────────────────────

function TagPill({ tag, active, onClick, onRemove }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors whitespace-nowrap',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-muted/40 text-foreground hover:bg-muted',
      )}
    >
      <Tag className="h-3 w-3" />
      {tag}
      {onRemove && (
        <span
          role="button"
          onClick={(e) => { e.stopPropagation(); onRemove(tag) }}
          className="ml-0.5 rounded-full hover:bg-white/20 p-0.5"
        >
          <X className="h-2.5 w-2.5" />
        </span>
      )}
    </button>
  )
}

// ─── Clip Card ────────────────────────────────────────────────────────────────

function ClipCard({ clip, onDelete, onTagClick, activeTags }) {
  const [hover, setHover] = useState(false)

  return (
    <div
      className="group relative rounded-lg border border-border bg-card overflow-hidden transition-shadow hover:shadow-md"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
        {clip.thumbnail_url ? (
          <img
            src={clip.thumbnail_url}
            alt={clip.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground/40">
            {typeIcon(clip.type, 'h-8 w-8')}
          </div>
        )}

        {/* Overlay on hover */}
        {hover && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
            {clip.type === 'video' && (
              <div className="rounded-full bg-white/90 p-2">
                <Play className="h-4 w-4 text-foreground fill-current" />
              </div>
            )}
            <button
              onClick={() => onDelete(clip)}
              className="rounded-full bg-destructive/90 p-2 text-white hover:bg-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Duration badge */}
        {clip.duration != null && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-mono text-white">
            {formatDuration(clip.duration)}
          </span>
        )}

        {/* Type badge */}
        <span className="absolute top-1.5 left-1.5 rounded bg-black/60 p-1 text-white">
          {typeIcon(clip.type, 'h-3 w-3')}
        </span>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-foreground truncate" title={clip.name}>
          {clip.name}
        </p>
        {clip.size_bytes && (
          <p className="text-xs text-muted-foreground mt-0.5">{formatBytes(clip.size_bytes)}</p>
        )}

        {/* Tags */}
        {clip.tags && clip.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {clip.tags.slice(0, 4).map((tag) => (
              <TagPill
                key={tag}
                tag={tag}
                active={activeTags.includes(tag)}
                onClick={() => onTagClick(tag)}
              />
            ))}
            {clip.tags.length > 4 && (
              <span className="text-xs text-muted-foreground self-center">
                +{clip.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Add Clip Modal ───────────────────────────────────────────────────────────

function AddClipModal({ open, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('video')
  const [tags, setTags] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [duration, setDuration] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    try {
      const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean)
      const result = await clipsApi.create({
        name: name.trim(),
        type,
        tags: tagArray,
        file_url: fileUrl.trim() || undefined,
        duration: duration ? parseFloat(duration) : undefined,
      })
      onCreated(result.clip)
      handleClose()
    } catch (err) {
      setError(err.message || 'Failed to create clip')
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    setName('')
    setType('video')
    setTags('')
    setFileUrl('')
    setDuration('')
    setError('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Clip"
      description="Register a new clip in your library. You can add tags to organise and search your media."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Name">
          <Input
            placeholder="e.g. Intro animation"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </FormField>

        <FormField label="Type">
          <div className="relative">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full appearance-none rounded-md border border-border bg-background px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="image">Image</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </FormField>

        <FormField label="Tags" hint="Comma-separated, e.g. intro, branding, logo">
          <Input
            placeholder="intro, branding, logo"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </FormField>

        <FormField label="File URL (optional)">
          <Input
            placeholder="https://..."
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
          />
        </FormField>

        <FormField label="Duration in seconds (optional)">
          <Input
            type="number"
            min="0"
            step="0.001"
            placeholder="e.g. 30.5"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </FormField>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
          <Button type="submit" disabled={saving} className="gap-2">
            <Plus className="h-4 w-4" />
            {saving ? 'Adding…' : 'Add Clip'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Delete Confirmation ──────────────────────────────────────────────────────

function DeleteModal({ clip, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await clipsApi.remove(clip.id)
      onDeleted(clip.id)
      onClose()
    } catch {
      // ignore — could show toast
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal
      open={!!clip}
      onClose={onClose}
      title="Delete Clip"
      description={`Remove "${clip?.name}" from your library? This cannot be undone.`}
    >
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </div>
    </Modal>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyLibrary({ onAdd, hasFilters }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {hasFilters ? (
        <>
          <Search className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">No clips match your filters</p>
          <p className="mt-1 text-xs text-muted-foreground">Try different tags or clear the search.</p>
        </>
      ) : (
        <>
          <Library className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">Your library is empty</p>
          <p className="mt-1 text-xs text-muted-foreground">Add your first clip to get started.</p>
          <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={onAdd}>
            <Upload className="h-4 w-4" />
            Add your first clip
          </Button>
        </>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ClipLibraryPage() {
  const { user } = useAuthContext()
  const location = useLocation()

  // Data
  const [clips, setClips] = useState([])
  const [total, setTotal] = useState(0)
  const [allTags, setAllTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeType, setActiveType] = useState('')
  const [activeTags, setActiveTags] = useState([])

  // Modals
  const [addOpen, setAddOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Debounce search
  const debounceRef = useRef(null)
  function handleSearchChange(val) {
    setSearch(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val)
      setPage(0)
    }, 300)
  }

  // Load clips
  const fetchClips = useCallback(async () => {
    setLoading(true)
    try {
      const result = await clipsApi.list({
        type: activeType || undefined,
        tags: activeTags.length ? activeTags : undefined,
        search: debouncedSearch || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      })
      setClips(result.clips)
      setTotal(result.total)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [activeType, activeTags, debouncedSearch, page])

  useEffect(() => { fetchClips() }, [fetchClips])

  // Load all tags once
  useEffect(() => {
    clipsApi.tags().then((r) => setAllTags(r.tags)).catch(() => {})
  }, [])

  function toggleTag(tag) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
    setPage(0)
  }

  function clearFilters() {
    setSearch('')
    setDebouncedSearch('')
    setActiveType('')
    setActiveTags([])
    setPage(0)
  }

  function handleCreated(clip) {
    setClips((prev) => [clip, ...prev])
    setTotal((t) => t + 1)
    if (clip.tags) {
      setAllTags((prev) => {
        const merged = new Set([...prev, ...clip.tags])
        return [...merged].sort()
      })
    }
  }

  function handleDeleted(id) {
    setClips((prev) => prev.filter((c) => c.id !== id))
    setTotal((t) => t - 1)
  }

  const hasFilters = !!(debouncedSearch || activeType || activeTags.length)

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar>
          <SidebarSection>
            {NAV_ITEMS.map(({ icon: Icon, label, to }) => (
              <Link to={to} key={to}>
                <SidebarItem
                  icon={<Icon className="h-4 w-4" />}
                  label={label}
                  active={location.pathname === to}
                />
              </Link>
            ))}
          </SidebarSection>
        </Sidebar>

        {/* Main */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {/* Page header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Library className="h-6 w-6" />
                Clip Library
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Your media assets — search and filter by tags.
              </p>
            </div>
            <Button onClick={() => setAddOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Clip
            </Button>
          </div>

          {/* Stats bar */}
          {!loading && total > 0 && (
            <div className="mb-5 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Film className="h-3.5 w-3.5" />
                {clips.filter((c) => c.type === 'video').length} video
              </span>
              <span className="flex items-center gap-1">
                <Music className="h-3.5 w-3.5" />
                {clips.filter((c) => c.type === 'audio').length} audio
              </span>
              <span className="flex items-center gap-1">
                <Image className="h-3.5 w-3.5" />
                {clips.filter((c) => c.type === 'image').length} image
              </span>
              <span className="ml-auto text-foreground font-medium">
                {total.toLocaleString()} total
              </span>
            </div>
          )}

          {/* Search + type filter row */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search clips…"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {search && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Type tabs */}
            <div className="flex rounded-lg border border-border bg-muted/40 p-0.5 gap-0.5">
              {TYPE_TABS.map(({ label, value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => { setActiveType(value); setPage(0) }}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium transition-colors',
                    activeType === value
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {label}
                </button>
              ))}
            </div>

            {/* Clear filters */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Tag filter pills */}
          {allTags.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <TagPill
                  key={tag}
                  tag={tag}
                  active={activeTags.includes(tag)}
                  onClick={() => toggleTag(tag)}
                />
              ))}
            </div>
          )}

          {/* Active tag chips */}
          {activeTags.length > 0 && (
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Filtering by:</span>
              {activeTags.map((tag) => (
                <TagPill
                  key={tag}
                  tag={tag}
                  active
                  onClick={() => toggleTag(tag)}
                  onRemove={toggleTag}
                />
              ))}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border bg-card overflow-hidden animate-pulse">
                  <div className="aspect-video bg-muted" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-2.5 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : clips.length === 0 ? (
            <EmptyLibrary onAdd={() => setAddOpen(true)} hasFilters={hasFilters} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {clips.map((clip) => (
                <ClipCard
                  key={clip.id}
                  clip={clip}
                  activeTags={activeTags}
                  onTagClick={toggleTag}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString()}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={(page + 1) * PAGE_SIZE >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <AddClipModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={handleCreated} />
      {deleteTarget && (
        <DeleteModal
          clip={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
