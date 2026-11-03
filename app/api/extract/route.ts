import Anthropic from "@anthropic-ai/sdk";
import {
  extractContract,
  ExtractionError,
  type ContractFile,
  type ImageMediaType,
} from "@/lib/extract";
import { MOCK_EXTRACTION } from "@/lib/mock-extraction";
import { clientIp, isRateLimited } from "@/lib/rate-limit";

// 재시도 1회까지 30초 × 2
export const maxDuration = 60;

const MAX_FILES = 2;
const MAX_BYTES = 5 * 1024 * 1024; // Claude 이미지 1장 한도
const IMAGE_TYPES: ImageMediaType[] = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function fail(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

// 요청: multipart/form-data, "images" 필드에 가린 사진 1~2장 (브라우저에서 JPEG로 변환·축소한 것)
// 응답: { data: ContractExtraction } 또는 { error: { code, message } }
// 이미지는 메모리에서만 쓰고 저장·로그하지 않는다.
export async function POST(request: Request) {
  if (isRateLimited(`extract:${clientIp(request)}`)) {
    return fail(429, "RATE_LIMITED", "잠시 후 다시 시도해 주세요.");
  }

  let images: File[];
  try {
    const form = await request.formData();
    images = form.getAll("images").filter((v): v is File => v instanceof File);
  } catch {
    return fail(400, "BAD_REQUEST", "사진을 열 수 없어요. 다른 사진으로 다시 올려주세요.");
  }

  if (images.length === 0 || images.length > MAX_FILES) {
    return fail(400, "BAD_REQUEST", "계약서 사진을 1~2장 올려주세요.");
  }
  for (const image of images) {
    if (!IMAGE_TYPES.includes(image.type as ImageMediaType) || image.size > MAX_BYTES) {
      return fail(400, "INVALID_IMAGE", "사진을 열 수 없어요. 다른 사진으로 다시 올려주세요.");
    }
  }

  // API 키 없이 화면을 개발·시연할 때. Claude를 부르지 않고 샘플 계약서를 돌려준다.
  if (process.env.MOCK_AI === "1") {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return Response.json({ data: MOCK_EXTRACTION });
  }

  const files: ContractFile[] = await Promise.all(
    images.map(async (image) => ({
      mediaType: image.type as ImageMediaType,
      data: Buffer.from(await image.arrayBuffer()).toString("base64"),
    })),
  );

  try {
    const data = await extractContract(files);
    if (!data.is_contract) {
      return fail(
        422,
        "NOT_CONTRACT",
        "근로계약서가 아닌 것 같아요. 계약서 전체가 나오게 다시 찍어주세요.",
      );
    }
    return Response.json({ data });
  } catch (error) {
    if (error instanceof ExtractionError) {
      console.error("extract failed:", error.code);
      return fail(502, error.code, "분석이 늦어지고 있어요. 잠시 후 다시 눌러주세요.");
    }
    if (error instanceof Anthropic.RateLimitError) {
      return fail(503, "UPSTREAM_BUSY", "잠시 후 다시 시도해 주세요.");
    }
    if (error instanceof Anthropic.APIConnectionTimeoutError) {
      return fail(504, "TIMEOUT", "분석이 늦어지고 있어요. 잠시 후 다시 눌러주세요.");
    }
    if (error instanceof Anthropic.APIError) {
      console.error("claude api error:", error.status, error.message);
      return fail(502, "UPSTREAM_ERROR", "분석이 늦어지고 있어요. 잠시 후 다시 눌러주세요.");
    }
    // API 키 누락 등 설정 문제
    console.error("extract failed:", error instanceof Error ? error.message : error);
    return fail(500, "SERVER_ERROR", "분석이 늦어지고 있어요. 잠시 후 다시 눌러주세요.");
  }
}
