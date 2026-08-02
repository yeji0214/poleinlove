import { beforeEach, describe, expect, it } from "vitest";
import { sign, verifyToken } from "./session";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function makeToken(expiresAt: number) {
  return `${expiresAt}.${sign(String(expiresAt))}`;
}

describe("verifyToken", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret";
  });

  it("서명이 올바르고 만료되지 않은 토큰은 통과한다", () => {
    const token = makeToken(Date.now() + ONE_DAY_MS);
    expect(verifyToken(token)).toBe(true);
  });

  it("만료 시각이 지난 토큰은 서명이 맞아도 거부한다", () => {
    const token = makeToken(Date.now() - ONE_DAY_MS);
    expect(verifyToken(token)).toBe(false);
  });

  it("서명이 변조된 토큰은 거부한다", () => {
    const token = makeToken(Date.now() + ONE_DAY_MS);
    const [expiresAt] = token.split(".");
    const tampered = `${expiresAt}.0000000000000000000000000000000000000000000000000000000000000000`;
    expect(verifyToken(tampered)).toBe(false);
  });

  it("만료 시각만 바꿔서 서명과 안 맞게 된 토큰은 거부한다", () => {
    const token = makeToken(Date.now() + ONE_DAY_MS);
    const [, signature] = token.split(".");
    const tampered = `${Date.now() + 10 * ONE_DAY_MS}.${signature}`;
    expect(verifyToken(tampered)).toBe(false);
  });

  it("다른 비밀키로 서명된 토큰은 거부한다", () => {
    const expiresAt = Date.now() + ONE_DAY_MS;
    process.env.SESSION_SECRET = "old-secret";
    const oldToken = makeToken(expiresAt);

    process.env.SESSION_SECRET = "test-secret";
    expect(verifyToken(oldToken)).toBe(false);
  });

  it("점(.)이 없는 토큰은 거부한다", () => {
    expect(verifyToken("not-a-valid-token")).toBe(false);
  });

  it("서명 부분이 비어있는 토큰은 거부한다", () => {
    expect(verifyToken(`${Date.now() + ONE_DAY_MS}.`)).toBe(false);
  });

  it("빈 문자열, null, undefined는 거부한다", () => {
    expect(verifyToken("")).toBe(false);
    expect(verifyToken(null)).toBe(false);
    expect(verifyToken(undefined)).toBe(false);
  });
});
