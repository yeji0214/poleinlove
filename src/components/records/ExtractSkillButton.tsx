'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ExtractSkillButton() {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState({ updated: 0, remaining: 0 })
  const router = useRouter()

  async function run() {
    setStatus('running')
    setProgress({ updated: 0, remaining: 0 })
    let totalUpdated = 0

    try {
      while (true) {
        const res = await fetch('/api/records/extract-skill', { method: 'POST' })
        const data = await res.json()
        if (!res.ok) { setStatus('error'); return }

        totalUpdated += data.updated
        setProgress({ updated: totalUpdated, remaining: data.remaining })

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
      <button disabled className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-medium text-sky-400">
        기술명 추출 중… {progress.updated}개 완료
      </button>
    )
  }

  if (status === 'done') {
    return (
      <span className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-400">
        기술명 추출 완료 ✓
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
      className="rounded-2xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-medium text-sky-500 transition-colors hover:bg-sky-50"
    >
      ✦ 기술명 자동 추출
    </button>
  )
}
