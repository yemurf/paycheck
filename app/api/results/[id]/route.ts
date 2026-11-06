import { dbFailure, deleteResult, getResult } from "@/lib/saved-results";
import { getSessionUser } from "@/lib/session";

// GET    /api/results/:id → { data: { item: SavedDetail } } (계약 내용 + 판정 결과. 급여명세서 대조의 기준)
// DELETE /api/results/:id → { data: { deleted: true } }
// 본인 결과만 보고 지울 수 있다. 다른 사람 것이면 없는 것처럼 404.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail = (status: number, code: string, message: string) => Response.json({ error: { code, message } }, { status });

export async function GET(_request: Request, ctx: RouteContext<"/api/results/[id]">) {
  const user = await getSessionUser();
  if (!user) return fail(401, "LOGIN_REQUIRED", "로그인이 필요해요.");
  const { id } = await ctx.params;
  if (!UUID.test(id)) return fail(404, "NOT_FOUND", "저장한 결과를 찾지 못했어요.");
  try {
    const item = await getResult(user.id, id);
    return item
      ? Response.json({ data: { item } }, { headers: { "Cache-Control": "no-store" } })
      : fail(404, "NOT_FOUND", "저장한 결과를 찾지 못했어요.");
  } catch (e) {
    return dbFailure(e);
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/results/[id]">) {
  const user = await getSessionUser();
  if (!user) return fail(401, "LOGIN_REQUIRED", "로그인이 필요해요.");
  const { id } = await ctx.params;
  if (!UUID.test(id)) return fail(404, "NOT_FOUND", "저장한 결과를 찾지 못했어요.");
  try {
    return (await deleteResult(user.id, id))
      ? Response.json({ data: { deleted: true } })
      : fail(404, "NOT_FOUND", "저장한 결과를 찾지 못했어요.");
  } catch (e) {
    return dbFailure(e);
  }
}
