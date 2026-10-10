// Usage: npm run seed            → adds admin + products if the products collection is empty
//        npm run seed -- --reset → wipes products, carts, orders and customer accounts first
import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { connectDB } from '../config/db.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import Cart from '../models/Cart.js'
import Order from '../models/Order.js'
import { catalog } from './catalog.js'

export async function seed({ reset = false } = {}) {
  if (reset) await Promise.all([Product.deleteMany({}), Cart.deleteMany({}), Order.deleteMany({}), User.deleteMany({ role: 'customer' })])

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@kasuwahub.ng').toLowerCase()
  if (!(await User.exists({ email: adminEmail }))) {
    await User.create({ name: 'KasuwaHub Admin', email: adminEmail, password: process.env.ADMIN_PASSWORD || 'ChangeMe123!', role: 'admin' })
    console.log(`Admin created: ${adminEmail}`)
  }

  if (await Product.estimatedDocumentCount()) {
    console.log('Products already exist — skipping (use --reset to reseed)')
    return
  }
  // create one-by-one so slug generation runs for each
  for (const { id: _legacyId, ...p } of catalog) await Product.create(p)
  console.log(`Seeded ${catalog.length} products`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await connectDB(env.mongoUri)
  await seed({ reset: process.argv.includes('--reset') })
  await mongoose.disconnect()
}
