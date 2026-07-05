import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'

const anthropic = new Anthropic()
const DIFFICULTY_TAGS = ['입문', '초급', '중급', '고급'] as const

interface InstagramMedia {
  id: string
  caption?: string
  media_type: string
  thumbnail_url?: string
  timestamp: string
  permalink?: string
}

function extractSkillFromCaption(caption: string | null | undefined): string {
  if (!caption) return ''
  const matches = [...caption.matchAll(/#pd([a-zA-Z가-힣]+)/gi)]
  if (matches.length === 0) return ''
  return matches.map((m) => m[1].charAt(0).toUpperCase() + m[1].slice(1)).join(' · ')
}

async function fetchAllReels(
  accessToken: string,
): Promise<{ reels?: InstagramMedia[]; error?: string }> {
  const reels: InstagramMedia[] = []
  let url: string | null = `https://graph.instagram.com/me/media?fields=id,caption,media_type,thumbnail_url,timestamp,permalink&limit=100&access_token=${accessToken}`

  while (url) {
    const res: Response = await fetch(url, { cache: 'no-store' })
    const data = await res.json()
    if (data.error) return { error: data.error.message }

    const items: InstagramMedia[] = data.data ?? []
    reels.push(...items.filter((i) => i.media_type === 'REEL' || i.media_type === 'VIDEO'))
    url = data.paging?.next ?? null
  }

  return { reels }
}

// 배치로 Claude에 난이도 태그 요청 (100개씩)
async function batchAssignTags(
  items: Array<{ id: string; skillName: string; caption: string | null }>,
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>()
  const BATCH_SIZE = 100

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE)
    const input = batch.map((r) => ({
      id: r.id,
      skill: r.skillName,
      caption: r.caption ? r.caption.slice(0, 300) : '',
    }))

    try {
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `다음 폴댄스 기록들의 난이도를 판단해줘. 입문/초급/중급/고급 중 해당하는 것을 JSON으로만 반환해.

난이도 기준:
- 입문: 폴댄스 처음 배우는 기초 동작
- 초급: 기본기를 익힌 후 배우는 동작
- 중급: 어느 정도 힘과 유연성이 필요한 동작
- 고급: 높은 수준의 힘, 유연성, 기술이 필요한 동작

한 기록에 여러 난이도가 있을 수 있어. 판단이 어려우면 빈 배열.

기록: ${JSON.stringify(input)}

응답 형식 (다른 말 없이 JSON만): {"id1": ["초급"], "id2": ["초급","중급"]}`,
          },
        ],
      })

      const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}'
      const parsed: Record<string, string[]> = JSON.parse(text)
      for (const [id, tags] of Object.entries(parsed)) {
        const valid = tags.filter((t) => (DIFFICULTY_TAGS as readonly string[]).includes(t))
        result.set(id, valid)
      }
    } catch {
      // 배치 실패 시 해당 배치는 태그 없이 진행
    }
  }

  return result
}

export async function syncInstagramReels(
  accessToken: string,
): Promise<{ added: number; total: number; error?: string }> {
  const { reels, error } = await fetchAllReels(accessToken)
  if (error || !reels) return { added: 0, total: 0, error }

  const existingRecords = await prisma.record.findMany({
    where: { instagramMediaId: { not: null } },
    select: { instagramMediaId: true, instagramUrl: true },
  })
  const existingMap = new Map(existingRecords.map((r) => [r.instagramMediaId as string, r]))

  // 새로운 릴스만 추출
  const newReels = reels.filter((r) => !existingMap.has(r.id))

  // 기존 기록 링크 업데이트
  for (const reel of reels) {
    const existing = existingMap.get(reel.id)
    if (existing && !existing.instagramUrl && reel.permalink) {
      await prisma.record.update({
        where: { instagramMediaId: reel.id },
        data: { instagramUrl: reel.permalink },
      })
    }
  }

  if (newReels.length === 0) return { added: 0, total: reels.length }

  // 새 릴스 AI 태그 일괄 생성
  const tagItems = newReels.map((r) => ({
    id: r.id,
    skillName: extractSkillFromCaption(r.caption) || '미분류',
    caption: r.caption ?? null,
  }))
  const tagMap = await batchAssignTags(tagItems)

  // 새 기록 저장
  let added = 0
  for (const reel of newReels) {
    const skillName = extractSkillFromCaption(reel.caption) || '미분류'
    const tags = tagMap.get(reel.id) ?? []

    const record = await prisma.record.create({
      data: {
        skillName,
        performedAt: new Date(reel.timestamp),
        sessionNote: reel.caption ?? null,
        instagramMediaId: reel.id,
        instagramUrl: reel.permalink ?? null,
        tags,
      },
    })

    if (reel.thumbnail_url) {
      await prisma.image.create({
        data: { url: reel.thumbnail_url, recordId: record.id, order: 0 },
      })
    }

    added++
  }

  return { added, total: reels.length }
}
