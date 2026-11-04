import { describe, expect, it } from "vitest";
import type { ContractExtraction } from "../lib/contract-schema";
import { formatDuration, isAtLeastOneYear, parseDate, parseTime, spanMinutes } from "./helpers";
import { checkContract } from "./index";
import { checkMinWage } from "./r1-min-wage";
import { checkProbation } from "./r2-probation";
import { checkWeeklyHoliday, minWageWithHolidayPay } from "./r3-weekly-holiday";
import { checkBreak } from "./r4-break";
import { checkRequiredItems } from "./r5-required-items";
import { checkMinor, worksAtNight } from "./r7-minor";

type Schedule = ContractExtraction["schedule"];
type Day = Schedule[number]["day"];

const TODAY = new Date(Date.UTC(2026, 9, 30));

// 카페, 월·수·금 10:00–15:30 (휴게 30분) = 주 15시간, 모든 항목이 문제 없는 계약
function contract(overrides: Partial<ContractExtraction> = {}): ContractExtraction {
  return {
    is_contract: true,
    contract_period: { start: "2026-03-01", end: "2026-12-31", indefinite: false },
    workplace: "○○카페 △△점",
    job_description: "음료 제조 및 매장 관리",
    wage: { type: "hourly", amount: 10_320, weekly_holiday_pay: "separate" },
    wage_components: "기본급, 주휴수당",
    probation: { exists: false, months: null, wage_rate: null },
    schedule: days(["월", "수", "금"], "10:00", "15:30", 30),
    schedule_fixed: true,
    weekly_holiday: { mentioned: true, day: "일" },
    annual_leave_mentioned: true,
    pay_method: { payday: "매월 10일", method: "계좌이체" },
    deduction_notes: [],
    evidence: [],
    low_confidence_fields: [],
    ...overrides,
  };
}

function days(list: Day[], start: string, end: string, breakMinutes: number | null): Schedule {
  return list.map((day) => ({ day, start, end, break_minutes: breakMinutes }));
}

function period(start: string | null, end: string | null, indefinite = false) {
  return { contract_period: { start, end, indefinite } };
}

function wage(amount: number | null, weekly_holiday_pay: ContractExtraction["wage"]["weekly_holiday_pay"] = "separate") {
  return { wage: { type: "hourly" as const, amount, weekly_holiday_pay } };
}

function probation(months: number | null, wage_rate: number | null) {
  return { probation: { exists: true, months, wage_rate } };
}

describe("helpers", () => {
  it("시각을 분으로 바꾼다", () => {
    expect(parseTime("10:00")).toBe(600);
    expect(parseTime("9:30")).toBe(570);
    expect(parseTime("25:00")).toBeNull();
    expect(parseTime(null)).toBeNull();
  });

  it("자정을 넘기는 근무를 계산한다", () => {
    expect(spanMinutes({ day: "토", start: "22:00", end: "02:00", break_minutes: null })).toBe(240);
  });

  it("없는 날짜는 null", () => {
    expect(parseDate("2026-02-30")).toBeNull();
    expect(parseDate("2026-02-28")).not.toBeNull();
  });

  it("계약기간 1년 경계", () => {
    expect(isAtLeastOneYear({ start: "2026-11-01", end: "2027-10-31", indefinite: false })).toBe(true);
    expect(isAtLeastOneYear({ start: "2026-11-01", end: "2027-10-30", indefinite: false })).toBe(false);
    expect(isAtLeastOneYear({ start: null, end: null, indefinite: true })).toBe(true);
    expect(isAtLeastOneYear({ start: "2026-11-01", end: null, indefinite: false })).toBeNull();
  });

  it("시간 표기", () => {
    expect(formatDuration(900)).toBe("15시간");
    expect(formatDuration(870)).toBe("14시간 30분");
    expect(formatDuration(45)).toBe("45분");
  });
});

