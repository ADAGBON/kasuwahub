// Production smoke test — checks the deployed website + API end to end.
//
// Usage (from the server folder, Node 20+):
//   npm run smoke -- --api https://kasuwahub-api.onrender.com --site https://kasuwahub.netlify.app
// Optional admin checks (product CRUD, order list, status update):
//   SMOKE_ADMIN_EMAIL=admin@kasuwahub.ng SMOKE_ADMIN_PASSWORD=… npm run smoke -- --api … --site …
//
// It creates one test customer (smoke-<time>@example.com) and one small test order, which the
// admin step cancels again so stock is restored.

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, a, i, all) => (a.startsWith('--') ? [...pairs, [a.slice(2), all[i + 1]]] : pairs), []),
)
const API = (args.api || process.env.SMOKE_API || '').replace(/\/+$/, '').replace(/\/api$/, '')
const SITE = (args.site || process.env.SMOKE_SITE || '').replace(/\/+$/, '')
if (!API || !SITE) {
  console.error('Usage: npm run smoke -- --api https://<your-api>.onrender.com --site https://<your-site>.netlify.app')
  process.exit(1)
}
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD

const results = []
let failed = 0
const green = (s) => `\x1b[32m${s}\x1b[0m`
const red = (s) => `\x1b[31m${s}\x1b[0m`
const dim = (s) => `\x1b[2m${s}\x1b[0m`

async function check(name, fn) {
  const t = Date.now()
  try {
    const note = await fn()
    results.push({ ok: true, name })
    console.log(`${green('✓')} ${name} ${dim(`${Date.now() - t}ms${note ? ` · ${note}` : ''}`)}`)
  } catch (err) {
    failed++
    results.push({ ok: false, name })
    console.log(`${red('✗')} ${name}\n    ${red(err.message)}`)
  }
}

const assert = (cond, msg) => { if (!cond) throw new Error(msg) }

