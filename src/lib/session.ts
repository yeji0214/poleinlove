import { createHmac } from 'crypto'
import { cookies } from 'next/headers'

export const SESSION_COOKIE_NAME = 'session'

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30일

function sign(value: string) {
  return createHmac('sha256', process.env.SESSION_SECRET ?? '')
    .update(value)
    .digest('hex')
}

export function verifyToken(token: string | undefined | null): boolean {
  if (!token) return false
  const [expiresAt, signature] = token.split('.')
  if (!expiresAt || !signature) return false
  if (sign(expiresAt) !== signature) return false
  return Date.now() < Number(expiresAt)
}

export async function createSession() {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000
  const token = `${expiresAt}.${sign(String(expiresAt))}`

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