describe("R1 최저임금", () => {
  it("최저시급 이상이면 문제 없음", () => {
    expect(checkMinWage(contract(), TODAY).status).toBe("ok");
  });

  it("1원이라도 낮으면 문제 있음", () => {
    const r = checkMinWage(contract(wage(10_319)), TODAY);
    expect(r.status).toBe("problem");
    expect(r.amount?.value).toBe(1);
  });

  it("시급 10,320원, 2026-12-31 종료 → 문제 없음", () => {
    const r = checkMinWage(contract(period("2026-11-01", "2026-12-31")), TODAY);
    expect(r.status).toBe("ok");
  });

  it("시급 10,320원, 2027-01-01 이후까지 → 확인 필요", () => {
    const r = checkMinWage(contract(period("2026-11-01", "2027-01-01")), TODAY);
    expect(r.status).toBe("check");
    expect(r.amount?.value).toBe(380);
  });

  it("2027년 최저시급 이상이면 2027년에 걸쳐도 문제 없음", () => {
    const r = checkMinWage(contract({ ...period("2026-11-01", "2027-04-30"), ...wage(10_700) }), TODAY);
    expect(r.status).toBe("ok");
  });

  it("기간의 정함이 없으면 다음 해까지 이어진다고 본다", () => {
    expect(checkMinWage(contract(period("2026-11-01", null, true)), TODAY).status).toBe("check");
  });

  it("종료일을 모르면 다음 해까지 이어진다고 본다", () => {
    expect(checkMinWage(contract(period("2026-11-01", null)), TODAY).status).toBe("check");
  });

  it("시급이 없으면 확인 필요", () => {
    expect(checkMinWage(contract(wage(null)), TODAY).status).toBe("check");
  });

  it("시작일을 모르면 오늘 연도를 기준으로 한다", () => {
    const r = checkMinWage(contract({ ...period(null, null), ...wage(10_500) }), new Date(Date.UTC(2027, 1, 1)));
    expect(r.status).toBe("problem");
    expect(r.amount?.value).toBe(200);
  });

  it("2025년 계약은 2025년 최저시급과 비교한다", () => {
    const r = checkMinWage(contract({ ...period("2025-03-01", "2025-12-31"), ...wage(10_030) }), TODAY);
    expect(r.status).toBe("ok");
  });

  it("2022년 계약은 2022년 최저시급 9,160원과 비교한다", () => {
    const r = checkMinWage(contract({ ...period("2022-03-01", "2022-12-31"), ...wage(9_160) }), TODAY);
    expect(r.status).toBe("ok");
    expect(r.summary).toContain("2022년 최저시급 9,160원");
  });

  it("2023년 계약은 2023년 최저시급 9,620원과 비교한다", () => {
    const r = checkMinWage(contract({ ...period("2023-03-01", "2023-12-31"), ...wage(9_600) }), TODAY);
    expect(r.status).toBe("problem");
    expect(r.amount?.value).toBe(20);
  });

  it("2022년에 시작해 2023년까지 이어지면 2023년 인상분을 확인한다", () => {
    const r = checkMinWage(contract({ ...period("2022-07-01", "2023-06-30"), ...wage(9_160) }), TODAY);
    expect(r.status).toBe("check");
    expect(r.amount?.value).toBe(460);
  });
});

