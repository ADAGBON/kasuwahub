import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCategory, deliveryZones } from '../data/products'
import { useApi } from '../api/hooks'
import { useCart } from '../context/CartContext'
import { ErrorBox, Spinner } from '../components/Status'
import FabricArt from '../components/FabricArt'
import ProductCard from '../components/ProductCard'
import { ShieldIcon, StarIcon, StoreIcon, TruckIcon } from '../components/Icons'
import { formatNaira, unitLabel } from '../utils/format'
import NotFound from './NotFound'

export default function ProductDetail() {
  const { slug } = useParams()
  const { data, error, loading, reload } = useApi(`/products/${encodeURIComponent(slug)}`)
  if (error?.status === 404) return <NotFound />
  if (error) return <div className="container-page py-12"><ErrorBox error={error} onRetry={reload} /></div>
  if (loading || !data) return <Spinner label="Loading product…" />
  // key forces fresh state (qty, size) when navigating between products
  return <ProductView key={data.product.id} product={data.product} related={data.related} />
}

function ProductView({ product, related }) {
  const { addItem } = useCart()
  const [qty, setQty] = useState(product.minQty)
  const [size, setSize] = useState(null)
  const [error, setError] = useState('')
  const [added, setAdded] = useState(false)
  const category = getCategory(product.category)
  const [busy, setBusy] = useState(false)
  const soldOut = product.stock < product.minQty
  const qtyLabel = product.unit === 'yard' ? 'Yards' : 'Quantity'

  const handleAdd = async () => {
    if (product.sizes?.length && !size) {
      setError('Please choose a size')
      return
    }
    setBusy(true)
    try {
      await addItem(product, qty, size)
      setError('')
      setAdded(true)
      setTimeout(() => setAdded(false), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <nav className="text-sm text-muted" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-ink">Home</Link> <span aria-hidden="true">/</span>{' '}
        <Link to={`/shop?category=${category?.slug}`} className="hover:text-ink">{category?.name}</Link> <span aria-hidden="true">/</span>{' '}
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 md:grid-cols-2 lg:gap-14">
        {/* Gallery */}
        <div>
          <div className="overflow-hidden rounded-3xl bg-sand ring-1 ring-black/5">
            <FabricArt product={product} className="aspect-square w-full" />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3" aria-hidden="true">
            {[1, 1.6, 2.4, 3.4].map((zoom) => (
              <div key={zoom} className="aspect-square overflow-hidden rounded-xl ring-1 ring-black/5">
                <div style={{ transform: `scale(${zoom})` }} className="h-full w-full">
                  <FabricArt product={product} className="h-full w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-terracotta">{category?.name}</p>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-indigo-ink sm:text-4xl">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-1 font-semibold">
              <span className="flex text-mustard">{Array.from({ length: 5 }, (_, i) => <StarIcon key={i} className={i < Math.round(product.rating) ? '' : 'opacity-25'} />)}</span>
              {product.rating}
            </span>
            <span className="text-muted">{product.reviews} reviews</span>
          </div>

          <p className="mt-6">
            <span className="font-display text-4xl font-bold text-indigo-ink">{formatNaira(product.price)}</span>
            <span className="ml-2 text-muted">{unitLabel(product.unit)}</span>
          </p>
          {product.unit === 'yard' && <p className="mt-1 text-sm text-muted">Minimum order: {product.minQty} yards</p>}
          <p className={`mt-2 text-sm font-semibold ${soldOut ? 'text-terracotta' : product.stock <= 5 ? 'text-[#8a5a0f]' : 'text-palm'}`}>
            {soldOut ? 'Out of stock' : product.stock <= 5 ? `Only ${product.stock} left` : 'In stock'}
          </p>

          <p className="mt-6 leading-relaxed text-ink/80">{product.description}</p>

          {product.sizes?.length > 0 && (
            <fieldset className="mt-8">
              <legend className="text-sm font-semibold">Size {size && <span className="font-normal text-muted">— {size}</span>}</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <label key={s} className={`grid h-11 min-w-11 cursor-pointer place-items-center rounded-xl border-2 px-3 text-sm font-semibold transition ${size === s ? 'border-indigo-ink bg-indigo-ink text-white' : 'border-black/10 bg-white hover:border-indigo-ink'}`}>
                    <input type="radio" name="size" value={s} className="sr-only" checked={size === s} onChange={() => { setSize(s); setError('') }} />
                    {s}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-8 flex flex-wrap items-end gap-4">
            <div>
              <label className="text-sm font-semibold" htmlFor="qty">{qtyLabel}</label>
              <div className="mt-2 flex items-center rounded-full border-2 border-black/10 bg-white">
                <button type="button" onClick={() => setQty((q) => Math.max(product.minQty, q - 1))} className="grid h-11 w-11 place-items-center text-xl disabled:opacity-30" disabled={qty <= product.minQty} aria-label="Decrease">−</button>
                <input id="qty" type="number" min={product.minQty} value={qty} onChange={(e) => setQty(Math.max(product.minQty, Number(e.target.value) || product.minQty))} className="w-12 bg-transparent text-center font-semibold focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                <button type="button" onClick={() => setQty((q) => Math.min(product.stock, q + 1))} disabled={qty >= product.stock} className="grid h-11 w-11 place-items-center text-xl disabled:opacity-30" aria-label="Increase">+</button>
              </div>
            </div>
            <button onClick={handleAdd} disabled={busy || soldOut} className="btn btn-primary h-[52px] flex-1 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-10">
              {soldOut ? 'Sold out' : busy ? 'Adding…' : added ? 'Added to cart ✓' : `Add to cart · ${formatNaira(product.price * qty)}`}
            </button>
          </div>
          {error && <p className="mt-3 text-sm font-semibold text-terracotta" role="alert">{error}</p>}
          {added && <p className="mt-3 text-sm" role="status"><Link to="/cart" className="font-semibold text-indigo-ink underline">View cart →</Link></p>}

          <div className="mt-8 space-y-4 rounded-2xl bg-white p-5 ring-1 ring-black/5">
            <Row icon={StoreIcon} title={product.seller} text={`${product.location}, Lagos · Verified seller`} />
            <Row icon={TruckIcon} title="Delivery" text={`From ${formatNaira(Math.min(...deliveryZones.map((z) => z.fee)))} · 1–3 days within Lagos`} />
            <Row icon={ShieldIcon} title="Secure checkout" text="Pay with card, transfer or USSD via Paystack" />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl font-bold text-indigo-ink sm:text-3xl">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function Row({ icon: Icon, title, text }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sand text-terracotta"><Icon width="20" height="20" /></span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted">{text}</p>
      </div>
    </div>
  )
}
