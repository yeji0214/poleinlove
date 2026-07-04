'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

function extractSkillFromCaption(caption: string | null): string {
  if (!caption) return ''
  const matches = [...caption.matchAll(/#pd([a-zA-Z가-힣]+)/gi)]
  if (matches.length === 0) return ''
  return matches.map(m => m[1].charAt(0).toUpperCase() + m[1].slice(1)).join(' · ')
}

export async function importReel(formData: FormData) {
  const caption = formData.get('caption') as string
  const thumbnailUrl = formData.get('thumbnailUrl') as string
  const timestamp = formData.get('timestamp') as string

  const skillName = extractSkillFromCaption(caption) || '미분류'
  const performedAt = new Date(timestamp)

  const record = await prisma.record.create({
    data: {
      skillName,
      performedAt,
      sessionNote: caption || null,
      tags: [],
    },
  })

  if (thumbnailUrl) {
    await prisma.image.create({
      data: { url: thumbnailUrl, recordId: record.id, order: 0 },
    })
  }

  redirect(`/records/${record.id}/edit`)
}
