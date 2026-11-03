import type { ContractExtraction } from "../lib/contract-schema";
import { formatDuration, netWorkMinutes, spanMinutes } from "./helpers";
import { BASIS, BREAK_RULES } from "./standards";
import type { RuleResult } from "./types";

const base = { id: "R4", title: "휴게시간", basis: BASIS.R4 } as const;

export function requiredBreakMinutes(workMinutes: number): number {
  return BREAK_RULES.find((r) => workMinutes >= r.minWorkMinutes)?.breakMinutes ?? 0;
}

export function checkBreak(c: ContractExtraction): RuleResult {
  const days = c.schedule.filter((e) => spanMinutes(e) != null);
  if (days.length === 0) {
    return {
      ...base,
      status: "check",
      summary: "근무 시간이 적혀 있지 않아 휴게시간을 확인할 수 없어요.",
      detail: "근무 시작·종료 시각이 있어야 휴게시간이 충분한지 알 수 있어요.",
    };
  }

  const short: string[] = [];
  const unstated: string[] = [];
  for (const entry of days) {
    const work = netWorkMinutes(entry)!;
    const required = requiredBreakMinutes(work);
    if (entry.break_minutes == null) {
      if (required > 0) unstated.push(entry.day);
    } else if (entry.break_minutes < required) {
      short.push(
        `${entry.day}요일은 ${formatDuration(work)} 일하는데 휴게가 ${entry.break_minutes}분이에요(${required}분 필요).`,
      );
    }
  }

  if (short.length > 0) {
    return {
      ...base,
      status: "problem",
      summary: "휴게시간이 기준보다 짧은 날이 있어요.",
      detail: `${short.join(" ")} 4시간 일하면 30분, 8시간 일하면 1시간 이상 쉬어야 해요.`,
    };
  }
  if (unstated.length > 0) {
    return {
      ...base,
      status: "check",
      summary: "휴게시간이 적혀 있지 않아요.",
      detail: `${unstated.join("·")}요일은 4시간 이상 일하는데 휴게시간이 적혀 있지 않아요. 실제로 쉬는 시간이 있는지 확인해 보세요.`,
    };
  }
  return {
    ...base,
    status: "ok",
    summary: "휴게시간이 기준에 맞아요.",
    detail: "근무일마다 근로시간에 맞는 휴게시간이 적혀 있어요.",
  };
}
