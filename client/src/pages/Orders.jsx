import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { useApi } from '../api/hooks'
import FabricArt from '../components/FabricArt'
import { EmptyState, ErrorBox, Spinner, StatusBadge } from '../components/Status'
import { formatNaira } from '../utils/format'
import { goToPayment } from './Checkout'

export const formatDate = (d) => new Date(d).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
const STEPS = ['pending', 'paid', 'processing', 'shipped', 'delivered']

export default function Orders() {
  const { data, error, loading, reload } = useApi('/orders/mine')
  if (loading) return <Spinner label="Loading your orders…" />

  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="font-display text-3xl font-bold text-indigo-ink sm:text-4xl">My orders</h1>
      <div className="mt-8">
        {error ? <ErrorBox error={error} onRetry={reload} />
          : !data.items.length ? <EmptyState title="No orders yet" text="When you place an order it will show up here." to="/shop" cta="Start shopping" />
            : (
              <ul className="space-y-4">
                {data.items.map((o) => (
                  <li key={o.id}>
                    <Link to={`/orders/${o.id}`} className="flex flex-wrap items-center gap-4 rounded-3xl bg-white p-4 ring-1 ring-black/5 transition hover:shadow-lg sm:p-5">
                      <div className="flex -space-x-3">
                        {o.items.slice(0, 3).map((i, n) => (
                          <FabricArt key={n} product={i} className="h-14 w-14 rounded-2xl ring-2 ring-white" />
                        ))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{o.orderNumber}</p>
                        <p className="text-sm text-muted">{formatDate(o.createdAt)} · {o.items.length} item{o.items.length > 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg font-bold text-indigo-ink">{formatNaira(o.total)}</p>
                        <StatusBadge status={o.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
      </div>
    </div>
  )
}

export function OrderDetail() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { data, error, loading, reload } = useApi(`/orders/${id}`)
  const [busy, setBusy] = useState('')
  const [actionError, setActionError] = useState('')

  if (loading) return <Spinner label="Loading order…" />
  if (error) return <div className="container-page py-12"><ErrorBox error={error} onRetry={reload} /></div>

  const { order } = data
  const stepIndex = STEPS.indexOf(order.status)

  const act = async (kind) => {
    setBusy(kind)
    setActionError('')
    try {
      if (kind === 'pay') {
        const { payment } = await api(`/orders/${order.id}/pay`, { method: 'POST' })
        return goToPayment(payment, navigate)
      }
      await api(`/orders/${order.id}/cancel`, { method: 'PATCH' })
      await reload()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy('')
    }
    return undefined
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <nav className="text-sm text-muted" aria-label="Breadcrumb">
        <Link to="/orders" className="hover:text-ink">My orders</Link> <span aria-hidden="true">/</span> <span className="text-ink">{order.orderNumber}</span>
      </nav>

      {params.get('paid') && order.payment.status === 'paid' && (
        <div className="mt-6 rounded-3xl bg-palm p-6 text-white" role="status">
          <p className="font-display text-2xl font-bold">Payment received — thank you!</p>
          <p className="mt-1 text-white/85">Your order is confirmed. The seller will start preparing it shortly.</p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-indigo-ink">Order {order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted">Placed {formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {order.status !== 'cancelled' && (
        <ol className="mt-8 grid grid-cols-5 gap-1" aria-label="Order progress">
          {STEPS.map((s, i) => (
            <li key={s} className="text-center">
              <div className={`h-1.5 rounded-full ${i <= stepIndex ? 'bg-terracotta' : 'bg-black/10'}`} />
              <p className={`mt-2 text-[11px] font-semibold capitalize sm:text-xs ${i <= stepIndex ? 'text-ink' : 'text-muted'}`}>{s}</p>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <ul className="divide-y divide-black/5 rounded-3xl bg-white px-5 ring-1 ring-black/5">
            {order.items.map((i, n) => (
              <li key={n} className="flex items-center gap-4 py-4">
                <FabricArt product={i} className="h-16 w-16 shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1">
                  <Link to={`/product/${i.slug}`} className="font-semibold hover:underline">{i.name}</Link>
                  <p className="text-sm text-muted">{formatNaira(i.price)} × {i.qty}{i.unit === 'yard' ? ' yd' : ''}{i.size && ` · Size ${i.size}`}</p>
                </div>
                <p className="font-semibold">{formatNaira(i.lineTotal)}</p>
              </li>
            ))}
          </ul>

          <section className="rounded-3xl bg-white p-5 ring-1 ring-black/5">
            <h2 className="font-semibold">History</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {[...order.statusHistory].reverse().map((h, n) => (
                <li key={n} className="flex flex-wrap gap-x-3">
                  <StatusBadge status={h.status} />
                  <span className="text-muted">{formatDate(h.at)}</span>
                  {h.note && <span>{h.note}</span>}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="h-fit space-y-6">
          <section className="rounded-3xl bg-white p-5 ring-1 ring-black/5">
            <h2 className="font-semibold">Delivery to</h2>
            <p className="mt-2 text-sm leading-relaxed">
              {order.shippingAddress.fullName}<br />{order.shippingAddress.phone}<br />
              {order.shippingAddress.address}, {order.shippingAddress.area}
              {order.shippingAddress.notes && <><br /><span className="text-muted">{order.shippingAddress.notes}</span></>}
            </p>
            <p className="mt-2 text-xs font-semibold capitalize text-muted">Zone: {order.deliveryZone}</p>
          </section>

          <section className="rounded-3xl bg-white p-5 ring-1 ring-black/5">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatNaira(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{formatNaira(order.deliveryFee)}</dd></div>
              <div className="flex justify-between border-t border-black/5 pt-2 text-lg font-bold"><dt>Total</dt><dd className="font-display text-indigo-ink">{formatNaira(order.total)}</dd></div>
              <div className="flex justify-between pt-1"><dt className="text-muted">Payment</dt><dd className="font-semibold capitalize">{order.payment.status}{order.payment.channel && ` · ${order.payment.channel}`}</dd></div>
            </dl>
            {actionError && <p className="mt-3 text-sm font-semibold text-terracotta" role="alert">{actionError}</p>}
            {order.status === 'pending' && (
              <div className="mt-5 space-y-2">
                <button onClick={() => act('pay')} disabled={!!busy} className="btn btn-primary w-full">{busy === 'pay' ? 'Redirecting…' : 'Pay now'}</button>
                <button onClick={() => act('cancel')} disabled={!!busy} className="w-full py-2 text-sm font-semibold text-muted hover:text-terracotta">{busy === 'cancel' ? 'Cancelling…' : 'Cancel order'}</button>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
