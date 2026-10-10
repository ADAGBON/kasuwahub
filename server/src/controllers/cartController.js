import Product from '../models/Product.js'
import ApiError from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { addToCart, cartView, getOrCreateCart, validateLine } from '../services/cartService.js'

// GET /api/cart
export const getCart = asyncHandler(async (req, res) => {
  res.json(await cartView(await getOrCreateCart(req.user._id)))
})

// POST /api/cart/items  { productId, qty, size }
export const addItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id)
  await addToCart(cart, { ...req.body, qty: Number(req.body?.qty ?? 1) })
  await cart.save()
  res.status(201).json(await cartView(cart))
})

// PATCH /api/cart/items/:itemId  { qty }
export const updateItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id)
  const item = cart.items.id(req.params.itemId)
  if (!item) throw ApiError.notFound('Cart item not found')
  const qty = Number(req.body?.qty)
  validateLine(await Product.findById(item.product), qty, item.size)
  item.qty = qty
  await cart.save()
  res.json(await cartView(cart))
})

// DELETE /api/cart/items/:itemId
export const removeItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id)
  const item = cart.items.id(req.params.itemId)
  if (!item) throw ApiError.notFound('Cart item not found')
  // reassigning the array saves it with a plain $set (portable across MongoDB-compatible servers)
  cart.items = cart.items.filter((i) => i.id !== item.id)
  await cart.save()
  res.json(await cartView(cart))
})

// DELETE /api/cart
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id)
  cart.items = []
  await cart.save()
  res.json(await cartView(cart))
})

// POST /api/cart/merge  { items: [{ productId, qty, size }] }
// Called after sign-in so items added as a guest are not lost. Invalid lines are skipped.
export const mergeCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id)
  const skipped = []
  for (const line of (req.body?.items ?? []).slice(0, 50)) {
    try {
      await addToCart(cart, { productId: line.productId, qty: Number(line.qty), size: line.size ?? null })
    } catch (err) {
      skipped.push({ productId: line.productId, reason: err.message })
    }
  }
  await cart.save()
  res.json({ ...(await cartView(cart)), skipped })
})
