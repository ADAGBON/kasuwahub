import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { products, getCategory } from '../data/products'
import { formatNaira } from '../utils/format'
import { SearchIcon } from './Icons'

export function matchesQuery(product, q) {
  const term = q.trim().toLowerCase()
  if (!term) return true
  const haystack = [product.name, product.description, product.seller, product.location, getCategory(product.category)?.name]
    .join(' ')
    .toLowerCase()
  return term.split(/\s+/).every((word) => haystack.includes(word))
}

export default function SearchBar({ onDone, autoFocus = false }) {
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const navigate = useNavigate()
  const wrapRef = useRef(null)

  useEffect(() => { setQuery(params.get('q') ?? '') }, [params])

  useEffect(() => {
    const close = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const suggestions = useMemo(
    () => (query.trim().length < 2 ? [] : products.filter((p) => matchesQuery(p, query)).slice(0, 5)),
    [query],
  )

  const finish = () => { setOpen(false); setActive(-1); onDone?.() }

  const searchAll = () => {
    navigate(query.trim() ? `/shop?q=${encodeURIComponent(query.trim())}` : '/shop')
    finish()
  }

  const submit = (e) => {
    e.preventDefault()
    if (active >= 0 && suggestions[active]) {
      navigate(`/product/${suggestions[active].id}`)
      finish()
    } else searchAll()
  }

  const onKeyDown = (e) => {
    if (!suggestions.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((i) => (i + 1) % suggestions.length) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1)) }
    if (e.key === 'Escape') setOpen(false)
  }

  const showList = open && query.trim().length >= 2

  return (
    <div ref={wrapRef} className="relative w-full">
      <form role="search" onSubmit={submit} className="relative">
        <label htmlFor="site-search" className="sr-only">Search products</label>
        <input
          id="site-search"
          type="search"
          autoFocus={autoFocus}
          autoComplete="off"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(-1) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search Ankara, lace, kaftan…"
          className="w-full rounded-full border border-black/10 bg-sand/70 py-2.5 pl-11 pr-24 text-sm placeholder:text-muted focus:border-indigo-ink focus:bg-white focus:outline-none"
          role="combobox"
          aria-expanded={showList}
          aria-controls="search-suggestions"
          aria-activedescendant={active >= 0 ? `sugg-${active}` : undefined}
        />
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-indigo-ink px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-deep">
          Search
        </button>
      </form>

      {showList && (
        <ul id="search-suggestions" role="listbox" className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-xl">
          {suggestions.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted">No matches for “{query}”</li>
          ) : (
            suggestions.map((p, i) => (
              <li key={p.id} id={`sugg-${i}`} role="option" aria-selected={i === active}>
                <Link
                  to={`/product/${p.id}`}
                  onClick={finish}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${i === active ? 'bg-sand' : 'hover:bg-sand/60'}`}
                >
                  <span>
                    <span className="font-semibold">{p.name}</span>
                    <span className="ml-2 text-xs text-muted">{getCategory(p.category)?.name}</span>
                  </span>
                  <span className="shrink-0 font-semibold text-terracotta">{formatNaira(p.price)}</span>
                </Link>
              </li>
            ))
          )}
          <li>
            <button type="button" onClick={searchAll} className="w-full border-t border-black/5 px-4 py-2.5 text-left text-sm font-semibold text-indigo-ink hover:bg-sand/60">
              See all results for “{query.trim()}” →
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
