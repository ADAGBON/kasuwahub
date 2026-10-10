import { Link } from 'react-router-dom'
import { categories } from '../data/products'
import { Logo } from './Navbar'

export default function Footer() {
  return (
    <footer className="mt-20 bg-indigo-deep text-cream/80">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            The online market square for Lagos fashion & fabric sellers — from Balogun to Lekki, delivered to your door.
          </p>
        </div>
        <div>
          <h3 className="font-display text-lg text-cream">Shop</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.slug}><Link to={`/shop?category=${c.slug}`} className="hover:text-mustard">{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-display text-lg text-cream">Help</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/cart" className="hover:text-mustard">Your cart</Link></li>
            <li><Link to="/login" className="hover:text-mustard">Track an order</Link></li>
            <li><span>Delivery: Island · Mainland · Outskirts</span></li>
            <li><span>Payments secured by Paystack</span></li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-lg text-cream">Sell on KasuwaHub</h3>
          <p className="mt-3 text-sm leading-relaxed">Move your shop off WhatsApp DMs. Get a real catalogue, card payments and order tracking.</p>
          <Link to="/register" className="btn btn-primary mt-4 text-sm">Become a seller</Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} KasuwaHub. Built in Lagos.</p>
          <p>Lab Phase project · Phase 1 UI</p>
        </div>
      </div>
    </footer>
  )
}
