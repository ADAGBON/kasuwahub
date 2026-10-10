import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from './AuthLayout'

export default function Login() {
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const next = {}
    if (!/^\S+@\S+\.\S+$/.test(fd.get('email'))) next.email = 'Enter a valid email address'
    if (!fd.get('password')) next.password = 'Enter your password'
    setErrors(next)
    setStatus(Object.keys(next).length ? '' : 'Looks good! Sign-in connects to the JWT API in Phase 2.')
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to track orders and check out faster.">
      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <Field label="Email" name="email" type="email" autoComplete="email" error={errors.email} />
        <Field label="Password" name="password" type="password" autoComplete="current-password" error={errors.password} />
        <button className="btn btn-dark w-full">Sign in</button>
        {status && <p className="rounded-xl bg-sand p-3 text-sm" role="status">{status}</p>}
        <p className="text-center text-sm text-muted">
          New to KasuwaHub? <Link to="/register" className="font-semibold text-terracotta hover:underline">Create an account</Link>
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
