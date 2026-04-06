/**
 * API tests for GET /api/health
 *
 * Tests run without a real DB or Redis — both are mocked so the suite is
 * fast, deterministic, and CI-friendly.
 */

const request = require('supertest')

// ── Mock PostgreSQL ────────────────────────────────────────────────────────
jest.mock('../../src/lib/@system/PostgreSQL', () => {
  const mockDb = {
    one: jest.fn(),
    oneOrNone: jest.fn(),
    none: jest.fn(),
    any: jest.fn(),
  }
  mockDb.connectPool = jest.fn().mockResolvedValue()
  mockDb.disconnectPool = jest.fn().mockResolvedValue()
  mockDb.pgp = {}
  return mockDb
})

// ── Mock Redis ─────────────────────────────────────────────────────────────
jest.mock('../../src/lib/@system/Redis', () => ({
  client: {
    on: jest.fn(),
    status: 'ready',
  },
  connect: jest.fn().mockResolvedValue(),
  isReady: jest.fn().mockReturnValue(true),
}))

const app = require('../../src/app')
const db = require('../../src/lib/@system/PostgreSQL')
const { isReady } = require('../../src/lib/@system/Redis')

describe('GET /api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default: healthy state
    db.one.mockResolvedValue({ '?column?': 1 })
    isReady.mockReturnValue(true)
  })

  it('returns 200 with status ok when DB and Redis are healthy', async () => {
    const res = await request(app).get('/api/health')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.checks.server).toBe('ok')
    expect(res.body.checks.db).toBe('ok')
    expect(res.body.checks.redis).toBe('ok')
    expect(res.body.timestamp).toBeDefined()
  })

  it('performs a SELECT 1 DB check', async () => {
    await request(app).get('/api/health')

    expect(db.one).toHaveBeenCalledWith('SELECT 1')
  })

  it('returns 503 with status degraded when DB is down', async () => {
    db.one.mockRejectedValue(new Error('Connection refused'))

    const res = await request(app).get('/api/health')

    expect(res.status).toBe(503)
    expect(res.body.status).toBe('degraded')
    expect(res.body.checks.db).toBe('error')
  })

  it('returns 200 with redis unavailable when Redis is down (non-fatal)', async () => {
    isReady.mockReturnValue(false)

    const res = await request(app).get('/api/health')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.checks.db).toBe('ok')
    expect(res.body.checks.redis).toBe('unavailable')
  })

  it('is available without authentication', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
  })

  it('returns JSON content-type', async () => {
    const res = await request(app).get('/api/health')
    expect(res.headers['content-type']).toMatch(/application\/json/)
  })

  it('rejects PATCH method with 404', async () => {
    const res = await request(app).patch('/api/health')
    expect(res.status).toBe(404)
  })

  it('rejects POST method with 404', async () => {
    const res = await request(app).post('/api/health')
    expect(res.status).toBe(404)
  })

  it('rejects PUT method with 404', async () => {
    const res = await request(app).put('/api/health')
    expect(res.status).toBe(404)
  })

  it('rejects DELETE method with 404', async () => {
    const res = await request(app).delete('/api/health')
    expect(res.status).toBe(404)
  })
})
