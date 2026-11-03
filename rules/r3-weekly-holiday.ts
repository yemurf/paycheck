import type { ContractExtraction } from "../lib/contract-schema";
import { formatDuration, formatWon } from "./helpers";
import { BASIS, WEEKLY_HOLIDAY_MAX_MINUTES, WEEKLY_HOLIDAY_MIN_MINUTES } from "./standards";
import type { RuleResult } from "./types";

const base = { id: "R3", title: "주휴수당", basis: BASIS.R3 } as const;

// 1주 주휴수당 = min(주 소정근로시간, 40) ÷ 40 × 8 × 시급
export function weeklyHolidayPay(weeklyMinutes: number, wage: number): number {
  const minutes = Math.min(weeklyMinutes, WEEKLY_HOLIDAY_MAX_MINUTES);
  return Math.round((minutes / WEEKLY_HOLIDAY_MAX_MINUTES) * 8 * wage);
}

export function checkWeeklyHoliday(
  c: ContractExtraction,
  weeklyMinutes: number | null,
): RuleResult {
  if (weeklyMinutes == null) {
    return {
      ...base,
      status: "check",
      summary: "근무 시간이 정해져 있지 않아 주휴수당 대상인지 판단하기 어려워요.",
      detail:
        "일주일에 일하는 시간이 15시간 이상이면 주휴수당을 받아요. 평소 일주일에 몇 시간 일하는지 입력하면 다시 확인할 수 있어요.",
    };
  }

  const hours = formatDuration(weeklyMinutes);
  if (weeklyMinutes < WEEKLY_HOLIDAY_MIN_MINUTES) {
    return {
      ...base,
      status: "ok",
      summary: `주 ${hours}이라 주휴수당 대상이 아니에요.`,
      detail: `주휴수당은 일주일에 15시간 이상 일할 때 받아요. 이 계약은 주 ${hours}이에요.`,
    };
  }

  const wage = c.wage.amount;
  const pay = wage == null ? null : weeklyHolidayPay(weeklyMinutes, wage);
  const payText = pay == null ? "" : ` 이 계약이면 1주에 ${formatWon(pay)}이에요.`;
  const amount = pay == null ? undefined : { label: "1주 주휴수당", value: pay };

  switch (c.wage.weekly_holiday_pay) {
    case "none":
      return {
        ...base,
        status: "problem",
        summary: `주 ${hours} 일하는데 주휴수당이 없다고 적혀 있어요.`,
        detail: `일주일에 15시간 이상 일하면 주휴수당을 받아야 해요.${payText}`,
        amount,
      };
    case "included":
      return {
        ...base,
        status: "check",
        summary: "주휴수당이 시급에 포함돼 있다고만 적혀 있어요.",
        detail: `시급에 주휴수당이 포함됐다면, 주휴수당을 뺀 시급도 최저시급 이상이어야 해요. 포함된 금액이 얼마인지 확인해 보세요.${payText}`,
        amount,
      };
    case "separate":
      return {
        ...base,
        status: "ok",
        summary: `주 ${hours} 일해서 주휴수당 대상이고, 따로 준다고 적혀 있어요.`,
        detail: `일주일에 15시간 이상 일하면 주휴수당을 받아요.${payText}`,
        amount,
      };
    default:
      return {
        ...base,
        status: "check",
        summary: `주 ${hours} 일해서 주휴수당 대상인데, 계약서에 언급이 없어요.`,
        detail: `일주일에 15시간 이상 일하면 주휴수당을 받아야 해요.${payText} 주휴수당을 주는지 확인해 보세요.`,
        amount,
      };
  }
}
