'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { type CreateRecordState } from '@/app/records/new/actions'
import { getTodayDateString } from '@/lib/date'

export async function updateRecord(
  id: number,
  _prevState: CreateRecordState,
  formData: FormData,
): Promise<CreateRecordState> {
  const skillName = formData.get('skillName') as string
  const performedAt = formData.get('performedAt') as string
  const tagsRaw = formData.get('tags') as string
  const imageUrlsRaw = formData.get('imageUrls') as string

  if (!skillName || !performedAt) {
    return { error: '기술명과 날짜는 필수입니다.' }
  }

  if (performedAt > getTodayDateString()) {
    return { error: '미래 날짜는 선택할 수 없습니다.' }
  }

  const tags = tagsRaw
    ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  const imageUrls = imageUrlsRaw
    ? imageUrlsRaw.split(',').filter(Boolean)
    : []

  try {
    await prisma.record.update({
      where: { id },
      data: {
        skillName,
        performedAt: new Date(performedAt),
        tags,
        difficultyNote: (formData.get('difficultyNote') as string) || null,
        didWellNote: (formData.get('didWellNote') as string) || null,
        improvementNote: (formData.get('improvementNote') as string) || null,
      },
    })

    await prisma.image.deleteMany({ where: { recordId: id } })
    if (imageUrls.length > 0) {
      await prisma.image.createMany({
        data: imageUrls.map((url, i) => ({
          url,
          recordId: id,
          order: i,
        })),
      })
    }
  } catch {
    return { error: '수정 중 오류가 발생했습니다.' }
  }

  redirect(`/records/${id}`)
}
