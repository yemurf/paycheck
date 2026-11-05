import { getSessionUser } from "@/lib/session";

// GET /api/auth/me → { data: { user: { id, name } | null } }
// 화면에서 로그인 여부를 보여줄 때 쓴다.
export async function GET() {
  const user = await getSessionUser();
  return Response.json({ data: { user } }, { headers: { "Cache-Control": "no-store" } });
}
