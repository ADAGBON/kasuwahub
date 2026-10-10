import { Link } from 'react-router-dom'
import { getCategory } from '../data/products'
import { formatNaira, unitLabel } from '../utils/format'
import FabricArt from './FabricArt'
import { StarIcon } from './Icons'

export default function ProductCard({ product }) {
  const soldOut = product.stock <= 0
  return (
    <Link
      to={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-sand">
        <FabricArt product={product} className={`h-full w-full transition duration-500 group-hover:scale-105 ${soldOut ? 'opacity-50 grayscale' : ''}`} />
        {(soldOut || product.badge) && (
          <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-sm ${soldOut ? 'bg-ink text-white' : 'bg-white/95 text-indigo-ink'}`}>
            {soldOut ? 'Sold out' : product.badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-terracotta">{getCategory(product.category)?.name}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug sm:text-base">{product.name}</h3>
        <p className="mt-1 truncate text-xs text-muted">{product.seller}{product.location && ` · ${product.location}`}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <p>
            <span className="font-bold text-indigo-ink sm:text-lg">{formatNaira(product.price)}</span>
            <span className="ml-1 text-xs text-muted">{unitLabel(product.unit)}</span>
          </p>
          {product.rating > 0 && (
            <span className="flex items-center gap-0.5 text-xs font-semibold text-muted">
              <StarIcon className="text-mustard" width="14" height="14" />
              {product.rating}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
