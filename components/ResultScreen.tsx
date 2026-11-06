"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { CheckResult, RuleResult, Status } from "@/rules";
import { formatWon } from "@/rules/helpers";
import { RULE_ICON } from "./rule-icons";
import { CountUp } from "./CountUp";
import { SaveCard } from "./SaveCard";
import type { SaveInput } from "./saved-results-api";
import { CopyMessage, Disclaimer, ScreenHeader, SecondaryButton } from "./ui";

const STATUS_STYLE: Record<Status, { label: string; badge: string; card: string; count: string }> = {
  problem: {
    label: "기준과 달라요",
    badge: "bg-red-100 text-red-700",
    card: "border-red-200",
    count: "text-red-600",
  },
  check: {
    label: "확인이 필요해요",
    badge: "bg-amber-100 text-amber-800",
    card: "border-amber-200",
    count: "text-amber-700",
  },
  ok: {
    label: "문제 없어요",
    badge: "bg-green-100 text-green-700",
    card: "border-zinc-200",
    count: "text-green-700",
  },
};

// "2026-11-03" → "2026년 11월 3일". 형식이 다르면 받은 그대로 보여준다
function koreanDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[1]}년 ${Number(m[2])}월 ${Number(m[3])}일` : iso;
}

type Props = {
  result: CheckResult;
  saveInput: SaveInput | null; // 이 결과를 낸 입력값. 저장할 때 보낸다
  canAddPhoto: boolean;
  onAddPhoto: () => void;
  onEdit: () => void;
  onRestart: () => void;
  restartLabel?: string; // 샘플 체험이면 "내 계약서로 확인하기"
  // 아래 첫 번째 버튼. 없으면 "입력한 내용 고치기"(onEdit). 샘플 체험이면 "다른 샘플 보기"
  firstAction?: { label: string; onClick: () => void };
};

export function ResultScreen({
  result,
  saveInput,
  canAddPhoto,
  onAddPhoto,
  onEdit,
  onRestart,
  restartLabel = "다른 계약서 확인하기",
  firstAction,
}: Props) {
  const count = (s: Status) => result.results.filter((r) => r.status === s).length;
  const problems = count("problem");
  const checks = count("check");

  const headline =
    problems > 0
      ? "기준과 다른 조항이 있어요"
      : checks > 0
        ? "확인해 볼 조항이 있어요"
        : "모든 항목이 기준에 맞아요";

  return (
    <div>
      <ScreenHeader title="점검 결과" onBack={onEdit} />

      <section className="mb-6 squircle-3xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
        <p className="text-body-sm text-zinc-500">항목 {result.results.length}개를 점검했어요</p>
        <p className="mt-1 text-title2">{headline}</p>
        <dl className="mt-4 grid grid-cols-3 divide-x divide-zinc-200 border-t border-zinc-200 pt-4">
          {(["problem", "check", "ok"] as const).map((s, i) => (
            <div key={s} className="flex flex-col-reverse items-center">
              <dt className="mt-1 text-caption text-zinc-500">{STATUS_STYLE[s].label}</dt>
              <dd className={`text-title1 tabular-nums ${count(s) > 0 ? STATUS_STYLE[s].count : "text-zinc-500"}`}>
                {/* 0부터 세어 올라가며 나타난다. 칸마다 조금씩 늦게 시작한다 */}
                <CountUp value={count(s)} delay={i * 120} />
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {result.notice && (
        <p className="mb-4 squircle-2xl bg-zinc-100 px-4 py-3 text-body text-zinc-700">{result.notice}</p>
      )}

      <ul className="space-y-4">
        {result.results.map((r, i) => (
          <li key={r.id} className="animate-screen-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
            <ResultCard result={r} canAddPhoto={canAddPhoto} onAddPhoto={onAddPhoto} />
          </li>
        ))}
      </ul>

      {saveInput && (
        <div className="mt-8">
          <SaveCard input={saveInput} />
        </div>
      )}

      <div className="mt-8 space-y-3">
        {/* 이 화면의 주된 행동은 카드 안의 '문장 복사하기'라서, 아래 두 버튼은 같은 무게로 둔다 */}
        <SecondaryButton onClick={firstAction?.onClick ?? onEdit}>{firstAction?.label ?? "입력한 내용 고치기"}</SecondaryButton>
        <SecondaryButton onClick={onRestart}>{restartLabel}</SecondaryButton>
      </div>

      {/* 이 결과를 판정한 기준 (점검 응답의 ruleset, rules/version.ts). 줄은 · 에서만 바뀌게 항목마다 묶는다.
          규칙 버전 번호(ruleset.version)는 사용자에게 의미가 없어 보여주지 않는다. 응답과 저장 결과에는 남아 있다 */}
      <Disclaimer
        note={[
          `${result.ruleset.minWageYears.to}년 최저시급까지 반영`,
          `법령 ${koreanDate(result.ruleset.lawsCheckedOn)} 확인`,
        ].map((part, i) => (
          <span key={part}>
            {i > 0 && " · "}
            <span className="whitespace-nowrap">{part}</span>
          </span>
        ))}
      />
    </div>
  );
}

function ResultCard({
  result: r,
  canAddPhoto,
  onAddPhoto,
}: {
  result: RuleResult;
  canAddPhoto: boolean;
  onAddPhoto: () => void;
}) {
  const [open, setOpen] = useState(r.status !== "ok");
  const style = STATUS_STYLE[r.status];
  const Icon = RULE_ICON[r.id];

  return (
    <div className={`overflow-hidden squircle-2xl border bg-white shadow-sm ${style.card}`}>
      <button className="w-full p-4 text-left transition active:bg-zinc-50" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-headline">
            <Icon aria-hidden className="size-5 text-zinc-500" />
            {r.title}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <span className={`rounded-full px-2 py-0.5 text-caption font-semibold ${style.badge}`}>{style.label}</span>
            <ChevronDown aria-hidden className={`size-5 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
          </span>
        </div>
        <p className="mt-2 text-body text-zinc-700">{r.summary}</p>
        {r.amount && (
          <p className="mt-2 text-body">
            <span className="text-zinc-500">{r.amount.label}</span>{" "}
            <strong className="text-zinc-900">{formatWon(r.amount.value)}</strong>
          </p>
        )}
      </button>

      {open && (
        <div className="animate-screen-in border-t border-zinc-100 p-4">
          <p className="text-body text-zinc-700">{r.explanation ?? r.detail}</p>
          <p className="mt-3 text-caption text-zinc-500">
            근거: {r.basis}{" "}
            <a href={`/legal#${r.id}`} target="_blank" className="whitespace-nowrap text-blue-700 underline underline-offset-2">
              조문 원문 보기
            </a>
          </p>
          {r.request && (
            <div className="mt-4">
              <h3 className="mb-2 text-body-sm font-semibold text-zinc-700">사장님께 이렇게 말해 보세요</h3>
              <CopyMessage message={r.request} compact />
            </div>
          )}
          {r.missing && r.missing.length > 0 && canAddPhoto && (
            <SecondaryButton size="sm" className="mt-3" onClick={onAddPhoto}>
              다른 장에 있나요? 사진 추가
            </SecondaryButton>
          )}
        </div>
      )}
    </div>
  );
}
