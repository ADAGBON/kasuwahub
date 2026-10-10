import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { toJSONOptions } from '../config/db.js'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'],
    },
    phone: {
      type: String, trim: true,
      match: [/^(\+?234|0)[789][01]\d{8}$/, 'Enter a valid Nigerian phone number'],
    },
    password: { type: String, required: [true, 'Password is required'], minlength: [8, 'Password must be at least 8 characters'], select: false },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  },
  { timestamps: true, toJSON: { ...toJSONOptions, transform: (d, r) => { delete r._id; delete r.password; return r } } },
)

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.matchPassword = function matchPassword(plain) {
  return bcrypt.compare(plain, this.password)
}

export default mongoose.model('User', userSchema)
