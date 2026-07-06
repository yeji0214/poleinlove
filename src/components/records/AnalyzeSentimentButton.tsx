import { BatchActionButton } from './BatchActionButton'

export function AnalyzeSentimentButton() {
  return (
    <BatchActionButton
      endpoint="/api/records/analyze-sentiment"
      color="rose"
      idleLabel="감정 분석"
      runningLabel="감정 분석 중…"
      doneLabel="감정 분석 완료"
    />
  )
}
