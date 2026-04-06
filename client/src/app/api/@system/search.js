// @system — Search API calls
// Wraps the SearchAdapter API endpoints exposed by the server.
// Do not modify this file. Add product-specific search calls in @custom/

import { apiRequest } from './utils'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SearchHit {
  id | number
  [key]: unknown
}

export interface SearchResult<T = SearchHit> {
  ok
  provider
  hits: T[]
  total
  page
  totalPages
  processingTimeMs?
}

export interface SearchParams {
  /** Index / collection name to search */
  index
  /** Search query string */
  q
  /** Provider-specific filter expression */
  filters?
  /** Sort rules, e.g. 'price:asc,name:desc' (comma-separated) */
  sort?
  /** Max results per page (default 20, max 100) */
  limit?
  /** Pagination offset (default 0) */
  offset?
  /** Comma-separated list of fields to retrieve */
  fields?
}

export interface IndexDocument {
  index
  id | number
  document: Record<string, unknown>
}

export interface BulkIndexDocuments {
  index
  documents: Array<Record<string, unknown>>
}

export interface CreateIndexOptions {
  uid
  primaryKey?
  searchableAttributes?[]
  attributesForFaceting?[]
}

export interface SearchHealthInfo {
  ok
  provider
  configured
  [key]: unknown
}

// ─── Search ──────────────────────────────────────────────────────────────────

export const search = <T = SearchHit>(params: SearchParams) => {
  const qs = new URLSearchParams()
  qs.set('index', params.index)
  qs.set('q', params.q)
  if (params.filters) qs.set('filters', params.filters)
  if (params.sort)    qs.set('sort', params.sort)
  if (params.limit !== undefined)  qs.set('limit', String(params.limit))
  if (params.offset !== undefined) qs.set('offset', String(params.offset))
  if (params.fields)  qs.set('fields', params.fields)

  return apiRequest.get<SearchResult>(`/search?${qs.toString()}`)
}

// ─── Indexing (admin) ─────────────────────────────────────────────────────────

export const indexDocument = (data: IndexDocument) =>
  apiRequest.post('/search/index', data)

export const indexDocuments = (data: BulkIndexDocuments) =>
  apiRequest.post('/search/index/bulk', data)

export const createIndex = (data: CreateIndexOptions) =>
  apiRequest.post('/search/indexes', data)

// ─── Deletion (admin) ─────────────────────────────────────────────────────────

export const deleteDocument = (indexName, id | number) =>
  apiRequest.delete(`/search/index/${encodeURIComponent(indexName)}/${encodeURIComponent(String(id))}`)

export const deleteIndex = (indexName) =>
  apiRequest.delete(`/search/indexes/${encodeURIComponent(indexName)}`)

// ─── Health (admin) ───────────────────────────────────────────────────────────

export const getSearchHealth = () =>
  apiRequest.get('/search/health')

export const getSearchHealthAll = () =>
  apiRequest.get<{ ok; adapters: Record<string, SearchHealthInfo> }>('/search/health/all')
