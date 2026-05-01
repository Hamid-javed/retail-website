import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('auth helpers', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.JWT_SECRET = 'testsecret'
    process.env.ADMIN_PASSWORD = 'testpassword'
  })

  it('signToken returns a string', async () => {
    const { signToken } = await import('../auth')
    const token = signToken()
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(10)
  })

  it('verifyToken returns payload for valid token', async () => {
    const { signToken, verifyToken } = await import('../auth')
    const token = signToken()
    const payload = verifyToken(token)
    expect(payload).toBeTruthy()
  })

  it('verifyToken returns null for invalid token', async () => {
    const { verifyToken } = await import('../auth')
    const result = verifyToken('invalid.token.here')
    expect(result).toBeNull()
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
