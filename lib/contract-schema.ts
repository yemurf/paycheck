import { z } from "zod";

// PRD 8장 "추출 데이터" 스키마. 모든 값은 null 허용(못 읽으면 null).
// evidence는 PRD 예시의 { "wage.amount": "..." } 맵 대신 배열로 받는다.
// 구조화 출력은 고정 키 객체만 강제할 수 있어서다.

const DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;

export const ContractExtractionSchema = z.object({
  is_contract: z
    .boolean()
    .describe("사진이 근로계약서이면 true, 아니면 false"),
  contract_period: z.object({
    start: z.string().nullable().describe("YYYY-MM-DD"),
    end: z.string().nullable().describe("YYYY-MM-DD"),
    indefinite: z
      .boolean()
      .nullable()
      .describe("기간의 정함이 없는 계약이면 true"),
  }),
  workplace: z.string().nullable().describe("근무 장소"),
  job_description: z.string().nullable().describe("업무 내용"),
  wage: z.object({
    type: z.enum(["hourly", "daily", "monthly", "other"]).nullable(),
    amount: z.number().int().nullable().describe("원 단위 정수"),
    weekly_holiday_pay: z
      .enum(["separate", "included", "none"])
      .nullable()
      .describe(
        "주휴수당을 따로 준다고 적혀 있으면 separate, '시급에 주휴수당 포함'이면 included, '주휴수당 없음/미지급'이면 none, 언급 없으면 null",
      ),
  }),
  wage_components: z.string().nullable().describe("임금 구성항목 원문 요약"),
  probation: z.object({
    exists: z.boolean().nullable(),
    months: z.number().nullable(),
    wage_rate: z
      .number()
      .nullable()
      .describe("수습 중 지급 비율. 90%면 0.9"),
  }),
  schedule: z.array(
    z.object({
      day: z.enum(DAYS),
      start: z.string().nullable().describe("HH:MM, 24시간제"),
      end: z.string().nullable().describe("HH:MM, 24시간제"),
      break_minutes: z.number().int().nullable(),
    }),
  ),
  schedule_fixed: z
    .boolean()
    .nullable()
    .describe("요일·시간이 정해져 있으면 true, '스케줄 근무'처럼 주마다 다르면 false"),
  weekly_holiday: z.object({
    mentioned: z.boolean(),
    day: z.enum(DAYS).nullable(),
  }),
  annual_leave_mentioned: z.boolean(),
  pay_method: z.object({
    payday: z.string().nullable(),
    method: z.string().nullable(),
  }),
  deduction_notes: z
    .array(z.string())
    .describe("'3.3%', '사업소득', '프리랜서', '업무위탁' 등 공제·계약 형태 관련 문구 원문"),
  evidence: z
    .array(
      z.object({
        field: z.string().describe("필드 경로. 예: wage.amount, schedule[0].start"),
        quote: z.string().describe("계약서에 적힌 원문 구절 그대로"),
      }),
    )
    .describe("값을 채운 필드마다 근거가 된 원문 구절"),
  low_confidence_fields: z
    .array(z.string())
    .describe("흐리거나 손글씨라 확실하지 않은 필드 경로"),
});

export type ContractExtraction = z.infer<typeof ContractExtractionSchema>;

// 모델에게 보내는 스키마.
// 구조화 출력은 null 허용(union) 필드를 16개까지만 받는데 위 스키마는 19개라 400 오류가 난다.
// 그래서 글자 필드 9개는 "모르면 빈 문자열"로 받고, fromModelExtraction에서 null로 되돌린다.
const text = (desc?: string) =>
  z
    .string()
    .describe(`${desc ? `${desc}. ` : ""}적혀 있지 않거나 읽을 수 없으면 빈 문자열`);

const base = ContractExtractionSchema.shape;

export const ModelExtractionSchema = ContractExtractionSchema.extend({
  contract_period: base.contract_period.extend({
    start: text("YYYY-MM-DD"),
    end: text("YYYY-MM-DD"),
  }),
  workplace: text("근무 장소"),
  job_description: text("업무 내용"),
  wage_components: text("임금 구성항목 원문 요약"),
  schedule: z.array(
    base.schedule.element.extend({
      start: text("HH:MM, 24시간제"),
      end: text("HH:MM, 24시간제"),
    }),
  ),
  pay_method: z.object({
    payday: text(),
    method: text(),
  }),
});

export type ModelExtraction = z.infer<typeof ModelExtractionSchema>;

const orNull = (s: string) => (s.trim() === "" ? null : s);

export function fromModelExtraction(m: ModelExtraction): ContractExtraction {
  return {
    ...m,
    contract_period: {
      ...m.contract_period,
      start: orNull(m.contract_period.start),
      end: orNull(m.contract_period.end),
    },
    workplace: orNull(m.workplace),
    job_description: orNull(m.job_description),
    wage_components: orNull(m.wage_components),
    schedule: m.schedule.map((s) => ({ ...s, start: orNull(s.start), end: orNull(s.end) })),
    pay_method: {
      payday: orNull(m.pay_method.payday),
      method: orNull(m.pay_method.method),
    },
  };
}