describe("R2 수습 감액", () => {
  const oneYear = period("2026-11-01", "2027-10-31");

  it("수습 없음 → 문제 없음", () => {
    expect(checkProbation(contract(), TODAY).status).toBe("ok");
  });

  it("계약기간 정확히 1년, 수습 3개월 90% → 확인 필요 (단순노무 안내)", () => {
    const r = checkProbation(contract({ ...oneYear, ...probation(3, 0.9) }), TODAY);
    expect(r.status).toBe("check");
    expect(r.detail).toContain("단순노무");
  });

  it("계약기간 364일, 수습 90% → 문제 있음", () => {
    const r = checkProbation(contract({ ...period("2026-11-01", "2027-10-30"), ...probation(3, 0.9) }), TODAY);
    expect(r.status).toBe("problem");
    expect(r.amount?.value).toBe(1_032);
  });

  it("감액 기간 4개월 → 문제 있음", () => {
    const r = checkProbation(contract({ ...oneYear, ...probation(4, 0.9) }), TODAY);
    expect(r.status).toBe("problem");
    expect(r.summary).toContain("3개월");
  });

  it("최저시급 90% 미만으로 감액 → 문제 있음", () => {
    const r = checkProbation(contract({ ...oneYear, ...probation(3, 0.8) }), TODAY);
    expect(r.status).toBe("problem");
    expect(r.amount?.value).toBe(1_032); // 9,288 − 8,256
  });

  it("수습이 있어도 100%면 문제 없음", () => {
    expect(checkProbation(contract({ ...oneYear, ...probation(3, 1) }), TODAY).status).toBe("ok");
  });

  it("수습 중 급여가 안 적혀 있으면 확인 필요", () => {
    expect(checkProbation(contract({ ...oneYear, ...probation(3, null) }), TODAY).status).toBe("check");
  });

  it("감액해도 최저시급 이상이면 문제 없음", () => {
    const r = checkProbation(contract({ ...period("2026-11-01", "2027-02-28"), ...wage(12_000), ...probation(3, 0.9) }), TODAY);
    expect(r.status).toBe("ok");
  });

  it("기간의 정함이 없는 계약도 3개월 90% 감액 가능 (1350) → 단순노무 안내만 남아 확인 필요", () => {
    const r = checkProbation(contract({ ...period("2026-11-01", null, true), ...probation(3, 0.9) }), TODAY);
    expect(r.status).toBe("check");
    expect(r.detail).not.toContain("확인 중");
    expect(r.detail).toContain("한국표준직업분류");
  });

  it("감액이 기준을 넘으면 임금체불 신고를 안내한다", () => {
    const r = checkProbation(contract({ ...period("2026-11-01", "2027-04-30"), ...probation(3, 0.9) }), TODAY);
    expect(r.status).toBe("problem");
    expect(r.detail).toContain("임금체불");
  });
});

describe("R3 주휴수당", () => {
  it("주 15시간 정확히 → 주휴 대상, 1주 30,960원", () => {
    const r = checkWeeklyHoliday(contract(wage(10_320, null)), 900);
    expect(r.status).toBe("check");
    expect(r.amount?.value).toBe(30_960);
  });

  it("주 14.5시간 → 주휴 비대상 (문제 없음)", () => {
    expect(checkWeeklyHoliday(contract(wage(10_320, null)), 870).status).toBe("ok");
  });

  it("15시간 이상인데 '없음' 명시 → 문제 있음", () => {
    expect(checkWeeklyHoliday(contract(wage(10_320, "none")), 900).status).toBe("problem");
  });

  it("'시급에 포함', 시급이 최저시급 × 1.2보다 낮음 → 확인 필요", () => {
    const r = checkWeeklyHoliday(contract(wage(10_320, "included")), 900, TODAY);
    expect(r.status).toBe("check");
    expect(r.amount?.value).toBe(12_384 - 10_320);
  });

  it("'시급에 포함', 시급이 최저시급 × 1.2 이상 → 문제 없음 (1350: 포함 자체는 법적 문제 없음)", () => {
    expect(checkWeeklyHoliday(contract(wage(12_384, "included")), 900, TODAY).status).toBe("ok");
    expect(checkWeeklyHoliday(contract(wage(12_383, "included")), 900, TODAY).status).toBe("check");
  });

  it("주 40시간 넘게 일하면 주휴는 8시간까지라 기준 시급이 1.2배보다 낮다", () => {
    expect(minWageWithHolidayPay(40 * 60, 10_320)).toBe(12_384);
    expect(minWageWithHolidayPay(48 * 60, 10_320)).toBe(12_040);
  });

  it("따로 준다고 적힘 → 문제 없음", () => {
    expect(checkWeeklyHoliday(contract(), 900).status).toBe("ok");
  });

  it("주 40시간을 넘으면 40시간으로 계산한다", () => {
    expect(checkWeeklyHoliday(contract(), 45 * 60).amount?.value).toBe(82_560);
  });

  it("근무 시간을 모르면 확인 필요", () => {
    expect(checkWeeklyHoliday(contract(), null).status).toBe("check");
  });
});

