import type { ContractExtraction } from "../lib/contract-schema";
import { formatWon, parseDate } from "./helpers";
import { BASIS, LATEST_MIN_WAGE_YEAR, minWageFor } from "./standards";
import type { RuleResult } from "./types";

// UTC 날짜 → "2025년 6월 30일"
const formatDate = (d: Date) => `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;

const rule = { id: "R1", title: "최저임금", basis: BASIS.R1 } as const;

export function checkMinWage(c: ContractExtraction, today: Date): RuleResult {
  const wage = c.wage.amount;
  if (wage == null) {
    return {
      ...rule,
      status: "check",
      summary: "시급을 확인할 수 없어요.",
      detail: "계약서에서 시급을 찾지 못했어요. 시급이 적혀 있는지 확인해 보세요.",
    };
  }

  const start = parseDate(c.contract_period.start);
  const startYear = (start ?? today).getUTCFullYear();
  const min = minWageFor(startYear);
  // 시작일을 모르면 오늘이 속한 해를 기준으로 본다. 실제 계약 연도와 다를 수 있으니 결과마다 밝힌다.
  const premise = start
    ? undefined
    : `계약 시작일을 몰라서 올해(${startYear}년) 기준으로 확인했어요. 시작일을 넣으면 그해 기준으로 다시 볼 수 있어요.`;
  const note = premise ? `${premise} ` : "";
  const base = { ...rule, ...(premise && { premise }) };

  if (wage < min) {
    return {
      ...base,
      status: "problem",
      summary: `시급 ${formatWon(wage)}이 ${startYear}년 최저시급 ${formatWon(min)}보다 낮아요.`,
      detail: `${note}${startYear}년 최저시급은 ${formatWon(min)}이에요. 계약서의 시급은 이보다 시간당 ${formatWon(min - wage)} 적어요. 최저시급보다 적게 받았다면 임금체불로 고용노동부에 신고할 수 있어요.`,
      amount: { label: "시간당 부족한 금액", value: min - wage },
    };
  }

  // 계약기간이 최저시급이 오르는 해까지 이어지는지.
  // 끝나는 날이 없거나(모름) 기간을 정하지 않은 계약은 지금도 일하고 있다고 보고, 최저시급 표의 마지막 해까지 본다.
  const end = c.contract_period.indefinite ? null : parseDate(c.contract_period.end);
  const lastYear = end ? end.getUTCFullYear() : Math.max(startYear, LATEST_MIN_WAGE_YEAR);
  let shortYear: number | null = null; // 처음으로 최저시급보다 낮아지는 해
  for (let year = startYear + 1; year <= lastYear; year++) {
    if (wage < minWageFor(year)) {
      shortYear = year;
      break;
    }
  }

  if (shortYear != null && end) {
    const next = minWageFor(shortYear);
    return {
      ...base,
      status: "check",
      summary: `${shortYear}년 1월 1일부터는 시급이 ${formatWon(next)} 이상이어야 해요.`,
      detail: `${note}계약이 ${formatDate(end)}까지라 ${shortYear}년 최저시급도 적용돼요. ${shortYear}년 최저시급은 ${formatWon(next)}이라서, 그때부터는 시급이 시간당 ${formatWon(next - wage)} 올라야 해요. 인상 약속이 있는지 확인해 보세요.`,
      amount: { label: `${shortYear}년부터 시간당 올라야 할 금액`, value: next - wage },
    };
  }

  if (shortYear != null) {
    // 지금도 일하고 있다면 올해 최저시급이 기준이다. 아직 오르기 전이면 오르는 해를 알려준다.
    const thisYear = today.getUTCFullYear();
    const year = Math.max(shortYear, Math.min(thisYear, LATEST_MIN_WAGE_YEAR));
    const nowMin = minWageFor(year);
    const why = c.contract_period.indefinite ? "기간을 정하지 않은 계약이라" : "계약서에 끝나는 날이 없어서";
    const already = year > shortYear;
    return {
      ...base,
      status: "check",
      summary: already
        ? `지금도 일하고 있다면 시급이 ${formatWon(nowMin)} 이상이어야 해요.`
        : `${shortYear}년 1월 1일부터는 시급이 ${formatWon(nowMin)} 이상이어야 해요.`,
      detail: already
        ? `${note}${why} 지금도 일하고 있다고 보고 확인했어요. ${year}년 최저시급은 ${formatWon(nowMin)}이라 시급이 시간당 ${formatWon(nowMin - wage)} 올라야 해요. 사장님께 시급을 올려 달라고 요청할 수 있어요.`
        : `${note}${why} 계속 일한다고 보고 확인했어요. ${shortYear}년 최저시급은 ${formatWon(nowMin)}이라서, 그때부터는 시급이 시간당 ${formatWon(nowMin - wage)} 올라야 해요. 인상 약속이 있는지 확인해 보세요.`,
      amount: {
        label: already ? `${year}년 기준 시간당 올라야 할 금액` : `${shortYear}년부터 시간당 올라야 할 금액`,
        value: nowMin - wage,
      },
    };
  }

  return {
    ...base,
    status: "ok",
    summary: `시급 ${formatWon(wage)}은 ${startYear}년 최저시급 ${formatWon(min)} 이상이에요.`,
    detail: `${note}${startYear}년 최저시급은 ${formatWon(min)}이고, 계약서의 시급은 그 이상이에요.`,
  };
}
