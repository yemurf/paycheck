// IP당 분당 5회 (PRD 8장). 서버 인스턴스 메모리에만 두는 간이 제한이라
// Vercel에서 인스턴스가 여러 개 뜨면 인스턴스마다 따로 센다.
const WINDOW_MS = 60_000;
const LIMIT = 5;

const hits = new Map<string, number[]>();

// key는 "extract:1.2.3.4"처럼 라우트별로 따로 센다.
export function isRateLimited(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}
