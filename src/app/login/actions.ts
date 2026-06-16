'use server'

import { redirect } from 'next/navigation'
import { createSession, deleteSession } from '@/lib/session'

export type LoginState = { error: string } | null

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = formData.get('password') as string
  const from = formData.get('from') as string

  if (password !== process.env.SITE_PASSWORD) {
    return { error: '비밀번호가 올바르지 않습니다.' }
  }

  await createSession()
  redirect(from && from.startsWith('/') ? from : '/records')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
