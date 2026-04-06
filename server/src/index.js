require('dotenv').config()

// ── Run DB migrations before anything else (non-fatal — server starts regardless) ──
;(function runMigrationsSync() {
  const { execFileSync, spawnSync } = require('child_process')
  const path = require('path')
  const node = process.execPath
  const runJs = path.join(__dirname, 'db/migrations/@system/run.js')
  const dropScript = path.join(__dirname, '..', 'scripts', 'drop-schema-migrations.js')
  const log = (msg) => console.log(`[startup][${new Date().toISOString()}] ${msg}`)
  try {
    log('Running DB migrations...')
    execFileSync(node, [runJs], { stdio: 'inherit' })
    log('Migrations done.')
  } catch (e) {
    log(`Migrations failed (${e.message}) — retrying once...`)
    try {
      spawnSync(node, [dropScript], { stdio: 'inherit', env: process.env })
      execFileSync(node, [runJs], { stdio: 'inherit' })
      log('Migrations done after recovery.')
    } catch (e2) {
      log(`WARNING: Migrations failed after retry (${e2.message}). Server will start anyway — DB may need manual migration.`)
    }
  }
})()

require('./lib/@system/Env') // validate env vars — exits with a clear error if required vars are missing
const http = require('http')
const app = require('./app')
const logger = require('./lib/@system/Logger')
const { connect: connectRedis } = require('./lib/@system/Redis')
const { connectPool: connectPostgres, disconnectPool: disconnectPostgres } = require('./lib/@system/PostgreSQL')
const { scheduler } = require('./scheduler/tasks/@system')

const PORT = process.env.PORT ?? 3001
// In production (Railway), bind to 0.0.0.0 so Railway can route traffic.
// In development, bind to localhost only to prevent external access.
const BIND_HOST = process.env.BIND_HOST ||
  (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1')

async function start() {
  await connectPostgres()
  await connectRedis()

  // ── Email logging ──────────────────────────────────────────────────────
  // Register email tracking callback if EmailLogRepo exists
  try {
    const Email = require('./lib/@system/Email')
    const EmailLogRepo = require('./db/repos/@custom/EmailLogRepo')
    Email.setEmailSentCallback((data) => EmailLogRepo.create(data))
    logger.info('email logging enabled')
  } catch (_) {
    // EmailLogRepo not available — email logging disabled
  }

  // ── Scheduler ──────────────────────────────────────────────────────────
  // Initialize custom tasks (application layer imports @custom, not @system)
  try {
    const initCustomTasks = require('./scheduler/tasks/@custom/init')
    initCustomTasks(scheduler)
    logger.info('custom tasks initialised')
  } catch (err) {
    logger.warn({ err }, 'no custom task init found or init failed — skipping')
  }

  // ── Create HTTP server (required for GraphQL WebSocket subscriptions) ──
  const httpServer = http.createServer(app)

  // ── GraphQL setup ──────────────────────────────────────────────────────
  try {
    const { setupGraphQL } = require('./graphql/@custom')
    await setupGraphQL(app, httpServer)
    logger.info('GraphQL API initialized')
  } catch (err) {
    logger.warn({ err: err.message }, 'GraphQL setup failed — continuing without GraphQL')
  }

  httpServer.listen(PORT, BIND_HOST, () => {
    logger.info({ port: PORT, host: BIND_HOST, env: process.env.NODE_ENV ?? 'development' }, 'server started')
  })

  // ── Graceful shutdown ──────────────────────────────────────────────────
  async function shutdown(signal) {
    logger.info({ signal }, 'shutdown signal received')
    httpServer.close(async () => {
      await disconnectPostgres()
      logger.info('shutdown complete')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

start()
