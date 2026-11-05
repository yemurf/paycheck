// 로그인 상태. DB 없이 브라우저 쿠키에 서명한 토큰으로 담는다 (stateless session).
// 토큰 = base64url(내용) + "." + base64url(HMAC-SHA256 서명). 서명이 맞아야만 믿는다.
// 내용은 서명만 하고 암호화하지 않으니, 비밀이 아닌 값(카카오 회원번호, 닉네임)만 담는다.
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "pc_session";
const SESSION_DAYS = 30;

export type SessionUser = {
  id: string; // "kakao:12345"
  name: string | null; // 카카오 닉네임 (동의하지 않으면 null)
};

type Payload = SessionUser & { exp: number }; // exp: 만료 시각 (초)

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET이 없거나 너무 짧아요 (32자 이상). .env.local을 확인해 주세요.");
  }
  return value;
}

const sign = (data: string, key: string) => createHmac("sha256", key).update(data).digest("base64url");

export function signToken(user: SessionUser, key: string, now = Date.now()): string {
  const payload: Payload = { ...user, exp: Math.floor(now / 1000) + SESSION_DAYS * 24 * 60 * 60 };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body, key)}`;
}

// 서명이 틀리거나 만료됐거나 모양이 이상하면 null
export function verifyToken(token: string | undefined, key: string, now = Date.now()): SessionUser | null {
  if (!token) return null;
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra !== undefined) return null;

  const expected = Buffer.from(sign(body, key));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload;
    if (typeof payload.id !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp * 1000 <= now) return null;
    return { id: payload.id, name: typeof payload.name === "string" ? payload.name : null };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true, // 화면의 자바스크립트가 읽지 못하게
  secure: process.env.NODE_ENV === "production", // 배포에서는 https로만
  sameSite: "lax" as const, // 카카오에서 돌아올 때는 보내고, 다른 사이트의 몰래 보내는 요청에는 안 보낸다
  path: "/",
  maxAge: SESSION_DAYS * 24 * 60 * 60,
};

export function createSessionToken(user: SessionUser): string {
  return signToken(user, secret());
}

// 서버 컴포넌트·라우트 핸들러에서 지금 로그인한 사람을 읽는다. 로그인 안 했으면 null.
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !process.env.SESSION_SECRET) return null;
  return verifyToken(token, secret());
}
