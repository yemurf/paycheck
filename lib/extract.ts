import type Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { anthropic, MODEL } from "./claude";
import {
  ModelExtractionSchema,
  fromModelExtraction,
  type ContractExtraction,
} from "./contract-schema";

export type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export type ContractFile = {
  mediaType: ImageMediaType | "application/pdf";
  data: string; // base64
};

export class ExtractionError extends Error {
  constructor(
    public code: "REFUSED" | "INCOMPLETE" | "UNPARSEABLE",
    message: string,
  ) {
    super(message);
  }
}

const SYSTEM_PROMPT = `너는 한국 아르바이트 근로계약서 사진에서 정보를 옮겨 적는 역할을 한다.

- 사진이 1장이든 2장이든 한 계약서의 여러 장이다. 모든 장을 합쳐 하나의 결과로 정리한다.
- 계약서에 적힌 내용만 옮긴다. 적혀 있지 않거나 읽을 수 없는 값은 추측하지 말고 null로 둔다(글자 필드는 빈 문자열).
- 법적으로 맞는지 판단하거나 금액을 계산하지 않는다. 판정은 다른 코드가 한다.
- 펜이나 스티커로 칠하거나 가린 부분은 사용자가 개인정보를 가린 것이니 무시한다.
- 날짜는 YYYY-MM-DD, 시각은 24시간제 HH:MM, 금액은 원 단위 정수로 쓴다. "10,320원"은 10320이다.
- 근무 요일이 "월~금"처럼 묶여 있으면 schedule에 요일별로 펼쳐 적는다. 휴게시간이 요일마다 같다고 적혀 있으면 각 요일에 같은 값을 넣는다.
- 값을 채운 필드는 evidence에 계약서 원문 구절을 그대로 옮겨 적는다.
- 손글씨, 흐림, 잘림 때문에 확실하지 않은 값은 low_confidence_fields에 필드 경로를 넣는다.
- 근로계약서가 아니면 is_contract를 false로 하고 나머지는 비워 둔다.`;

function toContentBlock(file: ContractFile): Anthropic.Beta.BetaContentBlockParam {
  if (file.mediaType === "application/pdf") {
    return {
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: file.data },
    };
  }
  return {
    type: "image",
    source: { type: "base64", media_type: file.mediaType, data: file.data },
  };
}

export async function extractContract(
  files: ContractFile[],
): Promise<ContractExtraction> {
  const response = await anthropic.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: betaZodOutputFormat(ModelExtractionSchema),
    },
    // 안전 분류기가 거절하면 서버에서 다른 모델로 다시 실행한다.
    // Anthropic 직접 연결에서만 지원 (OpenRouter는 fallbacks 형식이 달라 400 오류).
    ...(process.env.ANTHROPIC_BASE_URL
      ? {}
      : {
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default" as const,
        }),
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          ...files.map(toContentBlock),
          { type: "text", text: "이 근로계약서의 내용을 정리해 줘." },
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new ExtractionError("REFUSED", "모델이 요청을 거절했습니다.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new ExtractionError("INCOMPLETE", "응답이 중간에 끊겼습니다.");
  }
  if (!response.parsed_output) {
    throw new ExtractionError("UNPARSEABLE", "응답을 JSON으로 읽지 못했습니다.");
  }
  return fromModelExtraction(response.parsed_output);
}
