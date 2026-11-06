import { z } from "zod";
import { ContractExtractionSchema } from "@/lib/contract-schema";
import { clientIp, isRateLimited } from "@/lib/rate-limit";
import { dbFailure, listResults, saveResult } from "@/lib/saved-results";
import { getSessionUser } from "@/lib/session";

// 로그인한 사용자의 점검 결과.
// GET  /api/results → { data: { items: SavedSummary[] } } 최근 50개
// POST /api/results  { contract, weeklyHours?, minor? } → { data: { item: SavedSummary } }
//   판정은 서버가 다시 한다. 사진은 받지도 저장하지도 않는다.
// 로그인 안 했으면 401, DB 설정이 없으면 503.

const SaveRequestSchema = z.object({
  contract: ContractExtractionSchema,
  weeklyHours: z.number().min(0).max(168).nullable().optional(),
  minor: z.boolean().optional(),
});

const fail = (status: number, code: string, message: string) =>
  Response.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail(401, "LOGIN_REQUIRED", "로그인하면 저장한 결과를 볼 수 있어요.");
  try {
    return Response.json({ data: { items: await listResults(user.id) } }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return dbFailure(e);
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return fail(401, "LOGIN_REQUIRED", "로그인하면 결과를 저장할 수 있어요.");
  if (isRateLimited(`save:${clientIp(request)}`)) return fail(429, "RATE_LIMITED", "잠시 후 다시 시도해 주세요.");

  const parsed = SaveRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "BAD_REQUEST", "저장할 내용을 다시 확인해 주세요.");

  try {
    return Response.json({ data: { item: await saveResult(user.id, parsed.data) } }, { status: 201 });
  } catch (e) {
    return dbFailure(e);
  }
}
