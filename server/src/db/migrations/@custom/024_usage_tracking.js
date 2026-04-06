/**
 * @custom - Usage and cost tracking for dashboard
 * Tracks API usage, AI costs, and other metered services
 */

exports.up = async function (db) {
  // Usage tracking table for all metered services
  await db.schema.createTable('usage_events', (table) => {
    table.uuid('id').primary().defaultTo(db.raw('uuid_generate_v4()'))
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.timestamp('created_at').defaultTo(db.fn.now())
    
    // Event details
    table.string('service', 50).notNullable() // 'openai', 'anthropic', 'storage', etc.
    table.string('operation', 100).notNullable() // 'chat', 'image', 'embedding', etc.
    table.string('model', 100) // Model name if applicable
    
    // Usage metrics
    table.integer('tokens_input').defaultTo(0)
    table.integer('tokens_output').defaultTo(0)
    table.integer('tokens_total').defaultTo(0)
    table.bigInteger('bytes_processed').defaultTo(0) // For storage, images, etc.
    table.integer('requests_count').defaultTo(1)
    
    // Cost tracking
    table.decimal('cost_usd', 10, 6).defaultTo(0) // Cost in USD
    table.string('pricing_model', 50) // 'per_token', 'per_request', 'per_gb', etc.
    
    // Metadata
    table.jsonb('metadata') // Extra info: API key used, duration, status, etc.
    
    // Indexes for efficient querying
    table.index(['user_id', 'created_at'])
    table.index(['service', 'created_at'])
    table.index('created_at')
  })

  // Aggregate cost summary (materialized view concept)
  await db.schema.createTable('usage_summary', (table) => {
    table.uuid('id').primary().defaultTo(db.raw('uuid_generate_v4()'))
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.date('date').notNullable()
    table.string('service', 50).notNullable()
    
    // Aggregated metrics
    table.integer('total_requests').defaultTo(0)
    table.bigInteger('total_tokens').defaultTo(0)
    table.bigInteger('total_bytes').defaultTo(0)
    table.decimal('total_cost_usd', 10, 2).defaultTo(0)
    
    table.timestamp('updated_at').defaultTo(db.fn.now())
    
    // Unique constraint
    table.unique(['user_id', 'date', 'service'])
    table.index(['user_id', 'date'])
  })

  // User cost budget/limits (optional)
  await db.schema.createTable('user_cost_limits', (table) => {
    table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE')
    table.decimal('monthly_limit_usd', 10, 2).defaultTo(100) // Default $100/month
    table.decimal('daily_limit_usd', 10, 2).defaultTo(10) // Default $10/day
    table.boolean('alerts_enabled').defaultTo(true)
    table.integer('alert_threshold_percent').defaultTo(80) // Alert at 80%
    table.timestamp('updated_at').defaultTo(db.fn.now())
  })
}

exports.down = async function (db) {
  await db.schema.dropTableIfExists('user_cost_limits')
  await db.schema.dropTableIfExists('usage_summary')
  await db.schema.dropTableIfExists('usage_events')
}
