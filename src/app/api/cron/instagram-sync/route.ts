import { NextRequest, NextResponse } from 'next/server'
import { getValidAccessToken, syncInstagramReels } from '@/lib/instagram-sync'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const accessToken = await getValidAccessToken()
  if (!accessToken) {
    return NextResponse.json({ error: 'Instagram 연동이 필요합니다' }, { status: 401 })
  }

  const result = await syncInstagramReels(accessToken)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })

  return NextResponse.json({ added: result.added, total: result.total })
}
