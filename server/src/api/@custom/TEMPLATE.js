/**
 * API Template - Copy this for new resources
 * 
 * This template demonstrates all common API patterns:
 * - Auto-generated CRUD router (simplest)
 * - Manual CRUD with helpers (moderate control)
 * - Custom endpoints (full control)
 * - Search, filtering, sorting
 * - Pagination
 * - Validation
 * - Authentication
 * 
 * Choose the approach that fits your needs!
 */

// ═══════════════════════════════════════════════════════════════════════════
// OPTION 1: Auto-Generated CRUD Router (Zero Boilerplate)
// ═══════════════════════════════════════════════════════════════════════════
/*
const { createCrudRouter } = require('../../lib/@system/Helpers')
const ResourceRepo = require('../../db/repos/@custom/ResourceRepo')
const { authenticate, requireAdmin } = require('../../lib/@system/Helpers/auth')
const { validate } = require('../../lib/@system/Middleware')
const { CreateResourceSchema, UpdateResourceSchema } = require('./schemas')

module.exports = createCrudRouter({
  repo: ResourceRepo,
  
  validation: {
    create: { body: CreateResourceSchema },
    update: { body: UpdateResourceSchema },
  },
  
  middleware: {
    list: [],
    get: [],
    create: [authenticate],
    update: [authenticate],
    delete: [authenticate, requireAdmin],
  },
  
  config: {
    basePath: '/api/resources',
    dataKey: 'resource',
    messages: {
      notFound: 'Resource not found',
      deleted: 'Resource deleted successfully',
    },
  },
})
*/

// ═══════════════════════════════════════════════════════════════════════════
// OPTION 2: Manual CRUD with Helpers (Recommended)
// ═══════════════════════════════════════════════════════════════════════════

const express = require('express')
const router = express.Router()

// Import helpers
const {
  // CRUD handlers
  handleList,
  handleGetById,
  handleCreate,
  handleUpdate,
  handleDelete,
  
  // Search & filtering
  parseSearchQuery,
  buildWhereClause,
  buildOrderByClause,
  
  // Query parsing
  parseQueryParams,
  parseBooleanParams,
  parseArrayParams,
  
  // Utilities
  asyncHandler,
  validateIdParam,
  extractAllowedFields,
  successResponse,
  errorResponse,
  
  // Auth
  authenticate,
  requireAdmin,
} = require('../../lib/@system/Helpers')

const {
  pagination,
  validate,
} = require('../../lib/@system/Middleware')

// Repository (you'll create this)
const ResourceRepo = require('../../db/repos/@custom/ResourceRepo')

// Validation schemas (you'll create these)
const {
  CreateResourceSchema,
  UpdateResourceSchema,
  ListResourcesSchema,
  ResourceIdSchema,
} = require('./schemas')

// ───────────────────────────────────────────────────────────────────────────
// LIST - /api/resources
// GET ?q=search&category=x&status=active&sort=created_at&order=desc&page=1&limit=20
// ───────────────────────────────────────────────────────────────────────────

router.get(
  '/api/resources',
  pagination({ defaultLimit: 20, maxLimit: 100 }),
  validate(ListResourcesSchema),
  asyncHandler(async (req, res, next) => {
    // Option A: Parse all params automatically
    const queryConfig = parseQueryParams(req, {
      searchFields: ['name', 'description'],
      sortableFields: ['name', 'created_at', 'updated_at', 'status'],
      filterFields: ['category', 'status', 'user_id'],
      booleanFields: ['is_active', 'is_featured'],
      arrayFields: ['tags'],
    })
    
    // Use the CRUD handler
    await handleList({
      repo: ResourceRepo,
      req,
      res,
      next,
      filters: {
        whereClause: queryConfig.whereClause,
        params: queryConfig.params,
        orderBy: queryConfig.orderBy,
      },
      dataKey: 'resources',
    })
    
    // Option B: Manual control (more flexibility)
    /*
    const search = parseSearchQuery(req.query, {
      defaultFields: ['name', 'description'],
    })
    
    // Build filters
    const filters = {}
    if (req.query.category) filters.category = req.query.category
    if (req.query.status) filters.status = req.query.status
    if (req.query.user_id) filters.user_id = req.query.user_id
    
    // Parse booleans
    if (req.query.is_active !== undefined) {
      filters.is_active = req.query.is_active === 'true'
    }
    
    // Custom date filters
    if (req.query.created_after) {
      filters['created_at >='] = req.query.created_after
    }
    
    const { whereClause, params } = buildWhereClause({
      searchQuery: search.query,
      searchFields: search.fields,
      filters,
    })
    
    const orderBy = buildOrderByClause({
      sortBy: req.query.sort,
      sortOrder: req.query.order,
      allowedFields: ['name', 'created_at', 'updated_at'],
      defaultSort: 'created_at',
    })
    
    await handleList({
      repo: ResourceRepo,
      req, res, next,
      filters: { whereClause, params, orderBy },
      dataKey: 'resources',
    })
    */
  })
)

