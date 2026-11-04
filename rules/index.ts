import type { ContractExtraction } from "../lib/contract-schema";
import { weeklyWorkMinutes } from "./helpers";
import { checkMinWage } from "./r1-min-wage";
import { correctionRequest } from "./correction-requests";
import { checkProbation } from "./r2-probation";
import { checkWeeklyHoliday } from "./r3-weekly-holiday";
import { checkBreak } from "./r4-break";
import { checkRequiredItems } from "./r5-required-items";
import type { CheckResult, RuleResult, Status } from "./types";

export type CheckInput = {
  contract: ContractExtraction; // 사용자가 확인·수정한 값
  weeklyHours?: number | null; // 스케줄이 고정되지 않았을 때 사용자가 입력한 평소 주 근로시간
  today?: Date; // 계약 시작일을 모를 때 기준 연도
};

const STATUS_ORDER: Record<Status, number> = { problem: 0, check: 1, ok: 2 };

export function checkContract({ contract, weeklyHours, today = new Date() }: CheckInput): CheckResult {
  const scheduled = contract.schedule_fixed === false ? null : weeklyWorkMinutes(contract.schedule);
  const weeklyMinutes =
    scheduled ?? (weeklyHours != null ? Math.round(weeklyHours * 60) : null);

  // 1단계는 시급 계약만 금액을 점검한다. 그 외에는 임금과 무관한 R4, R5만 (PRD 7장).
  const hourly = contract.wage.type === "hourly" || contract.wage.type == null;
  const results: RuleResult[] = hourly
    ? [
        checkMinWage(contract, today),
        checkProbation(contract, today),
        checkWeeklyHoliday(contract, weeklyMinutes, today),
        checkBreak(contract),
        checkRequiredItems(contract),
      ]
    : [checkBreak(contract), checkRequiredItems(contract)];

  results.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

  return {
    results: results.map((r) => {
      const request = correctionRequest(r);
      return request ? { ...r, request } : r;
    }),
    notice: hourly
      ? undefined
      : "지금은 시급 계약서만 금액을 점검할 수 있어요. 휴게시간과 필수 기재사항은 확인했어요.",
  };
}

export type { CheckResult, RuleId, RuleResult, Status } from "./types";
