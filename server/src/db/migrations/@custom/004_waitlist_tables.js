'use strict'

/**
 * Migration 004 – Waitlist Tables (CORE FEATURE)
 * Creates waitlists and waitlist_subscribers tables with viral referral mechanics.
 * 
 * This is WaitlistKit's primary feature - must be in @custom.
 */

exports.up = async (db) => {
  // Create waitlists table
  await db.none(`
    CREATE TABLE IF NOT EXISTS waitlists (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      product_url TEXT,
      referral_enabled BOOLEAN DEFAULT true,
      status VARCHAR(20) DEFAULT 'active', -- active, paused, closed
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  console.log('[004_waitlist_tables] created waitlists table')

  // Create waitlist_subscribers table with referral tracking
  await db.none(`
    CREATE TABLE IF NOT EXISTS waitlist_subscribers (
      id SERIAL PRIMARY KEY,
      waitlist_id INTEGER NOT NULL REFERENCES waitlists(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      position INTEGER NOT NULL,
      referral_code VARCHAR(20) UNIQUE NOT NULL,
      referred_by INTEGER REFERENCES waitlist_subscribers(id),
      referral_count INTEGER DEFAULT 0,
      priority VARCHAR(20) DEFAULT 'normal', -- normal, vip
      status VARCHAR(20) DEFAULT 'waiting', -- waiting, invited, joined
      invited_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(waitlist_id, email)
    )
  `)
  console.log('[004_waitlist_tables] created waitlist_subscribers table')

  // Create indexes for performance
  await db.none('CREATE INDEX IF NOT EXISTS idx_waitlists_user_id ON waitlists(user_id)')
  await db.none('CREATE INDEX IF NOT EXISTS idx_waitlists_slug ON waitlists(slug)')
  await db.none('CREATE INDEX IF NOT EXISTS idx_waitlist_subscribers_waitlist_id ON waitlist_subscribers(waitlist_id)')
  await db.none('CREATE INDEX IF NOT EXISTS idx_waitlist_subscribers_referral_code ON waitlist_subscribers(referral_code)')
  console.log('[004_waitlist_tables] created indexes')
}

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS waitlist_subscribers CASCADE')
  await db.none('DROP TABLE IF EXISTS waitlists CASCADE')
  console.log('[004_waitlist_tables] dropped waitlist tables')
}
