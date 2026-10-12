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

// Render's free plan sleeps when idle; the first request can take ~50s while it wakes.
// We broadcast how many requests are "slow" so the UI can show a friendly notice.
let slowCount = 0
const announceSlow = (delta) => {
  slowCount = Math.max(0, slowCount + delta)
  window.dispatchEvent(new CustomEvent('kasuwahub:slow', { detail: slowCount > 0 }))
}

export async function api(path, opts = {}) {
  let slow = false
  const timer = setTimeout(() => { slow = true; announceSlow(1) }, 4000)
  try {
    return await request(path, opts)
  } finally {
    clearTimeout(timer)
    if (slow) announceSlow(-1)
  }
}

async function request(path, { method = 'GET', body, params, signal } = {}) {
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
    throw new ApiError(0, 'Cannot reach the KasuwaHub server. If it was asleep it can take up to a minute to start — please try again shortly.')
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event('kasuwahub:unauthorized'))
    throw new ApiError(res.status, data?.message || `Request failed (${res.status})`, data?.details)
  }
  return data
}
