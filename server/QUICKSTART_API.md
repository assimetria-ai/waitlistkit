# API Quick Start Guide

Get a fully-functional REST API up and running in 5 minutes.

## Step 1: Create Your Repository

```javascript
// server/src/db/repos/@custom/ProductRepo.js
const db = require('../../@system/PostgreSQL')
const { buildSelect, buildCount, buildInsert, buildUpdate } = require('../../../lib/@system/Helpers')

class ProductRepo {
  async findAll({ whereClause, params, orderBy, limit, offset }) {
    const { sql } = buildSelect('products', {
      whereClause,
      whereParams: params,
      orderBy,
      limit,
      offset,
    })
    const result = await db.query(sql, params)
    return result.rows
  }
  
  async count({ whereClause, params }) {
    const { sql } = buildCount('products', { whereClause, whereParams: params })
    const result = await db.query(sql, params)
    return parseInt(result.rows[0].count, 10)
  }
  
  async findById(id) {
    const result = await db.query('SELECT * FROM products WHERE id = $1', [id])
    return result.rows[0] || null
  }
  
  async create(data) {
    const { sql, params } = buildInsert('products', data, { returning: true })
    const result = await db.query(sql, params)
    return result.rows[0]
  }
  
  async update(id, data) {
    const { sql, params } = buildUpdate('products', data, id, { returning: true })
    const result = await db.query(sql, params)
    return result.rows[0]
  }
  
  async delete(id) {
    await db.query('DELETE FROM products WHERE id = $1', [id])
  }
}

module.exports = new ProductRepo()
```

## Step 2: Create Validation Schemas

```javascript
// server/src/lib/@custom/Validation/schemas/products.js
const { z } = require('zod')

const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive(),
  category: z.enum(['electronics', 'clothing', 'books']),
})

const UpdateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  price: z.number().positive().optional(),
  category: z.enum(['electronics', 'clothing', 'books']).optional(),
})

module.exports = {
  CreateProductSchema: { body: CreateProductSchema },
  UpdateProductSchema: { body: UpdateProductSchema },
}
```

## Step 3: Create Your API

### Option A: Zero Boilerplate (Recommended for simple CRUD)

```javascript
// server/src/api/@custom/products/index.js
const { createCrudRouter } = require('../../../lib/@system/Helpers')
const ProductRepo = require('../../../db/repos/@custom/ProductRepo')
const { CreateProductSchema, UpdateProductSchema } = require('../../../lib/@custom/Validation/schemas/products')

module.exports = createCrudRouter({
  repo: ProductRepo,
  validation: {
    create: CreateProductSchema,
    update: UpdateProductSchema,
  },
  config: {
    basePath: '/api/products',
    dataKey: 'product',
  },
})
```

### Option B: More Control

```javascript
// server/src/api/@custom/products/index.js
const express = require('express')
const router = express.Router()
const ProductRepo = require('../../../db/repos/@custom/ProductRepo')
const {
  pagination,
  handleList,
  handleGetById,
  handleCreate,
  handleUpdate,
  handleDelete,
  parseQueryParams,
  validate,
} = require('../../../lib/@system/Helpers')
const { CreateProductSchema, UpdateProductSchema } = require('../../../lib/@custom/Validation/schemas/products')

// LIST
router.get('/api/products', pagination(), async (req, res, next) => {
  try {
    const queryConfig = parseQueryParams(req, {
      searchFields: ['name', 'description'],
      sortableFields: ['name', 'price', 'created_at'],
      filterFields: ['category'],
    })
    
    await handleList({
      repo: ProductRepo,
      req, res, next,
      filters: {
        whereClause: queryConfig.whereClause,
        params: queryConfig.params,
        orderBy: queryConfig.orderBy,
      },
      dataKey: 'products',
    })
  } catch (err) {
    next(err)
  }
})

// GET
router.get('/api/products/:id', (req, res, next) => {
  handleGetById({
    repo: ProductRepo,
    req, res, next,
    dataKey: 'product',
  })
})

// CREATE
router.post('/api/products', validate(CreateProductSchema), (req, res, next) => {
  handleCreate({
    repo: ProductRepo,
    req, res, next,
    dataKey: 'product',
  })
})

// UPDATE
router.patch('/api/products/:id', validate(UpdateProductSchema), (req, res, next) => {
  handleUpdate({
    repo: ProductRepo,
    req, res, next,
    dataKey: 'product',
  })
})

// DELETE
router.delete('/api/products/:id', (req, res, next) => {
  handleDelete({
    repo: ProductRepo,
    req, res, next,
  })
})

module.exports = router
```

