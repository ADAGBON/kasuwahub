// Thin fetch wrapper for the KasuwaHub API.
// Dev: Vite proxies /api → http://localhost:5000. Prod: set VITE_API_URL to the Render URL + /api.
const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
const TOKEN_KEY = 'kasuwahub_token'

export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } },
  set: (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ } },
}

export class ApiError extends Error {
  constructor(status, message, details) { super(message); this.status = status; this.details = details }
}

export async function api(path, { method = 'GET', body, params, signal } = {}) {
  const url = new URL(BASE + path, window.location.origin)
  if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && v !== null && v !== '' && url.searchParams.set(k, v))

  const headers = {}
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined && !(body instanceof FormData)) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(url, { method, headers, signal, body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError(0, 'Cannot reach the KasuwaHub server. Is the API running?')
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event('kasuwahub:unauthorized'))
    throw new ApiError(res.status, data?.message || `Request failed (${res.status})`, data?.details)
  }
  return data
}
