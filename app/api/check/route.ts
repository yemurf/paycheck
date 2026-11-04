import { z } from "zod";
import { ContractExtractionSchema } from "@/lib/contract-schema";
import { addExplanations } from "@/lib/explain";
import { clientIp, isRateLimited } from "@/lib/rate-limit";
import { checkContract } from "@/rules";

const CheckRequestSchema = z.object({
  contract: ContractExtractionSchema,
  weeklyHours: z.number().min(0).max(168).nullable().optional(),
  minor: z.boolean().optional(),
});

// 요청: { contract: 사용자가 확인한 추출값, weeklyHours?: 평소 주 근로시간, minor?: 18세 미만인지 }
// 응답: { data: CheckResult } 또는 { error: { code, message } }
// 판정은 코드(rules)가 하고, Claude는 쉬운 설명(F7)만 붙인다.
// 설명이 실패하거나 숫자 검사에 걸리면 규칙별 기본 문구(detail)가 그대로 보인다.
export const maxDuration = 30;

export async function POST(request: Request) {
  if (isRateLimited(`check:${clientIp(request)}`)) {
    return Response.json(
      { error: { code: "RATE_LIMITED", message: "잠시 후 다시 시도해 주세요." } },
      { status: 429 },
    );
  }

  const parsed = CheckRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: { code: "BAD_REQUEST", message: "입력한 내용을 다시 확인해 주세요." } },
      { status: 400 },
    );
  }

  const data = checkContract(parsed.data);
  if (process.env.MOCK_AI !== "1") {
    try {
      data.results = await addExplanations(data.results);
    } catch (e) {
      console.error("explain failed", e);
    }
  }
  return Response.json({ data });
}
