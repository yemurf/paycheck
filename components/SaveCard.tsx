"use client";

import { BookmarkPlus, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { KakaoLoginButton, useAuth } from "./AuthArea";
import { keepPendingSave, saveResult, type SaveInput } from "./saved-results-api";
import { PrimaryButton } from "./ui";

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved" }
  | { status: "error"; message: string; preparing: boolean };

// 결과 화면 아래쪽의 저장 카드. 로그인은 선택이라 저장하지 않아도 점검은 끝난 상태다.
// 로그인 전이면 카카오에 다녀오는 동안 결과가 사라지므로, 저장할 값을 맡겨 두고 /my에서 저장한다.
export function SaveCard({ input }: { input: SaveInput }) {
  const auth = useAuth();
  const [state, setState] = useState<SaveState>({ status: "idle" });

  async function save() {
    setState({ status: "saving" });
    const res = await saveResult(input);
    setState(
      res.ok ? { status: "saved" } : { status: "error", message: res.message, preparing: res.status === 503 },
    );
  }

  const loggedIn = auth.status === "ready" && auth.user != null;
  const text = loggedIn
    ? "저장해 두면, 급여명세서를 받을 때마다 이 계약서 기준으로 점검할 수 있어요."
    : "로그인하고 저장하면, 급여명세서를 받을 때마다 이 계약서 기준으로 점검할 수 있어요.";

  return (
    <section className="squircle-3xl bg-white p-4 ring-1 ring-zinc-200">
      <div className="flex gap-3 text-body">
        {/* 아이콘을 첫 줄 가운데에 맞춘다 (1lh = 한 줄 높이) */}
        <span className="flex h-[1lh] shrink-0 items-center">
          <BookmarkPlus aria-hidden className="size-5 text-blue-600" />
        </span>
        <p className="text-zinc-700">{text}</p>
      </div>

      <div className="mt-4">
        {auth.status === "loading" ? (
          // 로그인 여부를 불러오는 동안 버튼 자리만 잡아 둔다
          <div aria-hidden className="h-11" />
        ) : !loggedIn ? (
          <KakaoLoginButton next="/my" onBeforeLeave={() => keepPendingSave(input)} />
        ) : state.status === "saved" ? (
          <div className="flex min-h-11 items-center justify-between gap-2">
            <p role="status" className="flex items-center gap-2 text-body font-semibold text-zinc-900">
              <Check aria-hidden className="size-5 animate-pop text-green-700" />
              저장했어요
            </p>
            <Link
              href="/my"
              className="inline-flex min-h-11 shrink-0 items-center px-2 text-body-sm font-semibold text-blue-700 underline underline-offset-2"
            >
              내 계약서 보기
            </Link>
          </div>
        ) : (
          <>
            <PrimaryButton size="sm" disabled={state.status === "saving"} onClick={save}>
              {state.status === "saving" ? "저장하고 있어요…" : "이 결과 저장하기"}
            </PrimaryButton>
            {state.status === "error" && (
              // 저장 기능이 아직 준비되지 않은 것(503)은 사용자 잘못이 아니라 빨간색으로 겁주지 않는다
              <p role="alert" className={`mt-2 text-body-sm ${state.preparing ? "text-zinc-600" : "text-red-700"}`}>
                {state.message}
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
