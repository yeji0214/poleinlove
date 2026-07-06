import { BatchActionButton } from './BatchActionButton'

export function ExtractSkillButton() {
  return (
    <BatchActionButton
      endpoint="/api/records/extract-skill"
      color="sky"
      idleLabel="기술명 자동 추출"
      runningLabel="기술명 추출 중…"
      doneLabel="기술명 추출 완료"
    />
  )
}
