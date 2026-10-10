import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useApi } from '../api/hooks'
import { categories, getCategory } from '../data/products'
import FabricArt from '../components/FabricArt'
import { ErrorBox, Spinner, StatusBadge } from '../components/Status'
import { CloseIcon } from '../components/Icons'
import { formatNaira } from '../utils/format'
import { formatDate } from './Orders'

const NEXT = { pending: ['cancelled'], paid: ['processing', 'cancelled'], processing: ['shipped', 'cancelled'], shipped: ['delivered'], delivered: [], cancelled: [] }
const PATTERNS = ['circles', 'diamonds', 'waves', 'stripes', 'lace', 'adire', 'beads', 'plain']

export default function Admin() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'orders' ? 'orders' : 'products'
  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="font-display text-3xl font-bold text-indigo-ink sm:text-4xl">Admin dashboard</h1>
      <div className="mt-6 inline-flex rounded-full bg-white p-1 ring-1 ring-black/5" role="tablist">
        {['products', 'orders'].map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setParams({ tab: t })}
            className={`rounded-full px-5 py-2 text-sm font-semibold capitalize ${tab === t ? 'bg-indigo-ink text-white' : 'text-muted hover:text-ink'}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="mt-8">{tab === 'products' ? <ProductsAdmin /> : <OrdersAdmin />}</div>
    </div>
  )
}

/* ---------------- Products ---------------- */

function ProductsAdmin() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const { data, error, loading, reload } = useApi('/products', { q, page, limit: 20, sort: 'newest', includeInactive: 'true' })
  const [editing, setEditing] = useState(null) // null | {} (new) | product
  const [msg, setMsg] = useState('')

  const remove = async (p) => {
    if (!window.confirm(`Delete “${p.name}”? This cannot be undone.`)) return
    try {
      await api(`/products/${p.id}`, { method: 'DELETE' })
      setMsg(`Deleted ${p.name}`)
      reload()
    } catch (err) { setMsg(err.message) }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Search products…" className="input max-w-xs py-2" aria-label="Search products" />
        <span className="text-sm text-muted">{data ? `${data.total} products` : ''}</span>
        <button onClick={() => setEditing({})} className="btn btn-primary ml-auto py-2.5">+ Add product</button>
      </div>
      {msg && <p className="mt-4 rounded-xl bg-sand p-3 text-sm" role="status">{msg}</p>}

      <div className="mt-6 overflow-x-auto rounded-3xl bg-white ring-1 ring-black/5">
        {error ? <ErrorBox error={error} onRetry={reload} /> : loading && !data ? <Spinner /> : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-black/5 text-xs uppercase tracking-wider text-muted">
              <tr><th className="p-4">Product</th><th className="p-4">Category</th><th className="p-4">Price</th><th className="p-4">Stock</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {data.items.map((p) => (
                <tr key={p.id} className={p.isActive ? '' : 'opacity-60'}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <FabricArt product={p} className="h-11 w-11 shrink-0 rounded-xl" />
                      <div className="min-w-0">
                        <Link to={`/product/${p.slug}`} className="font-semibold hover:underline">{p.name}</Link>
                        <p className="truncate text-xs text-muted">{p.seller}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">{getCategory(p.category)?.name}</td>
                  <td className="p-4 font-semibold">{formatNaira(p.price)}<span className="text-xs font-normal text-muted"> /{p.unit}</span></td>
                  <td className={`p-4 font-semibold ${p.stock <= 5 ? 'text-terracotta' : ''}`}>{p.stock}</td>
                  <td className="p-4">{p.isActive ? <span className="text-palm">Live</span> : <span className="text-muted">Hidden</span>}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => setEditing(p)} className="rounded-full px-3 py-1.5 font-semibold text-indigo-ink hover:bg-sand">Edit</button>
                    <button onClick={() => remove(p)} className="rounded-full px-3 py-1.5 font-semibold text-terracotta hover:bg-terracotta/10">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {data?.pages > 1 && (
        <div className="mt-4 flex justify-center gap-2 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-full bg-white px-4 py-2 font-semibold ring-1 ring-black/5 disabled:opacity-40">← Prev</button>
          <span className="px-3 py-2 text-muted">Page {page} of {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="rounded-full bg-white px-4 py-2 font-semibold ring-1 ring-black/5 disabled:opacity-40">Next →</button>
        </div>
      )}

      {editing && (
        <ProductForm
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={(p, isNew) => { setEditing(null); setMsg(`${isNew ? 'Added' : 'Updated'} ${p.name}`); reload() }}
        />
      )}
    </>
  )
}

function ProductForm({ product, onClose, onSaved }) {
  const isNew = !product.id
  const [form, setForm] = useState({
    name: product.name ?? '', description: product.description ?? '', category: product.category ?? 'ankara',
    price: product.price ?? '', unit: product.unit ?? 'yard', minQty: product.minQty ?? 1, stock: product.stock ?? 0,
    sizes: product.sizes?.join(', ') ?? '', seller: product.seller ?? '', location: product.location ?? '',
    badge: product.badge ?? '', pattern: product.pattern ?? 'circles', palette: product.palette ?? ['#d4572a', '#e8a33d', '#1f2a5c'],
    garment: product.garment ?? '', isActive: product.isActive ?? true, imageUrl: product.images?.[0]?.url ?? '',
  })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const upload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('image', file)
      const { url } = await api('/uploads', { method: 'POST', body: fd })
      setForm((f) => ({ ...f, imageUrl: url }))
    } catch (err) { setError(err.message) } finally { setUploading(false) }
  }

  const submit = async (e) => {
    e.preventDefault()
    const body = {
      ...form,
      price: Number(form.price), minQty: Number(form.minQty), stock: Number(form.stock),
      sizes: form.sizes.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean),
      garment: form.garment || undefined,
      images: form.imageUrl ? [{ url: form.imageUrl }] : [],
    }
    delete body.imageUrl
    setSaving(true)
    setError('')
    setErrors({})
    try {
      const { product: saved } = await api(isNew ? '/products' : `/products/${product.id}`, { method: isNew ? 'POST' : 'PATCH', body })
      onSaved(saved, isNew)
    } catch (err) {
      setError(err.message)
      setErrors(err.details ?? {})
      setSaving(false)
    }
  }

  const preview = { ...form, name: form.name || 'Preview', images: form.imageUrl ? [{ url: form.imageUrl }] : [] }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={isNew ? 'Add product' : 'Edit product'}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form onSubmit={submit} noValidate className="relative flex h-full w-full max-w-xl flex-col bg-cream shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/5 px-6 py-4">
          <h2 className="font-display text-2xl font-bold text-indigo-ink">{isNew ? 'Add product' : 'Edit product'}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-sand" aria-label="Close"><CloseIcon /></button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div className="flex gap-4">
            <FabricArt product={preview} className="h-24 w-24 shrink-0 rounded-2xl" />
            <div className="flex-1 space-y-2 text-sm">
              <label className="font-semibold" htmlFor="pf-image">Photo URL</label>
              <input id="pf-image" className="input py-2" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://… (optional)" />
              <label className="inline-flex cursor-pointer items-center gap-2 font-semibold text-indigo-ink">
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={upload} />
                {uploading ? 'Uploading…' : '↑ Upload to Cloudinary'}
              </label>
            </div>
          </div>

          <F label="Name" error={errors.name}><input className="input" value={form.name} onChange={set('name')} required /></F>
          <F label="Description" error={errors.description}><textarea className="input min-h-24" value={form.description} onChange={set('description')} required /></F>

          <div className="grid gap-4 sm:grid-cols-2">
            <F label="Category" error={errors.category}>
              <select className="input" value={form.category} onChange={set('category')}>
                {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </F>
            <F label="Sold per">
              <select className="input" value={form.unit} onChange={set('unit')}>
                <option value="yard">Yard</option><option value="piece">Piece</option><option value="set">Set</option>
              </select>
            </F>
            <F label="Price (₦)" error={errors.price}><input className="input" type="number" min="1" value={form.price} onChange={set('price')} /></F>
            <F label="Stock" error={errors.stock}><input className="input" type="number" min="0" value={form.stock} onChange={set('stock')} /></F>
            <F label="Minimum order"><input className="input" type="number" min="1" value={form.minQty} onChange={set('minQty')} /></F>
            <F label="Sizes (comma separated)"><input className="input" value={form.sizes} onChange={set('sizes')} placeholder="S, M, L, XL" /></F>
            <F label="Seller" error={errors.seller}><input className="input" value={form.seller} onChange={set('seller')} /></F>
            <F label="Location"><input className="input" value={form.location} onChange={set('location')} placeholder="Balogun Market" /></F>
            <F label="Badge"><input className="input" value={form.badge} onChange={set('badge')} placeholder="New, Bestseller…" /></F>
            <F label="Artwork pattern">
              <select className="input" value={form.pattern} onChange={set('pattern')}>{PATTERNS.map((p) => <option key={p}>{p}</option>)}</select>
            </F>
            <F label="Garment shape">
              <select className="input" value={form.garment} onChange={set('garment')}>
                <option value="">None (fabric)</option><option value="kaftan">Kaftan / top</option><option value="dress">Dress / gown</option>
              </select>
            </F>
            <F label="Artwork colours">
              <div className="flex gap-2">
                {form.palette.map((c, i) => (
                  <input key={i} type="color" value={c} aria-label={`Colour ${i + 1}`} className="h-11 w-full cursor-pointer rounded-xl border border-black/10 bg-white"
                    onChange={(e) => setForm((f) => ({ ...f, palette: f.palette.map((x, j) => (j === i ? e.target.value : x)) }))} />
                ))}
              </div>
            </F>
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input type="checkbox" checked={form.isActive} onChange={set('isActive')} className="h-4 w-4 accent-indigo-ink" /> Visible in the shop
          </label>
        </div>

        <div className="border-t border-black/5 p-6">
          {error && <p className="mb-3 text-sm font-semibold text-terracotta" role="alert">{error}</p>}
          <button disabled={saving || uploading} className="btn btn-primary w-full disabled:opacity-60">{saving ? 'Saving…' : isNew ? 'Add product' : 'Save changes'}</button>
        </div>
      </form>
    </div>
  )
}

function F({ label, error, children }) {
  return (
    <label className="block text-sm">
      <span className="font-semibold">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error && <span className="mt-1 block text-terracotta">{error}</span>}
    </label>
  )
}

/* ---------------- Orders ---------------- */

function OrdersAdmin() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const { data, error, loading, reload } = useApi('/orders', { status, page })
  const [busy, setBusy] = useState(null)
  const [msg, setMsg] = useState('')

  const move = async (order, next) => {
    if (next === 'cancelled' && !window.confirm(`Cancel order ${order.orderNumber}?${order.payment.status === 'paid' ? ' Stock will be returned; refund the customer from the Paystack dashboard.' : ''}`)) return
    setBusy(order.id)
    try {
      await api(`/orders/${order.id}/status`, { method: 'PATCH', body: { status: next } })
      setMsg(`${order.orderNumber} → ${next}`)
      await reload()
    } catch (err) { setMsg(err.message) } finally { setBusy(null) }
  }

  if (error) return <ErrorBox error={error} onRetry={reload} />
  if (loading && !data) return <Spinner />
  const { counts, revenue } = data.stats

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Revenue (paid orders)" value={formatNaira(revenue)} />
        <Stat label="To fulfil" value={(counts.paid ?? 0) + (counts.processing ?? 0)} />
        <Stat label="Awaiting payment" value={counts.pending ?? 0} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {['', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
          <button key={s || 'all'} onClick={() => { setStatus(s); setPage(1) }}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${status === s ? 'bg-indigo-ink text-white' : 'bg-white ring-1 ring-black/5 hover:bg-sand'}`}>
            {s || 'All'} <span className="opacity-60">{s ? counts[s] ?? 0 : Object.values(counts).reduce((a, b) => a + b, 0)}</span>
          </button>
        ))}
      </div>
      {msg && <p className="mt-4 rounded-xl bg-sand p-3 text-sm" role="status">{msg}</p>}

      <div className="mt-6 overflow-x-auto rounded-3xl bg-white ring-1 ring-black/5">
        {!data.items.length ? <p className="p-10 text-center text-muted">No orders here yet.</p> : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-black/5 text-xs uppercase tracking-wider text-muted">
              <tr><th className="p-4">Order</th><th className="p-4">Customer</th><th className="p-4">Zone</th><th className="p-4">Total</th><th className="p-4">Status</th><th className="p-4 text-right">Next step</th></tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {data.items.map((o) => (
                <tr key={o.id} className={busy === o.id ? 'opacity-50' : ''}>
                  <td className="p-4">
                    <Link to={`/orders/${o.id}`} className="font-semibold hover:underline">{o.orderNumber}</Link>
                    <p className="text-xs text-muted">{formatDate(o.createdAt)} · {o.items.reduce((s, i) => s + i.qty, 0)} units</p>
                  </td>
                  <td className="p-4">{o.user?.name ?? '—'}<p className="text-xs text-muted">{o.shippingAddress.area}</p></td>
                  <td className="p-4 capitalize">{o.deliveryZone}</td>
                  <td className="p-4 font-semibold">{formatNaira(o.total)}</td>
                  <td className="p-4"><StatusBadge status={o.status} /></td>
                  <td className="p-4 text-right">
                    {NEXT[o.status].map((n) => (
                      <button key={n} disabled={busy === o.id} onClick={() => move(o, n)}
                        className={`ml-1 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${n === 'cancelled' ? 'text-terracotta hover:bg-terracotta/10' : 'bg-indigo-ink text-white hover:bg-indigo-deep'}`}>
                        {n === 'cancelled' ? 'Cancel' : `Mark ${n}`}
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {data.pages > 1 && (
        <div className="mt-4 flex justify-center gap-2 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-full bg-white px-4 py-2 font-semibold ring-1 ring-black/5 disabled:opacity-40">← Prev</button>
          <span className="px-3 py-2 text-muted">Page {page} of {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="rounded-full bg-white px-4 py-2 font-semibold ring-1 ring-black/5 disabled:opacity-40">Next →</button>
        </div>
      )}
    </>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-black/5">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-indigo-ink">{value}</p>
    </div>
  )
}
