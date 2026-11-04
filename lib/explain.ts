// F7: 판정 결과를 Claude가 쉬운 말로 풀어 쓴다.
// AI는 설명만 한다. 판정과 숫자는 코드가 만든 값만 쓰고, 새 숫자가 나온 설명은 버린다.
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { RuleResult } from "@/rules";
import { anthropic, MODEL } from "./claude";

const STATUS_LABEL = { problem: "기준과 달라요", check: "확인이 필요해요", ok: "문제 없어요" } as const;

const ExplanationSchema = z.object({
  items: z.array(
    z.object({
      id: z.enum(["R1", "R2", "R3", "R4", "R5", "R7"]),
      explanation: z.string().describe("2~3문장 쉬운 설명"),
    }),
  ),
});

const SYSTEM_PROMPT = `너는 알바생에게 근로계약서 점검 결과를 쉬운 말로 설명한다.

- 항목마다 2~3문장, "~해요" 체로 쓴다. 어려운 법률 용어는 풀어 쓴다.
- 숫자는 입력에 있는 것만 그대로 쓴다. 새 숫자를 만들거나 계산하거나 단위를 바꾸지 않는다.
- 판정(status)을 바꾸거나 더 세게 말하지 않는다. "불법이에요"처럼 단정하지 않는다.
- 근거 조문 이름은 화면에 따로 보이니 다시 쓰지 않는다.
- 이 항목이 왜 중요한지, 이제 무엇을 하면 되는지를 담는다.`;

// "10,320원", "90%", "0.9" 같은 숫자를 쉼표를 뺀 문자열로 모은다.
function numbersIn(text: string): string[] {
  return (text.match(/\d+(?:[.,]\d+)*/g) ?? []).map((n) => n.replace(/,/g, ""));
}

// 설명에 나온 숫자가 모두 판정 결과 안에 있는지 검사한다 (PRD F7 완료 기준).
export function usesOnlyKnownNumbers(explanation: string, source: RuleResult): boolean {
  const known = new Set(
    numbersIn(
      [source.title, source.summary, source.detail, source.basis, ...(source.missing ?? [])].join(" "),
    ),
  );
  if (source.amount) known.add(String(source.amount.value));
  return numbersIn(explanation).every((n) => known.has(n));
}

export async function addExplanations(results: RuleResult[]): Promise<RuleResult[]> {
  const input = results.map((r) => ({
    id: r.id,
    title: r.title,
    status: STATUS_LABEL[r.status],
    summary: r.summary,
    detail: r.detail,
    ...(r.amount && { amount: r.amount }),
    ...(r.missing?.length && { missing: r.missing }),
  }));

  const response = await anthropic.beta.messages.parse(
    {
      model: MODEL,
      max_tokens: 4000,
      output_config: { effort: "low", format: betaZodOutputFormat(ExplanationSchema) },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: JSON.stringify(input) }],
    },
    // 설명은 없어도 결과를 보여줄 수 있으니 오래 기다리지 않는다.
    { timeout: 20_000, maxRetries: 0 },
  );

  const byId = new Map(response.parsed_output?.items.map((i) => [i.id, i.explanation.trim()]) ?? []);
  return results.map((r) => {
    const explanation = byId.get(r.id);
    return explanation && usesOnlyKnownNumbers(explanation, r) ? { ...r, explanation } : r;
  });
}
