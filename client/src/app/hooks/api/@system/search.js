const BASE_URL = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || '/api'

export interface SearchHit {
  id | number
  [key]: unknown
}

export interface SearchResult<T = SearchHit> {
  hits: T[]
  total
  page
  totalPages
  processingTimeMs?
  provider
}

interface SearchResponse {
  status
  message?
  data?: SearchResult
}

export async function search<T = SearchHit>(params: {
  index
  q
  filters?
  sort?
  limit?
  offset?
  fields?
}): Promise<SearchResponse> {
  const qs = new URLSearchParams()
  qs.set('q', params.q)
  if (params.filters) qs.set('filters', params.filters)
  if (params.sort) qs.set('sort', params.sort)
  if (params.limit != null) qs.set('limit', String(params.limit))
  if (params.offset != null) qs.set('offset', String(params.offset))
  if (params.fields) qs.set('fields', params.fields)

  try {
    const res = await fetch(`${BASE_URL}/search/${params.index}?${qs.toString()}`, {
      credentials: 'include',
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      return { status: res.status, message: err.message ?? 'Search failed' }
    }
    const data = (await res.json()) as SearchResult
    return { status: 200, data }
  } catch (err) {
    return { status: 500, message: err instanceof Error ? err.message : 'Search failed' }
  }
}
