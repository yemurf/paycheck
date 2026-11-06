"use client";

import {
  CalendarCheck,
  CalendarRange,
  Check,
  ChevronDown,
  Clock,
  Coins,
  Plus,
  Sprout,
  TreePalm,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { ApiError, checkContract } from "@/lib/api-client";
import type { ContractExtraction } from "@/lib/contract-schema";
import type { CheckResult } from "@/rules";
import { formatWon } from "@/rules/helpers";
import type { SaveInput } from "./saved-results-api";
import { ErrorBox, PrimaryButton, ScreenHeader, WorkingScreen } from "./ui";

const CHECK_STEPS = [
  { at: 0, text: "근로기준법·최저임금법과 비교하고 있어요" },
  { at: 3, text: "결과를 쉬운 말로 풀어 쓰고 있어요" },
  { at: 8, text: "거의 다 됐어요" },
];

export type ConfirmState = {
  contract: ContractExtraction;
  weeklyHours: string; // 스케줄 근무일 때만 입력
  wageConfirmed: boolean; // 시급은 값이 있어도 항상 확인받는다 (F4)
  // 근무 시작일에 만 18세 미만인지. 미리 고르지 않는다: "18세 이상"을 기본값으로 두면 청소년이 그냥 넘어가 경고를 못 받는다
  minor: boolean | null;
};

type Props = {
  state: ConfirmState;
  onChange: (state: ConfirmState) => void;
  // input: 이 결과를 낸 입력값. 결과를 저장할 때 그대로 보낸다 (확인 화면 값이 나중에 바뀌어도 결과와 어긋나지 않게)
  onChecked: (result: CheckResult, input: SaveInput) => void;
  onBack: () => void;
};

// 점검(와 저장)에 보내는 값. 요일·시간이 정해진 근무면 주 근로시간은 서버가 일정으로 계산하니 null.
export function checkInputOf(state: ConfirmState): SaveInput {
  const fixed = state.contract.schedule_fixed !== false;
  return {
    contract: state.contract,
    weeklyHours: fixed ? null : toNumber(state.weeklyHours),
    minor: state.minor === true,
  };
}

const DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;
type Schedule = ContractExtraction["schedule"];

// 판정에 쓰이는 값은 카드로 크게 보여주고, 고칠 때만 입력 칸을 연다 (설문지처럼 보이지 않게)
type CardKey = "wage" | "schedule" | "period" | "probation" | "holidayPay" | "leave";
const CARD_KEYS: CardKey[] = ["wage", "schedule", "period", "probation", "holidayPay", "leave"];

const WAGE_TYPE: Record<string, string> = { hourly: "시급", daily: "일급", monthly: "월급", other: "기타" };
const HOLIDAY_PAY: Record<string, string> = {
  separate: "따로 준다고 적혀 있어요",
  included: "시급에 포함이라고 적혀 있어요",
  none: "없다고 적혀 있어요",
};

// 입력 칸은 16px(iOS 자동 확대 방지), 높이 44px 이상. 안쪽 여백과 폭은 쓰는 곳마다 정한다(같은 속성 클래스가 겹치지 않게)
const inputBase =
  "min-h-11 squircle-xl border border-zinc-300 bg-white text-body outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const inputClass = `${inputBase} mt-1 w-full px-3 py-2`;
// 필수인데 아직 답하지 않은 것: 노란색(확인 필요)과 구분해 파란색으로
const REQUIRED_BADGE = "rounded-full bg-blue-100 px-2 py-0.5 text-caption font-semibold text-blue-700";

function toNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value.replaceAll(",", ""));
  return Number.isFinite(n) ? n : null;
}

function toText(value: string): string | null {
  return value === "" ? null : value;
}

function formatDate(d: string | null): string | null {
  return d ? d.replaceAll("-", ".") : null;
}

