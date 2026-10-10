import Order from '../models/Order.js'
import ApiError from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { isPaystackEnabled, isValidSignature, verifyTransaction } from '../services/paystack.js'
import { markOrderPaid } from '../services/orderService.js'

// GET /api/payments/verify/:reference — called by the client after Paystack redirects back
export const verifyPayment = asyncHandler(async (req, res) => {
  const { reference } = req.params
  const order = await Order.findOne({ 'payment.reference': reference })
  if (!order || (String(order.user) !== String(req.user._id) && req.user.role !== 'admin')) throw ApiError.notFound('Payment not found')
  if (order.payment.status === 'paid') return res.json({ order, paid: true })
  if (!isPaystackEnabled()) return res.json({ order, paid: false, demo: true })

  const tx = await verifyTransaction(reference)
  if (tx.status !== 'success') {
    return res.json({ order, paid: false, message: tx.gateway_response || `Payment ${tx.status}` })
  }
  const result = await markOrderPaid(reference, { amount: tx.amount, channel: tx.channel, paidAt: tx.paid_at })
  res.json({ order: result.order, paid: true })
})

// POST /api/payments/webhook — Paystack server-to-server notification (raw body, signed)
export const paystackWebhook = asyncHandler(async (req, res) => {
  if (!isValidSignature(req.body, req.headers['x-paystack-signature'])) {
    return res.status(401).json({ message: 'Invalid signature' })
  }
  const event = JSON.parse(req.body.toString('utf8'))
  if (event.event === 'charge.success') {
    const { reference, amount, channel, paid_at: paidAt } = event.data
    try {
      await markOrderPaid(reference, { amount, channel, paidAt })
    } catch (err) {
      console.error('Webhook could not mark order paid:', reference, err.message)
    }
  }
  res.sendStatus(200) // always acknowledge so Paystack stops retrying
})

// POST /api/payments/demo/:reference/complete — only when Paystack keys are NOT configured
export const completeDemoPayment = asyncHandler(async (req, res) => {
  if (isPaystackEnabled()) throw ApiError.notFound()
  const order = await Order.findOne({ 'payment.reference': req.params.reference })
  if (!order || String(order.user) !== String(req.user._id)) throw ApiError.notFound('Payment not found')
  const result = await markOrderPaid(req.params.reference, { amount: order.total * 100, channel: 'demo' })
  res.json({ order: result.order, paid: true })
})
