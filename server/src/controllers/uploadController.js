import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { env } from '../config/env.js'
import ApiError from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const enabled = Boolean(env.cloudinary.cloud_name && env.cloudinary.api_key && env.cloudinary.api_secret)
if (enabled) cloudinary.config(env.cloudinary)

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    /^image\/(jpeg|png|webp)$/.test(file.mimetype) ? cb(null, true) : cb(ApiError.badRequest('Only JPG, PNG or WebP images')),
}).single('image')

// POST /api/uploads (admin, multipart field "image")
export const uploadImage = asyncHandler(async (req, res) => {
  if (!enabled) throw new ApiError(501, 'Image uploads need Cloudinary keys in .env')
  if (!req.file) throw ApiError.badRequest('No image provided')
  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: 'kasuwahub/products', resource_type: 'image' }, (err, r) => (err ? reject(err) : resolve(r)))
      .end(req.file.buffer)
  })
  res.status(201).json({ url: result.secure_url, publicId: result.public_id })
})
