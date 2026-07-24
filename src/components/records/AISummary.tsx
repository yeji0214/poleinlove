'use client'

import { useState } from 'react'

export function AISummary({ recordId }: { recordId: number }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [summary, setSummary] = useState('')

  async function generate() {
    setStatus('loading')
    try {
      const res = await fetch(`/api/records/${recordId}/summarize`, { method: 'POST' })
      const data = await res.json()
      if (data.error) {
        setStatus('error')
        return
      }
      setSummary(data.summary)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'idle') {
    return (
      <button
        onClick={generate}
        className="flex items-center gap-1.5 rounded-xl bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-500 transition-colors hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-300 dark:hover:bg-violet-900"
      >
        ✦ AI 요약 보기
      </button>
    )
  }

  if (status === 'loading') {
    return (
      <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950">
        <p className="text-sm text-violet-400 dark:text-violet-300">요약 생성 중…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <button onClick={generate} className="text-xs text-red-400 underline underline-offset-2">
        오류 · 다시 시도
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-xs font-medium text-violet-400 dark:text-violet-300">✦ AI 요약</span>
        <button
          onClick={generate}
          className="text-xs text-violet-300 underline underline-offset-2 hover:text-violet-400 dark:text-violet-500 dark:hover:text-violet-300"
        >
          재생성
        </button>
      </div>
      <p className="text-sm leading-relaxed text-violet-700 dark:text-violet-200">{summary}</p>
    </div>
  )
}
