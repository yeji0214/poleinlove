import { prisma } from '@/lib/prisma'

const MAX_ATTEMPTS = 5
const WINDOW_MINUTES = 15

// 최근 WINDOW_MINUTES 안에 이 IP에서 실패 기록이 MAX_ATTEMPTS번 이상이면
// 잠금. DB에 남기므로 서버리스 인스턴스가 바뀌어도 안정적으로 유지된다.
export async function isRateLimited(ip: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000)
  const count = await prisma.loginAttempt.count({
    where: { ip, createdAt: { gte: since } },
  })
  return count >= MAX_ATTEMPTS
}

export async function recordFailedAttempt(ip: string): Promise<void> {
  await prisma.loginAttempt.create({ data: { ip } })
}

export async function clearAttempts(ip: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { ip } })
}
