import Order, { STATUS_FLOW, ORDER_STATUSES } from '../models/Order.js'
import ApiError from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getOrCreateCart, validateLine } from '../services/cartService.js'
import { getZone } from '../services/delivery.js'
import { restock, startPayment } from '../services/orderService.js'
import { pick } from '../utils/helpers.js'

const canSee = (user, order) => user.role === 'admin' || String(order.user._id ?? order.user) === String(user._id)

// POST /api/orders  { deliveryZone, shippingAddress: { fullName, phone, address, area, notes } }
// Builds the order from the server-side cart (prices are never trusted from the client)
export const createOrder = asyncHandler(async (req, res) => {
  const zone = getZone(req.body?.deliveryZone)
  if (!zone) throw ApiError.badRequest('Choose a delivery zone: island, mainland or outskirts')

  const cart = await getOrCreateCart(req.user._id)
  await cart.populate('items.product')
  const lines = cart.items.filter((i) => i.product)
  if (!lines.length) throw ApiError.badRequest('Your cart is empty')

  for (const l of lines) validateLine(l.product, l.qty, l.size) // re-check stock & rules at checkout

  const items = lines.map(({ product: p, qty, size }) => ({
    product: p._id, name: p.name, slug: p.slug, price: p.price, unit: p.unit, qty, size, seller: p.seller,
    lineTotal: p.price * qty, pattern: p.pattern, palette: p.palette, garment: p.garment, image: p.images?.[0]?.url,
  }))
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0)

  const order = await Order.create({
    user: req.user._id,
    items,
    shippingAddress: pick(req.body.shippingAddress, ['fullName', 'phone', 'address', 'area', 'notes']),
    deliveryZone: zone.id,
    subtotal,
    deliveryFee: zone.fee,
    total: subtotal + zone.fee,
  })

  const payment = await startPayment(order, req.user)
  res.status(201).json({ order, payment })
})

// POST /api/orders/:id/pay — retry payment for a pending order
export const payOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order || !canSee(req.user, order)) throw ApiError.notFound('Order not found')
  if (order.status !== 'pending') throw ApiError.badRequest(`Order is already ${order.status}`)
  res.json({ order, payment: await startPayment(order, req.user) })
})

// GET /api/orders/mine
export const myOrders = asyncHandler(async (req, res) => {
  res.json({ items: await Order.find({ user: req.user._id }).sort({ createdAt: -1 }) })
})

// GET /api/orders/:id
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone')
  if (!order || !canSee(req.user, order)) throw ApiError.notFound('Order not found')
  res.json({ order })
})

// PATCH /api/orders/:id/cancel — customer can cancel before payment
export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
  if (!order || !canSee(req.user, order)) throw ApiError.notFound('Order not found')
  if (order.status !== 'pending') throw ApiError.badRequest('Only unpaid orders can be cancelled — contact support for paid orders')
  order.status = 'cancelled'
  order.statusHistory.push({ status: 'cancelled', note: 'Cancelled by customer' })
  await order.save()
  res.json({ order })
})

// GET /api/orders?status=&page= (admin)
export const listOrders = asyncHandler(async (req, res) => {
  const filter = ORDER_STATUSES.includes(req.query.status) ? { status: req.query.status } : {}
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = 20
  const [items, total, counts] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('user', 'name email'),
    Order.countDocuments(filter),
    Promise.all(ORDER_STATUSES.map(async (s) => [s, await Order.countDocuments({ status: s })])),
  ])
  const paid = await Order.find({ 'payment.status': 'paid', status: { $ne: 'cancelled' } }, 'total')
  res.json({
    items, total, page, pages: Math.max(1, Math.ceil(total / limit)),
    stats: { counts: Object.fromEntries(counts), revenue: paid.reduce((s, o) => s + o.total, 0) },
  })
})

// PATCH /api/orders/:id/status  { status, note } (admin)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body || {}
  const order = await Order.findById(req.params.id)
  if (!order) throw ApiError.notFound('Order not found')
  if (!STATUS_FLOW[order.status]?.includes(status)) {
    throw ApiError.badRequest(`Cannot change order from "${order.status}" to "${status}"`)
  }
  // cancelling an order that was already paid puts the items back in stock (refund handled in Paystack dashboard)
  if (status === 'cancelled' && order.payment.status === 'paid') await restock(order)
  order.status = status
  order.statusHistory.push({ status, note })
  await order.save()
  res.json({ order })
})
