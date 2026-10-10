import mongoose from 'mongoose'

export async function connectDB(uri) {
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri)
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`)
  return mongoose.connection
}

// Shared JSON shape: expose `id`, hide `_id` and `__v`
export const toJSONOptions = {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id
    return ret
  },
}
