import { prisma } from '@/lib/prisma'

interface InstagramMedia {
  id: string
  caption?: string
  media_type: string
  thumbnail_url?: string
  timestamp: string
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
  let url: string | null = `https://graph.instagram.com/me/media?fields=id,caption,media_type,thumbnail_url,timestamp&limit=100&access_token=${accessToken}`

  while (url) {
    const res = await fetch(url, { cache: 'no-store' })
    const data = await res.json()
    if (data.error) return { error: data.error.message }

    const items: InstagramMedia[] = data.data ?? []
    reels.push(...items.filter((i) => i.media_type === 'REEL' || i.media_type === 'VIDEO'))
    url = data.paging?.next ?? null
  }

  return { reels }
}

export async function syncInstagramReels(
  accessToken: string,
): Promise<{ added: number; total: number; error?: string }> {
  const { reels, error } = await fetchAllReels(accessToken)
  if (error || !reels) return { added: 0, total: 0, error }

  const existingIds = new Set(
    (
      await prisma.record.findMany({
        where: { instagramMediaId: { not: null } },
        select: { instagramMediaId: true },
      })
    ).map((r) => r.instagramMediaId as string),
  )

  let added = 0
  for (const reel of reels) {
    if (existingIds.has(reel.id)) continue

    const skillName = extractSkillFromCaption(reel.caption) || '미분류'
    const record = await prisma.record.create({
      data: {
        skillName,
        performedAt: new Date(reel.timestamp),
        sessionNote: reel.caption ?? null,
        instagramMediaId: reel.id,
        tags: [],
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
