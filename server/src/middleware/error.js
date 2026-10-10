import ApiError from '../utils/ApiError.js'
import { isProd } from '../config/env.js'

export const notFound = (req, _res, next) => next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`))

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let status = err.status || 500
  let message = err.message || 'Something went wrong'
  let details = err.details

  if (err.name === 'ValidationError') {
    status = 400
    details = Object.fromEntries(Object.entries(err.errors).map(([k, e]) => [k, e.message]))
    message = Object.values(details)[0] || 'Invalid data'
  } else if (err.name === 'CastError') {
    status = 400
    message = `Invalid ${err.path}`
  } else if (err.code === 11000) {
    status = 409
    const field = Object.keys(err.keyValue || err.keyPattern || {})[0] || 'field'
    message = field === 'email' ? 'An account with this email already exists' : `Duplicate ${field}`
  } else if (err.type === 'entity.parse.failed') {
    status = 400
    message = 'Malformed JSON body'
  }

  if (status >= 500) console.error(err)
  res.status(status).json({
    message: status >= 500 && isProd ? 'Internal server error' : message,
    ...(details && { details }),
  })
}
