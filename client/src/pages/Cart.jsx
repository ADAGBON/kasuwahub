import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import FabricArt from '../components/FabricArt'
import { TrashIcon, ArrowIcon } from '../components/Icons'
import { formatNaira } from '../utils/format'
import { Spinner } from '../components/Status'

export default function Cart() {
  const { items, updateQty, removeItem, subtotal, syncNote, clearSyncNote, syncing } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busyKey, setBusyKey] = useState(null)

  const run = async (key, fn) => {
    setBusyKey(key)
    setError('')
    try { await fn() } catch (err) { setError(err.message) } finally { setBusyKey(null) }
  }

  if (syncing) return <Spinner label="Loading your cart…" />
  if (!items.length) {
    return (
      <div className="container-page py-20 text-center">
        <svg viewBox="0 0 120 120" className="mx-auto h-28 w-28" aria-hidden="true">
          <circle cx="60" cy="60" r="56" fill="#f1e7d6" />
          <path d="M34 42h8l8 34h28l7-24H46" fill="none" stroke="#1f2a5c" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="54" cy="86" r="4" fill="#d4572a" /><circle cx="74" cy="86" r="4" fill="#d4572a" />
        </svg>
        <h1 className="mt-6 font-display text-3xl font-bold text-indigo-ink">Your cart is empty</h1>
        <p className="mt-2 text-muted">Find something beautiful from Lagos’ best sellers.</p>
        <Link to="/shop" className="btn btn-primary mt-8">Start shopping <ArrowIcon /></Link>
      </div>
    )
  }

  const unavailable = items.some((i) => i.available === false)

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="font-display text-3xl font-bold text-indigo-ink sm:text-4xl">Your cart</h1>
      {syncNote && (
        <p className="mt-4 flex items-start justify-between gap-3 rounded-xl bg-mustard/15 p-3 text-sm" role="status">
          {syncNote} <button onClick={clearSyncNote} className="font-semibold">Dismiss</button>
        </p>
      )}
      {error && <p className="mt-4 rounded-xl bg-terracotta/10 p-3 text-sm font-semibold text-terracotta" role="alert">{error}</p>}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-black/5 rounded-3xl bg-white px-4 ring-1 ring-black/5 sm:px-6">
          {items.map(({ key, product, qty, size, available }) => (
            <li key={key} className={`flex gap-4 py-5 ${busyKey === key ? 'opacity-60' : ''}`}>
              <Link to={`/product/${product.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl sm:h-28 sm:w-28">
                <FabricArt product={product} className="h-full w-full" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/product/${product.slug}`} className="font-semibold hover:underline">{product.name}</Link>
                    <p className="text-sm text-muted">
                      {formatNaira(product.price)} · {product.seller}{size && <> · Size <strong className="text-ink">{size}</strong></>}
                    </p>
                    {available === false && <p className="mt-1 text-xs font-semibold text-terracotta">Not enough stock — reduce quantity or remove</p>}
                  </div>
                  <p className="shrink-0 font-bold text-indigo-ink">{formatNaira(product.price * qty)}</p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-full border border-black/10">
                    <button onClick={() => run(key, () => updateQty(key, qty - 1))} disabled={qty <= product.minQty || busyKey === key} className="grid h-9 w-9 place-items-center disabled:opacity-30" aria-label={`Decrease ${product.name}`}>−</button>
                    <span className="w-14 text-center text-sm font-semibold">{qty}{product.unit === 'yard' ? ' yd' : ''}</span>
                    <button onClick={() => run(key, () => updateQty(key, qty + 1))} disabled={qty >= product.stock || busyKey === key} className="grid h-9 w-9 place-items-center disabled:opacity-30" aria-label={`Increase ${product.name}`}>+</button>
                  </div>
                  <button onClick={() => run(key, () => removeItem(key))} className="flex items-center gap-1 text-sm text-muted hover:text-terracotta">
                    <TrashIcon /> <span className="hidden sm:inline">Remove</span>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-3xl bg-white p-6 ring-1 ring-black/5 lg:sticky lg:top-28">
          <h2 className="font-display text-xl font-bold text-indigo-ink">Order summary</h2>
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-semibold">{formatNaira(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="text-muted">Chosen at checkout</dd></div>
          </dl>
          <p className="mt-4 rounded-xl bg-sand/60 p-3 text-xs text-muted">Delivery: Mainland ₦2,500 · Island ₦3,500 · Outskirts ₦5,000</p>
          <button
            onClick={() => navigate(user ? '/checkout' : '/login?next=/checkout')}
            disabled={unavailable}
            className="btn btn-primary mt-6 w-full disabled:opacity-50"
          >
            {user ? 'Proceed to checkout' : 'Sign in to check out'} <ArrowIcon />
          </button>
          <Link to="/shop" className="mt-3 block text-center text-sm font-semibold text-indigo-ink hover:underline">Continue shopping</Link>
        </aside>
      </div>
    </div>
  )
}
