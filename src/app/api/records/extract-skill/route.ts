import { NextResponse } from 'next/server'
import { batchExtractSkills } from '@/lib/instagram-sync'
import { prisma } from '@/lib/prisma'

const BATCH_SIZE = 10

export async function POST() {
  const records = await prisma.record.findMany({
    where: { skillName: '미분류' },
    select: { id: true, sessionNote: true },
    take: BATCH_SIZE,
  })

  const total = await prisma.record.count({ where: { skillName: '미분류' } })

  if (records.length === 0) return NextResponse.json({ processed: 0, remaining: 0 })

  const withCaption = records.filter((r) => r.sessionNote)
  const skillMap = withCaption.length > 0
    ? await batchExtractSkills(withCaption.map((r) => ({ id: String(r.id), caption: r.sessionNote! })))
    : new Map<string, string>()

  let processed = 0
  for (const record of records) {
    const skill = skillMap.get(String(record.id))
    await prisma.record.update({
      where: { id: record.id },
      // 추출 실패 시 빈 문자열로 마킹 → 재처리 방지, UI에선 '미분류'로 표시
      data: { skillName: skill || '' },
    })
    if (skill) processed++
  }

  const remaining = Math.max(0, total - records.length)
  return NextResponse.json({ processed, remaining })
}
