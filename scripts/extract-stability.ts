// 같은 계약서를 여러 번 추출해서 AI가 값을 얼마나 일정하게 읽는지 잰다.
// 판정은 규칙 코드라 같은 값이면 같은 결과가 나오지만, 그 앞의 추출(AI)은 흔들릴 수 있다.
// 항목별로 값이 매번 같은지, 그리고 그 흔들림 때문에 판정(R1~R7)이 바뀌는지를 함께 본다.
//
// 사용법: npm run extract-stability -- <파일> [파일2] [--runs 5] [--minor]
//   --runs   몇 번 읽을지 (기본 5). 한 번마다 Claude API를 한 번 부르니 비용이 든다.
//   --minor  18세 미만으로 보고 R7까지 판정한다.
//
// 주의: 앱은 사진을 브라우저에서 긴 변 1,600px JPEG로 줄이고, PDF도 이미지로 바꿔서 보낸다.
// 이 스크립트는 파일을 그대로 보내니 실제 앱과 조건이 조금 다르다. 앱과 똑같이 재려면 줄인 JPEG를 넣는다.
import { readFileSync } from "node:fs";
import { extname } from "node:path";
import type { ContractExtraction } from "../lib/contract-schema";
import { extractContract, type ContractFile } from "../lib/extract";
import { checkContract, type RuleId, type Status } from "../rules";

const MEDIA_TYPES: Record<string, ContractFile["mediaType"]> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

const DAY_ORDER = ["월", "화", "수", "목", "금", "토", "일"];

function parseArgs(argv: string[]) {
  const paths: string[] = [];
  let runs = 5;
  let minor = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--runs") runs = Number(argv[++i]);
    else if (argv[i] === "--minor") minor = true;
    else paths.push(argv[i]);
  }
  if (paths.length === 0 || !Number.isInteger(runs) || runs < 2) {
    console.error("사용법: npm run extract-stability -- <파일> [파일2] [--runs 5] [--minor]");
    process.exit(1);
  }
  return { paths, runs, minor };
}

// 판정에 쓰이는 값만 "항목 이름 → 비교용 문자열"로 펼친다. 근거 문장(evidence)은 표현이 매번 달라 뺀다.
function flatten(c: ContractExtraction): Record<string, string> {
  const v = (x: unknown) => (x === null || x === undefined ? "(없음)" : String(x));
  const schedule = [...c.schedule]
    .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day))
    .map((e) => `${e.day} ${v(e.start)}-${v(e.end)} 휴게${v(e.break_minutes)}`)
    .join(", ");
  return {
    "계약서 여부": v(c.is_contract),
    "계약 시작일": v(c.contract_period.start),
    "계약 종료일": v(c.contract_period.end),
    "기간 정함 없음": v(c.contract_period.indefinite),
    "급여 형태": v(c.wage.type),
    "급여 금액": v(c.wage.amount),
    "주휴수당 표기": v(c.wage.weekly_holiday_pay),
    "수습 있음": v(c.probation.exists),
    "수습 개월": v(c.probation.months),
    "수습 지급 비율": v(c.probation.wage_rate),
    "근무 일정": schedule || "(없음)",
    "일정 고정": v(c.schedule_fixed),
    "주휴일 언급": v(c.weekly_holiday.mentioned),
    "주휴일 요일": v(c.weekly_holiday.day),
    "연차 언급": v(c.annual_leave_mentioned),
    "임금 지급일": v(c.pay_method.payday),
    "임금 지급방법": v(c.pay_method.method),
    "근무 장소": v(c.workplace),
    "업무 내용": v(c.job_description),
  };
}

// 값마다 몇 번 나왔는지, 많이 나온 순으로
function tally(values: string[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]);
}

