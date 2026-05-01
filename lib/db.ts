import mongoose from 'mongoose'

declare global {
  var _mongoConn: Promise<typeof mongoose> | undefined
}

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI environment variable is not set')
  if (global._mongoConn) {
    await global._mongoConn
    return
  }
  global._mongoConn = mongoose.connect(uri)
  await global._mongoConn
}
