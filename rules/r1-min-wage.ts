import type { ContractExtraction } from "../lib/contract-schema";
import { formatWon, parseDate } from "./helpers";
import { BASIS, LATEST_MIN_WAGE_YEAR, minWageFor } from "./standards";
import type { RuleResult } from "./types";

const base = { id: "R1", title: "최저임금", basis: BASIS.R1 } as const;

export function checkMinWage(c: ContractExtraction, today: Date): RuleResult {
  const wage = c.wage.amount;
  if (wage == null) {
    return {
      ...base,
      status: "check",
      summary: "시급을 확인할 수 없어요.",
      detail: "계약서에서 시급을 찾지 못했어요. 시급이 적혀 있는지 확인해 보세요.",
    };
  }

  const start = parseDate(c.contract_period.start);
  const startYear = (start ?? today).getUTCFullYear();
  const min = minWageFor(startYear);

  if (wage < min) {
    return {
      ...base,
      status: "problem",
      summary: `시급 ${formatWon(wage)}이 ${startYear}년 최저시급 ${formatWon(min)}보다 낮아요.`,
      detail: `${startYear}년 최저시급은 ${formatWon(min)}이에요. 계약서의 시급은 이보다 시간당 ${formatWon(min - wage)} 적어요. 최저시급보다 적게 받았다면 임금체불로 고용노동부에 신고할 수 있어요.`,
      amount: { label: "시간당 부족한 금액", value: min - wage },
    };
  }

  // 계약기간이 최저시급이 오르는 해까지 이어지는지. 종료일을 모르거나 정함이 없으면 이어진다고 본다.
  const end = c.contract_period.indefinite ? null : parseDate(c.contract_period.end);
  const lastYear = end ? end.getUTCFullYear() : Math.max(startYear, LATEST_MIN_WAGE_YEAR);
  for (let year = startYear + 1; year <= lastYear; year++) {
    const next = minWageFor(year);
    if (wage < next) {
      return {
        ...base,
        status: "check",
        summary: `${year}년 1월 1일부터는 시급이 ${formatWon(next)} 이상이어야 해요.`,
        detail: `계약기간이 ${year}년까지 이어져요. ${year}년 최저시급은 ${formatWon(next)}이라서, 그때부터는 시급이 시간당 ${formatWon(next - wage)} 올라야 해요. 인상 약속이 있는지 확인해 보세요.`,
        amount: { label: `${year}년부터 시간당 올라야 할 금액`, value: next - wage },
      };
    }
  }

  return {
    ...base,
    status: "ok",
    summary: `시급 ${formatWon(wage)}은 ${startYear}년 최저시급 ${formatWon(min)} 이상이에요.`,
    detail: `${startYear}년 최저시급은 ${formatWon(min)}이고, 계약서의 시급은 그 이상이에요.`,
  };
}
