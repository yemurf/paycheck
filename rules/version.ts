// 판정 기준의 버전. 같은 입력이라도 규칙이 바뀌면 결과가 달라질 수 있어서,
// 결과마다 "어떤 기준으로 판정했는지"를 함께 돌려준다.
import { CONSULTATION_ISO_DATE, LEGAL_VERIFIED_DATE } from "./legal-sources";
import { LATEST_MIN_WAGE_YEAR, MIN_WAGE_BY_YEAR } from "./standards";
import type { RuleId } from "./types";

// 규칙 코드나 기준값(rules/ 아래 파일)을 바꾸면 날짜로 올린다. 같은 날 두 번 바꾸면 "2026-11-04.2"처럼.
// 올리고 나면 RULES_FINGERPRINT도 테스트가 알려주는 값으로 바꾼다 (rules/rules.test.ts).
export const RULES_VERSION = "2026-11-04.4";
export const RULES_FINGERPRINT = "2026-11-04.4:f2d3e476d4296739";

export type Ruleset = {
  version: string; // RULES_VERSION
  minWageYears: { from: number; to: number }; // 최저시급 표가 있는 연도
  lawsCheckedOn: string; // 법령 원문을 대조한 날 (YYYY-MM-DD)
  consultedOn: string; // 고용노동부 1350 상담으로 기준을 확인한 날 (YYYY-MM-DD)
  applied: RuleId[]; // 이번 점검에서 판정한 규칙
};

const MIN_WAGE_FIRST_YEAR = Math.min(...Object.keys(MIN_WAGE_BY_YEAR).map(Number));

export function rulesetFor(applied: RuleId[]): Ruleset {
  return {
    version: RULES_VERSION,
    minWageYears: { from: MIN_WAGE_FIRST_YEAR, to: LATEST_MIN_WAGE_YEAR },
    lawsCheckedOn: LEGAL_VERIFIED_DATE,
    consultedOn: CONSULTATION_ISO_DATE,
    applied: [...applied].sort(),
  };
}
