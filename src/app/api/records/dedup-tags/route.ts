import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DB에 저장된 중복 태그를 한번에 정리
export async function POST() {
  const records = await prisma.record.findMany({ select: { id: true, tags: true } })

  let fixed = 0
  for (const record of records) {
    const deduped = [...new Set(record.tags)]
    if (deduped.length !== record.tags.length) {
      await prisma.record.update({ where: { id: record.id }, data: { tags: deduped } })
      fixed++
    }
  }

  return NextResponse.json({ fixed, total: records.length })
}
