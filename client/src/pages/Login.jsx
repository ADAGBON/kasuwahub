import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLayout from './AuthLayout'

// only allow in-app redirects (prevents open redirects via ?next=https://evil…)
export const safeNext = (next) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/')

export default function Login() {
  const { login, user } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const next = safeNext(params.get('next'))
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user && !busy) return <Navigate to={next} replace />

  const onSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get('email')).trim()
    const password = String(fd.get('password'))
    const v = {}
    if (!/^\S+@\S+\.\S+$/.test(email)) v.email = 'Enter a valid email address'
    if (!password) v.password = 'Enter your password'
    setErrors(v)
    if (Object.keys(v).length) return
    setBusy(true)
    setError('')
    try {
      await login(email, password)
      navigate(next, { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to track orders and check out faster.">
      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <Field label="Email" name="email" type="email" autoComplete="email" error={errors.email} />
        <Field label="Password" name="password" type="password" autoComplete="current-password" error={errors.password} />
        {error && <p className="rounded-xl bg-terracotta/10 p-3 text-sm font-semibold text-terracotta" role="alert">{error}</p>}
        <button disabled={busy} className="btn btn-dark w-full disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="text-center text-sm text-muted">
          New to KasuwaHub? <Link to={`/register${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-semibold text-terracotta hover:underline">Create an account</Link>
        </p>
      </form>
    </AuthLayout>
  )
}

export function Field({ label, error, ...props }) {
  const id = `f-${props.name}`
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      <input id={id} {...props} className={`input mt-1.5 ${error ? '!border-terracotta' : ''}`} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} />
      {error && <p id={`${id}-err`} className="mt-1 text-sm text-terracotta">{error}</p>}
    </div>
  )
}
