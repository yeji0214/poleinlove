'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AnalyzeSentimentButton() {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState({ analyzed: 0, remaining: 0 })
  const router = useRouter()

  async function run() {
    setStatus('running')
    setProgress({ analyzed: 0, remaining: 0 })
    let total = 0

    try {
      while (true) {
        const res = await fetch('/api/records/analyze-sentiment', { method: 'POST' })
        const data = await res.json()
        if (!res.ok) { setStatus('error'); return }

        total += data.analyzed
        setProgress({ analyzed: total, remaining: data.remaining })

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
      <button disabled className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-400">
        감정 분석 중… {progress.analyzed}개 완료
      </button>
    )
  }
  if (status === 'done') {
    return (
      <span className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-400">
        감정 분석 완료 ✓
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
      className="rounded-2xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-rose-500 transition-colors hover:bg-rose-50"
    >
      ✦ 감정 분석
    </button>
  )
}
