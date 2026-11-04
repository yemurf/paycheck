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
];

// 연차유급휴가는 상시 5인 이상 사업장만 적으면 된다 (1350 상담, 2026-11-03).
// 1단계는 사업장 규모를 묻지 않으므로 빠진 항목으로 세지 않고 안내만 붙인다.
const ANNUAL_LEAVE_NOTE =
  "연차유급휴가는 계약서에 보이지 않아요. 직원이 5명 미만인 곳은 안 적어도 되지만, 5명 이상이라면 적어야 해요.";

export function checkRequiredItems(c: ContractExtraction): RuleResult {
  const missing = REQUIRED_ITEMS.filter((item) => !item.present(c)).map((item) => item.name);
  const leaveNote = c.annual_leave_mentioned ? "" : ` ${ANNUAL_LEAVE_NOTE}`;
  if (missing.length === 0) {
    return {
      ...base,
      status: "ok",
      summary: "꼭 들어가야 하는 항목이 모두 있어요.",
      detail: `임금, 근로시간, 휴게, 휴일 등 계약서에 꼭 적어야 하는 항목이 모두 보여요.${leaveNote}`,
      missing,
    };
  }
  return {
    ...base,
    status: "check",
    summary: `계약서에 ${missing.join(", ")} 항목이 안 보여요.`,
    detail: `근로계약서에는 이 항목들을 꼭 적어야 해요. 다른 장에 있다면 사진을 추가해 주세요. 없다면 사장님께 적어 달라고 요청할 수 있어요.${leaveNote}`,
    missing,
  };
}
