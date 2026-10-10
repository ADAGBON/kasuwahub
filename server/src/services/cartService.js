import Cart from '../models/Cart.js'
import Product from '../models/Product.js'
import ApiError from '../utils/ApiError.js'

export async function getOrCreateCart(userId) {
  return (await Cart.findOne({ user: userId })) ?? Cart.create({ user: userId, items: [] })
}

// Validates a requested line against the product's rules (min qty, sizes, stock)
export function validateLine(product, qty, size) {
  if (!product || !product.isActive) throw ApiError.notFound('This product is no longer available')
  if (!Number.isInteger(qty) || qty < 1) throw ApiError.badRequest('Quantity must be a whole number')
  if (qty < product.minQty) throw ApiError.badRequest(`Minimum order for ${product.name} is ${product.minQty} ${product.unit}s`)
  if (product.sizes?.length) {
    if (!size) throw ApiError.badRequest('Please choose a size')
    if (!product.sizes.includes(size)) throw ApiError.badRequest(`Size ${size} is not available`)
  } else if (size) {
    throw ApiError.badRequest('This product does not come in sizes')
  }
  if (qty > product.stock) {
    throw ApiError.badRequest(product.stock ? `Only ${product.stock} left in stock for ${product.name}` : `${product.name} is out of stock`)
  }
}

// Populated, priced view of the cart that the client renders
export async function cartView(cart) {
  await cart.populate('items.product')
  // drop lines whose product was deleted
  const before = cart.items.length
  cart.items = cart.items.filter((i) => i.product)
  if (cart.items.length !== before) await cart.save()

  const items = cart.items.map((i) => ({
    id: i.id,
    product: i.product,
    qty: i.qty,
    size: i.size,
    lineTotal: i.product.price * i.qty,
    available: i.product.isActive && i.product.stock >= i.qty,
  }))
  return {
    items,
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal: items.reduce((s, i) => s + i.lineTotal, 0),
  }
}

export async function addToCart(cart, { productId, qty = 1, size = null }) {
  const product = await Product.findById(productId)
  const existing = cart.items.find((i) => String(i.product._id ?? i.product) === String(productId) && (i.size ?? null) === (size ?? null))
  const newQty = (existing?.qty ?? 0) + Number(qty)
  validateLine(product, newQty, size)
  if (existing) existing.qty = newQty
  else cart.items.push({ product: product._id, qty: newQty, size })
}
