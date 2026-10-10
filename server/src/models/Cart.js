import mongoose from 'mongoose'
import { toJSONOptions } from '../config/db.js'

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true, min: 1 },
    size: { type: String, default: null },
  },
  { toJSON: toJSONOptions },
)

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
  },
  { timestamps: true, toJSON: toJSONOptions },
)

export default mongoose.model('Cart', cartSchema)
