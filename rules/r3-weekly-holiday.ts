import type { ContractExtraction } from "../lib/contract-schema";
import { formatDuration, formatWon, parseDate } from "./helpers";
import { BASIS, minWageFor, WEEKLY_HOLIDAY_MAX_MINUTES, WEEKLY_HOLIDAY_MIN_MINUTES } from "./standards";
import type { RuleResult } from "./types";

const base = { id: "R3", title: "주휴수당", basis: BASIS.R3 } as const;

// 1주 주휴수당 = min(주 소정근로시간, 40) ÷ 40 × 8 × 시급
export function weeklyHolidayPay(weeklyMinutes: number, wage: number): number {
  const minutes = Math.min(weeklyMinutes, WEEKLY_HOLIDAY_MAX_MINUTES);
  return Math.round((minutes / WEEKLY_HOLIDAY_MAX_MINUTES) * 8 * wage);
}

// 시급에 주휴수당을 포함하려면, 포함한 시급이 최저시급에 주휴수당분까지 더한 금액 이상이어야 한다.
// 주 15~40시간이면 주휴시간이 근로시간의 20%라서 최저시급 × 1.2가 된다.
export function minWageWithHolidayPay(weeklyMinutes: number, minWage: number): number {
  const holidayMinutes = (Math.min(weeklyMinutes, WEEKLY_HOLIDAY_MAX_MINUTES) / WEEKLY_HOLIDAY_MAX_MINUTES) * 8 * 60;
  return Math.ceil((minWage * (weeklyMinutes + holidayMinutes)) / weeklyMinutes);
}

export function checkWeeklyHoliday(
  c: ContractExtraction,
  weeklyMinutes: number | null,
  today: Date = new Date(),
): RuleResult {
  if (weeklyMinutes == null) {
    return {
      ...base,
      status: "check",
      summary: "근무 시간이 정해져 있지 않아 주휴수당 대상인지 판단하기 어려워요.",
      detail:
        "4주 동안 평균해서 일주일에 15시간 이상(4주 합계 60시간 이상) 일하면 주휴수당을 받아요. 확인 화면에서 4주 평균 주 근무시간을 입력하면 다시 확인할 수 있어요.",
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
    case "included": {
      // 시급에 주휴수당을 포함하는 계약도 법적으로 문제는 없다 (1350, 2026-11-03). 다만 포함한 시급이 충분해야 한다.
      if (wage == null) {
        return {
          ...base,
          status: "check",
          summary: "주휴수당이 시급에 포함돼 있다고 적혀 있어요.",
          detail: "시급에 주휴수당을 포함하는 계약도 있어요. 다만 그 시급이 최저시급에 주휴수당분까지 더한 금액 이상이어야 해요. 시급을 확인해 보세요.",
        };
      }
      const year = (parseDate(c.contract_period.start) ?? today).getUTCFullYear();
      const min = minWageFor(year);
      const required = minWageWithHolidayPay(weeklyMinutes, min);
      if (wage >= required) {
        return {
          ...base,
          status: "ok",
          summary: "주휴수당이 시급에 포함돼 있고, 포함해도 최저시급 기준을 넘어요.",
          detail: `시급에 주휴수당을 포함하는 계약도 법적으로 문제는 없어요. 포함하려면 시급이 ${year}년 최저시급 ${formatWon(min)}에 주휴수당분을 더한 시간당 ${formatWon(required)} 이상이어야 하는데, 이 계약은 그 이상이에요.`,
        };
      }
      return {
        ...base,
        status: "check",
        summary: "주휴수당이 시급에 포함돼 있다고 적혀 있는데, 포함하기엔 시급이 낮아요.",
        detail: `시급에 주휴수당을 포함하는 계약도 있어요. 다만 그러려면 시급이 ${year}년 최저시급 ${formatWon(min)}에 주휴수당분을 더한 시간당 ${formatWon(required)} 이상이어야 해요. 이 계약의 시급 ${formatWon(wage)}은 그보다 ${formatWon(required - wage)} 적어서, 주휴수당을 따로 받아야 할 수 있어요.`,
        amount: { label: "주휴수당 포함 시 시간당 부족한 금액", value: required - wage },
      };
    }
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