// ───────────────────────────────────────────────────────────────────────────
// GET BY ID - /api/resources/:id
// ───────────────────────────────────────────────────────────────────────────

router.get(
  '/api/resources/:id',
  validateIdParam('integer'), // or 'uuid'
  asyncHandler((req, res, next) => {
    handleGetById({
      repo: ResourceRepo,
      req,
      res,
      next,
      dataKey: 'resource',
      notFoundMessage: 'Resource not found',
    })
  })
)

// ───────────────────────────────────────────────────────────────────────────
// CREATE - /api/resources
// POST { name, description, category, ... }
// ───────────────────────────────────────────────────────────────────────────

router.post(
  '/api/resources',
  authenticate,
  validate(CreateResourceSchema),
  asyncHandler((req, res, next) => {
    handleCreate({
      repo: ResourceRepo,
      req,
      res,
      next,
      
      // Transform data before creating
      transformData: async (body, req) => {
        // Add computed fields
        const slug = body.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
        
        // Add user context
        const user_id = req.user?.id
        
        // Add timestamps
        const created_at = new Date().toISOString()
        
        // Whitelist allowed fields (prevent mass assignment)
        const allowed = extractAllowedFields(body, [
          'name',
          'description',
          'category',
          'tags',
          'metadata',
        ])
        
        return {
          ...allowed,
          slug,
          user_id,
          created_at,
          updated_at: created_at,
          status: 'draft', // Default status
        }
      },
      
      dataKey: 'resource',
      statusCode: 201,
    })
  })
)

// ───────────────────────────────────────────────────────────────────────────
// UPDATE - /api/resources/:id
// PATCH { name?, description?, ... }
// ───────────────────────────────────────────────────────────────────────────

router.patch(
  '/api/resources/:id',
  authenticate,
  validateIdParam('integer'),
  validate(UpdateResourceSchema),
  asyncHandler((req, res, next) => {
    handleUpdate({
      repo: ResourceRepo,
      req,
      res,
      next,
      
      // Transform data before updating
      transformData: async (body, req, existing) => {
        // Example: Prevent certain changes
        if (existing.status === 'published' && body.status === 'draft') {
          throw new Error('Cannot unpublish via PATCH. Use DELETE endpoint.')
        }
        
        // Example: Only allow owner or admin to update
        if (req.user.id !== existing.user_id && !req.user.is_admin) {
          throw new Error('Not authorized to update this resource')
        }
        
        // Whitelist allowed fields
        const allowed = extractAllowedFields(body, [
          'name',
          'description',
          'category',
          'tags',
          'metadata',
          'status',
        ])
        
        // Add updated timestamp
        return {
          ...allowed,
          updated_at: new Date().toISOString(),
        }
      },
      
      dataKey: 'resource',
      notFoundMessage: 'Resource not found',
    })
  })
)

// ───────────────────────────────────────────────────────────────────────────
// DELETE - /api/resources/:id
// DELETE
// ───────────────────────────────────────────────────────────────────────────

router.delete(
  '/api/resources/:id',
  authenticate,
  requireAdmin,
  validateIdParam('integer'),
  asyncHandler((req, res, next) => {
    handleDelete({
      repo: ResourceRepo,
      req,
      res,
      next,
      hardDelete: false, // Use soft delete (if repo supports it)
      notFoundMessage: 'Resource not found',
      successMessage: 'Resource deleted successfully',
    })
  })
)

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOM ENDPOINTS (Beyond basic CRUD)
// ═══════════════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────────────
// PUBLISH - /api/resources/:id/publish
// POST
// ───────────────────────────────────────────────────────────────────────────

router.post(
  '/api/resources/:id/publish',
  authenticate,
  validateIdParam('integer'),
  asyncHandler(async (req, res, next) => {
    const resource = await ResourceRepo.findById(req.params.id)
    
    if (!resource) {
      return res.status(404).json(errorResponse('Resource not found'))
    }
    
    // Check authorization
    if (req.user.id !== resource.user_id && !req.user.is_admin) {
      return res.status(403).json(errorResponse('Not authorized'))
    }
    
    // Validate resource is ready to publish
    if (!resource.name || !resource.description) {
      return res.status(400).json(
        errorResponse('Cannot publish incomplete resource', {
          details: {
            name: !resource.name ? 'Name is required' : null,
            description: !resource.description ? 'Description is required' : null,
          },
        })
      )
    }
    
    // Publish
    const updated = await ResourceRepo.update(resource.id, {
      status: 'published',
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    
    res.json(successResponse(updated, {
      message: 'Resource published successfully',
    }))
  })
)

// ───────────────────────────────────────────────────────────────────────────
// BULK OPERATIONS - /api/resources/bulk-delete
// POST { ids: [1, 2, 3] }
// ───────────────────────────────────────────────────────────────────────────

router.post(
  '/api/resources/bulk-delete',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res, next) => {
    const { ids } = req.body
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(errorResponse('ids must be a non-empty array'))
    }
    
    // Validate all IDs
    const invalidIds = ids.filter((id) => {
      const numId = parseInt(id, 10)
      return isNaN(numId) || numId <= 0
    })
    
    if (invalidIds.length > 0) {
      return res.status(400).json(
        errorResponse('Invalid ID format', {
          details: { invalidIds },
        })
      )
    }
    
    // Bulk delete
    await ResourceRepo.bulkDelete(ids)
    
    res.json(
      successResponse(null, {
        message: `${ids.length} resources deleted successfully`,
        meta: { deletedIds: ids },
      })
    )
  })
)

