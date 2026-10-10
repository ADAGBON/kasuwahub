// End-to-end API tests. Needs a MongoDB (or compatible) server.
// ⚠ The test database is DROPPED before and after the run — never point MONGODB_URI_TEST at real data.
// Run: MONGODB_URI_TEST=mongodb+srv://…/kasuwahub_test npm test   (defaults to a local MongoDB)
import 'dotenv/config'
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET ||= 'test-secret'
process.env.PAYSTACK_SECRET_KEY = ''
// Always use a separate test database, never the app's MONGODB_URI
process.env.MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/kasuwahub_test'

import { test, before, after, describe } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import mongoose from 'mongoose'
import request from 'supertest'

const { env } = await import('../src/config/env.js')
const { createApp } = await import('../src/app.js')
const { seed } = await import('../src/seed/seed.js')
const { default: User } = await import('../src/models/User.js')
const { default: Product } = await import('../src/models/Product.js')

const app = createApp()
const api = () => request(app)
const auth = (t) => ({ Authorization: `Bearer ${t}` })

let adminToken, userToken, kaftan, ankara

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI)
  await mongoose.connection.db.dropDatabase()
  await seed({ reset: true })
  const res = await api().post('/api/auth/login').send({ email: 'admin@kasuwahub.ng', password: 'ChangeMe123!' })
  adminToken = res.body.token
  kaftan = await Product.findOne({ slug: 'mens-ankara-kaftan' })
  ankara = await Product.findOne({ slug: 'sunburst-ankara-print' })
})

after(async () => {
  await mongoose.connection.db.dropDatabase()
  await mongoose.disconnect()
})

describe('1. Database', () => {
  test('seeded 16 products and an admin', async () => {
    assert.equal(await Product.countDocuments(), 16)
    assert.equal((await User.findOne({ email: 'admin@kasuwahub.ng' })).role, 'admin')
  })
  test('health check', async () => {
    const res = await api().get('/api/health')
    assert.equal(res.status, 200)
  })
})

describe('2. JWT authentication', () => {
  test('register returns a token and never exposes the password', async () => {
    const res = await api().post('/api/auth/register')
      .send({ name: 'Ada Buyer', email: 'Ada@Example.com', phone: '0803 123 4567', password: 'password123', role: 'admin' })
    assert.equal(res.status, 201)
    assert.ok(res.body.token)
    assert.equal(res.body.user.email, 'ada@example.com')
    assert.equal(res.body.user.role, 'customer', 'role must not be settable on register')
    assert.equal(res.body.user.password, undefined)
    userToken = res.body.token
  })
  test('password is stored hashed', async () => {
    const u = await User.findOne({ email: 'ada@example.com' }).select('+password')
    assert.notEqual(u.password, 'password123')
    assert.match(u.password, /^\$2[aby]\$/)
  })
  test('duplicate email is rejected', async () => {
    const res = await api().post('/api/auth/register').send({ name: 'X', email: 'ada@example.com', password: 'password123' })
    assert.equal(res.status, 409)
  })
  test('validation errors', async () => {
    const res = await api().post('/api/auth/register').send({ name: 'X', email: 'bad', password: 'short' })
    assert.equal(res.status, 400)
    assert.ok(res.body.details.email)
  })
  test('login with wrong password fails', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'ada@example.com', password: 'nope-nope' })
    assert.equal(res.status, 401)
  })
  test('/me requires a valid token', async () => {
    assert.equal((await api().get('/api/auth/me')).status, 401)
    assert.equal((await api().get('/api/auth/me').set(auth('garbage'))).status, 401)
    const ok = await api().get('/api/auth/me').set(auth(userToken))
    assert.equal(ok.status, 200)
    assert.equal(ok.body.user.name, 'Ada Buyer')
  })
})

