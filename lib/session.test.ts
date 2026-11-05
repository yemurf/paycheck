import { describe, expect, it } from "vitest";
import { decodeState, encodeState, safeNextPath } from "./kakao";
import { signToken, verifyToken } from "./session";

const KEY = "test-secret-test-secret-test-secret-1234";
const USER = { id: "kakao:12345", name: "예진" };
const NOW = Date.UTC(2026, 10, 5);

describe("로그인 토큰", () => {
  it("서명한 토큰은 그대로 읽힌다", () => {
    expect(verifyToken(signToken(USER, KEY, NOW), KEY, NOW)).toEqual(USER);
  });

  it("다른 키로 서명했거나 내용을 바꾸면 거부한다", () => {
    const token = signToken(USER, KEY, NOW);
    expect(verifyToken(token, `${KEY}x`, NOW)).toBeNull();
    const [, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ id: "kakao:999", name: null, exp: NOW / 1000 + 1000 })).toString("base64url");
    expect(verifyToken(`${forged}.${signature}`, KEY, NOW)).toBeNull();
  });

  it("30일이 지나면 만료된다", () => {
    const token = signToken(USER, KEY, NOW);
    expect(verifyToken(token, KEY, NOW + 29 * 86_400_000)).toEqual(USER);
    expect(verifyToken(token, KEY, NOW + 30 * 86_400_000)).toBeNull();
  });

  it("모양이 이상한 토큰은 거부한다", () => {
    for (const bad of [undefined, "", "abc", "a.b.c", "....", "a.b"]) expect(verifyToken(bad, KEY, NOW)).toBeNull();
  });
});

describe("로그인 뒤 돌아갈 경로", () => {
  it("우리 사이트 안의 경로만 받는다", () => {
    expect(safeNextPath("/check")).toBe("/check");
    expect(safeNextPath("/legal#R1")).toBe("/legal#R1");
    for (const bad of [null, "", "https://evil.com", "//evil.com", "/\\evil.com", "evil"]) {
      expect(safeNextPath(bad)).toBe("/check");
    }
  });

  it("state 쿠키는 저장한 값을 돌려주고, 망가진 값은 무시한다", () => {
    expect(decodeState(encodeState({ state: "abc", next: "/legal" }))).toEqual({ state: "abc", next: "/legal" });
    expect(decodeState(encodeState({ state: "abc", next: "https://evil.com" }))?.next).toBe("/check");
    expect(decodeState("not-base64-json")).toBeNull();
    expect(decodeState(undefined)).toBeNull();
  });
});
