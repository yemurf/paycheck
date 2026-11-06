// 로그인한 사용자의 점검 결과 저장 (화면에서 쓰는 부분).
// 서버: POST·GET /api/results, DELETE /api/results/:id (app/api/results). 판정은 서버가 다시 하니 결과는 보내지 않는다.
import type { ContractExtraction } from "@/lib/contract-schema";
import type { SavedSummary } from "@/lib/saved-results";

export type { SavedSummary };

// 저장에 보내는 값. 확인 화면이 점검할 때 쓴 값 그대로다 (ConfirmScreen의 checkInputOf).
export type SaveInput = { contract: ContractExtraction; weeklyHours: number | null; minor: boolean };

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

const FALLBACK = "잠시 후 다시 시도해 주세요.";

async function call<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, { cache: "no-store", ...init });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.data) return { ok: true, data: json.data as T };
    // 서버가 준 안내 문구를 그대로 보여 준다 (예: 503 "저장 기능을 준비하고 있어요.")
    return { ok: false, status: res.status, message: json?.error?.message ?? FALLBACK };
  } catch {
    return { ok: false, status: 0, message: "인터넷 연결을 확인하고 다시 시도해 주세요." };
  }
}

export const saveResult = (input: SaveInput) =>
  call<{ item: SavedSummary }>("/api/results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

export const listResults = () => call<{ items: SavedSummary[] }>("/api/results");

export const deleteResult = (id: string) =>
  call<{ deleted: true }>(`/api/results/${encodeURIComponent(id)}`, { method: "DELETE" });

// 로그인하러 카카오에 다녀오면 페이지가 새로 열려 결과가 사라진다.
// 그래서 떠나기 전에 저장할 값을 이 탭에만 잠깐 맡겨 두고, /my에서 꺼내 저장한 뒤 바로 지운다.
// sessionStorage는 탭을 닫으면 사라진다. 사생활 보호 모드 등에서는 쓰기가 막힐 수 있어 실패해도 넘어간다.
const PENDING_KEY = "pc_pending_save";

export function keepPendingSave(input: SaveInput) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(input));
  } catch {}
}

// 꺼내면서 지운다 (같은 결과가 두 번 저장되지 않게)
export function takePendingSave(): SaveInput | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as SaveInput) : null;
  } catch {
    return null;
  }
}

export function clearPendingSave() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {}
}
