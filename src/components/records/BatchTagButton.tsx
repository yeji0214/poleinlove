import { BatchActionButton } from './BatchActionButton'

export function BatchTagButton() {
  return (
    <BatchActionButton
      endpoint="/api/records/batch-tag"
      color="violet"
      idleLabel="태그 일괄 적용"
      runningLabel="태그 적용 중…"
      doneLabel="태그 적용 완료"
    />
  )
}
