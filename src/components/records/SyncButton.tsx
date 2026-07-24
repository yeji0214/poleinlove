'use client'

import { useState } from 'react'

export function SyncButton({ hasToken }: { hasToken: boolean }) {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'error'>('idle')

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
      window.location.reload()
    } catch {
      setStatus('error')
    }
  }

  if (status === 'syncing') {
    return (
      <button
        disabled
        className="whitespace-nowrap rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500"
      >
        동기화…
      </button>
    )
  }

  if (status === 'error') {
    return (
      <button
        onClick={() => sync()}
        className="whitespace-nowrap rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:border-red-900 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950"
      >
        오류 · 재시도
      </button>
    )
  }

  return (
    <button
      onClick={() => sync()}
      className="whitespace-nowrap rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
    >
      동기화
    </button>
  )
}