// 같은 시간에 일하는 요일을 묶는다: 월·수·금 10:00–15:00
function scheduleGroups(schedule: Schedule) {
  const sorted = [...schedule].sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day));
  const groups = new Map<string, { days: string[]; time: string; rest: string }>();
  for (const e of sorted) {
    const key = `${e.start}|${e.end}|${e.break_minutes}`;
    const group = groups.get(key) ?? {
      days: [],
      time: `${e.start ?? "?"}–${e.end ?? "?"}`,
      rest: e.break_minutes == null ? "휴게시간 적혀 있지 않음" : `휴게 ${e.break_minutes}분`,
    };
    group.days.push(e.day);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export function ConfirmScreen({ state, onChange, onChecked, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [othersOpen, setOthersOpen] = useState(false);
  const c = state.contract;

  const set = (patch: Partial<ContractExtraction>) => onChange({ ...state, contract: { ...c, ...patch } });

  const isLow = (path: string) =>
    c.low_confidence_fields.some((f) => f === path || f.startsWith(`${path}.`) || f.startsWith(`${path}[`));
  const evidence = (path: string) =>
    c.evidence.find((e) => e.field === path || e.field.startsWith(`${path}.`) || e.field.startsWith(`${path}[`))
      ?.quote;

  const fixed = c.schedule_fixed !== false;
  const BLURRY = "잘 안 보였어요. 계약서와 같은지 확인해 주세요.";

  // 카드마다 확인이 필요한 이유 (없으면 null)
  const attention: Record<CardKey, string | null> = {
    wage:
      c.wage.amount == null
        ? "금액을 못 찾았어요. 계약서를 보고 입력해 주세요."
        : isLow("wage.amount") || isLow("wage.type")
          ? BLURRY
          : null,
    schedule: fixed
      ? c.schedule.length === 0
        ? "근무 요일과 시간을 못 찾았어요. 계약서에 있다면 추가해 주세요."
        : isLow("schedule")
          ? BLURRY
          : null
      : state.weeklyHours === ""
        ? "근무 시간이 주마다 달라요. 4주 동안 평균 일주일에 몇 시간 일하는지 입력해 주세요."
        : null,
    period:
      c.contract_period.start == null && c.contract_period.indefinite !== true
        ? "계약 시작일을 못 찾았어요."
        : isLow("contract_period")
          ? BLURRY
          : null,
    probation:
      c.probation.exists === true && (c.probation.months == null || c.probation.wage_rate == null)
        ? "수습 기간이나 수습 중 급여 비율을 못 찾았어요."
        : isLow("probation")
          ? BLURRY
          : null,
    holidayPay: isLow("wage.weekly_holiday_pay") ? BLURRY : null,
    leave: null,
  };
  const attentionCount = CARD_KEYS.filter((k) => attention[k]).length;

  // 확인이 필요한 카드를 위로. 고치는 도중에 순서가 바뀌면 헷갈리니 처음 한 번만 정한다.
  const [order] = useState(() => [...CARD_KEYS].sort((a, b) => Number(!attention[a]) - Number(!attention[b])));
  // 값이 비어 있어 입력이 필요한 카드는 처음부터 열어 둔다
  const [editing, setEditing] = useState<Set<CardKey>>(
    () =>
      new Set(
        CARD_KEYS.filter(
          (k) =>
            (k === "wage" && c.wage.amount == null) ||
            (k === "schedule" && (!fixed || c.schedule.length === 0)) ||
            (k === "period" && attention.period != null && c.contract_period.start == null) ||
            (k === "probation" && attention.probation != null && !isLow("probation")),
        ),
      ),
  );
  const toggle = (k: CardKey) =>
    setEditing((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const input = checkInputOf(state);
      onChecked(await checkContract(input.contract, input.weeklyHours, input.minor), input);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  function setSchedule(schedule: Schedule) {
    set({ schedule });
  }

  const cards: Record<CardKey, ReactNode> = {
    wage: (
      <ReviewCard
        icon={Coins}
        title="급여"
        attention={attention.wage}
        evidence={evidence("wage.amount")}
        editing={editing.has("wage")}
        onToggle={() => toggle("wage")}
        value={
          c.wage.amount == null ? (
            <Missing>금액 못 찾음</Missing>
          ) : (
            <>
              <span className="mr-2 text-body font-semibold text-zinc-500">
                {c.wage.type ? WAGE_TYPE[c.wage.type] : "급여"}
              </span>
              {formatWon(c.wage.amount)}
            </>
          )
        }
        editor={
          <>
            <Labeled label="급여 형태">
              <select
                className={inputClass}
                value={c.wage.type ?? ""}
                onChange={(e) =>
                  set({ wage: { ...c.wage, type: toText(e.target.value) as ContractExtraction["wage"]["type"] } })
                }
              >
                <option value="">모름</option>
                <option value="hourly">시급</option>
                <option value="daily">일급</option>
                <option value="monthly">월급</option>
                <option value="other">기타</option>
              </select>
            </Labeled>
            <Labeled label="금액 (원)">
              <input
                className={inputClass}
                inputMode="numeric"
                placeholder="예: 10320"
                value={c.wage.amount ?? ""}
                onChange={(e) => set({ wage: { ...c.wage, amount: toNumber(e.target.value) } })}
              />
            </Labeled>
          </>
        }
      >
        <label
          className={`mt-4 block squircle-xl p-3 text-body font-semibold transition ${
            state.wageConfirmed ? "bg-blue-50 text-blue-800" : "bg-white text-zinc-900 ring-1 ring-blue-300"
          }`}
        >
          <span className="flex items-center gap-2">
            <input
              id="wage-confirm"
              type="checkbox"
              className="size-5 accent-blue-600"
              checked={state.wageConfirmed}
              onChange={(e) => onChange({ ...state, wageConfirmed: e.target.checked })}
            />
            계약서의 금액과 같아요
            <span className={REQUIRED_BADGE}>필수</span>
          </span>
          {!state.wageConfirmed && (
            <span className="mt-1 block pl-7 text-body-sm text-zinc-600">
              숫자를 잘못 읽을 수 있어서, 체크해야 점검할 수 있어요.
            </span>
          )}
        </label>
      </ReviewCard>
    ),

    schedule: (
      <ReviewCard
        icon={Clock}
        title="근무 일정"
        attention={attention.schedule}
        evidence={evidence("schedule")}
        editing={editing.has("schedule")}
        onToggle={() => toggle("schedule")}
        value={
          !fixed ? (
            state.weeklyHours === "" ? (
              <Missing>스케줄 근무</Missing>
            ) : (
              `스케줄 근무 · 주 ${state.weeklyHours}시간`
            )
          ) : c.schedule.length === 0 ? (
            <Missing>근무 일정 못 찾음</Missing>
          ) : (
            <span className="block space-y-1">
              {scheduleGroups(c.schedule).map((g) => (
                <span key={g.days.join()} className="block">
                  {g.days.join("·")} <span className="tabular-nums">{g.time}</span>
                  <span className="block text-body-sm text-zinc-500">{g.rest}</span>
                </span>
              ))}
            </span>
          )
        }
        editor={
          <>
            <label className="flex min-h-11 items-center gap-2 text-body">
              <input
                type="checkbox"
                className="size-5 accent-blue-600"
                checked={fixed}
                onChange={(e) => set({ schedule_fixed: e.target.checked })}
              />
              요일과 시간이 정해진 근무예요
            </label>
            {fixed ? (
              <>
                {c.schedule.map((entry, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-[3.5rem_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-x-1 gap-y-2 squircle-xl p-2 ${
                      isLow(`schedule[${i}]`) ? "bg-amber-50 ring-1 ring-amber-300" : "bg-zinc-50"
                    }`}
                  >
                    <select
                      aria-label="요일"
                      className={`${inputBase} w-full px-1`}
                      value={entry.day}
                      onChange={(e) =>
                        setSchedule(c.schedule.map((s, j) => (j === i ? { ...s, day: e.target.value as typeof s.day } : s)))
                      }
                    >
                      {DAYS.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                    <input
                      aria-label="시작"
                      type="time"
                      className={inputClass + " mt-0 min-w-0 px-1"}
                      value={entry.start ?? ""}
                      onChange={(e) =>
                        setSchedule(c.schedule.map((s, j) => (j === i ? { ...s, start: toText(e.target.value) } : s)))
                      }
                    />
                    <input
                      aria-label="종료"
                      type="time"
                      className={inputClass + " mt-0 min-w-0 px-1"}
                      value={entry.end ?? ""}
                      onChange={(e) =>
                        setSchedule(c.schedule.map((s, j) => (j === i ? { ...s, end: toText(e.target.value) } : s)))
                      }
                    />
                    {/* 시간 칸 폭을 지키려고 가로는 36px, 세로는 44px */}
                    <button
                      aria-label="이 근무일 삭제"
                      className="flex h-11 w-9 items-center justify-center text-zinc-500"
                      onClick={() => setSchedule(c.schedule.filter((_, j) => j !== i))}
                    >
                      <X aria-hidden className="size-5" />
                    </button>
                    <label className="col-span-4 flex items-center gap-2 text-body-sm text-zinc-600">
                      휴게
                      <input
                        inputMode="numeric"
                        placeholder="적혀 있지 않음"
                        className={`${inputBase} w-36 px-2`}
                        value={entry.break_minutes ?? ""}
                        onChange={(e) =>
                          setSchedule(
                            c.schedule.map((s, j) => (j === i ? { ...s, break_minutes: toNumber(e.target.value) } : s)),
                          )
                        }
                      />
                      분
                    </label>
                  </div>
                ))}
                <button
                  className="flex min-h-11 w-full items-center justify-center gap-1 squircle-xl border border-dashed border-zinc-300 text-body-sm font-semibold text-zinc-600 active:bg-zinc-50"
                  onClick={() => {
                    const used = new Set(c.schedule.map((s) => s.day));
                    const day = DAYS.find((d) => !used.has(d)) ?? "월";
                    const last = c.schedule[c.schedule.length - 1];
                    setSchedule([
                      ...c.schedule,
                      { day, start: last?.start ?? null, end: last?.end ?? null, break_minutes: last?.break_minutes ?? null },
                    ]);
                  }}
                >
                  <Plus aria-hidden className="size-4" />
                  근무일 추가
                </button>
              </>
            ) : (
              <Labeled
                label="4주 동안 평균 일주일에 몇 시간 일하나요?"
                note="4주 합계가 60시간 이상(주 평균 15시간 이상)이면 주휴수당 대상이에요."
              >
                <input
                  className={inputClass}
                  inputMode="decimal"
                  placeholder="예: 16"
                  value={state.weeklyHours}
                  onChange={(e) => onChange({ ...state, weeklyHours: e.target.value })}
                />
              </Labeled>
            )}
          </>
        }
      />
    ),

    period: (
      <ReviewCard
        icon={CalendarRange}
        title="계약기간"
        attention={attention.period}
        evidence={evidence("contract_period")}
        editing={editing.has("period")}
        onToggle={() => toggle("period")}
        value={
          c.contract_period.start == null && c.contract_period.indefinite !== true ? (
            <Missing>시작일 못 찾음</Missing>
          ) : (
            <span className="tabular-nums">
              {formatDate(c.contract_period.start) ?? "시작일 모름"} –{" "}
              {c.contract_period.indefinite ? "기간 정함 없음" : (formatDate(c.contract_period.end) ?? "종료일 모름")}
            </span>
          )
        }
        editor={
          <>
            <Labeled label="시작일">
              <input
                type="date"
                className={inputClass}
                value={c.contract_period.start ?? ""}
                onChange={(e) => set({ contract_period: { ...c.contract_period, start: toText(e.target.value) } })}
              />
            </Labeled>
            <label className="flex min-h-11 items-center gap-2 text-body">
              <input
                type="checkbox"
                className="size-5 accent-blue-600"
                checked={c.contract_period.indefinite === true}
                onChange={(e) =>
                  set({
                    contract_period: {
                      ...c.contract_period,
                      indefinite: e.target.checked,
                      end: e.target.checked ? null : c.contract_period.end,
                    },
                  })
                }
              />
              기간을 정하지 않은 계약이에요
            </label>
            {c.contract_period.indefinite !== true && (
              <Labeled label="종료일">
                <input
                  type="date"
                  className={inputClass}
                  value={c.contract_period.end ?? ""}
                  onChange={(e) => set({ contract_period: { ...c.contract_period, end: toText(e.target.value) } })}
                />
              </Labeled>
            )}
          </>
        }
      />
    ),

    probation: (
      <ReviewCard
        icon={Sprout}
        title="수습"
        attention={attention.probation}
        evidence={evidence("probation")}
        editing={editing.has("probation")}
        onToggle={() => toggle("probation")}
        value={
          c.probation.exists !== true
            ? "수습 없음"
            : [
                c.probation.months != null ? `${c.probation.months}개월` : "기간 모름",
                c.probation.wage_rate != null ? `급여 ${Math.round(c.probation.wage_rate * 100)}%` : "급여 비율 모름",
              ].join(" · ")
        }
        editor={
          <>
            <label className="flex min-h-11 items-center gap-2 text-body">
              <input
                type="checkbox"
                className="size-5 accent-blue-600"
                checked={c.probation.exists === true}
                onChange={(e) =>
                  set({
                    probation: e.target.checked
                      ? { ...c.probation, exists: true }
                      : { exists: false, months: null, wage_rate: null },
                  })
                }
              />
              수습 기간이 있어요
            </label>
            {c.probation.exists === true && (
              <div className="grid grid-cols-2 gap-3">
                <Labeled label="기간 (개월)">
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    value={c.probation.months ?? ""}
                    onChange={(e) => set({ probation: { ...c.probation, months: toNumber(e.target.value) } })}
                  />
                </Labeled>
                <Labeled label="수습 중 급여 (%)">
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    placeholder="예: 90"
                    value={c.probation.wage_rate == null ? "" : Math.round(c.probation.wage_rate * 100)}
                    onChange={(e) => {
                      const pct = toNumber(e.target.value);
                      set({ probation: { ...c.probation, wage_rate: pct == null ? null : pct / 100 } });
                    }}
                  />
                </Labeled>
              </div>
            )}
          </>
        }
      />
    ),

    holidayPay: (
      <ReviewCard
        icon={CalendarCheck}
        title="주휴수당"
        attention={attention.holidayPay}
        evidence={evidence("wage.weekly_holiday_pay")}
        editing={editing.has("holidayPay")}
        onToggle={() => toggle("holidayPay")}
        value={c.wage.weekly_holiday_pay ? HOLIDAY_PAY[c.wage.weekly_holiday_pay] : "계약서에 언급 없음"}
        editor={
          <select
            aria-label="주휴수당"
            className={inputClass}
            value={c.wage.weekly_holiday_pay ?? ""}
            onChange={(e) =>
              set({
                wage: {
                  ...c.wage,
                  weekly_holiday_pay: toText(e.target.value) as ContractExtraction["wage"]["weekly_holiday_pay"],
                },
              })
            }
          >
            <option value="">언급 없음</option>
            <option value="separate">따로 준다고 적혀 있음</option>
            <option value="included">시급에 포함이라고 적혀 있음</option>
            <option value="none">없다고 적혀 있음</option>
          </select>
        }
      />
    ),

    leave: (
      <ReviewCard
        icon={TreePalm}
        title="휴일과 휴가"
        attention={attention.leave}
        editing={editing.has("leave")}
        onToggle={() => toggle("leave")}
        value={
          <span className="block space-y-1 text-body">
            <YesNo yes={c.weekly_holiday.mentioned}>주휴일(쉬는 날)</YesNo>
            <YesNo yes={c.annual_leave_mentioned}>연차유급휴가</YesNo>
          </span>
        }
        editor={
          <>
            <label className="flex min-h-11 items-center gap-2 text-body">
              <input
                type="checkbox"
                className="size-5 accent-blue-600"
                checked={c.weekly_holiday.mentioned}
                onChange={(e) => set({ weekly_holiday: { ...c.weekly_holiday, mentioned: e.target.checked } })}
              />
              주휴일(쉬는 날)이 적혀 있어요
            </label>
            <label className="flex min-h-11 items-center gap-2 text-body">
              <input
                type="checkbox"
                className="size-5 accent-blue-600"
                checked={c.annual_leave_mentioned}
                onChange={(e) => set({ annual_leave_mentioned: e.target.checked })}
              />
              연차유급휴가가 적혀 있어요
            </label>
          </>
        }
      />
    ),
  };

  const others: { label: string; value: string | null; low: boolean; onChange: (v: string | null) => void }[] = [
    { label: "근무 장소", value: c.workplace, low: isLow("workplace"), onChange: (v) => set({ workplace: v }) },
    {
      label: "업무 내용",
      value: c.job_description,
      low: isLow("job_description"),
      onChange: (v) => set({ job_description: v }),
    },
    {
      label: "임금 구성항목",
      value: c.wage_components,
      low: isLow("wage_components"),
      onChange: (v) => set({ wage_components: v }),
    },
    {
      label: "임금 지급일",
      value: c.pay_method.payday,
      low: isLow("pay_method.payday"),
      onChange: (v) => set({ pay_method: { ...c.pay_method, payday: v } }),
    },
    {
      label: "임금 지급방법",
      value: c.pay_method.method,
      low: isLow("pay_method.method"),
      onChange: (v) => set({ pay_method: { ...c.pay_method, method: v } }),
    },
  ];
  const othersMissing = others.filter((o) => o.value == null).length;

  return (
    <div>
      {loading && <WorkingScreen title="계약서를 점검하고 있어요" steps={CHECK_STEPS} expectedSeconds={8} />}
      <ScreenHeader title="읽은 내용 확인하기" onBack={loading ? undefined : onBack} />

      <div className="mb-6">
        <p className="text-title3">AI가 계약서에서 이렇게 읽었어요</p>
        <p className="mt-1 text-body text-zinc-600">계약서와 다른 곳만 고쳐 주세요. 고친 값으로 점검해요.</p>
        {attentionCount > 0 && (
          <p className="mt-3 flex items-center gap-2 text-body-sm font-semibold text-amber-800">
            <TriangleAlert aria-hidden className="size-4" />
            확인이 필요한 항목 {attentionCount}개
          </p>
        )}
        {c.low_confidence_fields.length >= 3 && (
          <p className="mt-3 squircle-2xl bg-amber-50 px-4 py-3 text-body text-amber-900">
            잘 안 보이는 항목이 있어요. 노란 카드를 직접 확인해 주세요.
          </p>
        )}
      </div>

      <AgeQuestion value={state.minor} onChange={(minor) => onChange({ ...state, minor })} />

      <ul className="mt-4 space-y-4">
        {order.map((k) => (
          <li key={k}>{cards[k]}</li>
        ))}
      </ul>

      <div className="mt-4 overflow-hidden squircle-2xl bg-white ring-1 ring-zinc-200">
        <button
          className="flex min-h-14 w-full items-center justify-between gap-2 px-4 py-3 text-left active:bg-zinc-50"
          onClick={() => setOthersOpen(!othersOpen)}
          aria-expanded={othersOpen}
        >
          <span>
            <span className="text-headline">나머지 항목</span>
            <span className="ml-2 text-body-sm text-zinc-500">
              {othersMissing > 0 ? `못 찾은 항목 ${othersMissing}개` : "근무 장소, 업무 내용 등"}
            </span>
          </span>
          <ChevronDown aria-hidden className={`size-5 text-zinc-400 transition-transform ${othersOpen ? "rotate-180" : ""}`} />
        </button>
        {othersOpen && (
          <div className="animate-screen-in space-y-3 border-t border-zinc-100 p-4">
            {others.map((o) => (
              <Labeled key={o.label} label={o.label} note={o.low ? BLURRY : o.value == null ? "계약서에서 못 찾았어요" : undefined}>
                <input
                  className={inputClass + (o.low || o.value == null ? " border-amber-300 bg-amber-50" : "")}
                  value={o.value ?? ""}
                  onChange={(e) => o.onChange(toText(e.target.value))}
                />
              </Labeled>
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-10 -mx-5 mt-8 space-y-2 border-t border-zinc-100 bg-white/95 px-5 pt-3 pb-4 backdrop-blur">
        {error && <ErrorBox>{error}</ErrorBox>}
        {!state.wageConfirmed && (
          <button
            type="button"
            className="w-full py-1 text-center text-body-sm text-blue-700 underline underline-offset-2"
            onClick={() => {
              const box = document.getElementById("wage-confirm");
              box?.closest("label")?.scrollIntoView({ behavior: "smooth", block: "center" });
              box?.focus({ preventScroll: true });
            }}
          >
            급여 카드의 &lsquo;계약서의 금액과 같아요&rsquo;를 체크해 주세요 (필수)
          </button>
        )}
        {state.minor == null && (
          <button
            type="button"
            className="w-full py-1 text-center text-body-sm text-blue-700 underline underline-offset-2"
            onClick={() => document.getElementById("age-question")?.scrollIntoView({ behavior: "smooth", block: "center" })}
          >
            나이를 골라 주세요 (필수)
          </button>
        )}
        <PrimaryButton arrow disabled={!state.wageConfirmed || state.minor == null || loading} onClick={submit}>
          점검하기
        </PrimaryButton>
      </div>
    </div>
  );
}

// 계약서에는 없는 정보라 직접 묻는다. 18세 미만이면 근로시간·야간 근로·서류 기준(R7)을 더 본다.
function AgeQuestion({ value, onChange }: { value: boolean | null; onChange: (minor: boolean) => void }) {
  const option = (minor: boolean, label: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={value === minor}
      onClick={() => onChange(minor)}
      className={`min-h-11 flex-1 squircle-xl px-3 py-2 text-body font-semibold transition active:scale-[0.98] ${
        value === minor ? "bg-blue-600 text-white" : "bg-white text-zinc-700 ring-1 ring-zinc-300"
      }`}
    >
      {label}
    </button>
  );

  return (
    <section
      id="age-question"
      className={`scroll-mt-6 squircle-2xl bg-white p-4 shadow-sm ring-1 ${value == null ? "ring-blue-300" : "ring-zinc-200"}`}
    >
      <h2 className="flex items-center gap-2 text-body-sm font-semibold text-zinc-500">
        나이
        <span className={REQUIRED_BADGE}>필수</span>
      </h2>
      <p className="mt-1 text-headline text-zinc-900">근무를 시작하는 날, 만 18세 미만인가요?</p>
      <div role="radiogroup" aria-label="만 18세 미만인지" className="mt-3 flex gap-2">
        {option(true, "18세 미만이에요")}
        {option(false, "18세 이상이에요")}
      </div>
      {value === true && (
        <p className="mt-3 text-body-sm text-zinc-600">
          18세 미만은 일할 수 있는 시간과 필요한 서류가 따로 있어서 함께 확인해 드려요.
        </p>
      )}
    </section>
  );
}

// AI가 읽은 값 한 덩어리. 평소에는 값만 크게 보이고, "수정"을 누르면 입력 칸이 열린다.
function ReviewCard({
  icon: Icon,
  title,
  value,
  evidence,
  attention,
  editing,
  onToggle,
  editor,
  children,
}: {
  icon: LucideIcon;
  title: string;
  value: ReactNode;
  evidence?: string;
  attention: string | null;
  editing: boolean;
  onToggle: () => void;
  editor: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section
      className={`squircle-2xl p-4 shadow-sm ring-1 ${attention ? "bg-amber-50/70 ring-amber-300" : "bg-white ring-zinc-200"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-body-sm font-semibold text-zinc-500">
          <Icon aria-hidden className="size-4" />
          {title}
        </h2>
        {/* 보이는 알약은 30px, 누르는 영역은 바깥 8px씩 더해 46px. 음수 여백으로 줄 높이는 그대로 */}
        <button onClick={onToggle} aria-expanded={editing} className="group -my-2 -mr-2 p-2">
          <span
            className={`block rounded-full px-3 py-1 text-body-sm font-semibold transition group-active:scale-95 ${
              editing ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-700"
            }`}
          >
            {editing ? "완료" : "수정"}
          </span>
        </button>
      </div>

      <div className="mt-1 text-title2 text-zinc-900">{value}</div>
      {evidence && <p className="mt-2 text-caption text-zinc-500">계약서: “{evidence}”</p>}
      {attention && (
        <p className="mt-2 flex gap-2 text-body text-amber-800">
          <span className="flex h-[1lh] shrink-0 items-center">
            <TriangleAlert aria-hidden className="size-4" />
          </span>
          {attention}
        </p>
      )}

      {editing && <div className="mt-4 animate-screen-in space-y-3 border-t border-zinc-200/70 pt-4">{editor}</div>}
      {children}
    </section>
  );
}

function Labeled({ label, note, children }: { label: string; note?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-body-sm text-zinc-600">
        {label}
        {children}
      </label>
      {note && <p className="mt-1 text-caption text-amber-800">{note}</p>}
    </div>
  );
}

function Missing({ children }: { children: ReactNode }) {
  return <span className="text-amber-700">{children}</span>;
}

function YesNo({ yes, children }: { yes: boolean; children: ReactNode }) {
  return (
    <span className="flex items-center gap-2 font-semibold">
      {yes ? (
        <Check aria-hidden className="size-4 text-green-600" />
      ) : (
        <X aria-hidden className="size-4 text-zinc-400" />
      )}
      {children}
      <span className="font-normal text-zinc-500">{yes ? "적혀 있음" : "안 보임"}</span>
    </span>
  );
}