async function call(path, { method = 'GET', token, body, headers = {} } = {}) {
  const res = await fetch(`${API}/api${path}`, {
    method,
    headers: { ...(body && { 'Content-Type': 'application/json' }), ...(token && { Authorization: `Bearer ${token}` }), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  return { status: res.status, data, headers: res.headers }
}

console.log(`\nKasuwaHub smoke test\n  API:  ${API}\n  Site: ${SITE}\n`)

// ---------- 1. API is up (free Render instances may need ~60s to wake) ----------
await check('API is awake and connected to MongoDB', async () => {
  const deadline = Date.now() + 120_000
  let last
  while (Date.now() < deadline) {
    try {
      const r = await call('/health')
      if (r.status === 200 && r.data?.db === 'connected') return `uptime ${r.data.uptime}s`
      last = `status ${r.status} ${JSON.stringify(r.data)}`
    } catch (e) { last = e.message }
    await new Promise((r) => setTimeout(r, 5000))
  }
  throw new Error(`API not healthy after 2 minutes (${last})`)
})

// ---------- 2. Website ----------
let siteHtml = ''
await check('Website home page loads', async () => {
  const r = await fetch(SITE)
  siteHtml = await r.text()
  assert(r.ok, `HTTP ${r.status}`)
  assert(siteHtml.includes('<div id="root">'), 'Response is not the KasuwaHub app')
  return `HTTP ${r.status}`
})

await check('Deep links work (SPA redirect for /product/… and /orders)', async () => {
  for (const path of ['/shop?category=ankara', '/product/sunburst-ankara-print', '/orders']) {
    const r = await fetch(SITE + path)
    assert(r.ok, `${path} returned HTTP ${r.status} — add the SPA redirect (netlify.toml / vercel.json)`)
  }
})

await check('Website is built with the live API address (VITE_API_URL)', async () => {
  const js = siteHtml.match(/src="(\/assets\/[^"]+\.js)"/)?.[1]
  assert(js, 'Could not find the app bundle in index.html')
  const bundle = await (await fetch(SITE + js)).text()
  const host = new URL(API).host
  assert(bundle.includes(host), `Bundle does not contain ${host}. Set VITE_API_URL=${API}/api in Netlify and redeploy`)
})

await check('CORS allows the website to call the API', async () => {
  const r = await call('/products?limit=1', { headers: { Origin: SITE } })
  const allowed = r.headers.get('access-control-allow-origin')
  assert(allowed === SITE, `Got "${allowed}". Set CLIENT_URL=${SITE} on Render (no trailing slash)`)
})

// ---------- 3. Products ----------
let fabric
await check('Product catalogue, search and filters', async () => {
  const all = await call('/products?limit=60')
  assert(all.status === 200 && all.data.total > 0, 'No products — run `npm run seed` against the production database')
  const lace = await call('/products?q=lace')
  assert(lace.data.items.length > 0, 'Search for "lace" returned nothing')
  const fabrics = await call('/products?category=fabrics&sort=price-asc&maxPrice=10000')
  assert(fabrics.data.items.every((p) => p.price <= 10000), 'Price filter not applied')
  fabric = all.data.items.find((p) => !p.sizes?.length && p.stock >= p.minQty + 1)
  assert(fabric, 'No in-stock product without sizes to test the cart with')
  const detail = await call(`/products/${fabric.slug}`)
  assert(detail.status === 200 && detail.data.product.id === fabric.id, 'Product detail failed')
  return `${all.data.total} products`
})

// ---------- 4. Auth ----------
let token
const email = `smoke-${Date.now()}@example.com`
await check('Register, log in and read profile (JWT)', async () => {
  const reg = await call('/auth/register', { method: 'POST', body: { name: 'Smoke Test', email, password: 'smoke-test-pass-123' } })
  assert(reg.status === 201 && reg.data.token, `Register failed: ${reg.status} ${reg.data?.message}`)
  assert(!('password' in reg.data.user), 'Password leaked in response')
  const login = await call('/auth/login', { method: 'POST', body: { email, password: 'smoke-test-pass-123' } })
  assert(login.status === 200, `Login failed: ${login.data?.message}`)
  token = login.data.token
  const me = await call('/auth/me', { token })
  assert(me.status === 200 && me.data.user.email === email, '/auth/me failed')
})

await check('Protected routes reject missing/invalid tokens and non-admins', async () => {
  assert((await call('/cart')).status === 401, '/cart without token should be 401')
  assert((await call('/cart', { token: 'bad.token' })).status === 401, 'Bad token should be 401')
  const r = await call('/products', { method: 'POST', token, body: { name: 'x' } })
  assert(r.status === 403, `Customer creating a product should be 403, got ${r.status}`)
})

// ---------- 5. Cart & order ----------
let order
await check('Cart: add, update quantity, read totals', async () => {
  const add = await call('/cart/items', { method: 'POST', token, body: { productId: fabric.id, qty: fabric.minQty } })
  assert(add.status === 201, `Add to cart failed: ${add.data?.message}`)
  const line = add.data.items[0]
  const upd = await call(`/cart/items/${line.id}`, { method: 'PATCH', token, body: { qty: fabric.minQty + 1 } })
  assert(upd.data.subtotal === fabric.price * (fabric.minQty + 1), 'Cart subtotal is wrong')
})

await check('Checkout creates an order with the delivery fee', async () => {
  const r = await call('/orders', {
    method: 'POST', token,
    body: { deliveryZone: 'mainland', shippingAddress: { fullName: 'Smoke Test', phone: '08031234567', address: '1 Test Street', area: 'Yaba', notes: 'Automated smoke test — please ignore' } },
  })
  assert(r.status === 201, `Order failed: ${r.data?.message}`)
  order = r.data.order
  assert(order.total === order.subtotal + 2500, 'Total should include ₦2,500 mainland delivery')
  if (r.data.payment.demo) {
    const pay = await call(`/payments/demo/${encodeURIComponent(r.data.payment.reference)}/complete`, { method: 'POST', token })
    assert(pay.data?.order?.status === 'paid', 'Demo payment did not mark order paid')
    order = pay.data.order
    return `${order.orderNumber} · paid (demo mode)`
  }
  assert(/^https:\/\/checkout\.paystack\.com\//.test(r.data.payment.authorizationUrl), 'Paystack did not return a checkout link')
  return `${order.orderNumber} · Paystack checkout link created`
})

await check('Order history shows the order; cart cleared after payment', async () => {
  const mine = await call('/orders/mine', { token })
  assert(mine.data.items.some((o) => o.id === order.id), 'Order missing from history')
  if (order.status === 'paid') assert((await call('/cart', { token })).data.items.length === 0, 'Cart not cleared after payment')
})

// ---------- 6. Admin (optional) ----------
if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  let adminToken
  await check('Admin login', async () => {
    const r = await call('/auth/login', { method: 'POST', body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } })
    assert(r.status === 200 && r.data.user.role === 'admin', `Admin login failed: ${r.data?.message}`)
    adminToken = r.data.token
  })
  await check('Admin: add, update and delete a product', async () => {
    const c = await call('/products', { method: 'POST', token: adminToken, body: { name: `Smoke Test Item ${Date.now()}`, description: 'Temporary', category: 'accessories', price: 1000, stock: 1, seller: 'Smoke', isActive: false } })
    assert(c.status === 201, `Create failed: ${c.data?.message}`)
    const u = await call(`/products/${c.data.product.id}`, { method: 'PATCH', token: adminToken, body: { price: 1500 } })
    assert(u.data.product.price === 1500, 'Update failed')
    const d = await call(`/products/${c.data.product.id}`, { method: 'DELETE', token: adminToken })
    assert(d.status === 200, 'Delete failed')
  })
  await check('Admin: sees the order and cancels it (stock restored)', async () => {
    const list = await call('/orders', { token: adminToken })
    assert(list.data.items.some((o) => o.id === order.id), 'Order not in admin list')
    const route = order.status === 'pending' ? `/orders/${order.id}/cancel` : `/orders/${order.id}/status`
    const r = await call(route, { method: 'PATCH', token: order.status === 'pending' ? token : adminToken, body: { status: 'cancelled', note: 'Smoke test clean-up' } })
    assert(r.data?.order?.status === 'cancelled', `Cancel failed: ${r.data?.message}`)
  })
} else {
  console.log(dim('\n(admin checks skipped — set SMOKE_ADMIN_EMAIL and SMOKE_ADMIN_PASSWORD to include them)'))
}

console.log(`\n${failed ? red(`${failed} of ${results.length} checks failed`) : green(`All ${results.length} checks passed`)}\n`)
process.exit(failed ? 1 : 0)
