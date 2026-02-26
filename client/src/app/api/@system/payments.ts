// @system — Unified payment API (client-side)
// Uses /api/payments/* which auto-routes to the active provider (Stripe or Polar).
// Drop-in replacement for importing directly from stripe.ts or polar.ts.
//
// Usage:
//   import { getPlans, createCheckout, getSubscription } from '@/app/api/@system/payments'

import { api } from '../../lib/@system/api'
import { formatAmount, formatInterval } from './stripe'

// ── Types ─────────────────────────────────────────────────────────────────────

export type PaymentProvider = 'stripe' | 'polar'

export interface Plan {
  provider:      PaymentProvider
  priceId:       string
  productId:     string
  name:          string
  description:   string | null
  amount:        number      // smallest currency unit (cents for USD)
  currency:      string
  interval:      'month' | 'year' | 'week' | 'day' | 'one_time'
  intervalCount: number
  trialDays:     number | null
  metadata:      Record<string, string>
}

export interface Subscription {
  provider:           PaymentProvider
  subscriptionId:     string | null
  customerId?:        string | null
  priceId:            string | null
  productId?:         string | null
  status:             'active' | 'trialing' | 'past_due' | 'canceled' | 'cancelled' | 'inactive'
  currentPeriodStart: string | null
  currentPeriodEnd:   string | null
  cancelAtPeriodEnd:  boolean
}

// ── Provider ──────────────────────────────────────────────────────────────────

/** Returns the payment provider name configured on the server. */
export async function getProvider(): Promise<PaymentProvider> {
  const { provider } = await api.get<{ provider: PaymentProvider }>('/payments/provider')
  return provider
}

// ── Plans ─────────────────────────────────────────────────────────────────────

/** Fetch available pricing plans from the active payment provider. */
export async function getPlans(): Promise<{ plans: Plan[]; provider: PaymentProvider }> {
  return api.get<{ plans: Plan[]; provider: PaymentProvider }>('/payments/plans')
}

// ── Checkout ──────────────────────────────────────────────────────────────────

/**
 * Create a checkout session and redirect the user to the hosted payment page.
 * @param priceId    Provider price ID (Stripe priceId or Polar productPriceId)
 * @param trialDays  Optional trial days (Stripe only)
 */
export async function createCheckout(priceId: string, trialDays?: number): Promise<void> {
  const body: Record<string, unknown> = { priceId }
  if (trialDays) body.trialDays = trialDays

  const { url } = await api.post<{ url: string }>('/payments/checkout', body)
  if (url) window.location.href = url
}

// ── Billing portal ────────────────────────────────────────────────────────────

/**
 * Open the billing portal (Stripe Customer Portal).
 * Throws an error for Polar (no portal supported) — catch and show a message.
 */
export async function openBillingPortal(): Promise<void> {
  const { url } = await api.post<{ url: string }>('/payments/portal', {})
  if (url) window.location.href = url
}

// ── Subscription ──────────────────────────────────────────────────────────────

/** Get the current user's active subscription. */
export async function getSubscription(): Promise<{ subscription: Subscription | null; provider: PaymentProvider }> {
  return api.get<{ subscription: Subscription | null; provider: PaymentProvider }>('/payments/subscription')
}

/** Get all of the current user's subscriptions (history). */
export async function getAllSubscriptions(): Promise<{ subscriptions: Subscription[]; provider: PaymentProvider }> {
  return api.get<{ subscriptions: Subscription[]; provider: PaymentProvider }>('/payments/subscriptions')
}

/** Cancel the current active subscription (sets cancel_at_period_end = true). */
export async function cancelSubscription(): Promise<{ subscription: Subscription }> {
  return api.delete<{ subscription: Subscription }>('/payments/subscription')
}

/** Reverse a scheduled cancellation (Stripe only). */
export async function resumeSubscription(): Promise<{ subscription: Subscription }> {
  return api.post<{ subscription: Subscription }>('/payments/subscription/resume', {})
}

// ── Formatting helpers ────────────────────────────────────────────────────────

/** Format a plan's price as a localised currency string (e.g. "$9"). */
export function formatPlanAmount(plan: Pick<Plan, 'amount' | 'currency'>): string {
  return formatAmount(plan.amount, plan.currency)
}

/** Format a plan's billing interval (e.g. "/month", "/year", "one-time"). */
export function formatPlanInterval(plan: Pick<Plan, 'interval' | 'intervalCount'>): string {
  return formatInterval(plan.interval, plan.intervalCount)
}

/** Returns true when the subscription is in an "access granted" state. */
export function isSubscriptionActive(sub: Subscription | null): boolean {
  return !!sub && ['active', 'trialing'].includes(sub.status)
}

/** Returns true when the subscription is scheduled to cancel. */
export function isSubscriptionCancelling(sub: Subscription | null): boolean {
  return isSubscriptionActive(sub) && (sub?.cancelAtPeriodEnd ?? false)
}

/** Human-readable status label. */
export function subscriptionStatusLabel(sub: Subscription | null): string {
  if (!sub) return 'No subscription'
  if (isSubscriptionCancelling(sub)) return 'Cancelling'
  switch (sub.status) {
    case 'active':    return 'Active'
    case 'trialing':  return 'Trial'
    case 'past_due':  return 'Past Due'
    case 'canceled':
    case 'cancelled': return 'Cancelled'
    default:          return 'Inactive'
  }
}