async function main() {
  const { paths, runs, minor } = parseArgs(process.argv.slice(2));
  const files: ContractFile[] = paths.map((p) => {
    const mediaType = MEDIA_TYPES[extname(p).toLowerCase()];
    if (!mediaType) throw new Error(`지원하지 않는 파일: ${p}`);
    return { mediaType, data: readFileSync(p).toString("base64") };
  });

  console.error(`${paths.join(", ")}을(를) ${runs}번 읽어요. Claude API를 ${runs}번 불러요.\n`);

  // 동시에 많이 부르면 속도 제한에 걸리니 하나씩
  const extractions: ContractExtraction[] = [];
  let failed = 0;
  for (let i = 1; i <= runs; i++) {
    const started = Date.now();
    try {
      extractions.push(await extractContract(files));
      console.error(`  ${i}/${runs} 완료 (${((Date.now() - started) / 1000).toFixed(1)}초)`);
    } catch (e) {
      failed++;
      console.error(`  ${i}/${runs} 실패: ${e instanceof Error ? e.message : e}`);
    }
  }
  if (extractions.length < 2) {
    console.error("\n성공한 추출이 2번보다 적어서 비교할 수 없어요.");
    process.exit(1);
  }
  printReport(extractions, failed, minor);
}

// 추출 결과들을 비교해 출력한다. API 없이 시험할 수 있게 따로 뺐다.
export function printReport(extractions: ContractExtraction[], failed: number, minor: boolean) {
  const n = extractions.length;

  // 1. 항목별 일치
  const flat = extractions.map(flatten);
  const fields = Object.keys(flat[0]);
  const unstable = fields.filter((f) => new Set(flat.map((x) => x[f])).size > 1);

  console.log(`\n■ 항목별 일치 (성공 ${n}번${failed ? `, 실패 ${failed}번` : ""})`);
  for (const field of fields) {
    const counts = tally(flat.map((x) => x[field]));
    if (counts.length === 1) {
      console.log(`  ✓ ${field}: ${counts[0][0]}`);
    } else {
      console.log(`  ✗ ${field}: ${counts.map(([value, k]) => `"${value}" ${k}번`).join(" / ")}`);
    }
  }

  // 2. 흐릿하다고 표시한 항목
  const low = tally(extractions.flatMap((x) => x.low_confidence_fields));
  if (low.length > 0) {
    console.log(`\n■ 잘 안 보인다고 표시한 항목`);
    for (const [field, k] of low) console.log(`  ${field}: ${k}/${n}번`);
  }

  // 3. 판정이 바뀌는지. 같은 날짜 기준으로 판정해야 비교가 된다.
  const today = new Date();
  const verdicts = extractions.map((contract) => {
    const { results } = checkContract({ contract, minor, today });
    return Object.fromEntries(results.map((r) => [r.id, r.status])) as Partial<Record<RuleId, Status>>;
  });
  const ruleIds = [...new Set(verdicts.flatMap((v) => Object.keys(v)))].sort() as RuleId[];
  const LABEL: Record<Status | "없음", string> = { problem: "기준과 달라요", check: "확인 필요", ok: "문제 없어요", 없음: "판정 안 함" };
  const flipped = ruleIds.filter((id) => new Set(verdicts.map((v) => v[id] ?? "없음")).size > 1);

  console.log(`\n■ 판정${minor ? " (18세 미만으로 판정)" : ""}`);
  for (const id of ruleIds) {
    const counts = tally(verdicts.map((v) => LABEL[v[id] ?? "없음"]));
    const mark = counts.length === 1 ? "✓" : "✗";
    console.log(`  ${mark} ${id}: ${counts.map(([label, k]) => (counts.length === 1 ? label : `${label} ${k}번`)).join(" / ")}`);
  }

  // 4. 요약
  console.log(`\n■ 요약`);
  console.log(`  항목 ${fields.length}개 중 ${fields.length - unstable.length}개가 ${n}번 모두 같았어요.`);
  if (unstable.length > 0) console.log(`  흔들린 항목: ${unstable.join(", ")}`);
  console.log(
    flipped.length === 0
      ? `  판정은 ${n}번 모두 같았어요.`
      : `  판정이 바뀐 규칙: ${flipped.join(", ")}. 이 항목은 확인 화면에서 사용자가 꼭 보게 해야 해요.`,
  );
}

// 다른 파일에서 printReport만 가져다 쓸 때는 실행하지 않는다
if (process.argv[1]?.endsWith("extract-stability.ts")) main();
