import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const secret = searchParams.get('secret')

  if (!secret || secret !== process.env.INIT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!token) {
    return NextResponse.json({ error: 'token required' }, { status: 400 })
  }

  let accessToken = token
  let expiresAt: Date

  const res = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${token}`,
  )
  const data = await res.json()

  if (data.access_token) {
    accessToken = data.access_token
    expiresAt = new Date(Date.now() + data.expires_in * 1000)
  } else {
    // Already long-lived token — use 60-day default
    expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
  }

  await prisma.instagramToken.upsert({
    where: { id: 1 },
    update: { accessToken, expiresAt },
    create: { id: 1, accessToken, expiresAt },
  })

  return NextResponse.json({ success: true, expiresAt })
}