// ───────────────────────────────────────────────────────────────────────────
// STATISTICS - /api/resources/stats
// GET
// ───────────────────────────────────────────────────────────────────────────

router.get(
  '/api/resources/stats',
  authenticate,
  asyncHandler(async (req, res, next) => {
    const stats = await ResourceRepo.getStats(req.user.id)
    
    res.json(successResponse(stats, {
      message: 'Statistics retrieved successfully',
    }))
  })
)

// ───────────────────────────────────────────────────────────────────────────
// DUPLICATE - /api/resources/:id/duplicate
// POST
// ───────────────────────────────────────────────────────────────────────────

router.post(
  '/api/resources/:id/duplicate',
  authenticate,
  validateIdParam('integer'),
  asyncHandler(async (req, res, next) => {
    const original = await ResourceRepo.findById(req.params.id)
    
    if (!original) {
      return res.status(404).json(errorResponse('Resource not found'))
    }
    
    // Check authorization
    if (req.user.id !== original.user_id && !req.user.is_admin) {
      return res.status(403).json(errorResponse('Not authorized'))
    }
    
    // Create duplicate
    const duplicate = await ResourceRepo.create({
      name: `${original.name} (Copy)`,
      description: original.description,
      category: original.category,
      tags: original.tags,
      metadata: original.metadata,
      user_id: req.user.id,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    
    res.status(201).json(
      successResponse(duplicate, {
        message: 'Resource duplicated successfully',
      })
    )
  })
)

module.exports = router

// ═══════════════════════════════════════════════════════════════════════════
// REPOSITORY INTERFACE
// ═══════════════════════════════════════════════════════════════════════════
/*
Your ResourceRepo should implement these methods:

class ResourceRepo {
  // Required for LIST
  async findAll({ whereClause, params, orderBy, limit, offset }) {
    const { sql } = buildSelect('resources', {
      whereClause,
      whereParams: params,
      orderBy,
      limit,
      offset,
    })
    const result = await db.query(sql, params)
    return result.rows
  }
  
  // Required for LIST
  async count({ whereClause, params }) {
    const { sql } = buildCount('resources', {
      whereClause,
      whereParams: params,
    })
    const result = await db.query(sql, params)
    return parseInt(result.rows[0].count, 10)
  }
  
  // Required for GET
  async findById(id) {
    const result = await db.query('SELECT * FROM resources WHERE id = $1', [id])
    return result.rows[0] || null
  }
  
  // Required for CREATE
  async create(data) {
    const { sql, params } = buildInsert('resources', data, { returning: true })
    const result = await db.query(sql, params)
    return result.rows[0]
  }
  
  // Required for UPDATE
  async update(id, data) {
    const { sql, params } = buildUpdate('resources', data, id, { returning: true })
    const result = await db.query(sql, params)
    return result.rows[0]
  }
  
  // Required for DELETE
  async delete(id) {
    await db.query('DELETE FROM resources WHERE id = $1', [id])
  }
  
  // Optional: Soft delete
  async softDelete(id) {
    await db.query('UPDATE resources SET deleted_at = NOW() WHERE id = $1', [id])
  }
  
  // Optional: Bulk operations
  async bulkDelete(ids) {
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',')
    await db.query(`DELETE FROM resources WHERE id IN (${placeholders})`, ids)
  }
  
  // Optional: Custom methods
  async getStats(userId) {
    const result = await db.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'published') as published,
        COUNT(*) FILTER (WHERE status = 'draft') as draft
      FROM resources
      WHERE user_id = $1
    `, [userId])
    return result.rows[0]
  }
}

module.exports = new ResourceRepo()
*/

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════
/*
Create schemas with Zod:

const { z } = require('zod')

const CreateResourceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.enum(['typeA', 'typeB', 'typeC']),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
})

const UpdateResourceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  category: z.enum(['typeA', 'typeB', 'typeC']).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
})

const ListResourcesSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  is_active: z.enum(['true', 'false']).optional(),
  sort: z.enum(['name', 'created_at', 'updated_at']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).optional(),
})

const ResourceIdSchema = z.object({
  id: z.coerce.number().int().positive(),
})

module.exports = {
  CreateResourceSchema: { body: CreateResourceSchema },
  UpdateResourceSchema: { body: UpdateResourceSchema },
  ListResourcesSchema: { query: ListResourcesSchema },
  ResourceIdSchema: { params: ResourceIdSchema },
}
*/
