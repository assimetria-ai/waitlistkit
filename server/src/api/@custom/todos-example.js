/**
 * Example CRUD API using template patterns
 * 
 * This is a reference implementation showing how to use:
 * - Pagination middleware
 * - Search helpers
 * - CRUD handlers
 * 
 * Copy this pattern for your own resources.
 */

const express = require('express')
const router = express.Router()
const { pagination, validate } = require('../../lib/@system/Middleware')
const {
  handleList,
  handleGetById,
  handleCreate,
  handleUpdate,
  handleDelete,
  parseSearchQuery,
  buildWhereClause,
  buildOrderByClause,
  authenticate,
} = require('../../lib/@system/Helpers')

// Example validation schemas (replace with real Zod schemas)
const createTodoSchema = {
  body: {
    type: 'object',
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 200 },
      description: { type: 'string', maxLength: 1000 },
      priority: { type: 'string', enum: ['low', 'medium', 'high'] },
    },
    required: ['title'],
  },
}

const updateTodoSchema = {
  body: {
    type: 'object',
    properties: {
      title: { type: 'string', minLength: 1, maxLength: 200 },
      description: { type: 'string', maxLength: 1000 },
      priority: { type: 'string', enum: ['low', 'medium', 'high'] },
      completed: { type: 'boolean' },
    },
  },
}

// Mock repository (replace with real database repo)
const todosRepo = {
  data: [],
  nextId: 1,
  
  async findAll({ limit, offset, whereClause, params, orderBy }) {
    // In real implementation, execute SQL query with whereClause, params, orderBy
    let results = [...this.data]
    
    // Simple in-memory filter/sort for demo
    if (limit > 0) {
      results = results.slice(offset, offset + limit)
    }
    
    return results
  },
  
  async count(filters) {
    return this.data.length
  },
  
  async findById(id) {
    return this.data.find((item) => item.id === parseInt(id)) || null
  },
  
  async create(data) {
    const item = {
      id: this.nextId++,
      ...data,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.data.push(item)
    return item
  },
  
  async update(id, data) {
    const index = this.data.findIndex((item) => item.id === parseInt(id))
    if (index === -1) return null
    
    this.data[index] = {
      ...this.data[index],
      ...data,
      updated_at: new Date().toISOString(),
    }
    return this.data[index]
  },
  
  async delete(id) {
    const index = this.data.findIndex((item) => item.id === parseInt(id))
    if (index !== -1) {
      this.data.splice(index, 1)
    }
  },
}

// ── LIST ────────────────────────────────────────────────────────────────────
// GET /api/todos
// Query params: ?q=search&limit=20&page=1&sort=created_at&order=desc&priority=high

router.get('/api/todos', pagination(), async (req, res, next) => {
  try {
    // Parse search query
    const search = parseSearchQuery(req.query, {
      defaultFields: ['title', 'description'],
    })
    
    // Build filters from query params
    const filters = {}
    if (req.query.priority) {
      filters.priority = req.query.priority
    }
    if (req.query.completed) {
      filters.completed = req.query.completed === 'true'
    }
    
    // Build WHERE clause with search + filters
    const { whereClause, params } = buildWhereClause({
      searchQuery: search.query,
      searchFields: search.fields,
      filters,
    })
    
    // Build ORDER BY clause
    const orderBy = buildOrderByClause({
      sortBy: req.query.sort,
      sortOrder: req.query.order,
      allowedFields: ['title', 'priority', 'created_at', 'updated_at'],
      defaultSort: 'created_at',
    })
    
    // Handle list with pagination
    await handleList({
      repo: todosRepo,
      req,
      res,
      next,
      filters: { whereClause, params, orderBy },
      dataKey: 'todos',
    })
  } catch (err) {
    next(err)
  }
})

// ── GET BY ID ───────────────────────────────────────────────────────────────
// GET /api/todos/:id

router.get('/api/todos/:id', (req, res, next) => {
  handleGetById({
    repo: todosRepo,
    req,
    res,
    next,
    dataKey: 'todo',
    notFoundMessage: 'Todo not found',
  })
})

// ── CREATE ──────────────────────────────────────────────────────────────────
// POST /api/todos
// Body: { title, description?, priority? }

router.post('/api/todos', validate(createTodoSchema), (req, res, next) => {
  handleCreate({
    repo: todosRepo,
    req,
    res,
    next,
    transformData: async (body, req) => ({
      ...body,
      // In authenticated app, add user_id from req.user
      // user_id: req.user?.id,
    }),
    dataKey: 'todo',
  })
})

// ── UPDATE ──────────────────────────────────────────────────────────────────
// PATCH /api/todos/:id
// Body: { title?, description?, priority?, completed? }

router.patch('/api/todos/:id', validate(updateTodoSchema), (req, res, next) => {
  handleUpdate({
    repo: todosRepo,
    req,
    res,
    next,
    transformData: async (body, req, existing) => {
      // Example: prevent changing completed todos
      if (existing.completed && body.title) {
        throw new Error('Cannot edit completed todos')
      }
      
      return {
        ...body,
        // Preserve certain fields
        id: existing.id,
        created_at: existing.created_at,
      }
    },
    dataKey: 'todo',
    notFoundMessage: 'Todo not found',
  })
})

// ── DELETE ──────────────────────────────────────────────────────────────────
// DELETE /api/todos/:id

router.delete('/api/todos/:id', (req, res, next) => {
  handleDelete({
    repo: todosRepo,
    req,
    res,
    next,
    hardDelete: true,
    notFoundMessage: 'Todo not found',
    successMessage: 'Todo deleted successfully',
  })
})

// ── ALTERNATIVE: Auto-generated CRUD router ─────────────────────────────────
// Uncomment to use createCrudRouter instead of manual routes:
//
// const { createCrudRouter } = require('../../lib/@system/Helpers')
//
// module.exports = createCrudRouter({
//   repo: todosRepo,
//   validation: {
//     create: createTodoSchema,
//     update: updateTodoSchema,
//   },
//   config: {
//     basePath: '/api/todos',
//     dataKey: 'todo',
//     messages: {
//       notFound: 'Todo not found',
//       deleted: 'Todo deleted successfully',
//     },
//   },
// })

module.exports = router
