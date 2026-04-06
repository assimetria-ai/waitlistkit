// @custom — Blog post validation schemas
const { z } = require('zod')

const CreateBlogPostBody = z.object({
  title: z.string().min(1).max(200).trim(),
  excerpt: z.string().max(500).nullish().default(null),
  content: z.string().max(100000).default(''),
  category: z.string().max(100).nullish().default(null),
  author: z.string().max(100).nullish().default(null),
  tags: z.union([
    z.array(z.string()),
    z.string(),
  ]).nullish().default(null),
  cover_image: z.string().url().max(2048).nullish().default(null),
  status: z.enum(['draft', 'published']).default('draft'),
})

const UpdateBlogPostBody = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  excerpt: z.string().max(500).nullish(),
  content: z.string().max(100000).optional(),
  category: z.string().max(100).nullish(),
  author: z.string().max(100).nullish(),
  tags: z.union([
    z.array(z.string()),
    z.string(),
  ]).nullish(),
  cover_image: z.string().url().max(2048).nullish(),
  status: z.enum(['draft', 'published']).optional(),
})

const BlogPostIdParams = z.object({
  id: z.coerce.number().int().positive(),
})

const BlogPostSlugParams = z.object({
  slug: z.string().min(1).max(200),
})

const ListBlogPostsQuery = z.object({
  category: z.string().max(100).optional(),
  status: z.enum(['draft', 'published']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

module.exports = {
  CreateBlogPostBody,
  UpdateBlogPostBody,
  BlogPostIdParams,
  BlogPostSlugParams,
  ListBlogPostsQuery,
}
