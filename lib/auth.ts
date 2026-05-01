import jwt from 'jsonwebtoken'

const COOKIE_NAME = 'admin_token'

export function signToken(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  return jwt.sign({ admin: true }, secret, { expiresIn: '7d' })
}

export function verifyToken(token: string): jwt.JwtPayload | null {
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) return null
    return jwt.verify(token, secret) as jwt.JwtPayload
  } catch {
    return null
  }
}

export function checkPassword(input: string): boolean {
  return input === process.env.ADMIN_PASSWORD
}

export { COOKIE_NAME }
