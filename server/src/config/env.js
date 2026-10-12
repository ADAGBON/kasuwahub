import 'dotenv/config'

const required = ['MONGODB_URI', 'JWT_SECRET']
const missing = required.filter((k) => !process.env[k])
if (missing.length && process.env.NODE_ENV !== 'test') {
  console.error(`Missing required env vars: ${missing.join(', ')} — see .env.example`)
  process.exit(1)
}

// CLIENT_URL may list several origins separated by commas (e.g. Netlify URL + localhost).
// Trailing slashes are removed because browsers send the Origin without one.
const clientUrls = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim().replace(/\/+$/, ''))
  .filter(Boolean)

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: clientUrls[0], // used for Paystack redirect links
  clientUrls,              // allowed CORS origins
  paystackSecret: process.env.PAYSTACK_SECRET_KEY || '',
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },
}

export const isProd = env.nodeEnv === 'production'

if (isProd) {
  if (!process.env.CLIENT_URL) console.warn('⚠ CLIENT_URL is not set — the website will be blocked by CORS')
  if ((env.jwtSecret || '').length < 32) console.warn('⚠ JWT_SECRET is short — use at least 32 random characters')
}
