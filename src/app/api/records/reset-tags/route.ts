import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const result = await prisma.record.updateMany({ data: { tags: [] } })
  return NextResponse.json({ reset: result.count })
}
