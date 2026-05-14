'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export type CreateRecordState = { error: string } | null

export async function createRecord(
  _prevState: CreateRecordState,
  formData: FormData,
): Promise<CreateRecordState> {
  const skillName = formData.get('skillName') as string
  const performedAt = formData.get('performedAt') as string
  const tagsRaw = formData.get('tags') as string

  if (!skillName || !performedAt) {
    return { error: '기술명과 날짜는 필수입니다.' }
  }

  const tags = tagsRaw
    ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  try {
    await prisma.record.create({
      data: {
        skillName,
        performedAt: new Date(performedAt),
        tags,
        sessionNote: (formData.get('sessionNote') as string) || null,
        difficultyNote: (formData.get('difficultyNote') as string) || null,
        didWellNote: (formData.get('didWellNote') as string) || null,
        improvementNote: (formData.get('improvementNote') as string) || null,
      },
    })
  } catch {
    return { error: '저장 중 오류가 발생했습니다.' }
  }

  redirect('/records')
}
