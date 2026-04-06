// @system — StripeService: Full Stripe billing service (ported from Simtria)
// Handles webhook digestion, plan caching, payment/refund queries, tax extraction,
// discount codes, cancellation reason mapping, credit-worthy change detection.
// Uses raw SQL via pg-promise (NOT Sequelize).
'use strict'

const stripe = require('./index') // lazy-initialised Stripe SDK proxy
const logger = require('../Logger')

const CREDITS_MULTIPLIER = Number(process.env.CREDITS_MULTIPLIER) || 1

class StripeService {
  constructor() {
    this.endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
    // Plan cache (24h TTL)
    this._planCache = { data: null, ts: null, ttl: 24 * 60 * 60 * 1000 }
  }

  // ── Cache helpers ────────────────────────────────────────────────────────

  _isCacheValid() {
    return this._planCache.data && this._planCache.ts && (Date.now() - this._planCache.ts) < this._planCache.ttl
  }

  // ── Stripe API wrappers ──────────────────────────────────────────────────

  async getCustomer(id) { return stripe.customers.retrieve(id) }
  async getPlan(id) { return stripe.plans.retrieve(id) }
  async getProduct(id) { return stripe.products.retrieve(id) }
  async getSubscription(id) { return stripe.subscriptions.retrieve(id) }
  async getInvoice(id) { return stripe.invoices.retrieve(id) }
  async getCoupon(id) { return stripe.coupons.retrieve(id) }
  async getCheckoutSession(id) { return stripe.checkout.sessions.retrieve(id) }

  async updateSubscription(id, data) { return stripe.subscriptions.update(id, data) }

  async getCustomerByEmail(email) {
    const customers = await stripe.customers.list({ email })
    return customers.data.length > 0 ? customers.data[0] : null
  }

  async getCustomerFromSubscription(subId) {
    const sub = await this.getSubscription(subId)
    return sub ? this.getCustomer(sub.customer) : null
  }

  async getCustomerSubscriptionsList(customerId, limit = 100) {
    try {
      const subs = await stripe.subscriptions.list({ customer: customerId, limit })
      return subs.data || []
    } catch (err) {
      logger.error({ err, customerId }, 'error fetching customer subscriptions')
      return []
    }
  }

  async cancelSubscription(subscriptionExternalId) {
    try {
      return await stripe.subscriptions.cancel(subscriptionExternalId)
    } catch (err) {
      throw new Error(`Error canceling subscription ${subscriptionExternalId}: ${err.message}`)
    }
  }

  async createCustomer(data) { return stripe.customers.create(data) }
  async createSubscription(data) { return stripe.subscriptions.create(data) }

  async listPaymentMethods(customerId) {
    const pm = await stripe.paymentMethods.list({ customer: customerId, type: 'card' })
    return pm.data
  }