describe("R4 휴게시간", () => {
  it("하루 4시간 정확히, 휴게 0분 → 문제 있음", () => {
    const r = checkBreak(contract({ schedule: days(["월"], "10:00", "14:00", 0) }));
    expect(r.status).toBe("problem");
    expect(r.detail).toContain("30분 필요");
  });

  it("하루 3시간 59분, 휴게 0분 → 문제 없음", () => {
    expect(checkBreak(contract({ schedule: days(["월"], "10:00", "13:59", 0) })).status).toBe("ok");
  });

  it("하루 8시간 정확히, 휴게 30분 → 문제 있음 (1시간 필요)", () => {
    const r = checkBreak(contract({ schedule: days(["월"], "09:00", "17:30", 30) }));
    expect(r.status).toBe("problem");
    expect(r.detail).toContain("60분 필요");
  });

  it("하루 8시간, 휴게 1시간 → 문제 없음", () => {
    expect(checkBreak(contract({ schedule: days(["월"], "09:00", "18:00", 60) })).status).toBe("ok");
  });

  it("4시간 이상인데 휴게 기재 없음 → 확인 필요", () => {
    expect(checkBreak(contract({ schedule: days(["월"], "10:00", "15:00", null) })).status).toBe("check");
  });

  it("4시간 미만이면 휴게 기재가 없어도 문제 없음", () => {
    expect(checkBreak(contract({ schedule: days(["월"], "10:00", "13:00", null) })).status).toBe("ok");
  });

  it("근무 시간이 없으면 확인 필요", () => {
    expect(checkBreak(contract({ schedule: [] })).status).toBe("check");
  });
});

describe("R5 필수 기재사항", () => {
  it("모두 있으면 문제 없음", () => {
    expect(checkRequiredItems(contract()).status).toBe("ok");
  });

  it("빠진 항목을 나열하고 확인 필요", () => {
    const r = checkRequiredItems(
      contract({ annual_leave_mentioned: false, weekly_holiday: { mentioned: false, day: null } }),
    );
    expect(r.status).toBe("check");
    expect(r.missing).toEqual(["휴일(주휴일)"]);
  });

  it("연차만 없으면 빠진 항목이 아니라 5인 기준 안내만 (1350: 5인 미만은 안 적어도 됨)", () => {
    const r = checkRequiredItems(contract({ annual_leave_mentioned: false }));
    expect(r.status).toBe("ok");
    expect(r.missing).toEqual([]);
    expect(r.detail).toContain("5명");
  });
});

