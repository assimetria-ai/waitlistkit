const db = require('../../../lib/@system/PostgreSQL')

const PricingPlanRepo = {
  // List all active plans (public)
  async findActive() {
    return db.any(
      `SELECT * FROM pricing_plans WHERE is_active = true ORDER BY sort_order ASC`,
    )
  },

  // List all plans including inactive (admin)
  async findAll() {
    return db.any(`SELECT * FROM pricing_plans ORDER BY sort_order ASC`)
  },

  async findById(id) {
    return db.oneOrNone(`SELECT * FROM pricing_plans WHERE id = $1`, [id])
  },

  async findBySlug(slug) {
    return db.oneOrNone(`SELECT * FROM pricing_plans WHERE slug = $1`, [slug])
  },

  async create({
    name,
    slug,
    description,
    price_monthly,
    price_yearly,
    currency = 'usd',
    features = [],
    limits = {},
    stripe_price_id_monthly,
    stripe_price_id_yearly,
    is_active = true,
    is_popular = false,
    sort_order = 0,
  }) {
    return db.one(
      `INSERT INTO pricing_plans
         (name, slug, description, price_monthly, price_yearly, currency,
          features, limits, stripe_price_id_monthly, stripe_price_id_yearly,
          is_active, is_popular, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        name,
        slug,
        description ?? null,
        price_monthly,
        price_yearly,
        currency,
        JSON.stringify(features),
        JSON.stringify(limits),
        stripe_price_id_monthly ?? null,
        stripe_price_id_yearly ?? null,
        is_active,
        is_popular,
        sort_order,
      ],
    )
  },

  async update(id, {
    name,
    slug,
    description,
    price_monthly,
    price_yearly,
    currency,
    features,
    limits,
    stripe_price_id_monthly,
    stripe_price_id_yearly,
    is_active,
    is_popular,
    sort_order,
  }) {
    return db.oneOrNone(
      `UPDATE pricing_plans
       SET name                    = COALESCE($2, name),
           slug                    = COALESCE($3, slug),
           description             = COALESCE($4, description),
           price_monthly           = COALESCE($5, price_monthly),
           price_yearly            = COALESCE($6, price_yearly),
           currency                = COALESCE($7, currency),
           features                = COALESCE($8::jsonb, features),
           limits                  = COALESCE($9::jsonb, limits),
           stripe_price_id_monthly = COALESCE($10, stripe_price_id_monthly),
           stripe_price_id_yearly  = COALESCE($11, stripe_price_id_yearly),
           is_active               = COALESCE($12, is_active),
           is_popular              = COALESCE($13, is_popular),
           sort_order              = COALESCE($14, sort_order),
           updated_at              = now()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        name ?? null,
        slug ?? null,
        description ?? null,
        price_monthly ?? null,
        price_yearly ?? null,
        currency ?? null,
        features != null ? JSON.stringify(features) : null,
        limits != null ? JSON.stringify(limits) : null,
        stripe_price_id_monthly ?? null,
        stripe_price_id_yearly ?? null,
        is_active ?? null,
        is_popular ?? null,
        sort_order ?? null,
      ],
    )
  },

  async delete(id) {
    return db.oneOrNone(
      `DELETE FROM pricing_plans WHERE id = $1 RETURNING id`,
      [id],
    )
  },
}

module.exports = PricingPlanRepo
