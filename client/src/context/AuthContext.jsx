import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, tokenStore } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(!tokenStore.get())

  // restore session on page load
  useEffect(() => {
    if (!tokenStore.get()) return
    api('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => tokenStore.set(null))
      .finally(() => setReady(true))
  }, [])

  const logout = useCallback(() => { tokenStore.set(null); setUser(null) }, [])

  // any 401 from the API (expired token) signs the user out
  useEffect(() => {
    window.addEventListener('kasuwahub:unauthorized', logout)
    return () => window.removeEventListener('kasuwahub:unauthorized', logout)
  }, [logout])

  const handleAuth = ({ token, user }) => { tokenStore.set(token); setUser(user); return user }
  const login = useCallback((email, password) => api('/auth/login', { method: 'POST', body: { email, password } }).then(handleAuth), [])
  const register = useCallback((data) => api('/auth/register', { method: 'POST', body: data }).then(handleAuth), [])

  const value = useMemo(() => ({ user, ready, isAdmin: user?.role === 'admin', login, register, logout }), [user, ready, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
