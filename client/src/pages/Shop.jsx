import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { categories, products, getCategory } from '../data/products'
import ProductCard from '../components/ProductCard'
import { matchesQuery } from '../components/SearchBar'
import { CloseIcon, FilterIcon } from '../components/Icons'

const FABRICS = ['ankara', 'aso-oke', 'lace', 'adire']

const priceBands = [
  { id: 'u10', label: 'Under ₦10,000', min: 0, max: 10000 },
  { id: '10-30', label: '₦10,000 – ₦30,000', min: 10000, max: 30000 },
  { id: 'o30', label: 'Over ₦30,000', min: 30000, max: Infinity },
]

const sorts = {
  popular: { label: 'Most popular', fn: (a, b) => b.reviews - a.reviews },
  'price-asc': { label: 'Price: low to high', fn: (a, b) => a.price - b.price },
  'price-desc': { label: 'Price: high to low', fn: (a, b) => b.price - a.price },
  rating: { label: 'Top rated', fn: (a, b) => b.rating - a.rating },
}

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const q = params.get('q') ?? ''
  const category = params.get('category') ?? 'all'
  const band = params.get('price') ?? ''
  const minPrice = Number(params.get('min')) || 0
  const maxPrice = Number(params.get('max')) || Infinity
  const sort = sorts[params.get('sort')] ? params.get('sort') : 'popular'

  const update = (changes) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([k, v]) => (v === '' || v == null ? next.delete(k) : next.set(k, v)))
    setParams(next, { replace: true })
  }

  const results = useMemo(() => {
    const activeBand = priceBands.find((b) => b.id === band)
    return products
      .filter((p) => category === 'all' || (category === 'fabrics' ? FABRICS.includes(p.category) : p.category === category))
      .filter((p) => matchesQuery(p, q))
      .filter((p) => !activeBand || (p.price >= activeBand.min && p.price < activeBand.max))
      .filter((p) => p.price >= minPrice && p.price <= maxPrice)
      .sort(sorts[sort].fn)
  }, [q, category, band, minPrice, maxPrice, sort])

  const heading = q ? `Results for “${q}”` : category === 'fabrics' ? 'All fabrics' : getCategory(category)?.name ?? 'All products'
  const activeFilters = [
    q && { key: 'q', label: `“${q}”` },
    category !== 'all' && { key: 'category', label: category === 'fabrics' ? 'Fabrics' : getCategory(category)?.name },
    band && { key: 'price', label: priceBands.find((b) => b.id === band)?.label },
    (params.get('min') || params.get('max')) && { key: 'range', label: `₦${params.get('min') || 0} – ₦${params.get('max') || '∞'}` },
  ].filter(Boolean)

  const clearFilter = (key) => (key === 'range' ? update({ min: '', max: '' }) : update({ [key]: '' }))

  const filterPanel = (
    <div className="space-y-8">
      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-wider text-muted">Category</legend>
        <div className="mt-3 space-y-1">
          {[{ slug: 'all', name: 'All products' }, { slug: 'fabrics', name: 'All fabrics' }, ...categories].map((c) => (
            <label key={c.slug} className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm ${category === c.slug ? 'bg-indigo-ink font-semibold text-white' : 'hover:bg-sand'}`}>
              <input type="radio" name="category" className="sr-only" checked={category === c.slug} onChange={() => update({ category: c.slug === 'all' ? '' : c.slug })} />
              {c.name}
              <span className={`ml-auto text-xs ${category === c.slug ? 'text-white/70' : 'text-muted'}`}>
                {c.slug === 'all' ? products.length : c.slug === 'fabrics' ? products.filter((p) => FABRICS.includes(p.category)).length : products.filter((p) => p.category === c.slug).length}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-bold uppercase tracking-wider text-muted">Price</legend>
        <div className="mt-3 space-y-2">
          {priceBands.map((b) => (
            <label key={b.id} className="flex cursor-pointer items-center gap-3 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-terracotta" checked={band === b.id} onChange={() => update({ price: band === b.id ? '' : b.id })} />
              {b.label}
            </label>
          ))}
        </div>
        <form
          key={`${params.get('min')}-${params.get('max')}`}
          className="mt-4 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            update({ min: fd.get('min'), max: fd.get('max'), price: '' })
          }}
        >
          <input name="min" type="number" min="0" inputMode="numeric" placeholder="Min ₦" defaultValue={params.get('min') ?? ''} className="input py-2 text-sm" aria-label="Minimum price" />
          <span className="text-muted">–</span>
          <input name="max" type="number" min="0" inputMode="numeric" placeholder="Max ₦" defaultValue={params.get('max') ?? ''} className="input py-2 text-sm" aria-label="Maximum price" />
          <button className="rounded-xl bg-indigo-ink px-3 py-2 text-sm font-semibold text-white">Go</button>
        </form>
      </fieldset>

      {activeFilters.length > 0 && (
        <button onClick={() => setParams({}, { replace: true })} className="text-sm font-semibold text-terracotta hover:underline">
          Clear all filters
        </button>
      )}
    </div>
  )

  return (
    <div className="container-page py-8 sm:py-12">
      <nav className="text-sm text-muted" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-ink">Home</Link> <span aria-hidden="true">/</span> <span className="text-ink">Shop</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-indigo-ink sm:text-4xl">{heading}</h1>
          <p className="mt-1 text-sm text-muted" aria-live="polite">{results.length} {results.length === 1 ? 'item' : 'items'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFiltersOpen(true)} className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold lg:hidden">
            <FilterIcon /> Filters {activeFilters.length > 0 && <span className="rounded-full bg-terracotta px-1.5 text-xs text-white">{activeFilters.length}</span>}
          </button>
          <label className="sr-only" htmlFor="sort">Sort by</label>
          <select id="sort" value={sort} onChange={(e) => update({ sort: e.target.value === 'popular' ? '' : e.target.value })} className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold">
            {Object.entries(sorts).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {activeFilters.map((f) => (
            <button key={f.key} onClick={() => clearFilter(f.key)} className="flex items-center gap-1 rounded-full bg-sand px-3 py-1 text-sm font-medium hover:bg-[#e8dcc6]">
              {f.label} <CloseIcon width="14" height="14" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">{filterPanel}</aside>

        <section aria-label="Products">
          {results.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
              {results.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="rounded-3xl bg-white px-6 py-16 text-center ring-1 ring-black/5">
              <p className="font-display text-2xl font-bold text-indigo-ink">No products found</p>
              <p className="mt-2 text-muted">Try a different search term or remove a filter.</p>
              <button onClick={() => setParams({}, { replace: true })} className="btn btn-dark mt-6">Show all products</button>
            </div>
          )}
        </section>
      </div>

      {/* Mobile filters drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-cream p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-indigo-ink">Filters</h2>
              <button onClick={() => setFiltersOpen(false)} className="rounded-full p-2 hover:bg-sand" aria-label="Close filters"><CloseIcon /></button>
            </div>
            {filterPanel}
            <button onClick={() => setFiltersOpen(false)} className="btn btn-primary mt-8 w-full">Show {results.length} results</button>
          </div>
        </div>
      )}
    </div>
  )
}
