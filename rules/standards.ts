// 법 기준값. 법이 바뀌면 이 파일만 고친다 (PRD 8장).

// 고용노동부 고시 연도별 최저시급. 지난 계약서도 점검하니 과거 연도까지 둔다.
export const MIN_WAGE_BY_YEAR: Record<number, number> = {
  2015: 5_580,
  2016: 6_030,
  2017: 6_470,
  2018: 7_530,
  2019: 8_350,
  2020: 8_590,
  2021: 8_720,
  2022: 9_160,
  2023: 9_620,
  2024: 9_860,
  2025: 10_030,
  2026: 10_320,
  2027: 10_700,
};

const KNOWN_YEARS = Object.keys(MIN_WAGE_BY_YEAR).map(Number).sort((a, b) => a - b);
export const LATEST_MIN_WAGE_YEAR = KNOWN_YEARS[KNOWN_YEARS.length - 1];

// 표에 없는 해는 가장 가까운 해의 값을 쓴다.
export function minWageFor(year: number): number {
  if (year <= KNOWN_YEARS[0]) return MIN_WAGE_BY_YEAR[KNOWN_YEARS[0]];
  if (year >= LATEST_MIN_WAGE_YEAR) return MIN_WAGE_BY_YEAR[LATEST_MIN_WAGE_YEAR];
  return MIN_WAGE_BY_YEAR[year];
}

// R2 수습 감액
export const PROBATION_MIN_PERCENT = 90;
export const PROBATION_MAX_MONTHS = 3;

// R3 주휴수당
export const WEEKLY_HOLIDAY_MIN_MINUTES = 15 * 60;
export const WEEKLY_HOLIDAY_MAX_MINUTES = 40 * 60;

// R4 휴게시간: 근로시간(휴게 제외)이 기준 이상이면 휴게가 이만큼 필요하다. 긴 기준부터.
export const BREAK_RULES = [
  { minWorkMinutes: 8 * 60, breakMinutes: 60 },
  { minWorkMinutes: 4 * 60, breakMinutes: 30 },
];

// 근거 조문 (요지)
export const BASIS = {
  R1: "최저임금법 제6조: 최저임금 이상의 임금을 지급해야 해요.",
  R2: "최저임금법 제5조 제2항, 시행령 제3조: 1년 이상 계약한 수습 3개월 이내에만 최저임금의 90%까지 줄일 수 있고, 단순노무 업무는 줄일 수 없어요.",
  R3: "근로기준법 제18조 제3항, 제55조: 1주 소정근로시간이 15시간 이상이면 1주에 하루 유급휴일(주휴)을 줘야 해요.",
  R4: "근로기준법 제54조: 근로시간이 4시간이면 30분 이상, 8시간이면 1시간 이상 휴게시간을 근로시간 도중에 줘야 해요.",
  R5: "근로기준법 제17조, 기간제법 제17조: 임금, 근로시간, 휴일, 휴가 등을 서면으로 명시해 교부해야 해요.",
} as const;
