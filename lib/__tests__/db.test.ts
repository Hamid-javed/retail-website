import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn().mockResolvedValue({}),
    connection: { readyState: 0 },
  },
}))

describe('connectDB', () => {
  beforeEach(() => {
    vi.resetModules()
    global._mongoConn = undefined
  })

  it('calls mongoose.connect with MONGODB_URI', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
    const mongoose = (await import('mongoose')).default
    const { connectDB } = await import('../db')
    await connectDB()
    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/test')
  })

  it('throws if MONGODB_URI is not set', async () => {
    delete process.env.MONGODB_URI
    const { connectDB } = await import('../db')
    await expect(connectDB()).rejects.toThrow('MONGODB_URI')
  })
})
