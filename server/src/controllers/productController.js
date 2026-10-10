import Product, { CATEGORIES, FABRIC_CATEGORIES } from '../models/Product.js'
import ApiError from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { escapeRegex, pick } from '../utils/helpers.js'

const EDITABLE = ['name', 'description', 'category', 'price', 'unit', 'minQty', 'sizes', 'stock', 'seller',
  'location', 'badge', 'images', 'pattern', 'palette', 'garment', 'isActive']

const SORTS = {
  popular: { reviews: -1, _id: 1 },
  'price-asc': { price: 1, _id: 1 },
  'price-desc': { price: -1, _id: 1 },
  rating: { rating: -1, _id: 1 },
  newest: { createdAt: -1, _id: 1 },
}

const isObjectId = (v) => /^[a-f\d]{24}$/i.test(v)
const findByIdOrSlug = (key) => Product.findOne(isObjectId(key) ? { _id: key } : { slug: key })

// GET /api/products?q=&category=&minPrice=&maxPrice=&sort=&page=&limit=
export const listProducts = asyncHandler(async (req, res) => {
  const { q = '', category, minPrice, maxPrice, sort = 'popular', includeInactive } = req.query
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = Math.min(60, Math.max(1, parseInt(req.query.limit, 10) || 24))

  const filter = {}
  // admins can see hidden products in the dashboard
  if (!(includeInactive === 'true' && req.user?.role === 'admin')) filter.isActive = true

  if (category === 'fabrics') filter.category = { $in: FABRIC_CATEGORIES }
  else if (category && category !== 'all') filter.category = category

  const min = Number(minPrice)
  const max = Number(maxPrice)
  if (minPrice || maxPrice) {
    filter.price = {}
    if (minPrice && !Number.isNaN(min)) filter.price.$gte = min
    if (maxPrice && !Number.isNaN(max)) filter.price.$lte = max
  }

  // every word must appear in at least one searchable field
  const words = String(q).trim().split(/\s+/).filter(Boolean).slice(0, 6)
  if (words.length) {
    filter.$and = words.map((w) => {
      const rx = new RegExp(escapeRegex(w), 'i')
      return { $or: [{ name: rx }, { description: rx }, { seller: rx }, { location: rx }, { category: rx }] }
    })
  }

  const [items, total] = await Promise.all([
    Product.find(filter).sort(SORTS[sort] || SORTS.popular).skip((page - 1) * limit).limit(limit),
    Product.countDocuments(filter),
  ])

  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) })
})

// GET /api/products/categories — counts per category
export const categoryCounts = asyncHandler(async (_req, res) => {
  const counts = Object.fromEntries(
    await Promise.all(CATEGORIES.map(async (c) => [c, await Product.countDocuments({ category: c, isActive: true })])),
  )
  counts.fabrics = FABRIC_CATEGORIES.reduce((s, c) => s + counts[c], 0)
  counts.all = CATEGORIES.reduce((s, c) => s + counts[c], 0)
  res.json(counts)
})

// GET /api/products/:idOrSlug
export const getProduct = asyncHandler(async (req, res) => {
  const product = await findByIdOrSlug(req.params.idOrSlug)
  if (!product || (!product.isActive && req.user?.role !== 'admin')) throw ApiError.notFound('Product not found')
  const related = await Product.find({ category: product.category, _id: { $ne: product._id }, isActive: true })
    .sort(SORTS.popular).limit(4)
  res.json({ product, related })
})

// POST /api/products (admin)
export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(pick(req.body, EDITABLE))
  res.status(201).json({ product })
})

// PUT|PATCH /api/products/:id (admin)
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await findByIdOrSlug(req.params.idOrSlug)
  if (!product) throw ApiError.notFound('Product not found')
  Object.assign(product, pick(req.body, EDITABLE))
  await product.save()
  res.json({ product })
})

// DELETE /api/products/:id (admin) — past orders keep their own snapshot of the product
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await findByIdOrSlug(req.params.idOrSlug)
  if (!product) throw ApiError.notFound('Product not found')
  await product.deleteOne()
  res.json({ message: 'Product deleted', id: product.id })
})
