import type { Ruleset } from "./version";

// R6은 PRD에서 3.3% 신호(F11)로 예약해 두어서, 18세 미만 점검은 R7이다.
export type RuleId = "R1" | "R2" | "R3" | "R4" | "R5" | "R7";

// problem: 기준과 달라요 / check: 확인이 필요해요 / ok: 문제 없어요
export type Status = "problem" | "check" | "ok";

export type RuleResult = {
  id: RuleId;
  title: string;
  status: Status;
  summary: string; // 카드에 보이는 한 줄
  detail: string; // 펼쳤을 때 보이는 기본 설명 (AI 설명이 실패하면 이게 보인다)
  premise?: string; // 결과를 읽을 때 꼭 알아야 하는 전제. detail 맨 앞에 있고, AI 설명에도 코드가 앞에 붙인다
  amount?: { label: string; value: number }; // 원 단위
  basis: string;
  missing?: string[]; // R5에서 빠진 항목
  request?: string; // F8: 사장님께 보낼 정정 요청 문장 (고정 문구, AI 없음)
  explanation?: string; // F7: AI 쉬운 설명. 숫자 검사를 통과한 것만 들어온다
};

export type CheckResult = {
  results: RuleResult[]; // problem → check → ok 순
  notice?: string;
  ruleset: Ruleset; // 어떤 기준으로 판정했는지 (rules/version.ts)
};
