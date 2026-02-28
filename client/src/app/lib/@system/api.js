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

async function request(path, options, _retry = true){
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options })

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
  patch: (path, body) =>
    request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }) }
