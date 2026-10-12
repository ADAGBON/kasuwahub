// Sets (or creates) the admin account password from ADMIN_EMAIL / ADMIN_PASSWORD in .env.
// Usage: change ADMIN_PASSWORD in .env, then run:  npm run admin:password
import mongoose from 'mongoose'
import { env } from '../src/config/env.js'
import { connectDB } from '../src/config/db.js'
import User from '../src/models/User.js'

const email = (process.env.ADMIN_EMAIL || 'admin@kasuwahub.ng').toLowerCase()
const password = process.env.ADMIN_PASSWORD
if (!password || password.length < 10) {
  console.error('Set ADMIN_PASSWORD in .env to at least 10 characters first.')
  process.exit(1)
}

await connectDB(env.mongoUri)
let user = await User.findOne({ email }).select('+password')
if (!user) user = new User({ name: 'KasuwaHub Admin', email, role: 'admin' })
user.password = password
user.role = 'admin'
await user.save()
console.log(`✅ Admin password updated for ${email}`)
await mongoose.disconnect()
