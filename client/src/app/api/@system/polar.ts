// @system — Polar.sh API calls (client-side)
// Mirrors stripe.ts so either provider can be used from the billing UI.
import { api } from '../../lib/@system/api'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PolarPlan {
  provider:      'polar'
  priceId:       string
  productId:     string
  name:          string
  description:   string | null
  amount:        number      // smallest currency unit (e.g. cents)
  currency:      string
  interval:      'month' | 'year' | 'one_time'
  intervalCount: number
  trialDays:     number | null
  metadata:      Record<string, string>
}

export interface PolarSubscription {
  id:                   number
  user_id:              number
  polar_subscription_id: string | null
  polar_product_id:     string | null
  polar_price_id:       string | null
  status:               'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive'
  current_period_start: string | null
  current_period_end:   string | null
  cancel_at_period_end: boolean
  created_at:           string
  updated_at:           string
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** List available Polar products/prices for the pricing page (public). */
export async function getPolarProducts(): Promise<{ products: PolarPlan[] }> {
  const { products } = await api.get<{ products: Array<{
    id: string
    name: string
    description: string | null
    is_archived: boolean
    is_recurring: boolean
    metadata: Record<string, string>
    prices: Array<{
      id: string
      price_amount: number
      price_currency: string
      recurring_interval: 'month' | 'year' | null
      is_archived: boolean
    }>
  }> }>('/polar/products')

  const plans: PolarPlan[] = []
  for (const product of products) {
    if (product.is_archived || !product.is_recurring) continue
    for (const price of product.prices ?? []) {
      if (price.is_archived) continue
      plans.push({
        provider:      'polar',
        priceId:       price.id,
        productId:     product.id,
        name:          product.name,
        description:   product.description,
        amount:        price.price_amount,
        currency:      (price.price_currency ?? 'usd').toLowerCase(),
        interval:      price.recurring_interval ?? 'month',
        intervalCount: 1,
        trialDays:     null,
        metadata:      product.metadata ?? {},
      })
    }
  }

  return { products: plans }
}

/** Get the current user's active Polar subscription. */
export async function getPolarSubscription(): Promise<{ subscription: PolarSubscription | null }> {
  return api.get<{ subscription: PolarSubscription | null }>('/polar/subscription')
}

/**
 * Redirect to a Polar hosted checkout for a given product price ID.
 * @param productPriceId  Polar product price ID
 */
export async function createPolarCheckoutSession(productPriceId: string): Promise<void> {
  const { url } = await api.post<{ url: string }>('/polar/create-checkout-session', { productPriceId })
  if (url) window.location.href = url
}

/** Cancel the current user's active Polar subscription. */
export async function cancelPolarSubscription(): Promise<{ subscription: PolarSubscription }> {
  return api.delete<{ subscription: PolarSubscription }>('/polar/subscription')
}

// ── Formatting helpers (mirrors stripe.ts) ────────────────────────────────────

/** Format a price amount (cents) to a human-readable currency string. */
export function formatPolarAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style:                 'currency',
    currency:              currency.toUpperCase(),
    minimumFractionDigits: amount % 100 === 0 ? 0 : 2,
  }).format(amount / 100)
}

/** Format a billing interval to a human-readable label (e.g. "/month"). */
export function formatPolarInterval(interval: string): string {
  if (interval === 'one_time') return 'one-time'
  return `/${interval}`
}
