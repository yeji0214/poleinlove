'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SyncButton({ hasToken }: { hasToken: boolean }) {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle')
  const [added, setAdded] = useState<number | null>(null)
  const router = useRouter()

  if (!hasToken) return null

  async function sync(reset = false) {
    if (reset && !confirm('기존 기록을 모두 삭제하고 인스타그램에서 전체 다시 가져올까요?')) return
    setStatus('syncing')
    try {
      const res = await fetch('/api/instagram/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset }),
      })
      const data = await res.json()
      if (data.error) {
        setStatus('error')
        return
      }
      setAdded(data.added)
      setStatus('done')
      router.refresh()
    } catch {
      setStatus('error')
    }
  }

  if (status === 'syncing') {
    return (
      <button
        disabled
        className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-400"
      >
        동기화 중…
      </button>
    )
  }

  if (status === 'done') {
    return (
      <button
        onClick={() => sync()}
        className="whitespace-nowrap rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
      >
        {added}개 추가됨 · 재동기화
      </button>
    )
  }

  if (status === 'error') {
    return (
      <button
        onClick={() => sync()}
        className="rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
      >
        오류 · 재시도
      </button>
    )
  }

  return (
    <button
      onClick={() => sync()}
      className="whitespace-nowrap rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
    >
      동기화
    </button>
  )
}
