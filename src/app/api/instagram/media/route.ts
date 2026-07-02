import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function getValidToken(): Promise<string | null> {
  const token = await prisma.instagramToken.findFirst()
  if (!token) return null

  // 7일 이내 만료 예정이면 갱신
  if (token.expiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000) {
    const res = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${token.accessToken}`,
    )
    const refreshed = await res.json()
    if (refreshed.access_token) {
      const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000)
      await prisma.instagramToken.update({
        where: { id: token.id },
        data: { accessToken: refreshed.access_token, expiresAt },
      })
      return refreshed.access_token
    }
  }

  return token.accessToken
}

export async function GET() {
  const accessToken = await getValidToken()

  if (!accessToken) {
    return NextResponse.json({ error: 'not_connected' }, { status: 401 })
  }

  const res = await fetch(
    `https://graph.instagram.com/me/media?fields=id,caption,media_type,thumbnail_url,timestamp,permalink&limit=30&access_token=${accessToken}`,
  )
  const data = await res.json()

  if (data.error) {
    return NextResponse.json({ error: data.error.message }, { status: 400 })
  }

  const reels = (data.data ?? []).filter(
    (item: { media_type: string }) => item.media_type === 'REEL' || item.media_type === 'VIDEO',
  )

  return NextResponse.json({ reels })
}
