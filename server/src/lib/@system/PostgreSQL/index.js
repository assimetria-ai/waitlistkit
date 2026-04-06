// Require logger first so it's available in pg-promise callbacks
const logger = require('../Logger')

const pgp = require('pg-promise')({
  /**
   * Called when a new client is acquired from the pool.
   * `useCount` is 0 on first checkout, increments on reuse.
   */
  connect({ client, useCount }) {
    if (useCount === 0) {
      logger.debug({ host: client.host, database: client.database }, 'PostgreSQL client connected')
    }
  },

  /**
   * Called when a client is returned to the pool.
   */
  disconnect({ client }) {
    logger.debug({ host: client.host, database: client.database }, 'PostgreSQL client released')
  },

  /**
   * Called on any pg-promise query error.
   */
  error(err, e) {
    logger.error({ err, query: e?.query }, 'PostgreSQL error')
  },
})

// ── Pool configuration ─────────────────────────────────────────────────────

// Resolve the connection URL.
//
// Priority on Railway (#18836 regression fix):
//   1. PG* vars — Railway injects these alongside the Postgres plugin and keeps
//      them in sync with the actual database credentials. DATABASE_URL can become
//      stale if manually overridden or after a credential rotation, so on Railway
//      we always prefer the authoritative individual vars.
//   2. DATABASE_URL — used outside Railway (local dev, other hosting).
//   3. Fallback — hardcoded localhost for local dev without any env config.
//
// Background: #18584 added PG* fallback only when DATABASE_URL was absent.
// This did not fix the regression because Railway's DATABASE_URL was SET but
// contained stale/wrong credentials, so the early-return on line 1 bypassed
// the correct PG* vars entirely. (#18836)
function resolveDbUrl() {
  const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env
  const isRailway = Boolean(process.env.RAILWAY_ENVIRONMENT)

  // On Railway: always build from PG* vars (authoritative, auto-rotated by Railway)
  if (isRailway && PGHOST && PGUSER && PGDATABASE) {
    const port = PGPORT ?? '5432'
    const pass = PGPASSWORD ? `:${encodeURIComponent(PGPASSWORD)}` : ''
    logger.info(
      { host: PGHOST, port, user: PGUSER, database: PGDATABASE },
      'Railway detected — DB URL built from PGHOST/PGUSER/PGDATABASE (overrides DATABASE_URL) (#18836)',
    )
    return `postgresql://${PGUSER}${pass}@${PGHOST}:${port}/${PGDATABASE}`
  }

  // Outside Railway: honour DATABASE_URL if set
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL

  // Non-Railway fallback: build from PG* vars (#18584)
  if (PGHOST && PGUSER && PGDATABASE) {
    const port = PGPORT ?? '5432'
    const pass = PGPASSWORD ? `:${encodeURIComponent(PGPASSWORD)}` : ''
    logger.warn(
      { host: PGHOST, port, user: PGUSER, database: PGDATABASE },
      'DATABASE_URL not set — built from PGHOST/PGUSER/PGDATABASE (#18584)',
    )
    return `postgresql://${PGUSER}${pass}@${PGHOST}:${port}/${PGDATABASE}`
  }

  return 'postgresql://postgres:postgres@localhost:5432/product_template_dev'
}

const DB_URL = resolveDbUrl()
const POOL_MAX = parseInt(process.env.DB_POOL_MAX ?? '10', 10)
const POOL_IDLE_TIMEOUT = parseInt(process.env.DB_POOL_IDLE_TIMEOUT ?? '30000', 10)
const POOL_CONNECTION_TIMEOUT = parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT ?? '2000', 10)

const connectionConfig = {
  connectionString: DB_URL,

  // Maximum number of clients in the pool.
  // Tune based on expected concurrency and your DB server's max_connections.
  max: POOL_MAX,

  // Close idle clients after this many milliseconds.
  idleTimeoutMillis: POOL_IDLE_TIMEOUT,

  // Throw an error if a client cannot be acquired within this period.
  connectionTimeoutMillis: POOL_CONNECTION_TIMEOUT,

  // Railway automatically injects RAILWAY_ENVIRONMENT. When on Railway, always
  // use SSL with rejectUnauthorized=false — Railway's internal Postgres uses
  // self-signed certs that valid-CA checks reject. DB_POOL_SSL=false does NOT
  // disable SSL on Railway (it would break the connection).
  // Outside Railway: SSL only in production; set DB_SSL_REJECT_UNAUTHORIZED=false
  // to skip cert validation, or DB_POOL_SSL=false to disable SSL entirely.
  ssl: (() => {
    const isRailway = Boolean(process.env.RAILWAY_ENVIRONMENT)
    if (isRailway) {
      return process.env.DB_SSL_CA
        ? { ca: require('fs').readFileSync(process.env.DB_SSL_CA) }
        : { rejectUnauthorized: false }
    }
    if (process.env.NODE_ENV === 'production' && process.env.DB_POOL_SSL !== 'false') {
      return process.env.DB_SSL_CA
        ? { ca: require('fs').readFileSync(process.env.DB_SSL_CA) }
        : { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
    }
    return undefined
  })(),
}

const db = pgp(connectionConfig)

// ── Lifecycle helpers ──────────────────────────────────────────────────────

/**
 * Verify the pool can reach the database. Call once at server startup.
 * Throws if the connection fails so the process exits with a clear error.
 */
async function connectPool() {
  // Log connection target (password redacted) so Railway DATABASE_URL
  // misconfigurations are immediately visible in startup logs (#18584)
  try {
    const url = new URL(DB_URL)
    logger.info(
      {
        host: url.hostname,
        port: url.port || 5432,
        database: url.pathname.slice(1),
        user: url.username,
        ssl: connectionConfig.ssl ? true : false,
      },
      'PostgreSQL connecting',
    )
  } catch (_) {
    logger.warn({ databaseUrl: '[unparseable]' }, 'DATABASE_URL could not be parsed — check env var')
  }

  const conn = await db.connect()
  const { serverVersion } = conn.client
  conn.done() // return the client to the pool immediately
  logger.info(
    { serverVersion, poolMax: POOL_MAX, idleTimeout: POOL_IDLE_TIMEOUT },
    'PostgreSQL connected',
  )
}

/**
 * Drain the pool and close all connections. Call on SIGTERM / SIGINT.
 */
async function disconnectPool() {
  await pgp.end()
  logger.info('PostgreSQL pool closed')
}

// ── Exports ───────────────────────────────────────────────────────────────
//
// module.exports IS the pg-promise db object — existing repos continue to
// work unchanged: `const db = require('.../PostgreSQL')`.
//
// Lifecycle helpers are attached as extra properties:
//   const { connectPool, disconnectPool } = require('.../PostgreSQL')
//

module.exports = db
module.exports.connectPool = connectPool
module.exports.disconnectPool = disconnectPool
module.exports.pgp = pgp
