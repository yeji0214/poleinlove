import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'

const anthropic = new Anthropic()
const DIFFICULTY_TAGS = ['입문', '초급', '중급', '고급'] as const
const SENTIMENTS = ['좋았던', '어려웠던', '복습필요'] as const
const BATCH_SIZE = 100

// 만료 7일 이내면 인스타그램 refresh API로 장기 토큰을 갱신하고 DB에 반영.
// 저장된 토큰이 없으면 null.
export async function getValidAccessToken(): Promise<string | null> {
  const token = await prisma.instagramToken.findFirst()
  if (!token) return null

  if (token.expiresAt.getTime() - Date.now() >= 7 * 24 * 60 * 60 * 1000) {
    return token.accessToken
  }

  const res = await fetch(
    `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${token.accessToken}`,
  )
  const refreshed = await res.json()
  if (!refreshed.access_token) return token.accessToken

  const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000)
  await prisma.instagramToken.update({
    where: { id: token.id },
    data: { accessToken: refreshed.access_token, expiresAt },
  })
  return refreshed.access_token
}

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

// 인스타그램 썸네일 URL은 며칠 후 만료되는 임시 서명 URL이라, 다운로드해서
// Supabase Storage에 영구 저장하고 그 URL을 반환. 실패 시 null.
export async function uploadThumbnailToStorage(thumbnailUrl: string): Promise<string | null> {
  try {
    const res = await fetch(thumbnailUrl)
    if (!res.ok) return null
    const blob = await res.blob()

    const path = `instagram-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
    const { error } = await supabase.storage
      .from('record-images')
      .upload(path, blob, { contentType: 'image/jpeg' })
    if (error) return null

    const { data } = supabase.storage.from('record-images').getPublicUrl(path)
    return data.publicUrl
  } catch {
    return null
  }
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

// Claude에 100개씩 배치 요청 → 각 배치 응답을 파싱해 id별 결과 Map으로 합침.
// 배치 단위 실패(요청 에러, JSON 파싱 실패)는 해당 배치만 스킵하고 계속 진행.
async function batchClaudeExtract<I extends { id: string }, T>(
  items: I[],
  opts: {
    toPromptItem: (item: I) => unknown
    prompt: (inputJson: string) => string
    parseValue: (raw: unknown) => T | undefined
  },
): Promise<Map<string, T>> {
  const result = new Map<string, T>()

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE)
    const input = batch.map(opts.toPromptItem)

    try {
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: opts.prompt(JSON.stringify(input)) }],
      })

      const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}'
      // 마크다운 코드블록 제거
      const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
      const parsed: Record<string, unknown> = JSON.parse(text)

      for (const [id, value] of Object.entries(parsed)) {
        const parsedValue = opts.parseValue(value)
        if (parsedValue !== undefined) result.set(id, parsedValue)
      }
    } catch {
      // 배치 실패 시 스킵
    }
  }

  return result
}

// 캡션에서 감정·상태 분류 (좋았던/어려웠던/복습필요)
export function batchAnalyzeSentiments(
  items: Array<{ id: string; caption: string }>,
): Promise<Map<string, string[]>> {
  return batchClaudeExtract(items, {
    toPromptItem: (r) => ({ id: r.id, caption: r.caption.slice(0, 300) }),
    prompt: (inputJson) => `다음 폴댄스 캡션들을 읽고 각 기록의 감정·상태를 분류해줘.

분류 기준:
- 좋았던: 기술이 잘 됐다, 성공했다, 기뻤다, 좋았다는 내용이 있을 때
- 어려웠던: 힘들었다, 어려웠다, 아팠다, 못했다는 내용이 있을 때
- 복습필요: 더 연습하고 싶다, 아직 부족하다, 다음에 더 잘하고 싶다는 내용이 있을 때

여러 개 해당 가능. 캡션에서 명확히 읽히지 않으면 빈 배열 [].

기록: ${inputJson}

응답 형식 (다른 말 없이 JSON만): {"1": ["좋았던"], "2": ["어려웠던", "복습필요"], "3": []}`,
    parseValue: (raw) => {
      const vals = Array.isArray(raw) ? raw : []
      return [...new Set(vals.filter((v): v is string => (SENTIMENTS as readonly string[]).includes(v)))]
    },
  })
}

// 캡션에서 연습한 기술명 추출
export function batchExtractSkills(
  items: Array<{ id: string; caption: string }>,
): Promise<Map<string, string>> {
  return batchClaudeExtract(items, {
    toPromptItem: (r) => ({ id: r.id, caption: r.caption.slice(0, 300) }),
    prompt: (inputJson) => `다음 폴댄스 캡션에서 연습한 기술명을 추출해줘. 기술명이 여러 개면 ' · '로 연결해서 반환해. 기술명을 확인할 수 없으면 빈 문자열 ""을 반환해.

주의: 기술명만 추출해. 감정, 설명, 수식어는 제외해. 예) "사이드 클라임" O, "사이드 클라임으로 올라가는게 힘들어" X

기록: ${inputJson}

응답 형식 (다른 말 없이 JSON만): {"1": "엔젤스핀 · 히어로", "2": "스타게이저", "3": ""}`,
    parseValue: (raw) => (typeof raw === 'string' && raw.trim() ? raw.trim() : undefined),
  })
}

// 기술명 + 캡션으로 난이도 태그 배정
function batchAssignTags(
  items: Array<{ id: string; skillName: string; caption: string | null }>,
): Promise<Map<string, string[]>> {
  return batchClaudeExtract(items, {
    toPromptItem: (r) => ({ id: r.id, skill: r.skillName, caption: r.caption ? r.caption.slice(0, 300) : '' }),
    prompt: (inputJson) => `다음 폴댄스 기록들의 난이도를 판단해줘. 입문/초급/중급/고급 중 명확히 해당하는 것만 JSON으로 반환해.

난이도 기준:
- 입문: 폴댄스를 처음 배우는 단계의 기초 동작
- 초급: 기본기를 익힌 후 배우는 동작
- 중급: 어느 정도 힘과 유연성이 필요한 동작
- 고급: 높은 수준의 힘, 유연성, 기술이 복합적으로 필요한 동작

중요: 캡션만으로 난이도를 확신할 수 없거나, 기술명만으로 판단이 어려우면 반드시 빈 배열 []을 반환해. 억지로 태그를 붙이지 마.

기록: ${inputJson}

응답 형식 (다른 말 없이 JSON만): {"id1": ["초급"], "id2": [], "id3": ["중급","고급"]}`,
    parseValue: (raw) => {
      const vals = Array.isArray(raw) ? raw : []
      return [...new Set(vals.filter((t): t is string => (DIFFICULTY_TAGS as readonly string[]).includes(t)))]
    },
  })
}

export async function syncInstagramReels(
  accessToken: string,
  skipAiTags = false,
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

  // #pd 해시태그로 기술명 추출, 없으면 AI 추출 대상으로 분류
  const hashtagSkillMap = new Map(
    newReels.map((r) => [r.id, extractSkillFromCaption(r.caption)])
  )
  const noHashtagReels = newReels.filter((r) => !hashtagSkillMap.get(r.id) && r.caption)

  // AI 기술명 추출 + 태그 배정 + 감정 분석 (reset 시엔 스킵)
  const reelsWithCaption = newReels.filter((r) => r.caption)
  const [aiSkillMap, tagMap, sentimentMap] = skipAiTags
    ? [new Map<string, string>(), new Map<string, string[]>(), new Map<string, string[]>()]
    : await Promise.all([
        batchExtractSkills(noHashtagReels.map((r) => ({ id: r.id, caption: r.caption! }))),
        batchAssignTags(
          newReels.map((r) => ({
            id: r.id,
            skillName: hashtagSkillMap.get(r.id) || '미분류',
            caption: r.caption ?? null,
          })),
        ),
        batchAnalyzeSentiments(reelsWithCaption.map((r) => ({ id: r.id, caption: r.caption! }))),
      ])

  // 새 기록 저장
  let added = 0
  for (const reel of newReels) {
    const skillName = hashtagSkillMap.get(reel.id) || aiSkillMap.get(reel.id) || '미분류'
    const tags = tagMap.get(reel.id) ?? []
    const sentiments = reel.caption
      ? (sentimentMap.get(reel.id) ?? ['없음'])
      : ['없음']

    const record = await prisma.record.create({
      data: {
        skillName,
        performedAt: new Date(reel.timestamp),
        sessionNote: reel.caption ?? null,
        instagramMediaId: reel.id,
        instagramUrl: reel.permalink ?? null,
        tags,
        sentiments,
      },
    })

    if (reel.thumbnail_url) {
      const permanentUrl = await uploadThumbnailToStorage(reel.thumbnail_url)
      if (permanentUrl) {
        await prisma.image.create({
          data: { url: permanentUrl, recordId: record.id, order: 0 },
        })
      }
    }

    added++
  }

  return { added, total: reels.length }
}
