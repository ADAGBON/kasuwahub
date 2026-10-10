import { useEffect, useState } from 'react'
import { api } from './client'

// Generic GET hook: re-fetches when `path` or `params` change, cancels stale requests
export function useApi(path, params) {
  const key = path ? path + JSON.stringify(params ?? {}) : null
  const [state, setState] = useState({ data: null, error: null, loading: Boolean(path) })

  useEffect(() => {
    if (!path) return undefined
    const ctrl = new AbortController()
    setState((s) => ({ ...s, loading: true, error: null }))
    api(path, { params, signal: ctrl.signal })
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => { if (error.name !== 'AbortError') setState({ data: null, error, loading: false }) })
    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const reload = () => api(path, { params }).then((data) => setState({ data, error: null, loading: false }))
  return { ...state, reload }
}
