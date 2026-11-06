import { NextResponse, type NextRequest } from "next/server";
import { decodeState, fetchKakaoUser, STATE_COOKIE, stateCookieOptions } from "@/lib/kakao";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

// GET /api/auth/kakao/callback?code=...&state=...
// 카카오에서 돌아오면 회원번호·닉네임을 읽어 로그인 쿠키를 만들고, 처음에 있던 화면(next)으로 보낸다.
// 실패하면 next?login=failed, 사용자가 취소하면 next?login=cancelled로 보낸다.
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const params = request.nextUrl.searchParams;
  const saved = decodeState(request.cookies.get(STATE_COOKIE)?.value);
  const next = saved?.next ?? "/";

  const done = (result?: "failed" | "cancelled") => {
    const url = new URL(next, origin);
    if (result) url.searchParams.set("login", result);
    const response = NextResponse.redirect(url);
    response.cookies.set(STATE_COOKIE, "", { ...stateCookieOptions, maxAge: 0 });
    return response;
  };

  if (params.get("error")) return done(params.get("error") === "access_denied" ? "cancelled" : "failed");
  const code = params.get("code");
  // 다른 브라우저나 다른 사이트에서 시작된 요청이면 받지 않는다
  if (!code || !saved || params.get("state") !== saved.state) return done("failed");

  try {
    const user = await fetchKakaoUser(origin, code);
    const response = done();
    response.cookies.set(SESSION_COOKIE, createSessionToken(user), sessionCookieOptions);
    return response;
  } catch (e) {
    console.error("kakao callback", e);
    return done("failed");
  }
}
