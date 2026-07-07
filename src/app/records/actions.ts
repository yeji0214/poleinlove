'use server'

import { prisma } from '@/lib/prisma'
import { buildRecordWhere, RECORDS_PAGE_SIZE } from '@/lib/records'

export async function loadMoreRecords(tag: string | undefined, q: string | undefined, skip: number) {
  return prisma.record.findMany({
    where: buildRecordWhere(tag, q),
    orderBy: { performedAt: 'desc' },
    include: { images: { orderBy: { order: 'asc' }, take: 1 } },
    skip,
    take: RECORDS_PAGE_SIZE,
  })
}
