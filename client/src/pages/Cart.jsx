import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { deliveryZones, getProduct } from '../data/products'
import FabricArt from '../components/FabricArt'
import { TrashIcon, ArrowIcon } from '../components/Icons'
import { formatNaira } from '../utils/format'

export default function Cart() {
  const { items, updateQty, removeItem } = useCart()
  const [zone, setZone] = useState('mainland')
  const [notice, setNotice] = useState('')

  const lines = items.map((i) => ({ ...i, product: getProduct(i.id) })).filter((l) => l.product)
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0)
  const delivery = deliveryZones.find((z) => z.id === zone)?.fee ?? 0

  if (!lines.length) {
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

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="font-display text-3xl font-bold text-indigo-ink sm:text-4xl">Your cart</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-black/5 rounded-3xl bg-white px-4 ring-1 ring-black/5 sm:px-6">
          {lines.map(({ key, product, qty, size }) => (
            <li key={key} className="flex gap-4 py-5">
              <Link to={`/product/${product.id}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl sm:h-28 sm:w-28">
                <FabricArt product={product} className="h-full w-full" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/product/${product.id}`} className="font-semibold hover:underline">{product.name}</Link>
                    <p className="text-sm text-muted">
                      {product.seller}{size && <> · Size <strong className="text-ink">{size}</strong></>}
                    </p>
                  </div>
                  <p className="shrink-0 font-bold text-indigo-ink">{formatNaira(product.price * qty)}</p>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-full border border-black/10">
                    <button onClick={() => updateQty(key, Math.max(product.minQty, qty - 1))} disabled={qty <= product.minQty} className="grid h-9 w-9 place-items-center disabled:opacity-30" aria-label={`Decrease ${product.name}`}>−</button>
                    <span className="w-14 text-center text-sm font-semibold">{qty}{product.unit === 'yard' ? ' yd' : ''}</span>
                    <button onClick={() => updateQty(key, qty + 1)} className="grid h-9 w-9 place-items-center" aria-label={`Increase ${product.name}`}>+</button>
                  </div>
                  <button onClick={() => removeItem(key)} className="flex items-center gap-1 text-sm text-muted hover:text-terracotta">
                    <TrashIcon /> <span className="hidden sm:inline">Remove</span>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-3xl bg-white p-6 ring-1 ring-black/5 lg:sticky lg:top-28">
          <h2 className="font-display text-xl font-bold text-indigo-ink">Order summary</h2>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold">Delivery zone</legend>
            <div className="mt-2 space-y-2">
              {deliveryZones.map((z) => (
                <label key={z.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 text-sm ${zone === z.id ? 'border-indigo-ink bg-sand/50' : 'border-black/5'}`}>
                  <input type="radio" name="zone" checked={zone === z.id} onChange={() => setZone(z.id)} className="mt-0.5 accent-indigo-ink" />
                  <span className="flex-1">
                    <span className="block font-semibold">{z.name}</span>
                    <span className="text-xs text-muted">{z.areas}</span>
                  </span>
                  <span className="font-semibold">{formatNaira(z.fee)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <dl className="mt-6 space-y-2 border-t border-black/5 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-semibold">{formatNaira(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="font-semibold">{formatNaira(delivery)}</dd></div>
            <div className="flex justify-between border-t border-black/5 pt-3 text-lg"><dt className="font-bold">Total</dt><dd className="font-display font-bold text-indigo-ink">{formatNaira(subtotal + delivery)}</dd></div>
          </dl>

          <button onClick={() => setNotice('Paystack checkout is connected in Phase 2 (back end).')} className="btn btn-primary mt-6 w-full">
            Checkout with Paystack
          </button>
          {notice && <p className="mt-3 text-center text-xs text-muted" role="status">{notice}</p>}
          <Link to="/shop" className="mt-3 block text-center text-sm font-semibold text-indigo-ink hover:underline">Continue shopping</Link>
        </aside>
      </div>
    </div>
  )
}