## Step 4: Register Your API

```javascript
// server/src/routes/@custom/index.js
const express = require('express')
const router = express.Router()

router.use(require('../../api/@custom/products'))
// ... other routes

module.exports = router
```

## Done! 🎉

Your API is now available at:

```bash
GET    /api/products          # List with pagination, search, filters
GET    /api/products/:id      # Get single product
POST   /api/products          # Create product
PATCH  /api/products/:id      # Update product
DELETE /api/products/:id      # Delete product
```

## Test It

```bash
# List products
curl "http://localhost:3000/api/products?page=1&limit=10"

# Search products
curl "http://localhost:3000/api/products?q=laptop&category=electronics"

# Sort products
curl "http://localhost:3000/api/products?sort=price&order=asc"

# Create product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","price":999,"category":"electronics"}'

# Update product
curl -X PATCH http://localhost:3000/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{"price":899}'

# Delete product
curl -X DELETE http://localhost:3000/api/products/1
```

## Advanced Features

### Add Authentication

```javascript
const { authenticate, requireAdmin } = require('../../../lib/@system/Helpers/auth')

module.exports = createCrudRouter({
  repo: ProductRepo,
  middleware: {
    create: [authenticate],
    update: [authenticate],
    delete: [authenticate, requireAdmin],
  },
  // ... rest of config
})
```

### Add User Context

```javascript
handleCreate({
  repo: ProductRepo,
  req, res, next,
  transformData: async (body, req) => ({
    ...body,
    user_id: req.user.id,
    created_at: new Date().toISOString(),
  }),
})
```

### Add Custom Endpoints

```javascript
router.post('/api/products/:id/publish', authenticate, async (req, res) => {
  const product = await ProductRepo.findById(req.params.id)
  if (!product) return res.status(404).json({ message: 'Not found' })
  
  await ProductRepo.update(product.id, {
    status: 'published',
    published_at: new Date().toISOString(),
  })
  
  res.json({ message: 'Published successfully' })
})
```

## Next Steps

1. Read the [API Scaffolding Guide](./API_SCAFFOLDING_GUIDE.md) for complete documentation
2. Check out [TEMPLATE.js](./src/api/@custom/TEMPLATE.js) for a comprehensive example
3. Review [todos-example.js](./src/api/@custom/todos-example.js) for a working demo

## Common Query Parameters

Your API automatically supports these query parameters:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `q` | Search term | `?q=laptop` |
| `fields` | Search fields | `?fields=name,description` |
| `sort` | Sort field | `?sort=price` |
| `order` | Sort direction | `?order=asc` |
| `page` | Page number | `?page=2` |
| `limit` | Page size | `?limit=20` |
| `offset` | Offset | `?offset=40` |
| `[field]` | Filter by field | `?category=electronics` |

## Response Format

```json
{
  "data": [...],
  "total": 100,
  "limit": 20,
  "offset": 0,
  "page": 1,
  "total_pages": 5,
  "has_more": true
}
```

## Error Handling

Errors are automatically handled and formatted:

```json
{
  "success": false,
  "message": "Validation error",
  "details": {
    "name": "Name is required"
  }
}
```

## Need Help?

- Full docs: [API_SCAFFOLDING_GUIDE.md](./API_SCAFFOLDING_GUIDE.md)
- Template: [TEMPLATE.js](./src/api/@custom/TEMPLATE.js)
- Example: [todos-example.js](./src/api/@custom/todos-example.js)
