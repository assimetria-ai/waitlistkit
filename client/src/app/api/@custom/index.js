// @custom API calls — product-specific API functions
import { api } from '../../lib/@system/api.js'

// ─── Blog API ─────────────────────────────────────────────────────────────────

export const getBlogPosts = () =>
  api.get('/blog')

export const getBlogPost = (slug) =>
  api.get(`/blog/${slug}`)

// ─── Pages API ────────────────────────────────────────────────────────────────

export const getPage = (id) =>
  api.get(`/pages/${id}`)

export const createPage = (data) =>
  api.post('/pages', data)

export const updatePage = (id, data) =>
  api.put(`/pages/${id}`, data)

// ─── Brand types ─────────────────────────────────────────────────────────────


// ─── Brand API ────────────────────────────────────────────────────────────────

export const getBrands = () =>
  api.get('/brands')

export const getBrand = (id) =>
  api.get(`/brands/${id}`)

export const createBrand = (data) => api.post('/brands', data)

export const updateBrand = (id, data) => api.patch(`/brands/${id}`, data)

export const uploadBrandLogo = (id, logo) =>
  api.post(`/brands/${id}/logo`, { logo })

export const deleteBrandLogo = (id) =>
  api.delete(`/brands/${id}/logo`)

export const deleteBrand = (id) =>
  api.delete(`/brands/${id}`)
