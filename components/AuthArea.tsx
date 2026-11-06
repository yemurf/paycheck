"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// 카카오 로그인 영역. 로그인은 선택 기능이라, 이 영역이 없어도 점검 흐름은 그대로 돌아간다.
// 서버: GET /api/auth/me(로그인 여부), GET /api/auth/kakao/login?next=(카카오로 이동), POST /api/auth/logout

export type User = { id: string; name: string | null };
export type AuthState = { status: "loading" } | { status: "ready"; user: User | null };

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { data?: { user?: User | null } } | null) => {
        if (alive) setState({ status: "ready", user: json?.data?.user ?? null });
      })
      // 로그인 여부를 못 불러와도 점검은 써야 하니, 로그인 전 화면으로 둔다
      .catch(() => {
        if (alive) setState({ status: "ready", user: null });
      });
    return () => {
      alive = false;
    };
  }, []);
  return state;
}

// 카카오 로그인 디자인 가이드: 배경 #FEE500, 심볼 #000000, 레이블 #000000 85%, 모서리 12px,
// 레이블 높이는 버튼 높이의 1/3 이하(44px 버튼에 15px 글씨), OS 기본 서체, 심볼 모양·비율·색 변경 금지.
// 카카오 화면으로 이동해야 하므로 fetch가 아니라 일반 링크로 연다.
// onBeforeLeave: 카카오로 떠나기 직전에 할 일 (예: 저장할 결과를 잠시 맡겨 두기)
export function KakaoLoginButton({ next, onBeforeLeave }: { next: string; onBeforeLeave?: () => void }) {
  return (
    <a
      href={`/api/auth/kakao/login?next=${encodeURIComponent(next)}`}
      onClick={onBeforeLeave}
      className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#FEE500] px-4 font-[system-ui,-apple-system,BlinkMacSystemFont,Roboto,sans-serif] text-[15px] leading-none font-semibold text-black/85 transition active:brightness-95"
    >
      <KakaoSymbol />
      카카오 로그인
    </a>
  );
}

// 카카오 말풍선 심볼 (카카오 로그인 버튼 리소스의 모양 그대로)
function KakaoSymbol() {
  return (
    <svg aria-hidden viewBox="0 0 18 18" className="size-[18px] shrink-0">
      <path
        fill="#000000"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 0.6C4.029 0.6 0 3.713 0 7.552c0 2.388 1.558 4.493 3.932 5.745l-0.999 3.648c-0.088 0.322 0.28 0.579 0.563 0.392l4.377-2.888c0.37 0.035 0.745 0.055 1.127 0.055 4.97 0 9-3.113 9-6.952C18 3.713 13.97 0.6 9 0.6"
      />
    </svg>
  );
}

// 로그아웃은 GET이 막혀 있어서 form POST로 보낸다. 서버가 쿠키를 지우고 첫 화면(/)으로 보낸다.
function LogoutButton() {
  return (
    <form method="post" action="/api/auth/logout" className="shrink-0">
      <button
        type="submit"
        className="inline-flex min-h-11 items-center px-2 text-body-sm text-zinc-500 underline underline-offset-2 active:text-zinc-700"
      >
        로그아웃
      </button>
    </form>
  );
}

// header: 랜딩 헤더 오른쪽. inline: /check 첫 화면 아래쪽(눈에 덜 띄게, 가운데 정렬)
// showMyLink: 로그인 후 '내 계약서'(/my) 링크. /my 화면 안에서는 끈다.
export function AuthArea({
  next,
  variant,
  showMyLink = true,
}: {
  next: string;
  variant: "header" | "inline";
  showMyLink?: boolean;
}) {
  const auth = useAuth();
  const align = variant === "header" ? "justify-end" : "justify-center";

  // inline에서는 로그인이 필수처럼 보이지 않게 버튼 위에 한 줄 안내를 붙인다
  const hint = variant === "inline" && (
    <p className="mb-2 text-center text-caption text-zinc-500">로그인은 선택이에요. 안 해도 모든 기능을 쓸 수 있어요.</p>
  );

  // 불러오는 동안은 로그인 전 화면과 같은 크기로 자리만 잡아 둔다 (화면이 덜컥 움직이지 않게)
  if (auth.status === "loading") {
    return (
      <div aria-hidden className="invisible">
        {hint}
        <div className={`flex h-11 ${align}`}>
          <span className="w-[140px]" />
        </div>
      </div>
    );
  }

  if (!auth.user) {
    return (
      <div>
        {hint}
        <div className={`flex h-11 ${align}`}>
          <KakaoLoginButton next={next} />
        </div>
      </div>
    );
  }

  const name = auth.user.name;
  return (
    <div className={`flex min-h-11 min-w-0 items-center gap-1 ${align}`}>
      {/* 닉네임이 길면 닉네임만 말줄임하고 '님'은 남긴다 */}
      <span className="flex min-w-0 text-body-sm font-semibold text-zinc-700">
        {name ? (
          <>
            <span className="truncate">{name}</span>
            <span className="shrink-0">님</span>
            {variant === "inline" && <span className="shrink-0 font-normal text-zinc-500">으로 로그인했어요</span>}
          </>
        ) : (
          "로그인됨"
        )}
      </span>
      {showMyLink && (
        <Link
          href="/my"
          className="inline-flex min-h-11 shrink-0 items-center px-2 text-body-sm font-semibold text-blue-700 active:text-blue-800"
        >
          내 계약서
        </Link>
      )}
      <LogoutButton />
    </div>
  );
}

const LOGIN_MESSAGE: Record<string, string> = {
  failed: "카카오 로그인을 하지 못했어요. 잠시 후 다시 시도해 주세요.",
  cancelled: "로그인을 취소했어요.",
};

// 카카오에서 돌아올 때 붙는 ?login=failed|cancelled 안내. 4초 동안 보여주고 사라지며,
// 새로고침해도 다시 뜨지 않게 주소에서 login만 지운다(다른 파라미터와 #은 그대로).
// onFailed: 로그인이 실패·취소됐을 때 할 일 (예: 맡겨 둔 저장 내용 지우기). 주소를 지우기 전에 부른다.
export function LoginNotice({ onFailed }: { onFailed?: () => void } = {}) {
  const [message, setMessage] = useState<string | null>(null);

  // 주소를 읽고 바로 지운다. 개발 모드에서 effect가 두 번 돌면 두 번째에는 login이 없으니,
  // 안내를 띄우는 타이머는 취소하지 않는다(취소하면 안내가 영영 안 뜬다).
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("login")) return;
    const text = LOGIN_MESSAGE[url.searchParams.get("login") ?? ""];
    if (text) onFailed?.();
    url.searchParams.delete("login");
    history.replaceState(history.state, "", url.pathname + url.search + url.hash);
    if (text) setTimeout(() => setMessage(text), 0);
    // 처음 한 번만 본다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!message) return;
    const hide = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(hide);
  }, [message]);

  if (!message) return null;
  return (
    <p
      role="status"
      className="fixed inset-x-4 top-[max(1rem,env(safe-area-inset-top))] z-50 mx-auto max-w-sm animate-screen-in squircle-xl bg-zinc-900 px-4 py-3 text-center text-body-sm text-white shadow-lg"
    >
      {message}
    </p>
  );
}
