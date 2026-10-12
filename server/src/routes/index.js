import { Router } from 'express'
import mongoose from 'mongoose'
import rateLimit from 'express-rate-limit'
import { adminOnly, optionalAuth, protect } from '../middleware/auth.js'
import * as auth from '../controllers/authController.js'
import * as products from '../controllers/productController.js'
import * as cart from '../controllers/cartController.js'
import * as orders from '../controllers/orderController.js'
import * as payments from '../controllers/paymentController.js'
import { uploadImage, uploadMiddleware } from '../controllers/uploadController.js'
import { DELIVERY_ZONES } from '../services/delivery.js'
import { isPaystackEnabled } from '../services/paystack.js'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { message: 'Too many attempts — please try again in a few minutes' },
})

// Health & config
router.get('/health', (_req, res) => {
  const db = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  res.status(db === 'connected' ? 200 : 503).json({ status: db === 'connected' ? 'ok' : 'degraded', db, uptime: Math.round(process.uptime()), time: new Date().toISOString() })
})
router.get('/config', (_req, res) => res.json({ deliveryZones: Object.values(DELIVERY_ZONES), paystack: isPaystackEnabled() }))

// Auth
router.post('/auth/register', authLimiter, auth.register)
router.post('/auth/login', authLimiter, auth.login)
router.get('/auth/me', protect, auth.me)
router.patch('/auth/me', protect, auth.updateMe)

// Products — public reads, admin writes
router.get('/products', optionalAuth, products.listProducts)
router.get('/products/categories', products.categoryCounts)
router.get('/products/:idOrSlug', optionalAuth, products.getProduct)
router.post('/products', protect, adminOnly, products.createProduct)
router.put('/products/:idOrSlug', protect, adminOnly, products.updateProduct)
router.patch('/products/:idOrSlug', protect, adminOnly, products.updateProduct)
router.delete('/products/:idOrSlug', protect, adminOnly, products.deleteProduct)
router.post('/uploads', protect, adminOnly, uploadMiddleware, uploadImage)

// Cart (signed-in users)
router.get('/cart', protect, cart.getCart)
router.post('/cart/items', protect, cart.addItem)
router.patch('/cart/items/:itemId', protect, cart.updateItem)
router.delete('/cart/items/:itemId', protect, cart.removeItem)
router.delete('/cart', protect, cart.clearCart)
router.post('/cart/merge', protect, cart.mergeCart)

// Orders
router.post('/orders', protect, orders.createOrder)
router.get('/orders/mine', protect, orders.myOrders)
router.get('/orders', protect, adminOnly, orders.listOrders)
router.get('/orders/:id', protect, orders.getOrder)
router.post('/orders/:id/pay', protect, orders.payOrder)
router.patch('/orders/:id/cancel', protect, orders.cancelMyOrder)
router.patch('/orders/:id/status', protect, adminOnly, orders.updateOrderStatus)

// Payments (webhook is mounted in app.js because it needs the raw body)
router.get('/payments/verify/:reference', protect, payments.verifyPayment)
router.post('/payments/demo/:reference/complete', protect, payments.completeDemoPayment)

export default router
