import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { categories } from '../data/products'
import SearchBar from './SearchBar'
import { CartIcon, CloseIcon, MenuIcon, SearchIcon, UserIcon } from './Icons'

export function Logo({ light = false }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="KasuwaHub home">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={light ? '#faf5ec' : '#1f2a5c'} />
        <circle cx="16" cy="16" r="8" fill="none" stroke="#e8a33d" strokeWidth="3" />
        <circle cx="16" cy="16" r="3" fill="#d4572a" />
      </svg>
      <span className={`font-display text-xl font-bold tracking-tight ${light ? 'text-cream' : 'text-indigo-ink'}`}>
        Kasuwa<span className="text-terracotta">Hub</span>
      </span>
    </Link>
  )
}

const navLinkClass = ({ isActive }) =>
  `rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${isActive ? 'bg-indigo-ink text-white' : 'text-ink hover:bg-sand'}`

export default function Navbar() {
  const { count } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()

  // close mobile panels whenever the route changes
  useEffect(() => { setMenuOpen(false); setSearchOpen(false) }, [location.pathname, location.search])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-cream/90 backdrop-blur">
      <div className="bg-indigo-ink py-1.5 text-center text-xs font-medium text-cream">
        <span className="sm:hidden">Same-day Lagos delivery before 12pm</span>
        <span className="hidden sm:inline">Same-day delivery on Lagos Island & Mainland for orders before 12pm</span>
      </div>

      <div className="container-page flex h-16 items-center gap-3 lg:gap-6">
        <button className="-ml-2 rounded-full p-2 hover:bg-sand lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <MenuIcon />
        </button>

        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          <NavLink to="/" end className={navLinkClass}>Home</NavLink>
          <NavLink to="/shop" className={navLinkClass}>Shop</NavLink>
          <NavLink to="/shop?category=fabrics" className={() => navLinkClass({ isActive: false })}>Fabrics</NavLink>
          <NavLink to="/shop?category=ready-made" className={() => navLinkClass({ isActive: false })}>Ready-Made</NavLink>
        </nav>

        <div className="mx-auto hidden w-full max-w-md md:block">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <button className="rounded-full p-2 hover:bg-sand md:hidden" onClick={() => setSearchOpen((s) => !s)} aria-label="Search" aria-expanded={searchOpen}>
            <SearchIcon />
          </button>
          <Link to="/login" className="rounded-full p-2 hover:bg-sand" aria-label="Account">
            <UserIcon />
          </Link>
          <Link to="/cart" className="relative rounded-full p-2 hover:bg-sand" aria-label={`Cart, ${count} items`}>
            <CartIcon />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-terracotta px-1 text-[11px] font-bold text-white">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="container-page pb-3 md:hidden">
          <SearchBar autoFocus onDone={() => setSearchOpen(false)} />
        </div>
      )}

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden ${menuOpen ? '' : 'pointer-events-none'}`} aria-hidden={!menuOpen}>
        <div className={`absolute inset-0 bg-black/40 transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setMenuOpen(false)} />
        <aside className={`absolute inset-y-0 left-0 flex w-80 max-w-[85%] flex-col bg-cream shadow-2xl transition-transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex h-16 items-center justify-between border-b border-black/5 px-4">
            <Logo />
            <button onClick={() => setMenuOpen(false)} className="rounded-full p-2 hover:bg-sand" aria-label="Close menu" tabIndex={menuOpen ? 0 : -1}>
              <CloseIcon />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-4" aria-label="Mobile">
            <ul className="space-y-1 text-base font-semibold">
              <li><Link to="/" className="block rounded-xl px-3 py-2.5 hover:bg-sand" tabIndex={menuOpen ? 0 : -1}>Home</Link></li>
              <li><Link to="/shop" className="block rounded-xl px-3 py-2.5 hover:bg-sand" tabIndex={menuOpen ? 0 : -1}>Shop all</Link></li>
            </ul>
            <p className="mt-6 px-3 text-xs font-bold uppercase tracking-wider text-muted">Categories</p>
            <ul className="mt-2 space-y-1">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link to={`/shop?category=${c.slug}`} className="block rounded-xl px-3 py-2 hover:bg-sand" tabIndex={menuOpen ? 0 : -1}>{c.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-2 border-t border-black/5 p-4">
            <Link to="/login" className="btn btn-dark w-full" tabIndex={menuOpen ? 0 : -1}>Sign in</Link>
            <Link to="/register" className="btn btn-outline w-full text-indigo-ink" tabIndex={menuOpen ? 0 : -1}>Create account</Link>
          </div>
        </aside>
      </div>
    </header>
  )
}
