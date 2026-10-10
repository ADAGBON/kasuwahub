import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { signToken } from '../middleware/auth.js'
import { pick } from '../utils/helpers.js'

const authResponse = (res, user, status = 200) =>
  res.status(status).json({ token: signToken(user), user })

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const data = pick(req.body, ['name', 'email', 'phone', 'password']) // role can never be set here
  if (data.phone) data.phone = data.phone.replace(/\s/g, '')
  const user = await User.create(data)
  authResponse(res, user, 201)
})

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) throw ApiError.badRequest('Email and password are required')
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password')
  if (!user || !(await user.matchPassword(password))) throw ApiError.unauthorized('Incorrect email or password')
  authResponse(res, user)
})

// GET /api/auth/me
export const me = (req, res) => res.json({ user: req.user })

// PATCH /api/auth/me
export const updateMe = asyncHandler(async (req, res) => {
  const data = pick(req.body, ['name', 'phone'])
  if (data.phone) data.phone = data.phone.replace(/\s/g, '')
  Object.assign(req.user, data)
  await req.user.save()
  res.json({ user: req.user })
})
