import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLayout from './AuthLayout'
import { Field, safeNext } from './Login'

export default function Register() {
  const { register, user } = useAuth()
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
    const data = Object.fromEntries(['name', 'email', 'phone', 'password'].map((k) => [k, String(fd.get(k) ?? '').trim()]))
    data.phone = data.phone.replace(/\s/g, '')
    const v = {}
    if (!data.name) v.name = 'Enter your full name'
    if (!/^\S+@\S+\.\S+$/.test(data.email)) v.email = 'Enter a valid email address'
    if (data.phone && !/^(\+?234|0)[789][01]\d{8}$/.test(data.phone)) v.phone = 'Enter a Nigerian number, e.g. 0803 123 4567'
    if (data.password.length < 8) v.password = 'Use at least 8 characters'
    setErrors(v)
    if (Object.keys(v).length) return
    if (!data.phone) delete data.phone
    setBusy(true)
    setError('')
    try {
      await register(data)
      navigate(next, { replace: true })
    } catch (err) {
      setError(err.message)
      setErrors(err.details ?? {})
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Shop from Lagos sellers and track every order.">
      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <Field label="Full name" name="name" autoComplete="name" error={errors.name} />
        <Field label="Email" name="email" type="email" autoComplete="email" error={errors.email} />
        <Field label="Phone number (optional)" name="phone" type="tel" autoComplete="tel" placeholder="0803 123 4567" error={errors.phone} />
        <Field label="Password" name="password" type="password" autoComplete="new-password" error={errors.password} />
        {error && <p className="rounded-xl bg-terracotta/10 p-3 text-sm font-semibold text-terracotta" role="alert">{error}</p>}
        <button disabled={busy} className="btn btn-primary w-full disabled:opacity-60">{busy ? 'Creating account…' : 'Create account'}</button>
        <p className="text-center text-sm text-muted">
          Already have an account? <Link to={`/login${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-semibold text-terracotta hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
