import { describe, expect, it } from "vitest";
import { minWageNotice } from "./min-wage-notice";

describe("랜딩 최저시급 안내", () => {
  it("2026년에는 올해 금액과 내년 인상 금액을 말한다", () => {
    expect(minWageNotice(new Date("2026-11-06T03:00:00Z"))).toBe(
      "2026년 최저시급은 10,320원이고, 2027년부터는 10,700원으로 올라요.",
    );
  });

  it("한국 시간 1월 1일 0시가 되면 새해 금액으로 바뀐다", () => {
    expect(minWageNotice(new Date("2026-12-31T14:59:00Z"))).toContain("2026년 최저시급은 10,320원");
    expect(minWageNotice(new Date("2026-12-31T15:00:00Z"))).toBe("2027년 최저시급은 10,700원이에요.");
  });

  it("표가 갱신되지 않았으면 표의 마지막 해를 말한다", () => {
    expect(minWageNotice(new Date("2029-05-01T00:00:00Z"))).toBe("2027년 최저시급은 10,700원이에요.");
  });
});
