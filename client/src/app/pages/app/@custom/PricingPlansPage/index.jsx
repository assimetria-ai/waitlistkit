import { useState } from 'react'
import {
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  Star,
  ToggleLeft,
  ToggleRight,
  X,
  Check,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { Header } from '../../../components/@system/Header'
import { PageLayout } from '../../../components/@system/PageLayout'
import { Button } from '../../../components/@system/ui/button'
import { usePricingPlans } from '../../../hooks/@custom/usePricingPlans'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PricingPlan {
  id: number
  name: string
  slug: string
  description: string | null
  price_monthly: number
  price_yearly: number
  currency: string
  features
  limits: Record<string, number>
  stripe_price_id_monthly: string | null
  stripe_price_id_yearly: string | null
  is_active: boolean
  is_popular: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

type PlanFormData = Omit<PricingPlan, 'id' | 'created_at' | 'updated_at'> & {
  features_raw: string // textarea string version of features array
  limits_raw: string   // textarea string version of limits object
}

const EMPTY_FORM: PlanFormData = {
  name: '',
  slug: '',
  description: '',
  price_monthly: 0,
  price_yearly: 0,
  currency: 'usd',
  features: [],
  limits: {},
  features_raw: '',
  limits_raw: '{}',
  stripe_price_id_monthly: '',
  stripe_price_id_yearly: '',
  is_active: true,
  is_popular: false,
  sort_order: 0,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

function planToForm(plan: PricingPlan): PlanFormData {
  return {
    ...plan,
    features_raw: (plan.features ?? []).join('\n'),
    limits_raw: JSON.stringify(plan.limits ?? {}, null, 2),
  }
}

// ─── Plan Form Modal ──────────────────────────────────────────────────────────

function PlanFormModal({
  initial,
  onClose,
  onSaved,
  savePlan,
}: {
  initial: PlanFormData
  onClose: () => void
  onSaved: (plan: PricingPlan) => void
  savePlan: (planId: number | null, payload: object) => Promise<PricingPlan>
}) {
  const [form, setForm] = useState<PlanFormData>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = 'id' in initial && (initial as unknown as PricingPlan).id != null

  function set<K extends keyof PlanFormData>(key: K, value: PlanFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleNameChange(value: string) {
    set('name', value)
    set('slug', value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    let features
    let limits: Record<string, number>

    try {
      features = form.features_raw
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
    } catch {
      setError('Features must be one entry per line.')
      return
    }

    try {
      limits = JSON.parse(form.limits_raw || '{}')
    } catch {
      setError('Limits must be valid JSON (e.g. {"pages": 5}).')
      return
    }

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      price_monthly: Number(form.price_monthly),
      price_yearly: Number(form.price_yearly),
      currency: form.currency,
      features,
      limits,
      stripe_price_id_monthly: form.stripe_price_id_monthly || null,
      stripe_price_id_yearly: form.stripe_price_id_yearly || null,
      is_active: form.is_active,
      is_popular: form.is_popular,
      sort_order: Number(form.sort_order),
    }

    try {
      setSaving(true)
      const planId = isEdit ? (initial as unknown as PricingPlan).id : null
      const plan = await savePlan(planId, payload)
      onSaved(plan)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save plan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-background shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold text-foreground">
            {isEdit ? 'Edit Plan' : 'New Pricing Plan'}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Name + Slug */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Plan Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="Pro"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Slug *</label>
                <input
                  required
                  value={form.slug}
                  onChange={e => set('slug', e.target.value)}
                  placeholder="pro"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Description</label>
              <input
                value={form.description ?? ''}
                onChange={e => set('description', e.target.value)}
                placeholder="Short description shown on pricing page"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Prices + Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Monthly Price *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price_monthly}
                    onChange={e => set('price_monthly', Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background pl-7 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Yearly Price *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price_yearly}
                    onChange={e => set('price_yearly', Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background pl-7 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Currency</label>
                <select
                  value={form.currency}
                  onChange={e => set('currency', e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="usd">USD</option>
                  <option value="eur">EUR</option>
                  <option value="gbp">GBP</option>
                </select>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Features</label>
              <p className="text-xs text-muted-foreground">One feature per line</p>
              <textarea
                rows={5}
                value={form.features_raw}
                onChange={e => set('features_raw', e.target.value)}
                placeholder={"Unlimited pages\nAll templates\nPriority support"}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </div>

            {/* Limits */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Limits (JSON)</label>
              <p className="text-xs text-muted-foreground">Use -1 for unlimited. e.g. {`{"pages": 25, "custom_domains": 1}`}</p>
              <textarea
                rows={3}
                value={form.limits_raw}
                onChange={e => set('limits_raw', e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </div>

            {/* Stripe IDs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Stripe Monthly Price ID</label>
                <input
                  value={form.stripe_price_id_monthly ?? ''}
                  onChange={e => set('stripe_price_id_monthly', e.target.value)}
                  placeholder="price_..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Stripe Yearly Price ID</label>
                <input
                  value={form.stripe_price_id_yearly ?? ''}
                  onChange={e => set('stripe_price_id_yearly', e.target.value)}
                  placeholder="price_..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Sort Order + Flags */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Sort Order</label>
                <input
                  type="number"
                  min="0"
                  value={form.sort_order}
                  onChange={e => set('sort_order', Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="flex flex-col gap-3 sm:pt-6">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => set('is_active', e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm font-medium text-foreground">Active</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.is_popular}
                    onChange={e => set('is_popular', e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm font-medium text-foreground">Mark as Popular</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Plan Row ─────────────────────────────────────────────────────────────────

function PlanRow({
  plan,
  onEdit,
  onDelete,
  onToggleActive,
  onMove,
}: {
  plan: PricingPlan
  onEdit: (plan: PricingPlan) => void
  onDelete: (id: number) => void
  onToggleActive: (plan: PricingPlan) => void
  onMove: (id: number, direction: 'up' | 'down') => void
}) {
  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
      {/* Order */}
      <td className="px-4 py-4 w-10">
        <div className="flex flex-col items-center gap-0.5">
          <button
            onClick={() => onMove(plan.id, 'up')}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs font-mono text-muted-foreground">{plan.sort_order}</span>
          <button
            onClick={() => onMove(plan.id, 'down')}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>

      {/* Name */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-foreground">{plan.name}</span>
          {plan.is_popular && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              <Star className="h-3 w-3" />
              Popular
            </span>
          )}
          {!plan.is_active && (
            <span className="rounded-full bg-muted border border-border px-2 py-0.5 text-xs text-muted-foreground">
              Inactive
            </span>
          )}
        </div>
        <p className="text-xs font-mono text-muted-foreground mt-0.5">/{plan.slug}</p>
        {plan.description && (
          <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate">{plan.description}</p>
        )}
      </td>

      {/* Pricing */}
      <td className="px-4 py-4 hidden sm:table-cell">
        <p className="text-sm font-semibold text-foreground">
          {formatPrice(plan.price_monthly, plan.currency)}<span className="text-xs font-normal text-muted-foreground">/mo</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatPrice(plan.price_yearly, plan.currency)}/yr
        </p>
      </td>

      {/* Features count */}
      <td className="px-4 py-4 hidden md:table-cell">
        <span className="text-sm text-muted-foreground">
          {(plan.features ?? []).length} features
        </span>
      </td>

      {/* Stripe */}
      <td className="px-4 py-4 hidden lg:table-cell">
        {plan.stripe_price_id_monthly ? (
          <div className="flex items-center gap-1 text-green-600">
            <Check className="h-3.5 w-3.5" />
            <span className="text-xs">Linked</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onToggleActive(plan)}
            title={plan.is_active ? 'Deactivate' : 'Activate'}
            className="rounded-md p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            {plan.is_active
              ? <ToggleRight className="h-4 w-4 text-primary" />
              : <ToggleLeft className="h-4 w-4" />}
          </button>
          <button
            onClick={() => onEdit(plan)}
            className="rounded-md p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(plan.id)}
            className="rounded-md p-1.5 hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PricingPlansPage() {
  const { plans, setPlans, loading, fetchPlans, savePlan, deletePlan, toggleActive, movePlan } = usePricingPlans()
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  function handleSaved(saved: PricingPlan) {
    setPlans(prev => {
      const idx = prev.findIndex(p => p.id === saved.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = saved
        return updated
      }
      return [...prev, saved]
    })
    setEditingPlan(null)
    setShowCreate(false)
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this pricing plan? This cannot be undone.')) return
    try {
      await deletePlan(id)
      setPlans(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete plan')
    }
  }

  async function handleToggleActive(plan: PricingPlan) {
    try {
      const updated = await toggleActive(plan)
      setPlans(prev => prev.map(p => p.id === plan.id ? updated : p))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update plan')
    }
  }

  async function handleMove(id: number, direction: 'up' | 'down') {
    const idx = plans.findIndex(p => p.id === id)
    if (idx < 0) return
    const target = direction === 'up' ? idx - 1 : idx + 1
    if (target < 0 || target >= plans.length) return

    const plan = plans[idx]
    const other = plans[target]
    const newOrder = plan.sort_order
    const otherOrder = other.sort_order

    try {
      await movePlan(plan.id, other.id, newOrder, otherOrder)
      await fetchPlans()
    } catch {
      // ignore
    }
  }

  const activePlans = plans.filter(p => p.is_active).length

  return (
    <PageLayout>
      <Header />

      <main className="container py-8 space-y-8">
        {/* Page Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              Pricing Plans
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {loading ? 'Loading…' : `${activePlans} active plan${activePlans !== 1 ? 's' : ''} · ${plans.length} total`}
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2 font-semibold shadow-sm">
            <Plus className="h-4 w-4" />
            New Plan
          </Button>
        </div>

        {/* Plans Table */}
        <div className="rounded-xl border border-border overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground gap-2">
              <DollarSign className="h-4 w-4 animate-pulse" />
              Loading pricing plans…
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <DollarSign className="h-10 w-10 opacity-30" />
              <p className="text-sm font-medium">No pricing plans yet</p>
              <p className="text-xs">Click "New Plan" to create your first plan.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <th className="px-4 py-3 text-left w-10">Order</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Pricing</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Features</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Stripe</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map(plan => (
                  <PlanRow
                    key={plan.id}
                    plan={plan}
                    onEdit={setEditingPlan}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                    onMove={handleMove}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Info */}
        <p className="text-xs text-muted-foreground">
          Use -1 in limits to indicate unlimited. Plans are shown on the public pricing page ordered by sort order.
          Inactive plans are hidden from users but remain in the database.
        </p>
      </main>

      {/* Modals */}
      {showCreate && (
        <PlanFormModal
          initial={EMPTY_FORM}
          onClose={() => setShowCreate(false)}
          onSaved={handleSaved}
        />
      )}
      {editingPlan && (
        <PlanFormModal
          initial={planToForm(editingPlan)}
          onClose={() => setEditingPlan(null)}
          onSaved={handleSaved}
        />
      )}
    </PageLayout>
  )
}
