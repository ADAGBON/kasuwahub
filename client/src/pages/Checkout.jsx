import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useApi } from '../api/hooks'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { deliveryZones as fallbackZones } from '../data/products'
import FabricArt from '../components/FabricArt'
import { ErrorBox, Spinner } from '../components/Status'
import { ShieldIcon } from '../components/Icons'
import { Field } from './Login'
import { formatNaira } from '../utils/format'

// Sends the browser to Paystack (or the demo payment page when Paystack isn't configured)
export function goToPayment(payment, navigate) {
  if (payment.demo) navigate(`/checkout/demo?reference=${encodeURIComponent(payment.reference)}`)
  else window.location.assign(payment.authorizationUrl)
}

export default function Checkout() {
  const { user } = useAuth()
  const { items, subtotal, refresh, syncing } = useCart()
  const { data: config } = useApi('/config')
  const zones = config?.deliveryZones ?? fallbackZones
  const navigate = useNavigate()
  const [zone, setZone] = useState('mainland')
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { if (!syncing) refresh() }, [refresh, syncing]) // make sure prices/stock are current

  if (syncing) return <Spinner label="Loading your cart…" />
  if (!items.length && !submitting) return <Navigate to="/cart" replace />

  const fee = zones.find((z) => z.id === zone)?.fee ?? 0

  const onSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const address = Object.fromEntries(['fullName', 'phone', 'address', 'area', 'notes'].map((k) => [k, String(fd.get(k) ?? '').trim()]))
    const next = {}
    if (!address.fullName) next.fullName = 'Enter the recipient’s name'
    if (!/^(\+?234|0)[789][01]\d{8}$/.test(address.phone.replace(/\s/g, ''))) next.phone = 'Enter a Nigerian number, e.g. 0803 123 4567'
    if (address.address.length < 5) next.address = 'Enter a street address'
    if (!address.area) next.area = 'Enter the area or LGA'
    setErrors(next)
    if (Object.keys(next).length) return

    setSubmitting(true)
    setError('')
    try {
      const { payment } = await api('/orders', { method: 'POST', body: { deliveryZone: zone, shippingAddress: address } })
      goToPayment(payment, navigate)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <nav className="text-sm text-muted" aria-label="Breadcrumb">
        <Link to="/cart" className="hover:text-ink">Cart</Link> <span aria-hidden="true">/</span> <span className="text-ink">Checkout</span>
      </nav>
      <h1 className="mt-3 font-display text-3xl font-bold text-indigo-ink sm:text-4xl">Checkout</h1>

      <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          <section className="rounded-3xl bg-white p-6 ring-1 ring-black/5">
            <h2 className="font-display text-xl font-bold text-indigo-ink">Delivery details</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Full name" name="fullName" defaultValue={user?.name} autoComplete="name" error={errors.fullName} />
              <Field label="Phone number" name="phone" type="tel" defaultValue={user?.phone} autoComplete="tel" placeholder="0803 123 4567" error={errors.phone} />
              <div className="sm:col-span-2"><Field label="Street address" name="address" autoComplete="street-address" placeholder="12 Herbert Macaulay Way" error={errors.address} /></div>
              <Field label="Area / LGA" name="area" placeholder="Yaba" error={errors.area} />
              <Field label="Delivery notes (optional)" name="notes" placeholder="Landmark, gate code…" />
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 ring-1 ring-black/5">
            <h2 className="font-display text-xl font-bold text-indigo-ink">Delivery zone</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {zones.map((z) => (
                <label key={z.id} className={`flex cursor-pointer flex-col rounded-2xl border-2 p-4 text-sm transition ${zone === z.id ? 'border-indigo-ink bg-sand/50' : 'border-black/5 hover:border-black/20'}`}>
                  <input type="radio" name="zone" value={z.id} checked={zone === z.id} onChange={() => setZone(z.id)} className="sr-only" />
                  <span className="font-semibold">{z.name}</span>
                  <span className="text-xs text-muted">{z.areas}</span>
                  <span className="mt-2 font-display text-lg font-bold text-indigo-ink">{formatNaira(z.fee)}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-3xl bg-white p-6 ring-1 ring-black/5 lg:sticky lg:top-28">
          <h2 className="font-display text-xl font-bold text-indigo-ink">Your order</h2>
          <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto">
            {items.map(({ key, product, qty, size }) => (
              <li key={key} className="flex items-center gap-3 text-sm">
                <FabricArt product={product} className="h-12 w-12 shrink-0 rounded-xl" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{product.name}</span>
                  <span className="text-xs text-muted">{qty}{product.unit === 'yard' ? ' yd' : ' ×'}{size && ` · ${size}`}</span>
                </span>
                <span className="font-semibold">{formatNaira(product.price * qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-black/5 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-semibold">{formatNaira(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="font-semibold">{formatNaira(fee)}</dd></div>
            <div className="flex justify-between border-t border-black/5 pt-3 text-lg"><dt className="font-bold">Total</dt><dd className="font-display font-bold text-indigo-ink">{formatNaira(subtotal + fee)}</dd></div>
          </dl>
          {error && <p className="mt-4 rounded-xl bg-terracotta/10 p-3 text-sm font-semibold text-terracotta" role="alert">{error}</p>}
          <button disabled={submitting} className="btn btn-primary mt-6 w-full disabled:opacity-60">
            {submitting ? 'Placing order…' : `Pay ${formatNaira(subtotal + fee)}`}
          </button>
          <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted"><ShieldIcon width="16" height="16" /> Secured by Paystack · card, transfer, USSD</p>
          {config && !config.paystack && <p className="mt-2 text-center text-xs text-muted">Demo mode: Paystack keys not set, payment will be simulated.</p>}
        </aside>
      </form>
    </div>
  )
}

// /checkout/demo?reference=… — stands in for Paystack when no keys are configured
export function CheckoutDemo() {
  const [params] = useSearchParams()
  const reference = params.get('reference')
  const navigate = useNavigate()
  const { refresh } = useCart()
  const [state, setState] = useState({ busy: false, error: '' })

  const pay = async () => {
    setState({ busy: true, error: '' })
    try {
      const { order } = await api(`/payments/demo/${encodeURIComponent(reference)}/complete`, { method: 'POST' })
      await refresh()
      navigate(`/orders/${order.id}?paid=1`, { replace: true })
    } catch (err) {
      setState({ busy: false, error: err.message })
    }
  }

  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-black/5">
        <p className="inline-block rounded-full bg-mustard/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#8a5a0f]">Test payment</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-indigo-ink">Simulated Paystack checkout</h1>
        <p className="mt-2 text-sm text-muted">Paystack keys aren’t configured on the server, so this page simulates a successful payment. No money moves.</p>
        <p className="mt-4 break-all rounded-xl bg-sand/60 p-3 font-mono text-xs">{reference}</p>
        {state.error && <p className="mt-4 text-sm font-semibold text-terracotta" role="alert">{state.error}</p>}
        <button onClick={pay} disabled={state.busy} className="btn btn-primary mt-6 w-full">{state.busy ? 'Processing…' : 'Complete test payment'}</button>
        <Link to="/orders" className="mt-3 block text-sm font-semibold text-indigo-ink hover:underline">Pay later</Link>
      </div>
    </div>
  )
}

// /checkout/complete?reference=… — Paystack redirects here after payment
export function CheckoutComplete() {
  const [params] = useSearchParams()
  const reference = params.get('reference') || params.get('trxref')
  const navigate = useNavigate()
  const { refresh } = useCart()
  const [error, setError] = useState(null)
  const once = useRef(false)

  useEffect(() => {
    if (once.current || !reference) return
    once.current = true
    api(`/payments/verify/${encodeURIComponent(reference)}`)
      .then(async ({ order, paid }) => {
        await refresh()
        navigate(`/orders/${order.id}${paid ? '?paid=1' : ''}`, { replace: true })
      })
      .catch(setError)
  }, [reference, navigate, refresh])

  if (!reference) return <Navigate to="/orders" replace />
  if (error) return <div className="container-page py-12"><ErrorBox error={error} /></div>
  return <Spinner label="Confirming your payment…" />
}
