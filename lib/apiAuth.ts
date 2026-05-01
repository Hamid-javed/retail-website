import { NextRequest } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export function isAdminRequest(request: NextRequest): boolean {
  const token = request.cookies.get(COOKIE_NAME)?.value
  return !!token && !!verifyToken(token)
}
