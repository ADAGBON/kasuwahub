import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { env } from '../config/env.js'

export const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn })

// Requires a valid "Authorization: Bearer <token>" header
export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) throw ApiError.unauthorized()

  let payload
  try {
    payload = jwt.verify(token, env.jwtSecret)
  } catch {
    throw ApiError.unauthorized('Your session has expired — please sign in again')
  }

  const user = await User.findById(payload.sub)
  if (!user) throw ApiError.unauthorized('Account no longer exists')
  req.user = user
  next()
})

export const adminOnly = (req, _res, next) => {
  if (req.user?.role !== 'admin') return next(ApiError.forbidden('Admin access only'))
  next()
}

// Attaches req.user if a valid token is present, but never blocks the request
export const optionalAuth = async (req, _res, next) => {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) return next()
  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret)
    req.user = await User.findById(payload.sub)
  } catch { /* ignore invalid token on public routes */ }
  next()
}
