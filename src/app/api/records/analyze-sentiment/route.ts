import { NextResponse } from 'next/server'
import { batchAnalyzeSentiments } from '@/lib/instagram-sync'
import { prisma } from '@/lib/prisma'

export const maxDuration = 60

const BATCH_SIZE = 10
const PROCESSED_SENTIMENTS = ['좋았던', '어려웠던', '복습필요', '없음']

// NULL 또는 []인 기록(= 미처리)을 찾기 위해 "처리된 값이 하나도 없는" 조건 사용
const unprocessedWhere = {
  NOT: { sentiments: { hasSome: PROCESSED_SENTIMENTS } },
} as const

export async function POST() {
  // NULL sentiments를 {}로 정규화 (db push로 추가된 기존 행 대응)
  await prisma.$executeRaw`UPDATE "Record" SET sentiments = '{}' WHERE sentiments IS NULL`

  const records = await prisma.record.findMany({
    where: { ...unprocessedWhere, sessionNote: { not: null } },
    select: { id: true, sessionNote: true },
    take: BATCH_SIZE,
  })

  const total = await prisma.record.count({ where: unprocessedWhere })

  if (records.length === 0) return NextResponse.json({ analyzed: 0, remaining: 0 })

  const sentimentMap = await batchAnalyzeSentiments(
    records.map((r) => ({ id: String(r.id), caption: r.sessionNote! })),
  )

  for (const record of records) {
    const sentiments = sentimentMap.get(String(record.id)) ?? []
    await prisma.record.update({
      where: { id: record.id },
      data: { sentiments: sentiments.length > 0 ? sentiments : ['없음'] },
    })
  }

  const remaining = Math.max(0, total - records.length)
  return NextResponse.json({ analyzed: records.length, remaining })
}
