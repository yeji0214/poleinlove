import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken, SESSION_COOKIE_NAME } from '@/lib/session'

export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!verifyToken(token)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!login|api/instagram/callback|api/instagram/init|manifest.webmanifest|_next/static|_next/image|.*\\.(?:ico|png|svg|jpg|jpeg|webp)$).*)'],
}
