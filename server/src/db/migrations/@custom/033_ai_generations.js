/**
 * @custom Migration: AI Generations
 * Tracks AI post generation history for the AI Post Writer feature.
 */
async function up(db) {
  await db.none(`
    CREATE TABLE IF NOT EXISTS ai_generations (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id     INTEGER REFERENCES posts(id) ON DELETE SET NULL,
      
      -- Generation inputs
      topic       TEXT,
      tone        TEXT,            -- 'professional' | 'casual' | 'storytelling' | 'educational' | 'provocative'
      length      TEXT,            -- 'short' | 'medium' | 'long'
      template_id INTEGER REFERENCES content_templates(id) ON DELETE SET NULL,
      prompt      TEXT,            -- Full prompt sent to AI
      
      -- Generation output
      output      TEXT NOT NULL,
      model       TEXT,            -- AI model used
      tokens_used INTEGER DEFAULT 0,
      
      -- User feedback
      accepted    BOOLEAN,         -- Did the user use this generation?
      rating      SMALLINT CHECK (rating BETWEEN 1 AND 5),
      
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_ai_generations_user_id
      ON ai_generations(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ai_generations_post_id
      ON ai_generations(post_id) WHERE post_id IS NOT NULL;

    COMMENT ON TABLE ai_generations IS 'AI post generation history with inputs, outputs, and user feedback';
    COMMENT ON COLUMN ai_generations.accepted IS 'Whether user used this generation for a post';
  `)
  console.log('  ✓ ai_generations table created')
}

async function down(db) {
  await db.none('DROP TABLE IF EXISTS ai_generations CASCADE')
}

module.exports = { up, down }
