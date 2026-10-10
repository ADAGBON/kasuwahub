import mongoose from 'mongoose'
import { toJSONOptions } from '../config/db.js'
import { slugify } from '../utils/helpers.js'

export const CATEGORIES = ['ankara', 'aso-oke', 'lace', 'adire', 'ready-made', 'accessories']
export const FABRIC_CATEGORIES = ['ankara', 'aso-oke', 'lace', 'adire']

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 120 },
    slug: { type: String, unique: true, index: true },
    description: { type: String, required: [true, 'Description is required'], maxlength: 2000 },
    category: { type: String, required: true, enum: { values: CATEGORIES, message: 'Unknown category "{VALUE}"' } },
    price: { type: Number, required: [true, 'Price is required'], min: [1, 'Price must be greater than 0'] }, // whole Naira
    unit: { type: String, enum: ['yard', 'set', 'piece'], default: 'piece' },
    minQty: { type: Number, default: 1, min: 1 },
    sizes: { type: [String], default: undefined },
    stock: { type: Number, default: 0, min: [0, 'Stock cannot be negative'] },
    seller: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: Number, default: 0 },
    badge: { type: String, trim: true },
    images: [{ url: String, publicId: String }],
    // generated artwork used until real photos are uploaded
    pattern: { type: String, default: 'plain' },
    palette: { type: [String], default: ['#1f2a5c', '#e8a33d', '#faf5ec'] },
    garment: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: toJSONOptions },
)

productSchema.pre('validate', async function makeSlug(next) {
  if (this.slug && !this.isModified('name')) return next()
  const base = slugify(this.name || 'product')
  let slug = base
  let n = 1
  // ensure uniqueness: sunburst-ankara-print, sunburst-ankara-print-2, …
  while (await this.constructor.exists({ slug, _id: { $ne: this._id } })) slug = `${base}-${++n}`
  this.slug = slug
  next()
})

export default mongoose.model('Product', productSchema)
