import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('auth helpers', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.JWT_SECRET = 'testsecret-that-is-long-enough-for-jose'
    process.env.ADMIN_PASSWORD = 'testpassword'
  })

  it('signToken returns a string', async () => {
    const { signToken } = await import('../auth')
    const token = await signToken()
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(10)
  })

  it('verifyToken returns true for valid token', async () => {
    const { signToken, verifyToken } = await import('../auth')
    const token = await signToken()
    const result = await verifyToken(token)
    expect(result).toBe(true)
  })

  it('verifyToken returns false for invalid token', async () => {
    const { verifyToken } = await import('../auth')
    const result = await verifyToken('invalid.token.here')
    expect(result).toBe(false)
  })

  it('checkPassword returns true for correct password', async () => {
    const { checkPassword } = await import('../auth')
    expect(checkPassword('testpassword')).toBe(true)
  })

  it('checkPassword returns false for wrong password', async () => {
    const { checkPassword } = await import('../auth')
    expect(checkPassword('wrongpassword')).toBe(false)
  })
})
