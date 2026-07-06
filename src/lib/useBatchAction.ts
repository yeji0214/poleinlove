'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type BatchStatus = 'idle' | 'running' | 'done' | 'error'

export function useBatchAction(endpoint: string) {
  const [status, setStatus] = useState<BatchStatus>('idle')
  const [processed, setProcessed] = useState(0)
  const router = useRouter()

  async function run() {
    setStatus('running')
    setProcessed(0)
    let total = 0

    try {
      while (true) {
        const res = await fetch(endpoint, { method: 'POST' })
        const data = await res.json()
        if (!res.ok) {
          setStatus('error')
          return
        }

        total += data.processed
        setProcessed(total)

        if (data.remaining === 0) break
      }
      setStatus('done')
      router.refresh()
    } catch {
      setStatus('error')
    }
  }

  return { status, processed, run }
}
