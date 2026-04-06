'use strict'

/**
 * Migration 012 – Brands → full @system upgrade
 *
 * Adds missing columns to the brands table created in 011:
 *   - subscription_id FK (Brand belongsTo Subscription)
 *   - external_id (for external integrations)
 *   - tags TEXT[] (array of string tags)
 *   - metadata JSONB (arbitrary key-value)
 *   - image_url (brand hero/cover image)
 *   - deleted_at (soft-delete timestamp)
 *   - status CHECK constraint expanded (active, draft, archived, deleted, inactive)
 *
 * Also adds brand_id FK to collaborators (Brand hasMany Collaborators).
 */

exports.up = async (db) => {
  // ── 1. Add new columns to brands (idempotent) ──────────────────────────────
  await db.none(`
    ALTER TABLE brands
      ADD COLUMN IF NOT EXISTS subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS external_id     TEXT,
      ADD COLUMN IF NOT EXISTS tags            TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS metadata        JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS image_url       TEXT,
      ADD COLUMN IF NOT EXISTS deleted_at      TIMESTAMPTZ;
  `)
  console.log('[012] ✓ brands: added subscription_id, external_id, tags, metadata, image_url, deleted_at')

  // ── 2. Indexes on new columns ───────────────────────────────────────────────
  await db.none('CREATE INDEX IF NOT EXISTS idx_brands_subscription_id ON brands(subscription_id)')
  await db.none('CREATE INDEX IF NOT EXISTS idx_brands_external_id ON brands(external_id)')
  console.log('[012] ✓ brands: indexes created')

  // ── 3. Expand status constraint ─────────────────────────────────────────────
  // Drop old constraint if exists (may or may not exist depending on creation method)
  await db.none(`
    DO $$ BEGIN
      ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_status_check;
    EXCEPTION WHEN undefined_object THEN NULL;
    END $$;
  `)
  await db.none(`
    ALTER TABLE brands ADD CONSTRAINT brands_status_check
      CHECK (status IN ('active', 'draft', 'archived', 'deleted', 'inactive'));
  `)
  console.log('[012] ✓ brands: status constraint updated (active, draft, archived, deleted, inactive)')

  // ── 4. Brand hasMany Collaborators – add brand_id FK to collaborators ───────
  // Guard: collaborators table is created in @custom/002_collaborators.js which runs
  // after all @system migrations. Skip gracefully on a fresh DB;
  // @custom/028_collaborators_brand_id.js handles the column as a fallback.
  const collaboratorsExists = await db.oneOrNone(
    "SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'collaborators'"
  )
  if (collaboratorsExists) {
    await db.none(`
      ALTER TABLE collaborators
        ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES brands(id) ON DELETE CASCADE;
    `)
    await db.none('CREATE INDEX IF NOT EXISTS idx_collaborators_brand_id ON collaborators(brand_id)')
    console.log('[012] ✓ collaborators: added brand_id FK')
  } else {
    console.log('[012] collaborators table not yet created — deferred to @custom/028_collaborators_brand_id.js')
  }
}

exports.down = async (db) => {
  // Remove brand_id from collaborators (only if table exists)
  const collaboratorsExists = await db.oneOrNone(
    "SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'collaborators'"
  )
  if (collaboratorsExists) {
    await db.none('DROP INDEX IF EXISTS idx_collaborators_brand_id')
    await db.none('ALTER TABLE collaborators DROP COLUMN IF EXISTS brand_id')
  }

  // Drop new constraint, restore simple one
  await db.none(`
    DO $$ BEGIN
      ALTER TABLE brands DROP CONSTRAINT IF EXISTS brands_status_check;
    EXCEPTION WHEN undefined_object THEN NULL;
    END $$;
  `)

  // Remove new columns from brands
  await db.none('DROP INDEX IF EXISTS idx_brands_external_id')
  await db.none('DROP INDEX IF EXISTS idx_brands_subscription_id')
  await db.none(`
    ALTER TABLE brands
      DROP COLUMN IF EXISTS subscription_id,
      DROP COLUMN IF EXISTS external_id,
      DROP COLUMN IF EXISTS tags,
      DROP COLUMN IF EXISTS metadata,
      DROP COLUMN IF EXISTS image_url,
      DROP COLUMN IF EXISTS deleted_at;
  `)
  console.log('[012] ✗ reverted brands upgrade and collaborators.brand_id')
}
