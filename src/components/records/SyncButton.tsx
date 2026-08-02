'use client'

import { useEffect, useRef, useState } from 'react'
import type { SyncProgressEvent } from '@/lib/syncProgress'
import { CheckCircleIcon, CircleIcon, SpinnerIcon } from '@/components/ui/icons'

type Stage = 'idle' | 'fetching' | 'diffed' | 'tagging' | 'saving' | 'done' | 'error'

type Meta = {
  total?: number
  newCount?: number
  current?: number
  added?: number
  message?: string
}

type Step = { key: Stage; label: string }

export function SyncButton({ hasToken }: { hasToken: boolean }) {
  const [open, setOpen] = useState(false)
  const [stage, setStage] = useState<Stage>('idle')
  const [meta, setMeta] = useState<Meta>({})
  const eventSourceRef = useRef<EventSource | null>(null)
  const stageRef = useRef<Stage>('idle')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    stageRef.current = stage
  }, [stage])

  // 언마운트 시 열려있는 스트림 정리
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close()
    }
  }, [])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (
        (stage === 'done' || stage === 'error') &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, stage])

  if (!hasToken) return null

  function startSync() {
    if (stage !== 'idle' && stage !== 'done' && stage !== 'error') return

    setOpen(true)
    setStage('fetching')
    setMeta({})

    const es = new EventSource('/api/instagram/sync-stream')
    eventSourceRef.current = es

    es.onmessage = (e) => {
      const data: SyncProgressEvent = JSON.parse(e.data)
      setStage(data.stage)

      if (data.stage === 'diffed') {
        setMeta({ total: data.total, newCount: data.newCount })
      } else if (data.stage === 'saving') {
        setMeta((m) => ({ ...m, current: data.current, total: data.total }))
      } else if (data.stage === 'done') {
        setMeta((m) => ({ ...m, added: data.added }))
        es.close()
        setTimeout(() => window.location.reload(), 900)
      } else if (data.stage === 'error') {
        setMeta({ message: data.message })
        es.close()
      }
    }

    es.onerror = () => {
      if (stageRef.current === 'done' || stageRef.current === 'error') return
      setStage('error')
      setMeta({ message: '연결이 끊겼어요' })
      es.close()
    }
  }

  const newCount = meta.newCount ?? 0
  const hasNewReels = stage === 'saving' || (stage === 'done' && (meta.added ?? 0) > 0) || newCount > 0

  const steps: Step[] = hasNewReels
    ? [
        { key: 'fetching', label: '릴스 목록 조회' },
        {
          key: 'diffed',
          label: meta.newCount !== undefined ? `신규 ${meta.newCount}개 확인` : '신규 항목 확인',
        },
        { key: 'tagging', label: 'AI 태깅' },
        {
          key: 'saving',
          label:
            meta.current !== undefined
              ? `저장 중 (${meta.current}/${meta.total ?? newCount})`
              : '저장',
        },
      ]
    : [
        { key: 'fetching', label: '릴스 목록 조회' },
        { key: 'diffed', label: meta.newCount !== undefined ? '새로운 기록 없음' : '신규 항목 확인' },
      ]

  const STAGE_ORDER: Stage[] = ['fetching', 'diffed', 'tagging', 'saving', 'done']
  const currentIndex = STAGE_ORDER.indexOf(stage)

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={startSync}
        disabled={stage !== 'idle' && stage !== 'done' && stage !== 'error'}
        className="whitespace-nowrap rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        동기화
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl bg-surface p-3 shadow-lg ring-1 ring-divider">
          {stage === 'error' ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-red-500">{meta.message ?? '동기화에 실패했어요'}</p>
              <button
                type="button"
                onClick={startSync}
                className="self-start text-xs font-medium text-text-secondary underline underline-offset-2"
              >
                재시도
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {steps.map((step) => {
                const stepIndex = STAGE_ORDER.indexOf(step.key)
                const isDone = stage === 'done' || currentIndex > stepIndex
                const isActive = !isDone && currentIndex === stepIndex
                return (
                  <li key={step.key} className="flex items-center gap-2 text-xs">
                    {isDone ? (
                      <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-400" />
                    ) : isActive ? (
                      <SpinnerIcon className="h-4 w-4 shrink-0 text-text-muted" />
                    ) : (
                      <CircleIcon className="h-4 w-4 shrink-0 text-text-muted/40" />
                    )}
                    <span className={isDone || isActive ? 'text-text-secondary' : 'text-text-muted'}>
                      {step.label}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
