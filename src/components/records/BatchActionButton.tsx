'use client'

import { useBatchAction } from '@/lib/useBatchAction'

type Color = 'violet' | 'sky' | 'rose'

const THEME: Record<Color, { idle: string; running: string }> = {
  violet: {
    idle: 'border-violet-200 bg-white text-violet-500 hover:bg-violet-50',
    running: 'border-violet-200 bg-violet-50 text-violet-400',
  },
  sky: {
    idle: 'border-sky-200 bg-white text-sky-500 hover:bg-sky-50',
    running: 'border-sky-200 bg-sky-50 text-sky-400',
  },
  rose: {
    idle: 'border-rose-200 bg-white text-rose-500 hover:bg-rose-50',
    running: 'border-rose-200 bg-rose-50 text-rose-400',
  },
}

type BatchActionButtonProps = {
  endpoint: string
  color: Color
  idleLabel: string
  runningLabel: string
  doneLabel: string
}

export function BatchActionButton({ endpoint, color, idleLabel, runningLabel, doneLabel }: BatchActionButtonProps) {
  const { status, processed, run } = useBatchAction(endpoint)
  const theme = THEME[color]

  if (status === 'running') {
    return (
      <button disabled className={`rounded-2xl border px-4 py-2.5 text-sm font-medium ${theme.running}`}>
        {runningLabel} {processed}개 완료
      </button>
    )
  }

  if (status === 'done') {
    return (
      <span className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-400">
        {doneLabel} ✓
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
      className={`rounded-2xl border px-4 py-2.5 text-sm font-medium transition-colors ${theme.idle}`}
    >
      ✦ {idleLabel}
    </button>
  )
}
