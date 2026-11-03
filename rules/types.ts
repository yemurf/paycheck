export type RuleId = "R1" | "R2" | "R3" | "R4" | "R5";

// problem: 기준과 달라요 / check: 확인이 필요해요 / ok: 문제 없어요
export type Status = "problem" | "check" | "ok";

export type RuleResult = {
  id: RuleId;
  title: string;
  status: Status;
  summary: string; // 카드에 보이는 한 줄
  detail: string; // 펼쳤을 때 보이는 기본 설명 (AI 설명이 실패하면 이게 보인다)
  amount?: { label: string; value: number }; // 원 단위
  basis: string;
  missing?: string[]; // R5에서 빠진 항목
  request?: string; // F8: 사장님께 보낼 정정 요청 문장 (고정 문구, AI 없음)
  explanation?: string; // F7: AI 쉬운 설명. 숫자 검사를 통과한 것만 들어온다
};

export type CheckResult = {
  results: RuleResult[]; // problem → check → ok 순
  notice?: string;
};
