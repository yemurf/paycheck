import { describe, expect, it } from "vitest";
import type { RuleResult } from "@/rules";
import { attachExplanation, usesOnlyKnownNumbers } from "./explain";

const r1: RuleResult = {
  id: "R1",
  title: "최저임금",
  status: "problem",
  summary: "시급 9,000원이 2026년 최저시급 10,320원보다 낮아요.",
  detail: "시급을 최저시급 이상으로 받아야 해요.",
  amount: { label: "시간당 덜 받는 금액", value: 1320 },
  basis: "최저임금법 제6조",
};

describe("F7 설명 숫자 검사", () => {
  it("판정 결과에 있는 숫자만 쓰면 통과", () => {
    expect(
      usesOnlyKnownNumbers("시급 9,000원은 2026년 최저시급 10320원보다 1,320원 적어요.", r1),
    ).toBe(true);
  });

  it("숫자가 없어도 통과", () => {
    expect(usesOnlyKnownNumbers("사장님께 시급을 다시 확인해 보세요.", r1)).toBe(true);
  });

  it("새 숫자가 나오면 실패", () => {
    expect(usesOnlyKnownNumbers("한 달이면 약 52,800원을 덜 받아요.", r1)).toBe(false);
    expect(usesOnlyKnownNumbers("고용노동부(1350)에 물어보세요.", r1)).toBe(false);
  });
});

describe("전제(premise)는 AI 설명에서도 빠지지 않는다", () => {
  const premise = "계약 시작일을 몰라서 올해(2026년) 기준으로 확인했어요. 시작일을 넣으면 그해 기준으로 다시 볼 수 있어요.";
  const withPremise: RuleResult = { ...r1, premise, detail: `${premise} ${r1.detail}` };

  it("AI 설명 앞에 전제를 코드가 붙인다", () => {
    const r = attachExplanation(withPremise, "시급이 최저시급보다 낮아요. 사장님께 확인해 보세요.");
    expect(r.explanation).toBe(`${premise} 시급이 최저시급보다 낮아요. 사장님께 확인해 보세요.`);
  });

  it("숫자 검사에 걸린 설명은 버리고 기본 설명(전제 포함)을 그대로 둔다", () => {
    const r = attachExplanation(withPremise, "시급이 5,000원 부족해요.");
    expect(r.explanation).toBeUndefined();
    expect(r.detail.startsWith(premise)).toBe(true);
  });

  it("전제가 없으면 AI 설명만 쓴다", () => {
    expect(attachExplanation(r1, "시급이 최저시급보다 낮아요.").explanation).toBe("시급이 최저시급보다 낮아요.");
  });
});
