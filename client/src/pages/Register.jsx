import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from './AuthLayout'
import { Field } from './Login'

export default function Register() {
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const next = {}
    if (!fd.get('name')?.trim()) next.name = 'Enter your full name'
    if (!/^\S+@\S+\.\S+$/.test(fd.get('email'))) next.email = 'Enter a valid email address'
    if (!/^(\+?234|0)[789][01]\d{8}$/.test(fd.get('phone')?.replace(/\s/g, ''))) next.phone = 'Enter a Nigerian number, e.g. 0803 123 4567'
    if ((fd.get('password') ?? '').length < 8) next.password = 'Use at least 8 characters'
    setErrors(next)
    setStatus(Object.keys(next).length ? '' : 'Looks good! Registration connects to the API in Phase 2.')
  }

  return (
    <AuthLayout title="Create your account" subtitle="Shop from Lagos sellers and track every order.">
      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <Field label="Full name" name="name" autoComplete="name" error={errors.name} />
        <Field label="Email" name="email" type="email" autoComplete="email" error={errors.email} />
        <Field label="Phone number" name="phone" type="tel" autoComplete="tel" placeholder="0803 123 4567" error={errors.phone} />
        <Field label="Password" name="password" type="password" autoComplete="new-password" error={errors.password} />
        <button className="btn btn-primary w-full">Create account</button>
        {status && <p className="rounded-xl bg-sand p-3 text-sm" role="status">{status}</p>}
        <p className="text-center text-sm text-muted">
          Already have an account? <Link to="/login" className="font-semibold text-terracotta hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
