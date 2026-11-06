"use client";

import { Check, FileSearch } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatWon } from "@/rules/helpers";
import { AuthArea, KakaoLoginButton, LoginNotice, useAuth } from "./AuthArea";
import {
  clearPendingSave,
  deleteResult,
  listResults,
  saveResult,
  takePendingSave,
  type SavedSummary,
} from "./saved-results-api";
import { ScreenHeader } from "./ui";

type ListState =
  | { status: "loading" }
  | { status: "ok"; items: SavedSummary[] }
  | { status: "error"; message: string; preparing: boolean };

// /my: 로그인한 사용자가 저장한 계약서 목록.
// 결과 화면에서 로그인 전에 저장을 누르면, 맡겨 둔 값(pc_pending_save)을 여기서 저장하고 바로 지운다.
export function MyContracts() {
  const auth = useAuth();
  const [list, setList] = useState<ListState>({ status: "loading" });
  const [saveNote, setSaveNote] = useState<{ ok: boolean; text: string } | null>(null);
  const started = useRef(false); // 개발 모드에서 effect가 두 번 돌아도 한 번만 저장·조회한다

  const userId = auth.status === "ready" ? auth.user?.id : undefined;
  useEffect(() => {
    if (!userId || started.current) return;
    started.current = true;
    (async () => {
      const pending = takePendingSave();
      if (pending) {
        const res = await saveResult(pending);
        setSaveNote(
          res.ok
            ? { ok: true, text: "방금 점검한 결과를 저장했어요." }
            : { ok: false, text: `방금 점검한 결과를 저장하지 못했어요. ${res.message}` },
        );
      }
      const res = await listResults();
      setList(
        res.ok
          ? { status: "ok", items: res.data.items }
          : { status: "error", message: res.message, preparing: res.status === 503 },
      );
    })();
  }, [userId]);

  async function remove(id: string) {
    const res = await deleteResult(id);
    if (res.ok) setList((prev) => (prev.status === "ok" ? { ...prev, items: prev.items.filter((i) => i.id !== id) } : prev));
    return res;
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* 로그인을 취소·실패하고 돌아오면 맡겨 둔 계약 내용이 브라우저에 남지 않게 지운다 */}
      <LoginNotice onFailed={clearPendingSave} />
      <ScreenHeader title="내 계약서" backHref="/check" />

      <div className="flex-1">
        {auth.status === "loading" ? (
          <Loading />
        ) : !auth.user ? (
          <section className="squircle-3xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
            <p className="text-body text-zinc-700">
              로그인하면 저장한 계약서를 볼 수 있어요. 급여명세서를 받을 때마다 저장한 계약서 기준으로 점검할 수 있어요.
            </p>
            <div className="mt-4">
              <KakaoLoginButton next="/my" />
            </div>
          </section>
        ) : (
          <>
            {saveNote && (
              <p
                role="status"
                className={`mb-4 flex gap-2 squircle-2xl px-4 py-3 text-body ${
                  saveNote.ok ? "bg-blue-50 text-blue-800" : "bg-red-50 text-red-700"
                }`}
              >
                {saveNote.ok && (
                  <span className="flex h-[1lh] shrink-0 items-center">
                    <Check aria-hidden className="size-5 animate-pop" />
                  </span>
                )}
                {saveNote.text}
              </p>
            )}
            {list.status === "loading" ? (
              <Loading />
            ) : list.status === "error" ? (
              <Empty text={list.message} tone={list.preparing ? "muted" : "error"} />
            ) : list.items.length === 0 ? (
              <Empty text="저장한 계약서가 없어요" />
            ) : (
              <ul className="space-y-4">
                {list.items.map((item) => (
                  <li key={item.id}>
                    <SavedItem item={item} onDelete={() => remove(item.id)} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {auth.status === "ready" && auth.user && (
        <div className="mt-8 border-t border-zinc-100 pt-4 pb-4">
          <AuthArea next="/my" variant="inline" showMyLink={false} />
        </div>
      )}
    </div>
  );
}

function Loading() {
  return (
    <p role="status" className="py-12 text-center text-body-sm text-zinc-500">
      불러오고 있어요…
    </p>
  );
}

// 목록이 비었거나 불러오지 못했을 때. 저장 기능 준비 중(503)은 겁주지 않게 회색으로.
function Empty({ text, tone = "muted" }: { text: string; tone?: "muted" | "error" }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <p role={tone === "error" ? "alert" : undefined} className={`text-body ${tone === "error" ? "text-red-700" : "text-zinc-600"}`}>
        {text}
      </p>
      <Link
        data-press
        href="/check"
        className="mt-6 inline-flex min-h-14 items-center justify-center squircle-2xl bg-blue-600 px-6 text-headline text-white shadow-sm shadow-blue-600/20 transition active:scale-[0.98] active:bg-blue-700"
      >
        계약서 점검하기
      </Link>
    </div>
  );
}

const WAGE_TYPE: Record<string, string> = { hourly: "시급", daily: "일급", monthly: "월급", other: "급여" };

const dot = (iso: string | null) => (iso ? iso.replaceAll("-", ".") : null);

function periodText(p: SavedSummary["period"]): string {
  const start = dot(p.start) ?? "시작일 모름";
  if (p.indefinite) return `${start}부터 · 기간 정함 없음`;
  return `${start} – ${dot(p.end) ?? "종료일 모름"}`;
}

// 저장한 날짜는 한국 시간으로 "11월 6일"
const checkedOn = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", timeZone: "Asia/Seoul" }).format(new Date(iso));

const COUNTS = [
  { key: "problem", label: "기준과 달라요", tone: "text-red-600" },
  { key: "check", label: "확인 필요", tone: "text-amber-700" },
  { key: "ok", label: "문제 없음", tone: "text-green-700" },
] as const;

function SavedItem({
  item,
  onDelete,
}: {
  item: SavedSummary;
  onDelete: () => Promise<{ ok: boolean; message?: string }>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setDeleting(true);
    setError(null);
    const res = await onDelete();
    if (!res.ok) {
      setError(res.message ?? "지우지 못했어요. 잠시 후 다시 시도해 주세요.");
      setDeleting(false);
      setConfirming(false);
    }
  }

  const wage =
    item.wage.amount != null
      ? `${WAGE_TYPE[item.wage.type ?? "other"] ?? "급여"} ${formatWon(item.wage.amount)}`
      : "금액 모름";

  return (
    <article className="squircle-3xl bg-white p-4 ring-1 ring-zinc-200">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-headline">{item.workplace ?? "근무 장소 모름"}</h2>
          <p className="mt-1 text-caption text-zinc-500">{checkedOn(item.createdAt)} 점검</p>
        </div>
        {!confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="-my-2 -mr-2 inline-flex min-h-11 shrink-0 items-center px-2 text-body-sm text-zinc-500 underline underline-offset-2 active:text-zinc-700"
          >
            지우기
          </button>
        )}
      </div>

      <dl className="mt-3 space-y-1 text-body-sm">
        <div className="flex gap-2">
          <dt className="w-14 shrink-0 text-zinc-500">급여</dt>
          <dd className="font-semibold text-zinc-900 tabular-nums">{wage}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-14 shrink-0 text-zinc-500">계약기간</dt>
          <dd className="text-zinc-900 tabular-nums">{periodText(item.period)}</dd>
        </div>
      </dl>

      {/* 결과 요약: 줄은 · 에서만 바뀌게 항목마다 묶는다 */}
      <p className="mt-3 text-body-sm text-zinc-600">
        {COUNTS.map((c, i) => {
          const n = item.counts[c.key];
          return (
            <span key={c.key}>
              {i > 0 && " · "}
              <span className="whitespace-nowrap">
                {c.label} <strong className={`tabular-nums ${n > 0 ? c.tone : "text-zinc-500"}`}>{n}</strong>
              </span>
            </span>
          );
        })}
      </p>

      {confirming ? (
        // 카드(24px, 안쪽 16px) 안의 상자라 동심원 규칙대로 8px
        <div className="mt-4 rounded-lg bg-zinc-50 p-3">
          <p className="text-body-sm text-zinc-700">이 계약서와 점검 결과를 지울까요? 지우면 되돌릴 수 없어요.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="min-h-11 rounded-xl border border-zinc-200 bg-white text-body-sm font-semibold text-zinc-800 active:bg-zinc-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={deleting}
              className="min-h-11 rounded-xl bg-red-600 text-body-sm font-semibold text-white active:bg-red-700 disabled:bg-red-300"
            >
              {deleting ? "지우고 있어요…" : "지우기"}
            </button>
          </div>
        </div>
      ) : (
        // 급여명세서 대조는 2단계 기능이라 자리만 보여 준다
        <button
          type="button"
          disabled
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 px-3 text-body-sm font-semibold text-zinc-500"
        >
          <FileSearch aria-hidden className="size-4" />
          급여명세서 대조하기
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-caption font-semibold text-zinc-500">
            2단계에서 열려요
          </span>
        </button>
      )}
      {error && (
        <p role="alert" className="mt-2 text-body-sm text-red-700">
          {error}
        </p>
      )}
    </article>
  );
}
