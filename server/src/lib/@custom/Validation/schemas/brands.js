const { z } = require('zod')

// ─── ID Parameter Validation ─────────────────────────────────────────────────
const BrandIdParams = z.object({
  id: z.string().uuid('Invalid brand ID format')
})

// ─── Pagination Query Validation ─────────────────────────────────────────────
const PaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).optional()
})

// ─── Create Brand Body Validation ────────────────────────────────────────────
const CreateBrandBody = z.object({
  name: z.string()
    .min(1, 'Brand name is required')
    .max(200, 'Brand name must be less than 200 characters')
    .trim(),
  
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),
  
  website_url: z.string()
    .url('Invalid website URL')
    .max(500, 'URL must be less than 500 characters')
    .optional()
    .nullable(),
  
  primary_color: z.string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color format (must be #RGB or #RRGGBB)')
    .optional()
    .nullable(),
  
  secondary_color: z.string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color format (must be #RGB or #RRGGBB)')
    .optional()
    .nullable()
})

// ─── Update Brand Body Validation ────────────────────────────────────────────
const UpdateBrandBody = z.object({
  name: z.string()
    .min(1, 'Brand name cannot be empty')
    .max(200, 'Brand name must be less than 200 characters')
    .trim()
    .optional(),
  
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),
  
  website_url: z.string()
    .url('Invalid website URL')
    .max(500, 'URL must be less than 500 characters')
    .optional()
    .nullable(),
  
  primary_color: z.string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color format (must be #RGB or #RRGGBB)')
    .optional()
    .nullable(),
  
  secondary_color: z.string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color format (must be #RGB or #RRGGBB)')
    .optional()
    .nullable(),
  
  status: z.enum(['active', 'inactive', 'archived'])
    .optional()
    .nullable()
})

// ─── Upload Logo Body Validation ─────────────────────────────────────────────
const UploadLogoBody = z.object({
  logo: z.string()
    .regex(/^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/, 'Invalid image data URL format')
    .refine((data) => {
      // Check base64 size (approximate file size)
      const base64Length = data.split(',')[1]?.length || 0
      const sizeInBytes = (base64Length * 3) / 4
      const sizeInMB = sizeInBytes / (1024 * 1024)
      return sizeInMB <= 2 // 2MB limit
    }, { message: 'Logo must be less than 2MB' })
})

module.exports = {
  BrandIdParams,
  PaginationQuery,
  CreateBrandBody,
  UpdateBrandBody,
  UploadLogoBody
}
