// Supabase(Postgres)에 서버에서만 접근한다. 패키지 없이 Supabase REST API(PostgREST)를 fetch로 부른다.
// 비밀 키(service role / secret key)는 서버 환경변수에만 둔다. 브라우저로 보내지 않는다.
// 테이블은 Row Level Security가 켜져 있어서 이 키 없이는 아무도 읽고 쓸 수 없다 (supabase/schema.sql).

export class DbError extends Error {
  constructor(
    public code: "UNCONFIGURED" | "REQUEST_FAILED",
    message: string,
  ) {
    super(message);
  }
}

export function dbConfigured(): boolean {
  return Boolean(dbUrl() && dbKey());
}

const dbUrl = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const dbKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

// 예전 키(eyJ…로 시작하는 JWT)는 Authorization에도 넣어야 하고, 새 비밀 키(sb_secret_…)는 apikey만 넣는다
export function dbHeaders(key: string): Record<string, string> {
  return {
    apikey: key,
    ...(key.startsWith("eyJ") && { Authorization: `Bearer ${key}` }),
    "Content-Type": "application/json",
  };
}

// path 예: "check_results?user_id=eq.kakao%3A1&select=*"
export async function db<T>(path: string, init: { method?: string; body?: unknown; prefer?: string } = {}): Promise<T> {
  const url = dbUrl();
  const key = dbKey();
  if (!url || !key) throw new DbError("UNCONFIGURED", "SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY가 없어요.");

  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${path}`, {
    method: init.method ?? "GET",
    headers: { ...dbHeaders(key), ...(init.prefer && { Prefer: init.prefer }) },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new DbError("REQUEST_FAILED", `Supabase ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  }
  return (res.status === 204 ? null : await res.json()) as T;
}

// PostgREST 필터 값. 사용자 id에 들어 있는 ":" 같은 글자를 안전하게 넣는다.
export const eq = (value: string) => `eq.${encodeURIComponent(value)}`;
