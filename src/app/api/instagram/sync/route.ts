import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncInstagramReels } from '@/lib/instagram-sync'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const token = await prisma.instagramToken.findFirst()
  if (!token) {
    return NextResponse.json({ error: 'Instagram 연동이 필요합니다' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  if (body?.reset === true) {
    await prisma.record.deleteMany({})
  }

  const result = await syncInstagramReels(token.accessToken, body?.reset === true)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })

  return NextResponse.json({ added: result.added, total: result.total })
}
