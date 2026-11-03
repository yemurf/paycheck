import type { ContractExtraction } from "../lib/contract-schema";
import { spanMinutes } from "./helpers";
import { BASIS } from "./standards";
import type { RuleResult } from "./types";

const base = { id: "R5", title: "필수 기재사항", basis: BASIS.R5 } as const;

// PRD 6장 R5 목록. 이름은 결과 화면에 그대로 나간다.
const REQUIRED_ITEMS: { name: string; present: (c: ContractExtraction) => boolean }[] = [
  {
    name: "근로계약기간",
    present: (c) => c.contract_period.indefinite === true || c.contract_period.start != null,
  },
  { name: "임금", present: (c) => c.wage.amount != null },
  { name: "임금 구성항목", present: (c) => c.wage_components != null },
  {
    name: "임금 지급방법",
    present: (c) => c.pay_method.payday != null || c.pay_method.method != null,
  },
  {
    name: "근로일과 근로시간",
    present: (c) => c.schedule.some((e) => spanMinutes(e) != null),
  },
  { name: "휴게시간", present: (c) => c.schedule.some((e) => e.break_minutes != null) },
  { name: "근무 장소", present: (c) => c.workplace != null },
  { name: "업무 내용", present: (c) => c.job_description != null },
  { name: "휴일(주휴일)", present: (c) => c.weekly_holiday.mentioned },
  { name: "연차유급휴가", present: (c) => c.annual_leave_mentioned },
];

export function checkRequiredItems(c: ContractExtraction): RuleResult {
  const missing = REQUIRED_ITEMS.filter((item) => !item.present(c)).map((item) => item.name);
  if (missing.length === 0) {
    return {
      ...base,
      status: "ok",
      summary: "꼭 들어가야 하는 항목이 모두 있어요.",
      detail: "임금, 근로시간, 휴일, 휴가 등 계약서에 꼭 적어야 하는 항목이 모두 보여요.",
      missing,
    };
  }
  return {
    ...base,
    status: "check",
    summary: `계약서에 ${missing.join(", ")} 항목이 안 보여요.`,
    detail:
      "근로계약서에는 이 항목들을 꼭 적어야 해요. 다른 장에 있다면 사진을 추가해 주세요. 없다면 사장님께 적어 달라고 요청할 수 있어요.",
    missing,
  };
}
