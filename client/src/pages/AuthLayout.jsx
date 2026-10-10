import FabricArt from '../components/FabricArt'
import { products } from '../data/products'

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="container-page grid min-h-[70vh] items-center gap-10 py-12 md:grid-cols-2">
      <div className="relative hidden overflow-hidden rounded-3xl md:block">
        <FabricArt product={products[0]} className="aspect-[4/5] w-full" />
        <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-white/90 p-5 backdrop-blur">
          <p className="font-display text-xl font-bold text-indigo-ink">“My customers finally have a proper catalogue.”</p>
          <p className="mt-1 text-sm text-muted">— Mama Tobi Fabrics, Balogun Market</p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-md">
        <h1 className="font-display text-3xl font-bold text-indigo-ink sm:text-4xl">{title}</h1>
        <p className="mt-2 text-muted">{subtitle}</p>
        {children}
      </div>
    </div>
  )
}
