const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

// Prevent concurrent refresh attempts: if one is in-flight, queue the rest.
let refreshPromise = null

async function tryRefresh(){
  if (refreshPromise) return refreshPromise
  refreshPromise = fetch(`${BASE_URL}/sessions/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' } })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => { refreshPromise = null })
  return refreshPromise
}

// CSRF token cache — fetched on demand, cleared on 403 to force re-fetch.
let csrfToken = null
let csrfFetchPromise = null

async function fetchCsrfToken(){
  if (csrfFetchPromise) return csrfFetchPromise
  csrfFetchPromise = fetch(`${BASE_URL}/csrf-token`, {
    method: 'GET',
    credentials: 'include' })
    .then((r) => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch CSRF token')))
    .then((data) => { csrfToken = data.csrfToken ?? data.token ?? data; return csrfToken })
    .catch(() => null)
    .finally(() => { csrfFetchPromise = null })
  return csrfFetchPromise
}

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

async function request(path, options = {}, _retry = true){
  const method = (options.method ?? 'GET').toUpperCase()
  const isMutation = MUTATION_METHODS.has(method)

  // Ensure we have a CSRF token for mutation requests.
  if (isMutation && !csrfToken) {
    await fetchCsrfToken()
  }

  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (isMutation && csrfToken) {
    headers['X-CSRF-Token'] = csrfToken
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers })

  // On 403, could be a stale/missing CSRF token — refetch and retry once.
  if (res.status === 403 && _retry && isMutation) {
    csrfToken = null
    await fetchCsrfToken()
    return request(path, options, false)
  }

  // On 401, attempt a single token refresh then replay the original request.
  if (res.status === 401 && _retry && path !== '/sessions/refresh') {
    const refreshed = await tryRefresh()
    if (refreshed) {
      return request(path, options, false)
    }
    // Refresh also failed — clear state and throw so callers can redirect to login.
    const err = await res.json().catch(() => ({ message: 'Unauthorized' }))
    throw new Error(err.message ?? 'Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message ?? 'API error')
  }
  return res.json()
}

export const api = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) =>
    request(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body) =>
    request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }) }
