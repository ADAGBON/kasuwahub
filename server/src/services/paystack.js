import crypto from 'node:crypto'
import { env } from '../config/env.js'
import ApiError from '../utils/ApiError.js'

const BASE = 'https://api.paystack.co'

// Without a secret key the app runs in demo mode so the full order flow can still be shown
export const isPaystackEnabled = () => Boolean(env.paystackSecret)

async function call(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${env.paystackSecret}`, 'Content-Type': 'application/json', ...options.headers },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.status === false) throw new ApiError(502, `Paystack: ${body.message || res.statusText}`)
  return body.data
}

// Amounts are sent in kobo (₦1 = 100 kobo)
export const initializeTransaction = ({ email, amount, reference, callbackUrl, metadata }) =>
  call('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({ email, amount: amount * 100, currency: 'NGN', reference, callback_url: callbackUrl, metadata }),
  })

export const verifyTransaction = (reference) => call(`/transaction/verify/${encodeURIComponent(reference)}`)

// Paystack signs webhooks with HMAC-SHA512 of the raw body using your secret key
export function isValidSignature(rawBody, signature) {
  if (!signature || !env.paystackSecret) return false
  const expected = crypto.createHmac('sha512', env.paystackSecret).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(String(signature))
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
