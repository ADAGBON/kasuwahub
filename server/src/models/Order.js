import mongoose from 'mongoose'
import { toJSONOptions } from '../config/db.js'

export const ORDER_STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']

// Allowed admin transitions — keeps fulfilment in a sensible order
export const STATUS_FLOW = {
  pending: ['cancelled'],
  paid: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

// Snapshot of the product at the time of purchase (price changes later don't affect old orders)
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String,
    slug: String,
    price: Number,
    unit: String,
    qty: { type: Number, min: 1 },
    size: String,
    seller: String,
    lineTotal: Number,
    pattern: String,
    palette: [String],
    garment: String,
    image: String,
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], validate: [(v) => v.length > 0, 'Order has no items'] },
    shippingAddress: {
      fullName: { type: String, required: [true, 'Full name is required'] },
      phone: { type: String, required: [true, 'Phone number is required'] },
      address: { type: String, required: [true, 'Street address is required'] },
      area: { type: String, required: [true, 'Area / LGA is required'] },
      notes: String,
    },
    deliveryZone: { type: String, enum: ['island', 'mainland', 'outskirts'], required: true },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    total: { type: Number, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    statusHistory: [{ status: String, at: { type: Date, default: Date.now }, note: String }],
    payment: {
      provider: { type: String, default: 'paystack' },
      reference: { type: String, index: true },
      status: { type: String, enum: ['unpaid', 'paid', 'failed'], default: 'unpaid' },
      channel: String,
      paidAt: Date,
    },
  },
  { timestamps: true, toJSON: toJSONOptions },
)

orderSchema.pre('validate', function makeOrderNumber(next) {
  if (!this.orderNumber) {
    const d = new Date()
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
    this.orderNumber = `KH-${ymd}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
  }
  if (this.isNew && !this.statusHistory.length) this.statusHistory.push({ status: this.status })
  next()
})

export default mongoose.model('Order', orderSchema)
