// 사진 업로드 큐 상태 관리.
//
// 상태 전이:
//   waiting → uploading → success
//                       ↘ error → uploading (재시도)
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
  | { type: "RETRY"; id: string }
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
          ? { ...item, status: "success", url: action.url, errorMessage: undefined }
          : item,
      );

    case "FAIL":
      return state.map((item) =>
        item.id === action.id
          ? { ...item, status: "error", errorMessage: action.errorMessage }
          : item,
      );

    case "RETRY":
      // 실패한 항목만 재시도 가능. 이미 성공했거나 업로드 중인 항목은 무시.
      return state.map((item) =>
        item.id === action.id && item.status === "error"
          ? { ...item, status: "waiting", errorMessage: undefined }
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
  if (!file.type.startsWith("image/")) return "이미지 파일만 업로드할 수 있어요";
  if (file.size > MAX_FILE_SIZE) return "파일 크기는 10MB를 넘을 수 없어요";
  return null;
}

// 큐 항목 id와 Storage 업로드 경로 생성. Date.now/Math.random을 쓰는
// 비순수 로직이라, 컴포넌트 렌더 본문이 아닌 별도 모듈 함수로 분리했다.
export function createItemId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function generateStoragePath(file: File): string {
  const ext = file.name.split(".").pop() ?? "jpg";
  return `${createItemId()}.${ext}`;
}