describe('3. Product management', () => {
  let createdId
  test('public list, search, filter and sort', async () => {
    const all = await api().get('/api/products')
    assert.equal(all.body.total, 16)
    const lace = await api().get('/api/products?q=lace')
    assert.ok(lace.body.items.every((p) => /lace/i.test(p.name + p.description + p.category)))
    const fabrics = await api().get('/api/products?category=fabrics')
    assert.equal(fabrics.body.total, 9)
    const cheap = await api().get('/api/products?maxPrice=10000&sort=price-asc')
    const prices = cheap.body.items.map((p) => p.price)
    assert.deepEqual(prices, [...prices].sort((a, b) => a - b))
    assert.ok(prices.every((p) => p <= 10000))
  })
  test('get by slug includes related products', async () => {
    const res = await api().get('/api/products/mens-ankara-kaftan')
    assert.equal(res.body.product.name, "Men's Ankara Kaftan")
    assert.ok(res.body.related.length > 0)
  })
  test('customers cannot create products', async () => {
    const res = await api().post('/api/products').set(auth(userToken)).send({ name: 'Hack' })
    assert.equal(res.status, 403)
  })
  test('admin can add a product', async () => {
    const res = await api().post('/api/products').set(auth(adminToken)).send({
      name: 'Kente Stole', description: 'Woven stole', category: 'accessories', price: 12000, stock: 5, seller: 'Test Seller',
    })
    assert.equal(res.status, 201)
    assert.equal(res.body.product.slug, 'kente-stole')
    createdId = res.body.product.id
  })
  test('admin product validation', async () => {
    const res = await api().post('/api/products').set(auth(adminToken)).send({ name: 'Bad', description: 'x', category: 'shoes', price: -5, seller: 's' })
    assert.equal(res.status, 400)
  })
  test('admin can update a product', async () => {
    const res = await api().patch(`/api/products/${createdId}`).set(auth(adminToken)).send({ price: 13500, badge: 'New' })
    assert.equal(res.status, 200)
    assert.equal(res.body.product.price, 13500)
  })
  test('admin can delete a product', async () => {
    const res = await api().delete(`/api/products/${createdId}`).set(auth(adminToken))
    assert.equal(res.status, 200)
    assert.equal((await api().get(`/api/products/${createdId}`)).status, 404)
  })
})

describe('4. Shopping cart', () => {
  let lineId
  test('cart requires sign-in', async () => {
    assert.equal((await api().get('/api/cart')).status, 401)
  })
  test('outfit requires a size', async () => {
    const res = await api().post('/api/cart/items').set(auth(userToken)).send({ productId: kaftan.id, qty: 1 })
    assert.equal(res.status, 400)
    assert.match(res.body.message, /size/i)
  })
  test('fabric enforces minimum yards', async () => {
    const res = await api().post('/api/cart/items').set(auth(userToken)).send({ productId: ankara.id, qty: 1 })
    assert.equal(res.status, 400)
    assert.match(res.body.message, /Minimum/)
  })
  test('add items; same product+size merges into one line', async () => {
    await api().post('/api/cart/items').set(auth(userToken)).send({ productId: kaftan.id, qty: 1, size: 'L' })
    await api().post('/api/cart/items').set(auth(userToken)).send({ productId: kaftan.id, qty: 1, size: 'L' })
    const res = await api().post('/api/cart/items').set(auth(userToken)).send({ productId: ankara.id, qty: 3 })
    assert.equal(res.status, 201)
    assert.equal(res.body.items.length, 2)
    assert.equal(res.body.count, 5)
    assert.equal(res.body.subtotal, 22000 * 2 + 4500 * 3)
    lineId = res.body.items.find((i) => i.product.id === ankara.id).id
  })
  test('cannot add more than stock', async () => {
    const res = await api().post('/api/cart/items').set(auth(userToken)).send({ productId: ankara.id, qty: 100 })
    assert.equal(res.status, 400)
    assert.match(res.body.message, /left in stock/)
  })
  test('update and remove a line', async () => {
    let res = await api().patch(`/api/cart/items/${lineId}`).set(auth(userToken)).send({ qty: 4 })
    assert.equal(res.body.subtotal, 22000 * 2 + 4500 * 4)
    res = await api().delete(`/api/cart/items/${lineId}`).set(auth(userToken))
    assert.equal(res.body.items.length, 1)
  })
  test('guest cart merges on sign-in and skips invalid lines', async () => {
    const res = await api().post('/api/cart/merge').set(auth(userToken)).send({
      items: [{ productId: ankara.id, qty: 2 }, { productId: kaftan.id, qty: 1 /* no size → skipped */ }],
    })
    assert.equal(res.body.items.length, 2)
    assert.equal(res.body.skipped.length, 1)
  })
})

