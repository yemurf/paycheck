// 카카오 로그인 (REST API, 인가 코드 방식).
// 1) 카카오 로그인 화면으로 보낸다 → 2) 돌아온 인가 코드로 토큰을 받는다 → 3) 토큰으로 회원번호·닉네임을 읽는다.
// 카카오 토큰은 회원 정보를 읽는 데만 쓰고 저장하지 않는다.
import type { SessionUser } from "./session";

const AUTHORIZE_URL = "https://kauth.kakao.com/oauth/authorize";
const TOKEN_URL = "https://kauth.kakao.com/oauth/token";
const USER_URL = "https://kapi.kakao.com/v2/user/me";

export class KakaoError extends Error {}

function config() {
  const clientId = process.env.KAKAO_REST_API_KEY;
  const clientSecret = process.env.KAKAO_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new KakaoError("KAKAO_REST_API_KEY, KAKAO_CLIENT_SECRET이 없어요. .env.local을 확인해 주세요.");
  }
  return { clientId, clientSecret };
}

// 카카오 개발자 사이트에 등록한 Redirect URI와 글자 하나까지 같아야 한다
export const callbackUrl = (origin: string) => `${origin}/api/auth/kakao/callback`;

export function authorizeUrl(origin: string, state: string): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config().clientId);
  url.searchParams.set("redirect_uri", callbackUrl(origin));
  url.searchParams.set("state", state);
  return url.toString();
}

export async function fetchKakaoUser(origin: string, code: string): Promise<SessionUser> {
  const { clientId, clientSecret } = config();

  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl(origin),
      code,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const token = (await tokenRes.json().catch(() => null)) as { access_token?: string } | null;
  if (!tokenRes.ok || !token?.access_token) {
    throw new KakaoError(`카카오 토큰 발급 실패 (${tokenRes.status})`);
  }

  const userRes = await fetch(USER_URL, {
    headers: { Authorization: `Bearer ${token.access_token}` },
    signal: AbortSignal.timeout(10_000),
  });
  const user = (await userRes.json().catch(() => null)) as {
    id?: number;
    properties?: { nickname?: string };
    kakao_account?: { profile?: { nickname?: string } };
  } | null;
  if (!userRes.ok || typeof user?.id !== "number") {
    throw new KakaoError(`카카오 회원 정보 조회 실패 (${userRes.status})`);
  }

  return {
    id: `kakao:${user.id}`,
    name: user.kakao_account?.profile?.nickname ?? user.properties?.nickname ?? null,
  };
}

// 로그인 뒤 돌아갈 곳. 다른 사이트로 보내는 데 악용되지 않게 우리 사이트 안의 경로만 받는다.
// 없거나 이상하면 랜딩으로 (로그인 실패 안내가 있는 곳)
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}

// 로그인을 시작한 브라우저가 돌아온 브라우저와 같은지 확인하는 값(state)과 돌아갈 경로를 잠깐 담아 두는 쿠키
export const STATE_COOKIE = "pc_kakao_state";
export const stateCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth/kakao",
  maxAge: 10 * 60, // 10분 안에 로그인을 마쳐야 한다
};

export function encodeState(value: { state: string; next: string }): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function decodeState(raw: string | undefined): { state: string; next: string } | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(Buffer.from(raw, "base64url").toString());
    return typeof value?.state === "string" ? { state: value.state, next: safeNextPath(value.next) } : null;
  } catch {
    return null;
  }
}
