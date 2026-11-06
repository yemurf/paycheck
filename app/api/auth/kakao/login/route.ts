import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { authorizeUrl, encodeState, KakaoError, safeNextPath, STATE_COOKIE, stateCookieOptions } from "@/lib/kakao";

// GET /api/auth/kakao/login?next=/my
// 카카오 로그인 화면으로 보낸다. 로그인을 마치면 /api/auth/kakao/callback으로 돌아오고, 그다음 next로 간다.
export async function GET(request: NextRequest) {
  const state = randomBytes(16).toString("hex");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));

  let url: string;
  try {
    url = authorizeUrl(request.nextUrl.origin, state);
  } catch (e) {
    console.error("kakao login config", e);
    const message = e instanceof KakaoError ? "카카오 로그인 설정이 아직 안 됐어요." : "잠시 후 다시 시도해 주세요.";
    return Response.json({ error: { code: "LOGIN_UNAVAILABLE", message } }, { status: 500 });
  }

  const response = NextResponse.redirect(url);
  response.cookies.set(STATE_COOKIE, encodeState({ state, next }), stateCookieOptions);
  return response;
}
