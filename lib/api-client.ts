// 브라우저에서 부르는 API. 실패하면 화면에 그대로 보여줄 문구를 담아 던진다.
import type { ContractExtraction } from "./contract-schema";
import type { Photo } from "./image";
import type { CheckResult } from "@/rules";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(input: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch {
    throw new ApiError("NETWORK", "인터넷 연결을 확인해 주세요.");
  }
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.data) {
    throw new ApiError(
      body?.error?.code ?? "UNKNOWN",
      body?.error?.message ?? "분석이 늦어지고 있어요. 잠시 후 다시 눌러주세요.",
    );
  }
  return body.data as T;
}

export async function extractContract(photos: Photo[]): Promise<ContractExtraction> {
  const form = new FormData();
  for (const photo of photos) {
    form.append("images", photo.blob, `${photo.id}.jpg`);
  }
  return call("/api/extract", { method: "POST", body: form });
}

export async function checkContract(
  contract: ContractExtraction,
  weeklyHours: number | null,
  minor: boolean,
): Promise<CheckResult> {
  return call("/api/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contract, weeklyHours, minor }),
  });
}
