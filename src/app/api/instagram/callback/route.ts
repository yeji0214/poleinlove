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

  // Facebook 단기 토큰 발급
  const tokenRes = await fetch(
    `https://graph.facebook.com/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`,
  )
  const tokenData = await tokenRes.json()

  if (tokenData.error || !tokenData.access_token) {
    console.error('Token exchange failed:', tokenData)
    return NextResponse.redirect(`${origin}/records/instagram?error=token_failed`)
  }

  // Facebook 장기 토큰으로 교환 (60일)
  const longLivedRes = await fetch(
    `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`,
  )
  const longLivedData = await longLivedRes.json()

  if (!longLivedData.access_token) {
    console.error('Long-lived token exchange failed:', longLivedData)
    return NextResponse.redirect(`${origin}/records/instagram?error=token_exchange_failed`)
  }

  const expiresAt = new Date(Date.now() + (longLivedData.expires_in ?? 5184000) * 1000)

  await prisma.instagramToken.upsert({
    where: { id: 1 },
    update: { accessToken: longLivedData.access_token, expiresAt },
    create: { id: 1, accessToken: longLivedData.access_token, expiresAt },
  })

  return NextResponse.redirect(`${origin}/records/instagram`)
}
