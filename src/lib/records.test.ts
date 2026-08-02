import { describe, expect, it } from "vitest";
import { buildRecordWhere } from "./records";

describe("buildRecordWhere", () => {
  it("태그와 검색어가 모두 없으면 조건 없는 쿼리를 만든다", () => {
    expect(buildRecordWhere()).toEqual({ AND: [{}, {}] });
  });

  it("태그만 있으면 tags.has 조건만 붙는다", () => {
    expect(buildRecordWhere("초급")).toEqual({
      AND: [{ tags: { has: "초급" } }, {}],
    });
  });

  it("검색어만 있으면 다섯 필드에 대한 OR 조건을 만든다", () => {
    const result = buildRecordWhere(undefined, "발레리나");

    expect(result).toEqual({
      AND: [
        {},
        {
          OR: [
            { skillName: { contains: "발레리나", mode: "insensitive" } },
            { sessionNote: { contains: "발레리나", mode: "insensitive" } },
            { difficultyNote: { contains: "발레리나", mode: "insensitive" } },
            { didWellNote: { contains: "발레리나", mode: "insensitive" } },
            { improvementNote: { contains: "발레리나", mode: "insensitive" } },
          ],
        },
      ],
    });
  });

  it("태그와 검색어가 모두 있으면 둘 다 AND로 묶인다", () => {
    const result = buildRecordWhere("중급", "폴싯");

    expect(result.AND).toHaveLength(2);
    expect(result.AND).toContainEqual({ tags: { has: "중급" } });
    expect(result.AND).toContainEqual(
      expect.objectContaining({
        OR: expect.arrayContaining([
          { skillName: { contains: "폴싯", mode: "insensitive" } },
        ]),
      }),
    );
  });

  it("빈 문자열은 값이 없는 것과 동일하게 취급한다", () => {
    expect(buildRecordWhere("", "")).toEqual({ AND: [{}, {}] });
  });

  it("검색은 대소문자를 구분하지 않는다 (mode: insensitive)", () => {
    const result = buildRecordWhere(undefined, "Handstand");
    const orConditions = (result.AND as { OR?: unknown }[])[1]?.OR ?? [];

    expect(orConditions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          skillName: expect.objectContaining({ mode: "insensitive" }),
        }),
      ]),
    );
  });
});
