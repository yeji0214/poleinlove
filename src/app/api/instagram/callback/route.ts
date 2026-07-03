import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin
  const code = request.nextUrl.searchParams.get('code')
  const error = request.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${origin}/records/instagram?error=auth_failed`)
  }

  const redirectUri = `${origin}/api/instagram/callback`

  // 단기 토큰 발급
  const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.INSTAGRAM_APP_ID!,
      client_secret: process.env.INSTAGRAM_APP_SECRET!,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    }),
  })

  const shortLived = await tokenRes.json()

  if (shortLived.error_type || !shortLived.access_token) {
    console.error('Token exchange failed:', shortLived)
    return NextResponse.redirect(`${origin}/records/instagram?error=token_failed`)
  }

  // 장기 토큰으로 교환 (60일)
  const longLivedRes = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${shortLived.access_token}`,
  )

  const longLived = await longLivedRes.json()

  if (!longLived.access_token) {
    console.error('Long-lived token exchange failed:', longLived)
    return NextResponse.redirect(`${origin}/records/instagram?error=token_exchange_failed`)
  }

  const expiresAt = new Date(Date.now() + longLived.expires_in * 1000)

  await prisma.instagramToken.upsert({
    where: { id: 1 },
    update: { accessToken: longLived.access_token, expiresAt },
    create: { id: 1, accessToken: longLived.access_token, expiresAt },
  })

  return NextResponse.redirect(`${origin}/records/instagram`)
}
