import crypto from 'node:crypto'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import Cart from '../models/Cart.js'
import ApiError from '../utils/ApiError.js'
import { env } from '../config/env.js'
import { initializeTransaction, isPaystackEnabled } from './paystack.js'

export const newReference = (order) => `${order.orderNumber}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`

// Creates a Paystack transaction (or a demo one) for a pending order and stores its reference
export async function startPayment(order, user) {
  order.payment.reference = newReference(order)
  await order.save()

  if (!isPaystackEnabled()) {
    return { reference: order.payment.reference, authorizationUrl: `${env.clientUrl}/checkout/demo?reference=${order.payment.reference}`, demo: true }
  }
  const data = await initializeTransaction({
    email: user.email,
    amount: order.total,
    reference: order.payment.reference,
    callbackUrl: `${env.clientUrl}/checkout/complete`,
    metadata: { orderId: order.id, orderNumber: order.orderNumber },
  })
  return { reference: data.reference, authorizationUrl: data.authorization_url, demo: false }
}

/**
 * Marks an order as paid exactly once — safe if both the webhook and the
 * browser redirect verification arrive (the conditional update "claims" it).
 */
export async function markOrderPaid(reference, { amount, channel, paidAt }) {
  const pending = await Order.findOne({ 'payment.reference': reference })
  if (!pending) throw ApiError.notFound('No order for this payment reference')
  if (pending.payment.status === 'paid') return { order: pending, alreadyPaid: true }
  if (amount !== pending.total * 100) throw ApiError.badRequest('Paid amount does not match order total')

  const order = await Order.findOneAndUpdate(
    { _id: pending._id, 'payment.status': 'unpaid' },
    {
      $set: { status: 'paid', 'payment.status': 'paid', 'payment.channel': channel, 'payment.paidAt': paidAt || new Date() },
      $push: { statusHistory: { status: 'paid', note: `Paid via ${channel || 'Paystack'}` } },
    },
    { new: true },
  )
  if (!order) return { order: await Order.findById(pending._id), alreadyPaid: true }

  // Reduce stock; the condition stops it going below zero
  const shortages = []
  for (const item of order.items) {
    const res = await Product.updateOne({ _id: item.product, stock: { $gte: item.qty } }, { $inc: { stock: -item.qty } })
    if (res.modifiedCount === 0) shortages.push(item.name)
  }
  if (shortages.length) {
    order.statusHistory.push({ status: 'paid', note: `Stock shortfall — check: ${shortages.join(', ')}` })
    await order.save()
  }

  // Remove the purchased lines from the customer's cart
  const cart = await Cart.findOne({ user: order.user })
  if (cart) {
    cart.items = cart.items.filter((ci) => !order.items.some((oi) => String(oi.product) === String(ci.product) && (oi.size ?? null) === (ci.size ?? null)))
    await cart.save()
  }
  return { order, alreadyPaid: false }
}

export async function restock(order) {
  for (const item of order.items) await Product.updateOne({ _id: item.product }, { $inc: { stock: item.qty } })
}
