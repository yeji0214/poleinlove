'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createSession, deleteSession } from '@/lib/session'
import { isRateLimited, recordFailedAttempt, clearAttempts } from '@/lib/rateLimit'

export type LoginState = { error: string } | null

// Vercel이 프록시를 거친 실제 클라이언트 IP를 x-forwarded-for에 담아준다
// (콤마로 구분된 목록의 첫 값). 로컬 개발 환경처럼 이 헤더가 없으면
// 모든 요청이 같은 키를 공유하게 되지만, 개발 환경에서는 문제되지 않는다.
async function getClientIp(): Promise<string> {
  const headerList = await headers()
  const forwardedFor = headerList.get('x-forwarded-for')
  return forwardedFor?.split(',')[0]?.trim() || 'unknown'
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = formData.get('password') as string
  const from = formData.get('from') as string
  const ip = await getClientIp()

  if (await isRateLimited(ip)) {
    return { error: '시도 횟수를 초과했어요. 잠시 후 다시 시도해주세요.' }
  }

  if (password !== process.env.SITE_PASSWORD) {
    await recordFailedAttempt(ip)
    return { error: '비밀번호가 올바르지 않습니다.' }
  }

  await clearAttempts(ip)
  await createSession()
  redirect(from && from.startsWith('/') ? from : '/records')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