describe("checkContract", () => {
  it("PRD 검증 예시: 주 3일 × 5시간, 수습 90%, 계약 6개월, 휴게 기재 없음", () => {
    const { results } = checkContract({
      contract: contract({
        ...period("2026-11-01", "2027-04-30"),
        ...wage(10_320, null),
        ...probation(3, 0.9),
        schedule: days(["월", "수", "금"], "10:00", "15:00", null),
      }),
      today: TODAY,
    });
    const byId = Object.fromEntries(results.map((r) => [r.id, r]));
    expect(byId.R2.status).toBe("problem");
    expect(byId.R3.status).toBe("check");
    expect(byId.R3.amount?.value).toBe(30_960);
    expect(byId.R4.status).toBe("check");
    expect(results[0].status).toBe("problem");
  });

  it("문제 있음 → 확인 필요 → 문제 없음 순으로 정렬한다", () => {
    const { results } = checkContract({
      contract: contract({ ...wage(10_000), annual_leave_mentioned: false }),
      today: TODAY,
    });
    const order = results.map((r) => r.status);
    expect(order).toEqual([...order].sort((a, b) => ["problem", "check", "ok"].indexOf(a) - ["problem", "check", "ok"].indexOf(b)));
    expect(results[0].id).toBe("R1");
  });

  it("스케줄 근무면 사용자가 입력한 주 근로시간을 쓴다", () => {
    const { results } = checkContract({
      contract: contract({ schedule_fixed: false, schedule: [] }),
      weeklyHours: 20,
      today: TODAY,
    });
    expect(results.find((r) => r.id === "R3")?.status).toBe("ok");
    expect(results.find((r) => r.id === "R3")?.amount?.value).toBe(41_280);
  });

  it("월급제 계약은 R4, R5만 판정한다", () => {
    const { results, notice } = checkContract({
      contract: contract({ wage: { type: "monthly", amount: 2_200_000, weekly_holiday_pay: null } }),
      today: TODAY,
    });
    expect(results.map((r) => r.id).sort()).toEqual(["R4", "R5"]);
    expect(notice).toContain("시급 계약서만");
  });
});

describe("F8 정정 요청 문장", () => {
  it("문제 있는 항목에만 문장을 붙인다", () => {
    const { results } = checkContract({
      contract: contract({ wage: { type: "hourly", amount: 9_000, weekly_holiday_pay: "separate" } }),
      today: TODAY,
    });
    const r1 = results.find((r) => r.id === "R1")!;
    expect(r1.status).toBe("problem");
    expect(r1.request).toContain("최저시급");
    expect(results.filter((r) => r.status === "ok").every((r) => r.request === undefined)).toBe(true);
  });

  it("R5는 빠진 항목 이름을 넣어 요청한다", () => {
    const { results } = checkContract({
      contract: contract({ weekly_holiday: { mentioned: false, day: null } }),
      today: TODAY,
    });
    const r5 = results.find((r) => r.id === "R5")!;
    expect(r5.request).toBeDefined();
    for (const item of r5.missing!) expect(r5.request).toContain(item);
  });
});

