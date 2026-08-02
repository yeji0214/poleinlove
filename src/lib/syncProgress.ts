// syncInstagramReels가 진행 상황을 알릴 때 쓰는 이벤트 타입.
// tagging 단계는 Claude에 배치로 한 번에 요청하는 구조라 세부 진행률을
// 낼 수 없어서 진행 중 여부만 알린다. saving 단계는 레코드를 하나씩
// 저장하는 루프라 current/total이 실제 값이다.
export type SyncProgressEvent =
  | { stage: "fetching" }
  | { stage: "diffed"; total: number; newCount: number }
  | { stage: "tagging" }
  | { stage: "saving"; current: number; total: number }
  | { stage: "done"; added: number; total: number }
  | { stage: "error"; message: string }

export type SyncProgressReporter = (event: SyncProgressEvent) => void
