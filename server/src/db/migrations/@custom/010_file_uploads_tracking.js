/**
 * Migration: File Uploads Tracking and Storage Quotas
 * 
 * Creates tables and views for:
 * - Tracking all file uploads per user
 * - Storage quota management
 * - File metadata and lifecycle
 */

'use strict'

module.exports = {
  async up(db) {
    // Create file_uploads table for tracking all uploaded files
    await db.none(`
      CREATE TABLE IF NOT EXISTS file_uploads (
        id BIGSERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        storage_key VARCHAR(500) UNIQUE NOT NULL,
        original_filename VARCHAR(500) NOT NULL,
        content_type VARCHAR(100),
        size_bytes BIGINT NOT NULL,
        folder VARCHAR(200) DEFAULT 'uploads',
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        deleted_at TIMESTAMPTZ,
        
        -- Constraints
        CONSTRAINT file_uploads_size_positive CHECK (size_bytes > 0)
      );
    `)

    // Indexes for performance
    await db.none(`
      CREATE INDEX idx_file_uploads_user_id ON file_uploads(user_id) WHERE deleted_at IS NULL;
      CREATE INDEX idx_file_uploads_deleted_at ON file_uploads(deleted_at);
      CREATE INDEX idx_file_uploads_created_at ON file_uploads(created_at);
      CREATE INDEX idx_file_uploads_folder ON file_uploads(folder) WHERE deleted_at IS NULL;
    `)

    // View for user storage usage
    await db.none(`
      CREATE OR REPLACE VIEW user_storage_usage AS
      SELECT 
        user_id,
        COUNT(*) as file_count,
        SUM(size_bytes) as total_bytes,
        ROUND(SUM(size_bytes) / (1024.0 * 1024.0), 2) as total_mb,
        ROUND(SUM(size_bytes) / (1024.0 * 1024.0 * 1024.0), 2) as total_gb,
        MAX(created_at) as last_upload_at
      FROM file_uploads
      WHERE deleted_at IS NULL
      GROUP BY user_id;
    `)

    // Storage quotas table (per-user or per-plan limits)
    await db.none(`
      CREATE TABLE IF NOT EXISTS storage_quotas (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        quota_bytes BIGINT NOT NULL DEFAULT 104857600, -- 100MB default
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        -- Constraints
        CONSTRAINT storage_quotas_positive CHECK (quota_bytes > 0)
      );
    `)

    // Index for lookups
    await db.none(`
      CREATE INDEX idx_storage_quotas_user_id ON storage_quotas(user_id);
    `)

    // Function to get user's current storage usage and quota
    await db.none(`
      CREATE OR REPLACE FUNCTION get_storage_status(p_user_id INTEGER)
      RETURNS TABLE (
        used_bytes BIGINT,
        quota_bytes BIGINT,
        used_mb NUMERIC,
        quota_mb NUMERIC,
        percentage NUMERIC,
        available_bytes BIGINT,
        is_over_quota BOOLEAN
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          COALESCE(u.total_bytes, 0)::BIGINT as used_bytes,
          COALESCE(q.quota_bytes, 104857600)::BIGINT as quota_bytes,
          ROUND(COALESCE(u.total_bytes, 0) / (1024.0 * 1024.0), 2) as used_mb,
          ROUND(COALESCE(q.quota_bytes, 104857600) / (1024.0 * 1024.0), 2) as quota_mb,
          ROUND((COALESCE(u.total_bytes, 0)::NUMERIC / COALESCE(q.quota_bytes, 104857600)::NUMERIC) * 100, 1) as percentage,
          GREATEST(COALESCE(q.quota_bytes, 104857600) - COALESCE(u.total_bytes, 0), 0)::BIGINT as available_bytes,
          COALESCE(u.total_bytes, 0) > COALESCE(q.quota_bytes, 104857600) as is_over_quota
        FROM (SELECT p_user_id as user_id) base
        LEFT JOIN user_storage_usage u ON u.user_id = base.user_id
        LEFT JOIN storage_quotas q ON q.user_id = base.user_id;
      END;
      $$ LANGUAGE plpgsql STABLE;
    `)

    console.log('[Migration] Created file_uploads tracking tables and storage quota system')
  },

  async down(db) {
    await db.none('DROP FUNCTION IF EXISTS get_storage_status(INTEGER);')
    await db.none('DROP TABLE IF EXISTS storage_quotas CASCADE;')
    await db.none('DROP VIEW IF EXISTS user_storage_usage;')
    await db.none('DROP TABLE IF EXISTS file_uploads CASCADE;')
    
    console.log('[Migration] Dropped file tracking and storage quota tables')
  },
}