describe("R7 18세 미만 근로", () => {
  const minor = (overrides: Partial<ContractExtraction> = {}, weeklyHours?: number) =>
    checkContract({ contract: contract(overrides), weeklyHours, minor: true, today: TODAY }).results.find(
      (r) => r.id === "R7",
    )!;

  it("18세 미만이라고 답했을 때만 점검한다", () => {
    expect(checkContract({ contract: contract(), today: TODAY }).results.some((r) => r.id === "R7")).toBe(false);
    expect(checkContract({ contract: contract(), minor: false, today: TODAY }).results.some((r) => r.id === "R7")).toBe(false);
    expect(minor()).toBeDefined();
  });

  it("근무시간이 기준 안이어도 서류 때문에 항상 확인 필요로 안내한다", () => {
    const r = minor(); // 월·수·금 5시간 = 주 15시간
    expect(r.status).toBe("check");
    expect(r.summary).toContain("기준에 맞아요");
    expect(r.detail).toContain("가족관계증명서");
    expect(r.detail).toContain("1388");
    expect(r.request).toBeUndefined();
  });

  it("하루 7시간은 괜찮고, 7시간 초과~8시간은 합의 확인, 8시간 초과는 기준과 달라요", () => {
    expect(minor({ schedule: days(["토"], "09:00", "16:30", 30) }).summary).toContain("기준에 맞아요"); // 7시간
    expect(minor({ schedule: days(["토"], "09:00", "17:00", 30) }).status).toBe("check"); // 7시간 30분
    expect(minor({ schedule: days(["토"], "09:00", "17:30", 30) }).status).toBe("check"); // 8시간
    const over = minor({ schedule: days(["토"], "09:00", "18:00", 30) }); // 8시간 30분
    expect(over.status).toBe("problem");
    expect(over.detail).toContain("토요일은 8시간 30분");
    expect(over.request).toContain("18세 미만");
  });

  it("주 35시간 초과~40시간은 합의 확인, 40시간 초과는 기준과 달라요", () => {
    const six = (end: string) => days(["월", "화", "수", "목", "금", "토"], "10:00", end, 0);
    expect(minor({ schedule: six("15:50") }).summary).toContain("기준에 맞아요"); // 주 35시간
    expect(minor({ schedule: six("16:30") }).status).toBe("check"); // 주 39시간
    expect(minor({ schedule: six("17:00") }).status).toBe("problem"); // 주 42시간 (하루 7시간)
  });

  it("스케줄 근무면 입력한 주 근로시간으로 본다", () => {
    const flexible = { schedule_fixed: false, schedule: [] };
    expect(minor(flexible, 35).summary).toContain("기준에 맞아요");
    expect(minor(flexible, 38).status).toBe("check");
    expect(minor(flexible, 41).status).toBe("problem");
  });

  it("근무 시간을 모르면 모른다고 말한다", () => {
    const r = minor({ schedule: [] });
    expect(r.status).toBe("check");
    expect(r.summary).toContain("확인하지 못했어요");
  });

  it("오후 10시~오전 6시에 걸친 근무는 인가 확인이 필요해요", () => {
    const r = minor({ schedule: days(["금"], "18:00", "22:30", 30) });
    expect(r.status).toBe("check");
    expect(r.summary).toContain("밤 10시");
    expect(r.detail).toContain("금요일 18:00~22:30");
  });

  it("월급제여도 18세 미만 기준은 본다", () => {
    const { results } = checkContract({
      contract: contract({ wage: { type: "monthly", amount: 2_200_000, weekly_holiday_pay: null } }),
      minor: true,
      today: TODAY,
    });
    expect(results.map((r) => r.id).sort()).toEqual(["R4", "R5", "R7"]);
  });

  it("야간 시간과 겹치는지 경계값까지 계산한다", () => {
    const at = (start: string, end: string) => worksAtNight({ day: "월", start, end, break_minutes: 0 });
    expect(at("14:00", "22:00")).toBe(false); // 10시 정각에 끝남
    expect(at("06:00", "12:00")).toBe(false); // 6시 정각에 시작
    expect(at("14:00", "22:01")).toBe(true);
    expect(at("05:30", "09:00")).toBe(true); // 새벽
    expect(at("23:00", "02:00")).toBe(true); // 자정을 넘김
    expect(at("20:00", "07:00")).toBe(true);
    expect(at(null as unknown as string, "07:00")).toBe(false);
  });

  it("checkMinor는 주 근로시간을 따로 받는다", () => {
    expect(checkMinor(contract({ schedule: [] }), 36 * 60).status).toBe("check");
  });
});

describe("법적 근거 페이지와 결과 카드의 조문이 같다", () => {
  it("판정에 쓰는 조문은 모두 결과 카드 근거(BASIS)에 나온다", async () => {
    const { LEGAL_SOURCES } = await import("./legal-sources");
    const { BASIS } = await import("./standards");
    for (const source of LEGAL_SOURCES) {
      for (const a of source.articles.filter((x) => !x.reference)) {
        for (const r of a.rules) expect(BASIS[r], `${r}에 ${source.name} ${a.jo}`).toContain(a.jo);
      }
    }
  });

  it("모든 점검에 근거 조문이 하나 이상 있다", async () => {
    const { LEGAL_SOURCES } = await import("./legal-sources");
    const used = new Set(LEGAL_SOURCES.flatMap((s) => s.articles.filter((a) => !a.reference).flatMap((a) => a.rules)));
    expect([...used].sort()).toEqual(["R1", "R2", "R3", "R4", "R5", "R7"]);
  });
});
