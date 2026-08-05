// 사진 업로드 큐 상태 관리.
//
// 상태 전이:
//   waiting → uploading → success
//                       ↘ error
// error는 재시도 없이 삭제만 가능하다. 실패 원인(형식/용량 초과, 업로드
// 오류)을 구분하지 않고 항상 삭제만 허용하는 이유는 재시도 UI를 넣으려면
// "이 실패가 재시도해서 해결될 문제인지"를 판단하는 로직이 추가로 필요한데,
// 지금은 그 구분 없이 실패 이유만 보여주고 사용자가 다시 선택하도록
// 단순화하는 쪽을 택했기 때문이다.
// 금지된 전이 (reducer가 막아줌):
//   success에서 다시 uploading으로 갈 수 없음 (이미 끝난 항목은 건드리지 않음)
//   존재하지 않는 id에 대한 액션은 무시

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type UploadStatus = "waiting" | "uploading" | "success" | "error";

export type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  status: UploadStatus;
  url?: string;
  errorMessage?: string;
};

export type UploadAction =
  | { type: "ADD"; items: UploadItem[] }
  | { type: "START"; id: string }
  | { type: "SUCCESS"; id: string; url: string }
  | { type: "FAIL"; id: string; errorMessage: string }
  | { type: "REMOVE"; id: string };

export function uploadQueueReducer(
  state: UploadItem[],
  action: UploadAction,
): UploadItem[] {
  switch (action.type) {
    case "ADD":
      return [...state, ...action.items];

    case "START":
      return state.map((item) =>
        item.id === action.id ? { ...item, status: "uploading" } : item,
      );

    case "SUCCESS":
      return state.map((item) =>
        item.id === action.id
          ? {
              ...item,
              status: "success",
              url: action.url,
              errorMessage: undefined,
            }
          : item,
      );

    case "FAIL":
      return state.map((item) =>
        item.id === action.id
          ? { ...item, status: "error", errorMessage: action.errorMessage }
          : item,
      );

    case "REMOVE":
      return state.filter((item) => item.id !== action.id);

    default:
      return state;
  }
}

// 파일 선택 시점의 사전 검증. 업로드 요청 자체를 보내기 전에 걸러서
// 불필요한 네트워크 왕복 없이 바로 실패 이유를 보여준다.
export function validateFile(file: File): string | null {
  if (!file.type.startsWith("image/")) return "이미지 파일만 업로드 가능";
  if (file.size > MAX_FILE_SIZE) return "10MB 이하 이미지만 업로드 가능";
  return null;
}

// 큐 항목 id와 Storage 업로드 경로 생성. Date.now/Math.random을 쓰는
// 비순수 로직이라, 컴포넌트 렌더 본문이 아닌 별도 모듈 함수로 분리했다.
export function createItemId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function generateStoragePath(file: File): string {
  const parts = file.name.split(".");
  // split은 항상 최소 한 개의 원소를 반환하므로(빈 문자열 포함) pop()이
  // undefined가 될 수 없다. "." 자체가 없는 경우에만 jpg로 대체한다.
  const ext = parts.length > 1 ? parts.pop() : "jpg";
  return `${createItemId()}.${ext}`;
}