describe('5. Order processing', () => {
  const address = { fullName: 'Ada Buyer', phone: '08031234567', address: '12 Herbert Macaulay Way', area: 'Yaba' }
  let order, reference

  test('order is built from the server cart with delivery fee (demo payment mode)', async () => {
    env.paystackSecret = ''
    const res = await api().post('/api/orders').set(auth(userToken)).send({ deliveryZone: 'mainland', shippingAddress: address })
    assert.equal(res.status, 201)
    order = res.body.order
    reference = res.body.payment.reference
    assert.equal(order.status, 'pending')
    assert.equal(order.subtotal, 22000 * 2 + 4500 * 2)
    assert.equal(order.deliveryFee, 2500)
    assert.equal(order.total, order.subtotal + 2500)
    assert.match(order.orderNumber, /^KH-\d{8}-/)
    assert.ok(res.body.payment.demo)
  })
  test('invalid zone and missing address are rejected', async () => {
    assert.equal((await api().post('/api/orders').set(auth(userToken)).send({ deliveryZone: 'abuja', shippingAddress: address })).status, 400)
    assert.equal((await api().post('/api/orders').set(auth(userToken)).send({ deliveryZone: 'island', shippingAddress: {} })).status, 400)
  })
  test('paying marks the order paid, reduces stock and clears the cart', async () => {
    const res = await api().post(`/api/payments/demo/${reference}/complete`).set(auth(userToken))
    assert.equal(res.body.order.status, 'paid')
    assert.equal((await Product.findById(kaftan.id)).stock, 40 - 2)
    assert.equal((await Product.findById(ankara.id)).stock, 40 - 2)
    assert.equal((await api().get('/api/cart').set(auth(userToken))).body.items.length, 0)
  })
  test('paying twice is idempotent (stock not reduced again)', async () => {
    await api().post(`/api/payments/demo/${reference}/complete`).set(auth(userToken))
    assert.equal((await Product.findById(kaftan.id)).stock, 38)
  })
  test('customer sees order history; other users cannot see it', async () => {
    const mine = await api().get('/api/orders/mine').set(auth(userToken))
    assert.equal(mine.body.items.length, 1)
    const other = await api().post('/api/auth/register').send({ name: 'Other', email: 'other@example.com', password: 'password123' })
    assert.equal((await api().get(`/api/orders/${order.id}`).set(auth(other.body.token))).status, 404)
  })
  test('admin moves order through fulfilment; invalid jumps rejected', async () => {
    const bad = await api().patch(`/api/orders/${order.id}/status`).set(auth(adminToken)).send({ status: 'delivered' })
    assert.equal(bad.status, 400)
    for (const status of ['processing', 'shipped', 'delivered']) {
      const res = await api().patch(`/api/orders/${order.id}/status`).set(auth(adminToken)).send({ status })
      assert.equal(res.body.order.status, status)
    }
    const list = await api().get('/api/orders').set(auth(adminToken))
    assert.equal(list.body.stats.counts.delivered, 1)
    assert.equal(list.body.stats.revenue, order.total)
  })
  test('customer cannot change order status', async () => {
    assert.equal((await api().patch(`/api/orders/${order.id}/status`).set(auth(userToken)).send({ status: 'cancelled' })).status, 403)
  })
  test('unpaid order can be cancelled by the customer', async () => {
    await api().post('/api/cart/items').set(auth(userToken)).send({ productId: ankara.id, qty: 2 })
    const res = await api().post('/api/orders').set(auth(userToken)).send({ deliveryZone: 'island', shippingAddress: address })
    const cancel = await api().patch(`/api/orders/${res.body.order.id}/cancel`).set(auth(userToken))
    assert.equal(cancel.body.order.status, 'cancelled')
  })

  test('Paystack: initialise, signed webhook marks paid, bad signature rejected', async () => {
    env.paystackSecret = 'sk_test_dummy'
    const realFetch = global.fetch
    global.fetch = async (url, opts) => {
      assert.match(String(url), /api\.paystack\.co\/transaction\/initialize/)
      const body = JSON.parse(opts.body)
      assert.equal(body.currency, 'NGN')
      return new Response(JSON.stringify({ status: true, data: { reference: body.reference, authorization_url: 'https://checkout.paystack.com/abc' } }), { status: 200 })
    }
    try {
      await api().post('/api/cart/items').set(auth(userToken)).send({ productId: ankara.id, qty: 2 })
      const res = await api().post('/api/orders').set(auth(userToken)).send({ deliveryZone: 'outskirts', shippingAddress: address })
      assert.equal(res.body.payment.authorizationUrl, 'https://checkout.paystack.com/abc')
      const ref = res.body.payment.reference
      const total = res.body.order.total

      const payload = JSON.stringify({ event: 'charge.success', data: { reference: ref, amount: total * 100, channel: 'card' } })
      const forged = await api().post('/api/payments/webhook').set('Content-Type', 'application/json').set('x-paystack-signature', 'bad').send(payload)
      assert.equal(forged.status, 401)

      const sig = crypto.createHmac('sha512', 'sk_test_dummy').update(payload).digest('hex')
      const ok = await api().post('/api/payments/webhook').set('Content-Type', 'application/json').set('x-paystack-signature', sig).send(payload)
      assert.equal(ok.status, 200)
      const after = await api().get(`/api/orders/${res.body.order.id}`).set(auth(userToken))
      assert.equal(after.body.order.status, 'paid')
      assert.equal(after.body.order.payment.channel, 'card')
    } finally {
      global.fetch = realFetch
      env.paystackSecret = ''
    }
  })
})
