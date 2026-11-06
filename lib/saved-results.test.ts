import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dbHeaders } from "./db";
import { MOCK_EXTRACTION } from "./mock-extraction";
import { buildRow, deleteResult, getResult, listResults, saveResult, toSavedContract } from "./saved-results";

const USER = "kakao:12345";
type Call = { url: string; method: string; headers: Record<string, string>; body?: unknown };
let calls: Call[];
let reply: unknown;

beforeEach(() => {
  calls = [];
  reply = [];
  vi.stubEnv("SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_test");
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    calls.push({
      url,
      method: init.method ?? "GET",
      headers: init.headers as Record<string, string>,
      body: init.body ? JSON.parse(init.body as string) : undefined,
    });
    return new Response(JSON.stringify(reply), { status: 200 });
  });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const row = () => ({
  ...buildRow(USER, { contract: MOCK_EXTRACTION }),
  id: "5b1f6c1e-0000-4000-8000-000000000001",
  created_at: "2026-11-06T01:00:00Z",
});

describe("저장하는 계약 내용", () => {
  it("근거 문장과 흐릿한 항목 목록은 빼고 저장한다", () => {
    const saved = toSavedContract(MOCK_EXTRACTION);
    expect(saved).not.toHaveProperty("evidence");
    expect(saved).not.toHaveProperty("low_confidence_fields");
    expect(saved.wage).toEqual(MOCK_EXTRACTION.wage);
  });

  it("판정은 서버의 규칙 코드로 다시 한다", () => {
    const built = buildRow(USER, { contract: MOCK_EXTRACTION, minor: true });
    expect(built.result.ruleset.applied).toContain("R7");
    expect(built.rules_version).toBe(built.result.ruleset.version);
    expect(built.result.results.every((r) => r.explanation === undefined)).toBe(true);
  });
});

describe("Supabase 요청", () => {
  it("새 비밀 키는 apikey만, 예전 JWT 키는 Authorization도 보낸다", () => {
    expect(dbHeaders("sb_secret_x")).not.toHaveProperty("Authorization");
    expect(dbHeaders("eyJhbGciOi.x.y").Authorization).toBe("Bearer eyJhbGciOi.x.y");
  });

  it("저장하면 로그인한 사용자 id로 넣는다", async () => {
    reply = [row()];
    const item = await saveResult(USER, { contract: MOCK_EXTRACTION });
    expect(calls[0].method).toBe("POST");
    expect(calls[0].url).toBe("https://test.supabase.co/rest/v1/check_results");
    expect((calls[0].body as { user_id: string }).user_id).toBe(USER);
    expect(calls[0].headers.apikey).toBe("sb_secret_test");
    expect(item.counts.problem + item.counts.check + item.counts.ok).toBe(5);
  });

  it("목록, 조회, 삭제는 항상 내 user_id로 거른다 (남의 결과를 못 본다)", async () => {
    reply = [row()];
    await listResults(USER);
    await getResult(USER, "5b1f6c1e-0000-4000-8000-000000000001");
    await deleteResult(USER, "5b1f6c1e-0000-4000-8000-000000000001");
    for (const c of calls) expect(c.url).toContain("user_id=eq.kakao%3A12345");
    expect(calls[2].method).toBe("DELETE");
  });

  it("없는 결과는 null, 지운 게 없으면 false", async () => {
    reply = [];
    expect(await getResult(USER, "5b1f6c1e-0000-4000-8000-000000000002")).toBeNull();
    expect(await deleteResult(USER, "5b1f6c1e-0000-4000-8000-000000000002")).toBe(false);
  });

  it("DB 설정이 없으면 UNCONFIGURED 오류", async () => {
    vi.stubEnv("SUPABASE_URL", "");
    await expect(listResults(USER)).rejects.toMatchObject({ code: "UNCONFIGURED" });
  });
});
