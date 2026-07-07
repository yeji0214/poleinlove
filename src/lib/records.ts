import type { Prisma } from '@prisma/client'

export const RECORDS_PAGE_SIZE = 20

export function buildRecordWhere(tag?: string, q?: string): Prisma.RecordWhereInput {
  return {
    AND: [
      tag ? { tags: { has: tag } } : {},
      q
        ? {
            OR: [
              { skillName: { contains: q, mode: 'insensitive' } },
              { sessionNote: { contains: q, mode: 'insensitive' } },
              { difficultyNote: { contains: q, mode: 'insensitive' } },
              { didWellNote: { contains: q, mode: 'insensitive' } },
              { improvementNote: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {},
    ],
  }
}
