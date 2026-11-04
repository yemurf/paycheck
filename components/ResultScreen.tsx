"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { CheckResult, RuleResult, Status } from "@/rules";
import { formatWon } from "@/rules/helpers";
import { RULE_ICON } from "./rule-icons";
import { CopyMessage, Disclaimer, PrimaryButton, ScreenHeader, SecondaryButton } from "./ui";

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
    count: "text-amber-600",
  },
  ok: {
    label: "문제 없어요",
    badge: "bg-green-100 text-green-700",
    card: "border-zinc-200",
    count: "text-green-600",
  },
};

type Props = {
  result: CheckResult;
  canAddPhoto: boolean;
  onAddPhoto: () => void;
  onEdit: () => void;
  onRestart: () => void;
};

export function ResultScreen({ result, canAddPhoto, onAddPhoto, onEdit, onRestart }: Props) {
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

      <section className="mb-6 squircle-3xl bg-zinc-50 p-5 ring-1 ring-zinc-200">
        <p className="text-sm font-medium text-zinc-500">항목 {result.results.length}개를 점검했어요</p>
        <p className="mt-1 text-xl font-bold leading-snug">{headline}</p>
        <dl className="mt-4 grid grid-cols-3 divide-x divide-zinc-200 border-t border-zinc-200 pt-4">
          {(["problem", "check", "ok"] as const).map((s) => (
            <div key={s} className="flex flex-col-reverse items-center">
              <dt className="mt-0.5 text-xs font-medium text-zinc-500">{STATUS_STYLE[s].label}</dt>
              <dd className={`text-2xl font-bold ${count(s) > 0 ? STATUS_STYLE[s].count : "text-zinc-300"}`}>{count(s)}</dd>
            </div>
          ))}
        </dl>
      </section>

      {result.notice && (
        <p className="mb-4 squircle-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-700">{result.notice}</p>
      )}

      <ul className="space-y-3">
        {result.results.map((r, i) => (
          <li key={r.id} className="animate-screen-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
            <ResultCard result={r} canAddPhoto={canAddPhoto} onAddPhoto={onAddPhoto} />
          </li>
        ))}
      </ul>

      <div className="mt-8 space-y-3">
        <SecondaryButton onClick={onEdit}>입력한 내용 고치기</SecondaryButton>
        <PrimaryButton onClick={onRestart}>다른 계약서 확인하기</PrimaryButton>
      </div>

      <Disclaimer />
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
          <span className="flex items-center gap-2 font-semibold">
            <Icon aria-hidden className="size-5 text-zinc-500" />
            {r.title}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.badge}`}>{style.label}</span>
            <ChevronDown aria-hidden className={`size-5 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
          </span>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-700">{r.summary}</p>
        {r.amount && (
          <p className="mt-2 text-sm">
            <span className="text-zinc-500">{r.amount.label}</span>{" "}
            <strong className="text-zinc-900">{formatWon(r.amount.value)}</strong>
          </p>
        )}
      </button>

      {open && (
        <div className="animate-screen-in border-t border-zinc-100 px-4 pt-3 pb-4">
          <p className="text-sm leading-relaxed text-zinc-700">{r.explanation ?? r.detail}</p>
          <p className="mt-3 text-xs leading-relaxed text-zinc-500">
            근거: {r.basis}{" "}
            <a href={`/legal#${r.id}`} target="_blank" className="whitespace-nowrap text-blue-700 underline underline-offset-2">
              조문 원문 보기
            </a>
          </p>
          {r.request && (
            <div className="mt-4">
              <h3 className="mb-2 text-xs font-semibold text-zinc-500">사장님께 이렇게 말해 보세요</h3>
              <CopyMessage message={r.request} compact />
            </div>
          )}
          {r.missing && r.missing.length > 0 && canAddPhoto && (
            <SecondaryButton className="mt-3 py-2 text-sm" onClick={onAddPhoto}>
              다른 장에 있나요? 사진 추가
            </SecondaryButton>
          )}
        </div>
      )}
    </div>
  );
}