  async updateSubscriptionPlan(subscriptionId, newPriceId) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId)
    return stripe.subscriptions.update(subscriptionId, {
      items: [{ id: sub.items.data[0].id, price: newPriceId }],
      proration_behavior: 'create_prorations',
    })
  }

  // ── Discount code application ────────────────────────────────────────────

  async addDiscountCode(subscriptionExternalId, discountCode) {
    try {
      if (discountCode.startsWith('promo_')) {
        return stripe.subscriptions.update(subscriptionExternalId, {
          discounts: [{ promotion_code: discountCode }],
        })
      }
      if (discountCode.startsWith('coupon_') || discountCode.includes('_')) {
        return stripe.subscriptions.update(subscriptionExternalId, {
          discounts: [{ coupon: discountCode }],
        })
      }
      // Try as promotion code string first
      try {
        const promoCodes = await stripe.promotionCodes.list({ code: discountCode, active: true, limit: 1 })
        if (promoCodes.data.length > 0) {
          return stripe.subscriptions.update(subscriptionExternalId, {
            discounts: [{ promotion_code: promoCodes.data[0].id }],
          })
        }
      } catch (_) {
        // Fallback to coupon
        return stripe.subscriptions.update(subscriptionExternalId, {
          discounts: [{ coupon: discountCode }],
        })
      }
      throw new Error(`Promotion code or coupon '${discountCode}' not found or inactive`)
    } catch (err) {
      throw new Error(`Error adding discount ${discountCode}: ${err.message}`)
    }
  }

  // ── Plan listing (cached 24h) ────────────────────────────────────────────

  async getAvailablePlans() {
    if (this._isCacheValid()) return this._planCache.data

    const prices = await stripe.prices.list({ active: true, limit: 100, expand: ['data.product'] })
    const plans = prices.data
      .filter((p) => (p.type === 'recurring' || p.type === 'one_time') && p.active)
      .map((price) => {
        const product = typeof price.product === 'object' ? price.product : null
        return {
          id: price.id,
          productId: product?.id || price.product,
          name: product?.name || 'Unknown Plan',
          description: product?.description || '',
          image: product?.images?.[0] || null,
          price: price.unit_amount / 100,
          currency: (price.currency || 'usd').toUpperCase(),
          interval: price.recurring?.interval || 'one_time',
          intervalCount: price.recurring?.interval_count || 1,
          type: price.type,
          metadata: product?.metadata || {},
          features: product?.metadata?.features ? JSON.parse(product.metadata.features) : [],
        }
      })
      .sort((a, b) => {
        const am = a.interval === 'year' ? a.price / 12 : a.price
        const bm = b.interval === 'year' ? b.price / 12 : b.price
        return am - bm
      })

    this._planCache = { data: plans, ts: Date.now(), ttl: this._planCache.ttl }
    return plans
  }

  // ── Period helpers (Stripe API v2024+) ───────────────────────────────────

  getCurrentPeriodEnd(obj) {
    return obj.current_period_end || obj.items?.data?.[0]?.current_period_end || null
  }

  getCurrentPeriodStart(obj) {
    return obj.current_period_start || obj.items?.data?.[0]?.current_period_start || null
  }

  // ── Payment / Refund queries ─────────────────────────────────────────────

  async getPaymentsForDateRange(startDate, endDate) {
    const gte = Math.floor(startDate.getTime() / 1000)
    const lte = Math.floor(endDate.getTime() / 1000)
    let all = [], hasMore = true, startingAfter = null

    while (hasMore) {
      const params = { created: { gte, lte }, limit: 100 }
      if (startingAfter) params.starting_after = startingAfter
      const charges = await stripe.charges.list(params)
      all = all.concat(charges.data)
      hasMore = charges.has_more
      if (hasMore && charges.data.length) startingAfter = charges.data[charges.data.length - 1].id
    }
    return all.filter((c) => c.status === 'succeeded' && c.paid && !c.refunded)
  }

  async getRefundsForDateRange(startDate, endDate) {
    const gte = Math.floor(startDate.getTime() / 1000)
    const lte = Math.floor(endDate.getTime() / 1000)
    let all = [], hasMore = true, startingAfter = null

    while (hasMore) {
      const params = { created: { gte, lte }, limit: 100 }
      if (startingAfter) params.starting_after = startingAfter
      const refunds = await stripe.refunds.list(params)
      all = all.concat(refunds.data)
      hasMore = refunds.has_more
      if (hasMore && refunds.data.length) startingAfter = refunds.data[refunds.data.length - 1].id
    }
    return Promise.all(
      all.map(async (refund) => {
        try {
          return { refund, originalCharge: await stripe.charges.retrieve(refund.charge) }
        } catch (_) {
          return { refund, originalCharge: null }
        }
      }),
    )
  }

  async getPaymentDataForDateRange(startDate, endDate) {
    const [payments, refunds] = await Promise.all([
      this.getPaymentsForDateRange(startDate, endDate),
      this.getRefundsForDateRange(startDate, endDate),
    ])
    return { payments, refunds, startDate, endDate }
  }

  // ── Tax extraction from invoices ─────────────────────────────────────────

  async getPaymentTaxInfo(payment) {
    try {
      if (payment.invoice) {
        const invoice = await stripe.invoices.retrieve(payment.invoice)
        return { hasInvoice: true, invoice, taxInfo: this.extractTaxInfoFromInvoice(invoice) }
      }
      return { hasInvoice: false, invoice: null, taxInfo: null }
    } catch (err) {
      logger.error({ err, paymentId: payment.id }, 'error getting tax info')
      return { hasInvoice: false, invoice: null, taxInfo: null, error: err.message }
    }
  }

  extractTaxInfoFromInvoice(invoice) {
    try {
      const info = {
        totalTax: invoice.tax || 0,
        totalTaxAmounts: invoice.total_tax_amounts || [],
        totalTaxes: invoice.total_taxes || [],
        defaultTaxRates: invoice.default_tax_rates || [],
        automaticTax: invoice.automatic_tax || null,
        taxRate: null, taxPercentage: null, calculatedTaxPercentage: null,
        taxAmount: 0, taxableAmount: 0, isInclusive: false, isReverseCharge: false,
        subtotal: invoice.subtotal || 0, total: invoice.total || 0,
        customerTaxExempt: invoice.customer_tax_exempt || 'none',
        customerTaxIds: invoice.customer_tax_ids || [],
      }

      // total_tax_amounts (most accurate)
      if (invoice.total_tax_amounts?.length > 0) {
        const t = invoice.total_tax_amounts[0]
        info.taxAmount = t.amount || 0
        info.taxableAmount = t.taxable_amount || 0
        info.isInclusive = t.inclusive || false
        if (info.taxableAmount > 0) info.calculatedTaxPercentage = Math.round((info.taxAmount / info.taxableAmount) * 100)
        if (t.tax_rate) { info.taxRate = t.tax_rate; info.taxPercentage = t.tax_rate.percentage }
      }

      // total_taxes fallback
      if (invoice.total_taxes?.length > 0 && !info.taxAmount) {
        const t = invoice.total_taxes[0]
        info.taxAmount = t.amount || 0
        info.taxableAmount = t.taxable_amount || 0
        info.isInclusive = t.tax_behavior === 'inclusive'
        if (info.taxableAmount > 0) info.calculatedTaxPercentage = Math.round((info.taxAmount / info.taxableAmount) * 100)
      }

      // default_tax_rates fallback
      if (!info.taxPercentage && !info.calculatedTaxPercentage && invoice.default_tax_rates?.length > 0) {
        info.taxRate = invoice.default_tax_rates[0]
        info.taxPercentage = invoice.default_tax_rates[0].percentage
      }

      // Reverse charge detection
      if (info.taxAmount === 0 && (info.taxPercentage > 0 || info.calculatedTaxPercentage > 0)) {
        info.isReverseCharge = true
      }
      if (info.customerTaxIds?.some((t) => t.type === 'eu_vat' && t.verification?.status === 'verified') && info.taxAmount === 0) {
        info.isReverseCharge = true
      }

      return info
    } catch (err) {
      logger.error({ err }, 'error extracting tax info from invoice')
      return null
    }
  }

  // ── Webhook digest — main entry point ────────────────────────────────────
  // Parses the raw Stripe event and returns a normalized action object
  // for the webhook handler lambda to process.

  async digest(rawBody, signature) {
    try {
      if (!signature) {
        logger.error('No Stripe signature in webhook request')
        return null
      }
      let event
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, this.endpointSecret)
      } catch (err) {
        logger.error({ err: err.message }, 'Stripe webhook signature verification failed')
        return null
      }

      const obj = event.data.object
      if (!obj) { logger.error('No object data in webhook event'); return null }

      switch (event.type) {
        case 'checkout.session.completed':
          return this._handleCheckoutCompleted(obj)
        case 'customer.subscription.deleted':
          return this._handleSubscriptionDeleted(obj)
        case 'customer.subscription.updated':
          return this._handleSubscriptionUpdated(obj, event.data.previous_attributes)
        case 'invoice.payment_succeeded':
          return this._handleInvoicePaymentSucceeded(obj)
        default:
          return null
      }
    } catch (err) {
      logger.error({ err }, 'Error in Stripe webhook digest')
      return null
    }
  }

  // ── Checkout completed ───────────────────────────────────────────────────

  async _handleCheckoutCompleted(obj) {
    if (obj.subscription) return this._handleSubscriptionCheckout(obj)
    return this._handleOneTimeCheckout(obj)
  }

  async _handleSubscriptionCheckout(obj) {
    const subscription = await this.getSubscription(obj.subscription)
    const customer = await this.getCustomer(subscription.customer)
    const product = await this.getProduct(subscription.plan.product)

    const isActive = subscription.status === 'active' || subscription.status === 'trialing'
    const quantity = subscription.items?.data?.[0]?.quantity || 1
    let actualPrice = obj.amount_subtotal
    if (obj.discount) {
      actualPrice = obj.amount_subtotal * (1 - obj.discount.coupon.percent_off / 100)
    }

    const isCreditsPurchase = this._isCreditsPurchase(obj, product)
    const baseCredits = this._calculateCredits(obj)
    const credits = baseCredits * quantity
    const periodEnd = this.getCurrentPeriodEnd(subscription)

    return {
      action: 'create',
      externalId: subscription?.id || obj.id,
      country: this._extractCountry(customer, obj),
      name: customer.name,
      email: customer.email.toLowerCase().trim(),
      price: actualPrice,
      periodicity: this._normalizePeriodicity(subscription?.plan?.interval),
      isActive,
      status: subscription.status,
      image: product.images?.[0],
      sessionId: obj.client_reference_id,
      endDate: periodEnd ? new Date(periodEnd * 1000) : null,
      type: obj.mode,
      credits,
      isCreditsPurchase,
      customFields: this._getCustomFields(obj),
      metadata: obj.metadata,
    }
  }

  async _handleOneTimeCheckout(obj) {
    let paymentLink = null
    try { if (obj.payment_link) paymentLink = await stripe.paymentLinks.retrieve(obj.payment_link) } catch (_) {}
    const isCreditsPurchase = this._isCreditsPurchase(obj, null, paymentLink)
    const credits = this._calculateCredits(obj)

    return {
      action: 'create',
      externalId: obj.id,
      country: obj.customer_details?.address?.country,
      name: obj.customer_details?.name,
      email: obj.customer_details.email.toLowerCase().trim(),
      price: obj.amount_total,
      periodicity: 'one-time',
      isActive: false,
      isCreditsPurchase,
      credits,
      sessionId: obj.client_reference_id,
      type: obj.mode,
      customFields: this._getCustomFields(obj),
      metadata: { ...obj.metadata, customFields: this._getCustomFields(obj) },
    }
  }

  // ── Subscription deleted ─────────────────────────────────────────────────

  async _handleSubscriptionDeleted(obj) {
    const customer = await this.getCustomer(obj.customer)
    const periodEnd = this.getCurrentPeriodEnd(obj)
    const baseData = { externalId: obj.id, country: this._extractCountry(customer, obj), name: customer.name, email: customer.email.toLowerCase().trim() }

    // Look up existing metadata in DB
    const SubscriptionRepo = require('../../../db/repos/@system/SubscriptionRepo')
    let existingMeta = {}
    try {
      const existing = await SubscriptionRepo.findByExternalId(obj.id)
      if (existing?.metadata) existingMeta = existing.metadata
    } catch (_) {}

    const { type, reason } = this._mapCancellationReason(obj)
    return {
      action: 'canceled',
      ...baseData,
      endDate: periodEnd ? new Date(periodEnd * 1000) : null,
      status: 'canceled',
      metadata: this._createCancellationMetadata(obj, type, reason, existingMeta),
    }
  }

  // ── Subscription updated ─────────────────────────────────────────────────

  async _handleSubscriptionUpdated(obj, previousAttributes = null) {
    const customer = await this.getCustomer(obj.customer)
    const product = obj.plan?.product ? await this.getProduct(obj.plan.product) : null

    const SubscriptionRepo = require('../../../db/repos/@system/SubscriptionRepo')
    let existingMeta = {}
    try {
      const existing = await SubscriptionRepo.findByExternalId(obj.id)
      if (existing?.metadata) existingMeta = existing.metadata
    } catch (_) {}

    const quantity = obj.items?.data?.[0]?.quantity || 1
    const rawAmount = obj.plan?.amount || obj.amount_total || 0
    const baseCredits = parseInt(rawAmount * CREDITS_MULTIPLIER / 100) || 0
    const credits = baseCredits * quantity
    const periodEnd = this.getCurrentPeriodEnd(obj)
    const baseData = { externalId: obj.id, country: this._extractCountry(customer, obj), name: customer.name, email: customer.email.toLowerCase().trim() }

    // Credits deferred to invoice.payment_succeeded — never award in subscription updates
    const effectiveCredits = 0

    // Check for scheduled cancellation
    if (obj.cancel_at_period_end) {
      return {
        action: 'canceled',
        ...baseData,
        cancelDate: new Date(obj.cancel_at * 1000),
        endDate: periodEnd ? new Date(periodEnd * 1000) : null,
        status: 'canceled',
        metadata: this._createCancellationMetadata(obj, 'manual_cancellation', 'user_scheduled_cancellation', existingMeta),
      }
    }

    // Payment failures — don't extend end date
    if (obj.status === 'past_due' || obj.status === 'unpaid') {
      const { type, reason } = obj.status === 'past_due'
        ? { type: 'payment_failed', reason: 'payment_overdue' }
        : { type: 'payment_failed', reason: 'payment_unpaid' }
      return {
        action: 'update',
        ...baseData,
        last_renew: new Date(),
        status: 'active', // keep active — user retains access during grace period
        metadata: this._createCancellationMetadata(obj, type, reason, existingMeta),
      }
    }

    // Draft invoices — don't extend end date
    let isDraft = false
    if (obj.latest_invoice) {
      try {
        const inv = await this.getInvoice(obj.latest_invoice)
        isDraft = inv.status === 'draft'
      } catch (_) {}
    }
    if (isDraft) {
      return {
        action: 'update', ...baseData,
        last_renew: new Date(),
        status: obj.status || 'active',
        metadata: obj.metadata || {},
      }
    }

    // Incomplete / expired
    if (obj.status === 'incomplete' || obj.status === 'incomplete_expired') {
      const reason = obj.status === 'incomplete' ? 'incomplete_payment' : 'incomplete_expired'
      return {
        action: 'canceled', ...baseData,
        endDate: periodEnd ? new Date(periodEnd * 1000) : null,
        status: 'expired',
        metadata: this._createCancellationMetadata(obj, 'checkout_incomplete', reason, existingMeta),
      }
    }

    // Fully canceled
    if (obj.status === 'canceled') {
      const { type, reason } = this._mapCancellationReason(obj)
      return {
        action: 'canceled', ...baseData,
        cancelDate: obj.canceled_at ? new Date(obj.canceled_at * 1000) : new Date(),
        endDate: periodEnd ? new Date(periodEnd * 1000) : null,
        status: 'canceled',
        metadata: this._createCancellationMetadata(obj, type, reason, existingMeta),
      }
    }

    // Active / trialing / plan change
    return {
      action: 'update',
      ...baseData,
      price: obj.plan?.amount,
      periodicity: this._normalizePeriodicity(obj.plan?.interval),
      credits: effectiveCredits,
      isCreditsPurchase: false,
      isActive: obj.status === 'active' || obj.status === 'trialing',
      status: obj.status,
      image: product?.images?.[0],
      last_renew: new Date(this.getCurrentPeriodStart(obj) * 1000),
      endDate: periodEnd ? new Date(periodEnd * 1000) : null,
      skipTransaction: true,
      metadata: obj.metadata || {},
    }
  }

  // ── Invoice payment succeeded (credit awarding) ─────────────────────────

  async _handleInvoicePaymentSucceeded(obj) {
    const subscriptionId = obj.subscription || obj.parent?.subscription_details?.subscription
    if (!subscriptionId) return null

    try {
      const subscription = await this.getSubscription(subscriptionId)
      const customer = await this.getCustomer(subscription.customer)
      const product = subscription.plan?.product ? await this.getProduct(subscription.plan.product) : null

      const quantity = subscription.items?.data?.[0]?.quantity || 1
      const rawAmount = subscription.plan?.amount || 0
      const baseCredits = parseInt(rawAmount * CREDITS_MULTIPLIER / 100) || 0
      const credits = baseCredits * quantity
      const isCreditsPurchase = this._isCreditsPurchase(subscription, product)
      const periodEnd = this.getCurrentPeriodEnd(subscription)

      return {
        action: 'payment_succeeded',
        externalId: subscription.id,
        country: this._extractCountry(customer),
        name: customer.name,
        email: customer.email.toLowerCase().trim(),
        price: (subscription.plan?.amount || 0) * quantity,
        periodicity: this._normalizePeriodicity(subscription.plan?.interval),
        credits,
        isCreditsPurchase,
        isActive: true,
        status: subscription.status,
        image: product?.images?.[0],
        last_renew: new Date(),
        endDate: periodEnd ? new Date(periodEnd * 1000) : null,
        invoiceId: obj.id,
        metadata: subscription.metadata || {},
      }
    } catch (err) {
      logger.error({ err, invoiceId: obj.id }, 'error handling payment succeeded')
      return null
    }
  }

  // ── Credit-worthy change detection ───────────────────────────────────────

  shouldAwardCreditsForUpdate(previousAttributes, obj) {
    if (!previousAttributes || Object.keys(previousAttributes).length === 0) return false

    const changed = Object.keys(previousAttributes)
    const creditWorthy = ['current_period_end', 'current_period_start', 'items', 'plan']
    const hasBillingChange = changed.some((f) => creditWorthy.includes(f))

    if (previousAttributes.status && changed.includes('status')) {
      const transition = `${previousAttributes.status} → ${obj.status}`
      const worthy = [
        'past_due → active', 'unpaid → active', 'incomplete → active',
        'incomplete_expired → active', 'canceled → active', 'canceled → trialing',
        'trialing → active',
      ]
      if (worthy.includes(transition)) return true
      if (!hasBillingChange) return false
    }

    return hasBillingChange
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  _extractCountry(customer, obj = null) {
    return customer?.address?.country
      || customer?.shipping?.address?.country
      || obj?.customer_details?.address?.country
      || null
  }

  _normalizePeriodicity(interval) {
    if (interval === 'month' || interval === 'year') return interval
    return interval ? 'one-time' : null
  }

  _calculateCredits(obj) {
    const rawAmount = obj.amount_subtotal || obj.amount_total || obj.plan?.amount || 0
    return parseInt(rawAmount * CREDITS_MULTIPLIER / 100) || 0
  }

  _isCreditsPurchase(obj, product = null, paymentLink = null) {
    return obj?.metadata?.isCreditsPurchase === 'true'
      || product?.name?.toLowerCase().includes('credits')
      || product?.metadata?.isCreditsPurchase === 'true'
      || paymentLink?.metadata?.isCreditsPurchase === 'true'
  }

  _getCustomFields(obj) {
    return obj.custom_fields?.map((f) => ({ name: f.key, value: f.text?.value || '' })) || []
  }

  _mapCancellationReason(obj) {
    const reason = obj.cancellation_details?.reason
    if (reason === 'cancellation_requested') return { type: 'manual_cancellation', reason: 'user_requested_cancellation' }
    if (reason === 'payment_failed') return { type: 'payment_failed', reason: 'payment_failed' }
    if (reason === 'payment_disputed') return { type: 'payment_failed', reason: 'payment_disputed' }
    if (obj.status === 'past_due') return { type: 'payment_failed', reason: 'payment_overdue' }
    if (obj.status === 'unpaid') return { type: 'payment_failed', reason: 'payment_unpaid' }
    if (obj.status === 'incomplete') return { type: 'checkout_incomplete', reason: 'incomplete_payment' }
    if (obj.status === 'incomplete_expired') return { type: 'checkout_incomplete', reason: 'incomplete_expired' }
    if (obj.canceled_at && obj.cancel_at_period_end) return { type: 'manual_cancellation', reason: 'user_scheduled_cancellation' }
    if (obj.canceled_at) return { type: 'manual_cancellation', reason: 'canceled_no_specific_reason' }
    if (obj.status === 'canceled') return { type: 'manual_cancellation', reason: 'canceled_generic' }
    return { type: 'unknown', reason: reason || `status_${obj.status}` }
  }

  _createCancellationMetadata(obj, type, reason, existingMeta = {}) {
    const userReason = existingMeta.cancellation_reason
    const finalReason = (userReason && userReason.length > 50) ? userReason : reason

    return {
      ...existingMeta,
      cancellation_type: type,
      cancellation_reason: finalReason,
      cancellation_source: existingMeta.cancellation_source || 'stripe_webhook',
      canceled_by: existingMeta.canceled_by || 'system',
      stripe_cancellation_reason: obj.cancellation_details?.reason || null,
      stripe_cancellation_feedback: obj.cancellation_details?.feedback || null,
      stripe_cancellation_comment: obj.cancellation_details?.comment || null,
      stripe_canceled_at: obj.canceled_at ? new Date(obj.canceled_at * 1000).toISOString() : null,
      stripe_status: obj.status || 'canceled',
      webhook_updated_at: new Date().toISOString(),
    }
  }
}

module.exports = new StripeService()
