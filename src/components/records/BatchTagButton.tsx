'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function BatchTagButton() {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState({ tagged: 0, remaining: 0 })
  const router = useRouter()

  async function run() {
    setStatus('running')
    setProgress({ tagged: 0, remaining: 0 })
    let totalTagged = 0

    try {
      while (true) {
        const res = await fetch('/api/records/batch-tag', { method: 'POST' })
        const data = await res.json()
        if (!res.ok) { setStatus('error'); return }

        totalTagged += data.tagged
        setProgress({ tagged: totalTagged, remaining: data.remaining })

        if (data.remaining === 0) break
      }
      setStatus('done')
      router.refresh()
    } catch {
      setStatus('error')
    }
  }

  if (status === 'running') {
    return (
      <button disabled className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-medium text-violet-400">
        태그 적용 중… {progress.tagged}개 완료
      </button>
    )
  }

  if (status === 'done') {
    return (
      <span className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-400">
        태그 적용 완료 ✓
      </span>
    )
  }

  if (status === 'error') {
    return (
      <button onClick={run} className="rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50">
        오류 · 재시도
      </button>
    )
  }

  return (
    <button
      onClick={run}
      className="rounded-2xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-medium text-violet-500 transition-colors hover:bg-violet-50"
    >
      ✦ 태그 일괄 적용
    </button>
  )
}
