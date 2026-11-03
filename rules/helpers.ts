import type { ContractExtraction } from "../lib/contract-schema";

type ScheduleEntry = ContractExtraction["schedule"][number];

// "HH:MM" → 0시부터의 분
export function parseTime(value: string | null): number | null {
  const m = value?.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const minutes = Number(m[1]) * 60 + Number(m[2]);
  return minutes <= 24 * 60 ? minutes : null;
}

// 시작~종료 사이 분. 종료가 시작보다 이르면 자정을 넘긴 근무로 본다.
export function spanMinutes(entry: ScheduleEntry): number | null {
  const start = parseTime(entry.start);
  const end = parseTime(entry.end);
  if (start == null || end == null) return null;
  return end > start ? end - start : end + 24 * 60 - start;
}

// 1일 근로시간 = 종료 − 시작 − 휴게. 휴게 기재가 없으면 휴게 없이 계산한다 (PRD 7장).
export function netWorkMinutes(entry: ScheduleEntry): number | null {
  const span = spanMinutes(entry);
  if (span == null) return null;
  return Math.max(0, span - (entry.break_minutes ?? 0));
}

// 주 소정근로시간. 시간을 모르는 요일이 하나라도 있으면 null.
export function weeklyWorkMinutes(schedule: ScheduleEntry[]): number | null {
  if (schedule.length === 0) return null;
  let total = 0;
  for (const entry of schedule) {
    const net = netWorkMinutes(entry);
    if (net == null) return null;
    total += net;
  }
  return total;
}

// "YYYY-MM-DD" → UTC 자정
export function parseDate(value: string | null): Date | null {
  const m = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return date.getUTCDate() === Number(m[3]) ? date : null;
}

// 계약기간이 1년 이상인지. 11/1 시작이면 다음 해 10/31 종료부터 1년으로 본다.
// 기간의 정함이 없으면 1년 이상으로 본다 (PRD 7장). 날짜를 모르면 null.
export function isAtLeastOneYear(period: ContractExtraction["contract_period"]): boolean | null {
  if (period.indefinite) return true;
  const start = parseDate(period.start);
  const end = parseDate(period.end);
  if (!start || !end) return null;
  const oneYearLastDay = new Date(
    Date.UTC(start.getUTCFullYear() + 1, start.getUTCMonth(), start.getUTCDate() - 1),
  );
  return end >= oneYearLastDay;
}

export function formatWon(value: number): string {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}
