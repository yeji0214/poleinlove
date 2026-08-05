import { describe, expect, it } from "vitest";
import {
  MAX_FILE_SIZE,
  uploadQueueReducer,
  validateFile,
  generateStoragePath,
  type UploadItem,
} from "./uploadQueue";

function makeItem(overrides: Partial<UploadItem> = {}): UploadItem {
  return {
    id: "item-1",
    file: new File(["x"], "photo.jpg", { type: "image/jpeg" }),
    previewUrl: "blob:preview-1",
    status: "waiting",
    ...overrides,
  };
}

describe("uploadQueueReducer", () => {
  it("ADD는 기존 항목 뒤에 새 항목들을 이어 붙인다", () => {
    const existing = [makeItem({ id: "a" })];
    const incoming = [makeItem({ id: "b" }), makeItem({ id: "c" })];

    const result = uploadQueueReducer(existing, {
      type: "ADD",
      items: incoming,
    });

    expect(result.map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  it("START는 해당 항목만 uploading으로 바꾼다", () => {
    const state = [makeItem({ id: "a" }), makeItem({ id: "b" })];

    const result = uploadQueueReducer(state, { type: "START", id: "a" });

    expect(result.find((i) => i.id === "a")?.status).toBe("uploading");
    expect(result.find((i) => i.id === "b")?.status).toBe("waiting");
  });

  it("SUCCESS는 상태를 success로 바꾸고 url을 채우며 이전 에러 메시지를 지운다", () => {
    const state = [
      makeItem({
        id: "a",
        status: "uploading",
        errorMessage: "이전 실패 메시지",
      }),
    ];

    const result = uploadQueueReducer(state, {
      type: "SUCCESS",
      id: "a",
      url: "https://example.com/a.jpg",
    });

    expect(result[0]).toMatchObject({
      status: "success",
      url: "https://example.com/a.jpg",
      errorMessage: undefined,
    });
  });

  it("FAIL은 상태를 error로 바꾸고 이유를 기록한다", () => {
    const state = [makeItem({ id: "a", status: "uploading" })];

    const result = uploadQueueReducer(state, {
      type: "FAIL",
      id: "a",
      errorMessage: "업로드에 실패했어요",
    });

    expect(result[0]).toMatchObject({
      status: "error",
      errorMessage: "업로드에 실패했어요",
    });
  });

  it("REMOVE는 해당 id만 큐에서 제거한다", () => {
    const state = [makeItem({ id: "a" }), makeItem({ id: "b" })];

    const result = uploadQueueReducer(state, { type: "REMOVE", id: "a" });

    expect(result.map((i) => i.id)).toEqual(["b"]);
  });

  it("존재하지 않는 id에 대한 액션은 무시된다 (상태 불변)", () => {
    const state = [makeItem({ id: "a", status: "success" })];

    const result = uploadQueueReducer(state, {
      type: "FAIL",
      id: "no-such-id",
      errorMessage: "무시돼야 함",
    });

    expect(result).toEqual(state);
  });

  it("일부만 실패해도 다른 항목의 성공 상태는 그대로 유지된다", () => {
    const state = [
      makeItem({ id: "a", status: "uploading" }),
      makeItem({ id: "b", status: "uploading" }),
      makeItem({ id: "c", status: "uploading" }),
    ];

    const afterA = uploadQueueReducer(state, {
      type: "SUCCESS",
      id: "a",
      url: "https://example.com/a.jpg",
    });
    const afterB = uploadQueueReducer(afterA, {
      type: "FAIL",
      id: "b",
      errorMessage: "네트워크 오류",
    });

    expect(afterB.find((i) => i.id === "a")?.status).toBe("success");
    expect(afterB.find((i) => i.id === "b")?.status).toBe("error");
    expect(afterB.find((i) => i.id === "c")?.status).toBe("uploading");
  });
});

describe("validateFile", () => {
  it("이미지가 아닌 파일은 거부한다", () => {
    const file = new File(["x"], "doc.pdf", { type: "application/pdf" });
    expect(validateFile(file)).toBe("이미지 파일만 업로드 가능");
  });

  it(`${MAX_FILE_SIZE / 1024 / 1024}MB를 초과하는 파일은 거부한다`, () => {
    const file = new File([new Uint8Array(MAX_FILE_SIZE + 1)], "big.jpg", {
      type: "image/jpeg",
    });
    expect(validateFile(file)).toBe("10MB 이하 이미지만 업로드 가능");
  });

  it("크기 제한 이하의 이미지 파일은 통과한다", () => {
    const file = new File([new Uint8Array(MAX_FILE_SIZE)], "ok.jpg", {
      type: "image/jpeg",
    });
    expect(validateFile(file)).toBeNull();
  });
});

describe("generateStoragePath", () => {
  it("원본 파일의 확장자를 유지한다", () => {
    const file = new File(["x"], "photo.png", { type: "image/png" });
    expect(generateStoragePath(file)).toMatch(/\.png$/);
  });

  it("확장자가 없으면 jpg로 대체한다", () => {
    const file = new File(["x"], "photo", { type: "image/jpeg" });
    expect(generateStoragePath(file)).toMatch(/\.jpg$/);
  });

  it("호출할 때마다 서로 다른 경로를 생성한다", () => {
    const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });
    const path1 = generateStoragePath(file);
    const path2 = generateStoragePath(file);
    expect(path1).not.toBe(path2);
  });
});
