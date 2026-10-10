import { Link } from 'react-router-dom'
import { categories, products, deliveryZones } from '../data/products'
import ProductCard from '../components/ProductCard'
import FabricArt from '../components/FabricArt'
import { ArrowIcon, ShieldIcon, StoreIcon, TruckIcon } from '../components/Icons'
import { formatNaira } from '../utils/format'

const heroPicks = ['ank-001', 'aso-001', 'adi-001', 'lac-001'].map((id) => products.find((p) => p.id === id))

// one representative product per category for the category tiles
const categoryArt = Object.fromEntries(categories.map((c) => [c.slug, products.find((p) => p.category === c.slug)]))

export default function Home() {
  const featured = [...products].sort((a, b) => b.reviews - a.reviews).slice(0, 8)
  const readyMade = products.filter((p) => p.category === 'ready-made').slice(0, 4)

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container-page grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1 text-xs font-bold uppercase tracking-wider text-terracotta">
              <span className="h-1.5 w-1.5 rounded-full bg-terracotta" /> Lagos’ fabric market, online
            </p>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] text-indigo-ink sm:text-5xl lg:text-6xl">
              From Balogun stalls <span className="italic text-terracotta">to your doorstep.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg">
              Shop Ankara by the yard, hand-woven Aso-Oke, lace and ready-made outfits from trusted Lagos sellers. Pay in Naira, track every order.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="btn btn-primary">Start shopping <ArrowIcon /></Link>
              <Link to="/shop?category=fabrics" className="btn btn-outline text-indigo-ink">Browse fabrics</Link>
            </div>
            <dl className="mt-10 grid max-w-sm grid-cols-3 gap-4 border-t border-black/10 pt-6">
              <div><dt className="text-xs text-muted">Sellers</dt><dd className="font-display text-2xl font-bold text-indigo-ink">120+</dd></div>
              <div><dt className="text-xs text-muted">Products</dt><dd className="font-display text-2xl font-bold text-indigo-ink">2.4k</dd></div>
              <div><dt className="text-xs text-muted">LGAs served</dt><dd className="font-display text-2xl font-bold text-indigo-ink">20</dd></div>
            </dl>
          </div>

          <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-3 sm:gap-4">
            {heroPicks.map((p, i) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className={`group relative overflow-hidden rounded-3xl shadow-lg ring-1 ring-black/5 ${i % 2 ? 'translate-y-6' : ''}`}
              >
                <FabricArt product={p} className="aspect-[4/5] h-full w-full transition duration-500 group-hover:scale-105" />
                <span className="absolute inset-x-2 bottom-2 rounded-2xl bg-white/90 px-3 py-2 text-xs backdrop-blur">
                  <span className="block truncate font-semibold">{p.name}</span>
                  <span className="text-terracotta">{formatNaira(p.price)}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-y border-black/5 bg-white">
        <div className="container-page grid gap-6 py-8 sm:grid-cols-3">
          {[
            { icon: TruckIcon, title: 'Zone-based delivery', text: 'Flat fees for Island, Mainland and Outskirts.' },
            { icon: ShieldIcon, title: 'Secure Naira payments', text: 'Card, transfer and USSD via Paystack.' },
            { icon: StoreIcon, title: 'Verified Lagos sellers', text: 'Real shops from Balogun, Yaba, Lekki and more.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sand text-terracotta"><Icon /></span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-16">
        <SectionHeader title="Shop by category" link="/shop" linkText="View all" />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link key={c.slug} to={`/shop?category=${c.slug}`} className="group overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 transition hover:shadow-lg">
              <div className="aspect-[4/3] overflow-hidden">
                <FabricArt product={categoryArt[c.slug]} className="h-full w-full transition duration-500 group-hover:scale-110" />
              </div>
              <div className="p-3">
                <h3 className="font-display text-lg font-bold text-indigo-ink">{c.name}</h3>
                <p className="line-clamp-2 text-xs text-muted">{c.blurb}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container-page pb-16">
        <SectionHeader title="Trending this week" link="/shop?sort=popular" linkText="See more" />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Promo banner */}
      <section className="container-page pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-indigo-ink px-6 py-12 text-cream sm:px-12">
          <svg className="absolute -right-16 -top-16 h-80 w-80 opacity-20" viewBox="0 0 100 100" aria-hidden="true">
            {[45, 35, 25, 15].map((r, i) => <circle key={r} cx="50" cy="50" r={r} fill="none" stroke={i % 2 ? '#d4572a' : '#e8a33d'} strokeWidth="5" />)}
          </svg>
          <div className="relative max-w-lg">
            <p className="text-xs font-bold uppercase tracking-wider text-mustard">Owambe season</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Aso-ebi for the whole family, sorted.</h2>
            <p className="mt-3 text-cream/80">Order matching Aso-Oke and lace in bulk and get it delivered to every guest’s zone.</p>
            <Link to="/shop?category=aso-oke" className="btn btn-primary mt-6">Shop Aso-Oke <ArrowIcon /></Link>
          </div>
        </div>
      </section>

      {/* Ready-made */}
      <section className="container-page pb-16">
        <SectionHeader title="Ready to wear" link="/shop?category=ready-made" linkText="All outfits" />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
          {readyMade.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Delivery zones */}
      <section className="container-page">
        <SectionHeader title="Delivery across Lagos" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {deliveryZones.map((z) => (
            <div key={z.id} className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
              <p className="text-xs font-bold uppercase tracking-wider text-terracotta">{z.name}</p>
              <p className="mt-2 font-display text-3xl font-bold text-indigo-ink">{formatNaira(z.fee)}</p>
              <p className="mt-1 text-sm text-muted">{z.areas}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function SectionHeader({ title, link, linkText }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="font-display text-2xl font-bold text-indigo-ink sm:text-3xl">{title}</h2>
      {link && (
        <Link to={link} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-terracotta hover:underline">
          {linkText} <ArrowIcon />
        </Link>
      )}
    </div>
  )
}
