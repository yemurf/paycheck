// 로그인한 사용자의 점검 결과 저장·조회. 급여명세서 대조(2단계)는 여기 저장한 계약 내용을 기준으로 한다.
import type { ContractExtraction } from "./contract-schema";
import { db, DbError, eq } from "./db";
import { checkContract, type CheckResult, type Status } from "../rules";

export type SaveInput = { contract: ContractExtraction; weeklyHours?: number | null; minor?: boolean };

// 저장하는 계약 내용. 근거 문장(evidence)과 흐릿한 항목 목록은 판정·대조에 필요 없고,
// 근거 문장에는 이름 같은 개인정보가 섞일 수 있어서 뺀다.
export type SavedContract = Omit<ContractExtraction, "evidence" | "low_confidence_fields">;

export function toSavedContract(c: ContractExtraction): SavedContract {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- 저장하지 않을 필드를 빼낸다
  const { evidence, low_confidence_fields, ...rest } = c;
  return rest;
}

type Row = {
  id: string;
  user_id: string;
  created_at: string;
  rules_version: string;
  contract: SavedContract;
  weekly_hours: number | null;
  minor: boolean;
  result: CheckResult;
};

// 목록에 보여줄 요약
export type SavedSummary = {
  id: string;
  createdAt: string;
  workplace: string | null;
  wage: SavedContract["wage"];
  period: SavedContract["contract_period"];
  counts: Record<Status, number>;
  rulesVersion: string;
};

export type SavedDetail = SavedSummary & {
  contract: SavedContract;
  weeklyHours: number | null;
  minor: boolean;
  result: CheckResult;
};

export function summarize(row: Pick<Row, "id" | "created_at" | "contract" | "result" | "rules_version">): SavedSummary {
  const counts: Record<Status, number> = { problem: 0, check: 0, ok: 0 };
  for (const r of row.result.results) counts[r.status]++;
  return {
    id: row.id,
    createdAt: row.created_at,
    workplace: row.contract.workplace,
    wage: row.contract.wage,
    period: row.contract.contract_period,
    counts,
    rulesVersion: row.rules_version,
  };
}

// 판정은 브라우저가 보낸 결과를 믿지 않고 서버에서 규칙 코드로 다시 한다. AI 설명은 저장하지 않는다.
export function buildRow(userId: string, input: SaveInput) {
  const result = checkContract({ contract: input.contract, weeklyHours: input.weeklyHours, minor: input.minor ?? false });
  return {
    user_id: userId,
    rules_version: result.ruleset.version,
    contract: toSavedContract(input.contract),
    weekly_hours: input.weeklyHours ?? null,
    minor: input.minor ?? false,
    result,
  };
}

export async function saveResult(userId: string, input: SaveInput): Promise<SavedSummary> {
  const [row] = await db<Row[]>("check_results", { method: "POST", body: buildRow(userId, input), prefer: "return=representation" });
  return summarize(row);
}

export async function listResults(userId: string): Promise<SavedSummary[]> {
  const rows = await db<Row[]>(
    `check_results?user_id=${eq(userId)}&select=id,created_at,contract,result,rules_version&order=created_at.desc&limit=50`,
  );
  return rows.map(summarize);
}

// 다른 사람의 결과는 id를 알아도 못 보게 user_id를 같이 건다
export async function getResult(userId: string, id: string): Promise<SavedDetail | null> {
  const rows = await db<Row[]>(`check_results?id=${eq(id)}&user_id=${eq(userId)}&select=*&limit=1`);
  const row = rows[0];
  if (!row) return null;
  return { ...summarize(row), contract: row.contract, weeklyHours: row.weekly_hours, minor: row.minor, result: row.result };
}

export async function deleteResult(userId: string, id: string): Promise<boolean> {
  const rows = await db<Row[]>(`check_results?id=${eq(id)}&user_id=${eq(userId)}`, {
    method: "DELETE",
    prefer: "return=representation",
  });
  return rows.length > 0;
}

// 저장 API의 오류 응답. DB 설정이 없으면 503(준비 중), 그 밖에는 500.
export function dbFailure(e: unknown): Response {
  console.error("results db", e);
  const [status, code, message] =
    e instanceof DbError && e.code === "UNCONFIGURED"
      ? [503, "DB_UNAVAILABLE", "저장 기능을 준비하고 있어요."]
      : [500, "DB_ERROR", "잠시 후 다시 시도해 주세요."];
  return Response.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}
