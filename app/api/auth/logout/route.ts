import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

// POST /api/auth/logout → 로그인 쿠키를 지우고 첫 화면으로 보낸다.
// GET으로 받지 않는 건 다른 사이트의 이미지 태그 같은 걸로 몰래 로그아웃시키지 못하게 하려는 것.
export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.nextUrl.origin), 303);
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
}
