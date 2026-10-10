import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env.js'
import routes from './routes/index.js'
import { paystackWebhook } from './controllers/paymentController.js'
import { errorHandler, notFound } from './middleware/error.js'

export function createApp() {
  const app = express()
  app.set('trust proxy', 1) // Render/Vercel sit behind a proxy

  app.use(helmet())
  const allowed = env.clientUrl.split(',').map((s) => s.trim())
  app.use(cors({ origin: (origin, cb) => cb(null, !origin || allowed.includes(origin)) }))
  if (env.nodeEnv !== 'test') app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))

  // Paystack signs the exact raw bytes, so this route must run before express.json()
  app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paystackWebhook)

  app.use(express.json({ limit: '100kb' }))
  app.get('/', (_req, res) => res.json({ name: 'KasuwaHub API', docs: '/api/health' }))
  app.use('/api', routes)

  app.use(notFound)
  app.use(errorHandler)
  return app
}
