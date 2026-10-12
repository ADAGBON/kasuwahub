import mongoose from 'mongoose'
import { env } from './config/env.js'
import { connectDB } from './config/db.js'
import { createApp } from './app.js'

try {
  await connectDB(env.mongoUri)
} catch (err) {
  console.error('❌ Could not connect to MongoDB:', err.message)
  console.error('   Check MONGODB_URI and that Atlas Network Access allows 0.0.0.0/0')
  process.exit(1)
}

// Render provides PORT; 0.0.0.0 makes the server reachable inside the container
const server = createApp().listen(env.port, '0.0.0.0', () =>
  console.log(`KasuwaHub API running on port ${env.port} (${env.nodeEnv}) — allowed origins: ${env.clientUrls.join(', ')}`),
)

// Graceful shutdown when Render redeploys or the instance sleeps
const shutdown = (signal) => {
  console.log(`${signal} received — closing server`)
  server.close(() => mongoose.disconnect().then(() => process.exit(0)))
  setTimeout(() => process.exit(0), 10000).unref()
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
