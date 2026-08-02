import { describe, expect, it } from "vitest";
import { extractSkillFromCaption } from "./caption";

describe("extractSkillFromCaption", () => {
  it("캡션이 없으면 빈 문자열을 반환한다", () => {
    expect(extractSkillFromCaption(null)).toBe("");
    expect(extractSkillFromCaption(undefined)).toBe("");
    expect(extractSkillFromCaption("")).toBe("");
  });

  it("#pd 해시태그가 없으면 빈 문자열을 반환한다", () => {
    expect(extractSkillFromCaption("오늘 폴댄스 수업 다녀왔어요 #폴댄스")).toBe("");
  });

  it("영문 해시태그의 첫 글자를 대문자로 바꾼다", () => {
    expect(extractSkillFromCaption("#pdhandstand 완성!")).toBe("Handstand");
  });

  it("한글 해시태그는 그대로 사용한다 (대소문자 개념이 없음)", () => {
    expect(extractSkillFromCaption("#pd발레리나 도전 중")).toBe("발레리나");
  });

  it("여러 해시태그를 가운데점(·)으로 이어 붙인다", () => {
    expect(extractSkillFromCaption("#pdhandstand #pdsplit 연습")).toBe(
      "Handstand · Split",
    );
  });

  it("대소문자 상관없이 #pd 접두사를 인식한다", () => {
    expect(extractSkillFromCaption("#PDhandstand 오늘의 목표")).toBe("Handstand");
  });

  it("#pd로 시작하지 않는 다른 해시태그는 무시한다", () => {
    expect(extractSkillFromCaption("#폴댄스 #pdhandstand #오운완")).toBe(
      "Handstand",
    );
  });
});
