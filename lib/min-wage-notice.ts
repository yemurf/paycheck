// 랜딩에 보여줄 최저시급 안내 문장. 오늘(한국 시간)이 속한 해의 최저시급을 말하고,
// 다음 해 최저시급이 이미 정해졌으면(rules/standards.ts에 있으면) 오르는 금액도 같이 말한다.
import { formatWon } from "../rules/helpers";
import { LATEST_MIN_WAGE_YEAR, MIN_WAGE_BY_YEAR, minWageFor } from "../rules/standards";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function minWageNotice(now: Date): string {
  const kstYear = new Date(now.getTime() + KST_OFFSET_MS).getUTCFullYear();
  // 표가 아직 올해까지 갱신되지 않았으면 표의 마지막 해를 말한다
  const year = Math.min(kstYear, LATEST_MIN_WAGE_YEAR);
  const current = minWageFor(year);
  const next = MIN_WAGE_BY_YEAR[year + 1];
  return next
    ? `${year}년 최저시급은 ${formatWon(current)}이고, ${year + 1}년부터는 ${formatWon(next)}으로 올라요.`
    : `${year}년 최저시급은 ${formatWon(current)}이에요.`;
}
