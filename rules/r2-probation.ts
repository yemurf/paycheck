import type { ContractExtraction } from "../lib/contract-schema";
import { formatWon, isAtLeastOneYear, parseDate } from "./helpers";
import { BASIS, minWageFor, PROBATION_MAX_MONTHS, PROBATION_MIN_PERCENT } from "./standards";
import type { RuleResult } from "./types";

const base = { id: "R2", title: "수습 감액", basis: BASIS.R2 } as const;

const SIMPLE_LABOR_NOTE =
  "주방 보조, 배달, 청소 같은 단순노무 업무라면 수습이어도 감액할 수 없어요.";

export function checkProbation(c: ContractExtraction, today: Date): RuleResult {
  const p = c.probation;
  const hasProbation = p.exists === true || p.months != null || p.wage_rate != null;
  if (!hasProbation) {
    return {
      ...base,
      status: "ok",
      summary: "수습 감액이 없어요.",
      detail: "계약서에 수습 기간 중 급여를 줄인다는 내용이 없어요.",
    };
  }

  if (p.wage_rate == null) {
    return {
      ...base,
      status: "check",
      summary: "수습 기간 중 급여가 적혀 있지 않아요.",
      detail: `수습 기간이 있지만 그동안 급여를 얼마나 주는지 적혀 있지 않아요. 수습 중에도 시급이 같은지 확인해 보세요. ${SIMPLE_LABOR_NOTE}`,
    };
  }

  const percent = Math.round(p.wage_rate * 100);
  if (percent >= 100) {
    return {
      ...base,
      status: "ok",
      summary: "수습 기간이 있지만 급여는 줄이지 않아요.",
      detail: "수습 기간에도 같은 시급을 받는 계약이에요.",
    };
  }

  const wage = c.wage.amount;
  if (wage == null) {
    return {
      ...base,
      status: "check",
      summary: `수습 중 시급을 ${percent}%로 줄이는데, 시급을 확인할 수 없어요.`,
      detail: `시급이 적혀 있지 않아 수습 중 시급이 최저시급 기준에 맞는지 판단하지 못했어요. ${SIMPLE_LABOR_NOTE}`,
    };
  }

  const startYear = (parseDate(c.contract_period.start) ?? today).getUTCFullYear();
  const min = minWageFor(startYear);
  const reduced = (wage * percent) / 100;
  if (reduced >= min) {
    return {
      ...base,
      status: "ok",
      summary: `수습 중 시급 ${formatWon(reduced)}도 최저시급 이상이에요.`,
      detail: `수습 기간에 시급을 ${percent}%로 줄여도 ${startYear}년 최저시급 ${formatWon(min)} 이상이에요.`,
    };
  }

  const floor = (min * PROBATION_MIN_PERCENT) / 100;
  const oneYear = isAtLeastOneYear(c.contract_period);
  const tooLong = p.months != null && p.months > PROBATION_MAX_MONTHS;
  const reasons: string[] = [];
  if (oneYear === false) reasons.push("계약기간이 1년 미만인데 수습 감액이 있어요.");
  if (tooLong) reasons.push(`감액 기간이 ${p.months}개월로 3개월을 넘어요.`);
  if (reduced < floor) {
    reasons.push(
      `수습 중 시급 ${formatWon(reduced)}이 최저시급의 90%(${formatWon(floor)})보다 낮아요.`,
    );
  }

  if (reasons.length > 0) {
    // 감액 자체가 안 되는 경우는 최저시급 전액과, 그 외에는 90% 기준과 비교한다.
    const amount =
      oneYear === false || tooLong
        ? { label: "수습 중 최저시급보다 시간당 적은 금액", value: min - reduced }
        : { label: "수습 중 최저시급 90%보다 시간당 적은 금액", value: floor - reduced };
    return {
      ...base,
      status: "problem",
      summary: reasons[0],
      detail: `수습 중 시급을 ${percent}%(${formatWon(reduced)})로 줄이는 계약이에요. ${reasons.join(" ")} 수습 감액은 1년 이상 계약에서 처음 3개월까지, 최저시급의 90%까지만 가능해요.`,
      amount,
    };
  }

  const notes: string[] = [];
  if (oneYear === null) notes.push("계약기간을 확인할 수 없어 1년 이상인지 판단하지 못했어요.");
  if (c.contract_period.indefinite) {
    notes.push("기간을 정하지 않은 계약에서 감액이 가능한지는 아직 확인 중이에요.");
  }
  if (p.months == null) notes.push("감액 기간이 적혀 있지 않아요. 3개월 이내인지 확인해 보세요.");
  return {
    ...base,
    status: "check",
    summary: `수습 중 시급을 ${percent}%로 줄여요. 업무에 따라 감액할 수 없을 수 있어요.`,
    detail: [
      `수습 기간에 시급을 ${percent}%(${formatWon(reduced)})로 줄이는 계약이에요.`,
      ...notes,
      SIMPLE_LABOR_NOTE,
    ].join(" "),
  };
}
