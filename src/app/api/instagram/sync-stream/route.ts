import { NextResponse } from 'next/server'
import { getValidAccessToken, syncInstagramReels } from '@/lib/instagram-sync'
import type { SyncProgressEvent } from '@/lib/syncProgress'

export const maxDuration = 60

// 수동 동기화 버튼 전용 SSE 스트림. 크론(api/cron/instagram-sync)은 지켜보는
// 사람이 없어 진행 상황을 스트리밍할 이유가 없으므로 별도로 둔다.
export async function GET() {
  const accessToken = await getValidAccessToken()
  if (!accessToken) {
    return NextResponse.json({ error: 'Instagram 연동이 필요합니다' }, { status: 401 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: SyncProgressEvent) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      try {
        await syncInstagramReels(accessToken, false, send)
      } catch (err) {
        send({
          stage: 'error',
          message: err instanceof Error ? err.message : '동기화 중 오류가 발생했어요',
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
