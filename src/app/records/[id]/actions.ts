'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export async function deleteRecord(id: number) {
  await prisma.record.delete({ where: { id } })
  redirect('/records')
}
