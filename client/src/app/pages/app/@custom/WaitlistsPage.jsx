// @custom — Waitlist management page: list, create, delete waitlists
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Rocket, Trash2, ExternalLink, X, Loader2 } from 'lucide-react'
import { PageLayout } from '../../../components/@system/layout/PageLayout'

export function WaitlistsPage({ createMode = false }) {
  const navigate = useNavigate()
  const [waitlists, setWaitlists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(createMode)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    product_url: '',
    referral_enabled: true,
  })
  const [formError, setFormError] = useState('')

  const fetchWaitlists = () => {
    setLoading(true)
    fetch('/api/waitlists', { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load waitlists')
        return r.json()
      })
      .then((data) => setWaitlists(data.waitlists ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchWaitlists()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setFormError('Name is required')
      return
    }
    setFormError('')
    setCreating(true)
    try {
      const r = await fetch('/api/waitlists', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!r.ok) {
        const d = await r.json()
        throw new Error(d.error ?? 'Failed to create waitlist')
      }
      const data = await r.json()
      setShowCreate(false)
      setForm({ name: '', description: '', product_url: '', referral_enabled: true })
      navigate(`/app/waitlists/${data.waitlist.id}`)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete waitlist "${name}"? This cannot be undone.`)) return
    try {
      const r = await fetch(`/api/waitlists/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!r.ok) throw new Error('Failed to delete')
      setWaitlists((prev) => prev.filter((w) => w.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    try {
      const r = await fetch(`/api/waitlists/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!r.ok) throw new Error('Failed to update')
      setWaitlists((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status: newStatus } : w)),
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed')
    }
  }

  return (
    <PageLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Waitlists</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your launch waitlists</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Waitlist
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card border rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-lg">Create Waitlist</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="My Product Launch"
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What are people signing up for?"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Product URL</label>
                <input
                  type="url"
                  value={form.product_url}
                  onChange={(e) => setForm((f) => ({ ...f, product_url: e.target.value }))}
                  placeholder="https://myproduct.com"
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="referral"
                  checked={form.referral_enabled}
                  onChange={(e) => setForm((f) => ({ ...f, referral_enabled: e.target.checked }))}
                  className="h-4 w-4 accent-primary"
                />
                <label htmlFor="referral" className="text-sm font-medium">Enable referral system</label>
              </div>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-destructive text-sm">{error}</p>
          <button
            onClick={fetchWaitlists}
            className="mt-3 text-sm underline text-muted-foreground hover:text-foreground"
          >
            Try again
          </button>
        </div>
      ) : waitlists.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Rocket className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold mb-1">No waitlists yet</p>
          <p className="text-sm text-muted-foreground mb-5">
            Create your first waitlist and start capturing early signups.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Create Waitlist
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {waitlists.map((wl) => (
            <div
              key={wl.id}
              className="rounded-xl border bg-card p-5 flex items-center justify-between gap-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => navigate(`/app/waitlists/${wl.id}`)}
                    className="font-semibold hover:underline truncate"
                  >
                    {wl.name}
                  </button>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                      wl.status === 'active'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {wl.status}
                  </span>
                </div>
                {wl.description && (
                  <p className="text-sm text-muted-foreground truncate">{wl.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {wl.subscriber_count ?? 0} subscribers · /{wl.slug}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {wl.product_url && (
                  <a
                    href={wl.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="Open product URL"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <button
                  onClick={() => handleToggleStatus(wl.id, wl.status)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    wl.status === 'active'
                      ? 'border hover:bg-muted text-muted-foreground'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}
                >
                  {wl.status === 'active' ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={() => navigate(`/app/waitlists/${wl.id}`)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Manage
                </button>
                <button
                  onClick={() => handleDelete(wl.id, wl.name)}
                  className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                  title="Delete waitlist"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
