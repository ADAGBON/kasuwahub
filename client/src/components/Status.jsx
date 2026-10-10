import { Link } from 'react-router-dom'

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-ink border-t-transparent" />
      {label}
    </div>
  )
}

export function ErrorBox({ error, onRetry }) {
  return (
    <div className="rounded-3xl bg-white px-6 py-12 text-center ring-1 ring-black/5" role="alert">
      <p className="font-display text-2xl font-bold text-indigo-ink">Something went wrong</p>
      <p className="mt-2 text-muted">{error?.message || 'Please try again.'}</p>
      {onRetry && <button onClick={onRetry} className="btn btn-dark mt-6">Try again</button>}
    </div>
  )
}

export function GridSkeleton({ count = 8, cols = 'md:grid-cols-3 lg:grid-cols-4' }) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:gap-5 ${cols}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5">
          <div className="aspect-square animate-pulse bg-sand" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 animate-pulse rounded bg-sand" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-sand" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-sand" />
          </div>
        </div>
      ))}
    </div>
  )
}

export const ORDER_STATUS_STYLE = {
  pending: 'bg-mustard/20 text-[#8a5a0f]',
  paid: 'bg-palm/15 text-palm',
  processing: 'bg-indigo-ink/10 text-indigo-ink',
  shipped: 'bg-indigo-ink/10 text-indigo-ink',
  delivered: 'bg-palm text-white',
  cancelled: 'bg-black/10 text-muted',
}

export function StatusBadge({ status }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${ORDER_STATUS_STYLE[status] ?? ''}`}>{status}</span>
}

export function EmptyState({ title, text, to, cta }) {
  return (
    <div className="rounded-3xl bg-white px-6 py-16 text-center ring-1 ring-black/5">
      <p className="font-display text-2xl font-bold text-indigo-ink">{title}</p>
      {text && <p className="mt-2 text-muted">{text}</p>}
      {to && <Link to={to} className="btn btn-primary mt-6">{cta}</Link>}
    </div>
  )
}
