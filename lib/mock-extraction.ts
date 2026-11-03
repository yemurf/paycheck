import type { ContractExtraction } from "./contract-schema";

// MOCK_AI=1일 때 /api/extract가 돌려주는 가짜 추출 결과.
// 샘플_근로계약서_하루커피.pdf와 같은 내용. PRD 6장 검증 예시(카페 주 3일 × 5시간, 수습 90%, 6개월 계약, 휴게 기재 없음)라서
// 결과 화면에 '문제 있음', '확인 필요', '문제 없음'이 골고루 나온다.
export const MOCK_EXTRACTION: ContractExtraction = {
  is_contract: true,
  contract_period: { start: "2026-11-01", end: "2027-04-30", indefinite: false },
  workplace: "하루커피 성수점",
  job_description: "음료 제조 및 매장 관리",
  wage: { type: "hourly", amount: 10_320, weekly_holiday_pay: null },
  wage_components: "기본급",
  probation: { exists: true, months: 3, wage_rate: 0.9 },
  schedule: [
    { day: "월", start: "10:00", end: "15:00", break_minutes: null },
    { day: "수", start: "10:00", end: "15:00", break_minutes: null },
    { day: "금", start: "10:00", end: "15:00", break_minutes: null },
  ],
  schedule_fixed: true,
  weekly_holiday: { mentioned: false, day: null },
  annual_leave_mentioned: false,
  pay_method: { payday: "매월 10일", method: "계좌이체" },
  deduction_notes: [],
  evidence: [
    { field: "wage.amount", quote: "시급 10,320원" },
    { field: "contract_period.start", quote: "2026년 11월 1일부터 2027년 4월 30일까지" },
    { field: "probation.wage_rate", quote: "수습기간 3개월 동안 임금의 90%를 지급한다" },
    { field: "schedule[0].start", quote: "월·수·금 10:00 ~ 15:00" },
  ],
  low_confidence_fields: ["schedule[0].break_minutes"],
};
